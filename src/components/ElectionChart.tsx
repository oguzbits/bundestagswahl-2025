import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell, LabelList } from 'recharts';
import { ChartContainer, ChartTooltip, type ChartConfig } from './ui/chart';
import type { GebietErgebnis } from '../domain/types';
import { getPartyColor } from '../domain/partyColors';
import { formatFloorPercentage } from '../utils/dataTransformer';

interface ElectionChartProps {
  data: GebietErgebnis;
  title: string;
  compareWith?: GebietErgebnis;
}

interface ChartDataItem {
  party: string;
  partyColor: string;
  // Primary Gebiet values
  percentage1: number;
  votes1: number;
  // Secondary / comparison Gebiet values (optional)
  percentage2?: number;
  votes2?: number;
}

const ESTABLISHED_PARTIES = new Set([
  'CDU',
  'CSU',
  'CDU/CSU',
  'SPD',
  'GRÜNE',
  'GRÜNEN',
  'BÜNDNIS 90/DIE GRÜNEN',
  'FDP',
  'AFD',
  'DIE LINKE',
  'LINKE',
  'BSW',
]);

interface CustomLabelProps {
  x?: number | string;
  y?: number | string;
  width?: number | string;
  value?: unknown;
}

const renderCustomLabel = (props: CustomLabelProps) => {
  const { x = 0, y = 0, width = 0, value } = props;
  const offset = 8;
  const displayValue =
    typeof value === 'number'
      ? `${(Math.floor(value * 10) / 10).toFixed(1)}`.replace('.', ',')
      : '';

  return (
    <g>
      <text
        x={Number(x) + Number(width) / 2}
        y={Number(y) - offset}
        fill="#0f172a"
        fontSize={11}
        textAnchor="middle"
        dominantBaseline="middle"
        className="hidden lg:block font-semibold pointer-events-none"
      >
        {displayValue}
      </text>
    </g>
  );
};

export function ElectionChart({ data, title, compareWith }: ElectionChartProps) {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // 1. Determine which parties to show as major parties and aggregate the rest into "Sonstige"
  const isMajorParty = (p: {
    parteiKurz: string;
    parteiLang: string;
    zweitstimmenRelativ: number;
  }) => {
    const isEstablished =
      ESTABLISHED_PARTIES.has(p.parteiKurz.toUpperCase()) ||
      ESTABLISHED_PARTIES.has(p.parteiLang.toUpperCase());
    const isHighPerformer = p.zweitstimmenRelativ >= 3.0;
    return isEstablished || isHighPerformer;
  };

  const majorPartiesSet = new Set<string>();

  data.parteien.forEach((p) => {
    if (isMajorParty(p)) {
      majorPartiesSet.add(p.parteiKurz);
    }
  });

  if (compareWith) {
    compareWith.parteien.forEach((p) => {
      if (isMajorParty(p)) {
        majorPartiesSet.add(p.parteiKurz);
      }
    });
  }

  // Lists of all parties to check for aggregation
  const primaryParties = data.parteien;
  const compareParties = compareWith ? compareWith.parteien : [];

  // Initialize aggregated variables
  let primarySonstigeVotes = 0;
  let primarySonstigePercent = 0;
  let primarySonstigePercent2021 = 0;

  let compareSonstigeVotes = 0;
  let compareSonstigePercent = 0;

  const chartItems: ChartDataItem[] = [];

  // Add individual major parties
  majorPartiesSet.forEach((partyName) => {
    const p1 = primaryParties.find((p) => p.parteiKurz === partyName);
    const p2 = compareParties.find((p) => p.parteiKurz === partyName);

    if (p1 || p2) {
      chartItems.push({
        party: partyName,
        partyColor: getPartyColor(partyName),
        percentage1: p1 ? p1.zweitstimmenRelativ : 0,
        votes1: p1 ? p1.zweitstimmenAbsolut : 0,
        ...(compareWith && {
          percentage2: p2 ? p2.zweitstimmenRelativ : 0,
          votes2: p2 ? p2.zweitstimmenAbsolut : 0,
        }),
      });
    }
  });

  // Calculate "Sonstige" for primary
  primaryParties.forEach((p) => {
    if (!majorPartiesSet.has(p.parteiKurz)) {
      primarySonstigeVotes += p.zweitstimmenAbsolut;
      primarySonstigePercent += p.zweitstimmenRelativ;
      primarySonstigePercent2021 += p.zweitstimmenRelativ2021;
    }
  });

  // Calculate "Sonstige" for comparison
  if (compareWith) {
    compareParties.forEach((p) => {
      if (!majorPartiesSet.has(p.parteiKurz)) {
        compareSonstigeVotes += p.zweitstimmenAbsolut;
        compareSonstigePercent += p.zweitstimmenRelativ;
      }
    });
  }

  // Round percentages to 2 decimal places
  primarySonstigePercent = Math.round(primarySonstigePercent * 100) / 100;
  primarySonstigePercent2021 = Math.round(primarySonstigePercent2021 * 100) / 100;
  compareSonstigePercent = Math.round(compareSonstigePercent * 100) / 100;

  // Add "Sonstige" if there are any remaining votes
  if (primarySonstigeVotes > 0 || compareSonstigeVotes > 0) {
    chartItems.push({
      party: 'Sonstige',
      partyColor: getPartyColor('Sonstige'),
      percentage1: primarySonstigePercent,
      votes1: primarySonstigeVotes,
      ...(compareWith && {
        percentage2: compareSonstigePercent,
        votes2: compareSonstigeVotes,
      }),
    });
  }

  // Sort chartItems by percentage1 descending, but keep 'Sonstige' at the end
  chartItems.sort((a, b) => {
    if (a.party === 'Sonstige') return 1;
    if (b.party === 'Sonstige') return -1;
    return b.percentage1 - a.percentage1;
  });

  // Prepare names for the bars
  const name1 = data.name;
  const name2 = compareWith ? compareWith.name : '';

  // Helper for singlegebiet deltas
  const formatDelta = (current: number, prev: number) => {
    const delta = current - prev;
    const sign = delta >= 0 ? '+' : '';
    return `${sign}${delta.toFixed(2)}%`;
  };

  // For the screen-reader only table, we list ALL parties in descending order of votes
  const allPartiesList = [...primaryParties];
  if (compareWith) {
    // Add parties from compareWith that are not in primaryParties
    compareParties.forEach((cp) => {
      if (!allPartiesList.some((p) => p.parteiKurz === cp.parteiKurz)) {
        allPartiesList.push({
          parteiKurz: cp.parteiKurz,
          parteiLang: cp.parteiLang,
          zweitstimmenAbsolut: 0,
          zweitstimmenRelativ: 0,
          zweitstimmenAbsolut2021: 0,
          zweitstimmenRelativ2021: 0,
        });
      }
    });
  }

  // Sort table list by relative percentage in primary region
  allPartiesList.sort((a, b) => {
    const cpA = compareParties.find((p) => p.parteiKurz === a.parteiKurz);
    const cpB = compareParties.find((p) => p.parteiKurz === b.parteiKurz);
    const maxA = Math.max(a.zweitstimmenRelativ, cpA ? cpA.zweitstimmenRelativ : 0);
    const maxB = Math.max(b.zweitstimmenRelativ, cpB ? cpB.zweitstimmenRelativ : 0);
    return maxB - maxA;
  });

  const chartConfig = {
    percentage1: {
      label: name1,
      color: '#475569',
    },
    percentage2: {
      label: name2,
      color: '#cbd5e1',
    },
  } satisfies ChartConfig;

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-6 shadow-sm space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-3 sm:pb-4">
        <h3 className="text-sm xs:text-base sm:text-lg font-bold text-slate-800 tracking-tight">
          {title}
        </h3>
        <span className="text-xs text-slate-500 font-medium">Zweitstimmenanteil in %</span>
      </div>

      <div className="w-full relative">
        <div className="h-[460px] sm:h-[520px] w-full relative" aria-hidden="true">
          <ChartContainer config={chartConfig} className="h-full w-full aspect-auto">
            <BarChart
              key={isMobile ? 'mobile' : 'desktop'}
              data={chartItems}
              margin={{ top: 20, right: 5, left: 0, bottom: isMobile ? 40 : 15 }}
              barGap={-6}
              barCategoryGap="12%"
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="party"
                tickLine={false}
                axisLine={false}
                stroke="#475569"
                fontSize={11}
                fontWeight={600}
                angle={isMobile ? -45 : 0}
                textAnchor={isMobile ? 'end' : 'middle'}
                height={isMobile ? 55 : 30}
              />
              <YAxis
                width={35}
                tickLine={false}
                axisLine={false}
                stroke="#475569"
                fontSize={11}
                domain={[0, 'auto']}
                tickFormatter={(value) => `${Math.floor(value)}`}
              />
              <ChartTooltip
                content={({
                  active,
                  payload,
                  label,
                }: {
                  active?: boolean;
                  payload?: readonly {
                    value?: number | string | readonly (number | string)[];
                    payload?: ChartDataItem;
                  }[];
                  label?: string | number;
                }) => {
                  if (active && payload && payload.length) {
                    const isSingleMode = !compareWith;
                    const chartItem = payload[0].payload as ChartDataItem;

                    // Find party object to get 2021 comparison
                    let deltaStr = '';
                    if (isSingleMode) {
                      if (chartItem.party === 'Sonstige') {
                        deltaStr = formatDelta(primarySonstigePercent, primarySonstigePercent2021);
                      } else {
                        const match = primaryParties.find((p) => p.parteiKurz === chartItem.party);
                        if (match) {
                          deltaStr = formatDelta(
                            match.zweitstimmenRelativ,
                            match.zweitstimmenRelativ2021,
                          );
                        }
                      }
                    }

                    return (
                      <div className="grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-800 pointer-events-none">
                        <p className="font-semibold text-slate-800 border-b border-slate-100 pb-1 mb-1">
                          {label}
                        </p>
                        <div className="grid gap-1.5">
                          <div>
                            {!isSingleMode && (
                              <p className="text-[10px] text-slate-500 uppercase font-medium">
                                {name1}
                              </p>
                            )}
                            <p className="leading-tight flex items-baseline gap-1.5">
                              <span className="font-mono font-medium text-slate-800 text-sm">
                                {payload[0].value !== undefined
                                  ? formatFloorPercentage(Number(payload[0].value))
                                  : ''}
                              </span>
                              {isSingleMode && deltaStr && (
                                <span
                                  className={`text-[10px] font-semibold ${deltaStr.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}
                                >
                                  ({deltaStr})
                                </span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                ({chartItem.votes1.toLocaleString('de-DE')} Stimmen)
                              </span>
                            </p>
                          </div>
                          {!isSingleMode && compareWith && payload[1] && (
                            <div className="border-t border-slate-100 pt-1.5">
                              <p className="text-[10px] text-slate-500 uppercase font-medium">
                                {name2}
                              </p>
                              <p className="leading-tight flex items-baseline gap-1.5">
                                <span className="font-mono font-medium text-slate-800 text-sm">
                                  {payload[1].value !== undefined
                                    ? formatFloorPercentage(Number(payload[1].value))
                                    : ''}
                                </span>
                                <span className="text-[10px] text-slate-500">
                                  ({payload[1].payload?.votes2?.toLocaleString('de-DE')} Stimmen)
                                </span>
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
                cursor={{ fill: '#f8fafc' }}
                position={{ y: 10 }}
                wrapperStyle={{
                  overflow: 'visible',
                }}
              />
              {/* Primary region bar - rendered first */}
              <Bar name={name1} dataKey="percentage1" radius={[4, 4, 0, 0]} fill="#475569">
                {chartItems.map((entry, index) => (
                  <Cell key={`cell-1-${index}`} fill={entry.partyColor} fillOpacity={1.0} />
                ))}
                <LabelList dataKey="percentage1" content={renderCustomLabel} />
              </Bar>

              {/* Comparison region bar (only if compareWith is present) - rendered second */}
              {compareWith && (
                <Bar name={name2} dataKey="percentage2" radius={[4, 4, 0, 0]} fill="#cbd5e1">
                  {chartItems.map((entry, index) => (
                    <Cell key={`cell-2-${index}`} fill={entry.partyColor} fillOpacity={0.4} />
                  ))}
                  <LabelList dataKey="percentage2" content={renderCustomLabel} />
                </Bar>
              )}
            </BarChart>
          </ChartContainer>
        </div>
        {/* Custom Legend outside the SVG container to prevent any overlap with rotated labels */}
        {compareWith && (
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-4 px-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="h-3 w-3 shrink-0 rounded-[3px] bg-[#475569] block" />
              <span>{name1}</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-700">
              <span className="h-3 w-3 shrink-0 rounded-[3px] bg-[#cbd5e1] block" />
              <span>{name2}</span>
            </div>
          </div>
        )}
      </div>

      {/* Screen-reader accessible data table wrapped in a block container to prevent layout overflow */}
      <div className="sr-only">
        <table>
          <caption>{title} - Detaillierte Wahlergebnisse</caption>
          <thead>
            <tr>
              <th scope="col">Partei</th>
              <th scope="col">{name1} (Stimmen absolut)</th>
              <th scope="col">{name1} (Stimmen relativ %)</th>
              {!compareWith && <th scope="col">{name1} (Veränderung zu 2021 %)</th>}
              {compareWith && (
                <>
                  <th scope="col">{name2} (Stimmen absolut)</th>
                  <th scope="col">{name2} (Stimmen relativ %)</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {allPartiesList.map((p) => {
              const cpVal = compareParties.find((cp) => cp.parteiKurz === p.parteiKurz);
              return (
                <tr key={p.parteiKurz}>
                  <th scope="row">{p.parteiLang || p.parteiKurz}</th>
                  <td>{p.zweitstimmenAbsolut.toLocaleString('de-DE')}</td>
                  <td>{p.zweitstimmenRelativ.toLocaleString('de-DE')}%</td>
                  {!compareWith && (
                    <td>{formatDelta(p.zweitstimmenRelativ, p.zweitstimmenRelativ2021)}</td>
                  )}
                  {compareWith && (
                    <>
                      <td>{cpVal ? cpVal.zweitstimmenAbsolut.toLocaleString('de-DE') : '0'}</td>
                      <td>{cpVal ? cpVal.zweitstimmenRelativ.toLocaleString('de-DE') : '0'}%</td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
