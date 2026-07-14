import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import type { GebietErgebnis } from '../domain/types';
import { getPartyColor } from '../domain/partyColors';

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

export function ElectionChart({ data, title, compareWith }: ElectionChartProps) {
  // 1. Determine which parties to show as top parties and aggregate the rest into "Übrige"
  // We want to limit display to parties with >= 0.5% or top 7 parties.
  const getTopPartyNames = (ergebnis: GebietErgebnis): string[] => {
    const top7 = ergebnis.parteien.slice(0, 7).map((p) => p.parteiKurz);
    const aboveHalfPercent = ergebnis.parteien
      .filter((p) => p.zweitstimmenRelativ >= 0.5)
      .map((p) => p.parteiKurz);
    
    // Use whichever set is larger to ensure we don't truncate major ones
    return aboveHalfPercent.length > top7.length ? aboveHalfPercent : top7;
  };

  const topPartiesPrimary = getTopPartyNames(data);
  const topPartiesCompare = compareWith ? getTopPartyNames(compareWith) : [];
  
  // Union of top parties
  const topPartiesSet = new Set([...topPartiesPrimary, ...topPartiesCompare]);

  // Lists of all parties to check for aggregation
  const primaryParties = data.parteien;
  const compareParties = compareWith ? compareWith.parteien : [];

  // Initialize aggregated variables
  let primaryUebrigeVotes = 0;
  let primaryUebrigePercent = 0;
  let primaryUebrigeVotes2021 = 0;
  let primaryUebrigePercent2021 = 0;

  let compareUebrigeVotes = 0;
  let compareUebrigePercent = 0;

  const chartItems: ChartDataItem[] = [];

  // Add individual top parties
  topPartiesSet.forEach((partyName) => {
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
    if (!topPartiesSet.has(p.parteiKurz)) {
      primaryUebrigeVotes += p.zweitstimmenAbsolut;
      primaryUebrigePercent += p.zweitstimmenRelativ;
      primaryUebrigeVotes2021 += p.zweitstimmenAbsolut2021;
      primaryUebrigePercent2021 += p.zweitstimmenRelativ2021;
    }
  });

  // Calculate "Sonstige" for comparison
  if (compareWith) {
    compareParties.forEach((p) => {
      if (!topPartiesSet.has(p.parteiKurz)) {
        compareUebrigeVotes += p.zweitstimmenAbsolut;
        compareUebrigePercent += p.zweitstimmenRelativ;
      }
    });
  }

  // Round percentages to 1 decimal place
  primaryUebrigePercent = Math.round(primaryUebrigePercent * 10) / 10;
  primaryUebrigePercent2021 = Math.round(primaryUebrigePercent2021 * 10) / 10;
  compareUebrigePercent = Math.round(compareUebrigePercent * 10) / 10;

  // Add "Sonstige" if there are any remaining votes
  if (primaryUebrigeVotes > 0 || compareUebrigeVotes > 0) {
    chartItems.push({
      party: 'Sonstige',
      partyColor: getPartyColor('Sonstige'),
      percentage1: primaryUebrigePercent,
      votes1: primaryUebrigeVotes,
      ...(compareWith && {
        percentage2: compareUebrigePercent,
        votes2: compareUebrigeVotes,
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
    return `${sign}${delta.toFixed(1)}%`;
  };

  // Custom Tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const isSingleMode = !compareWith;
      const chartItem = payload[0].payload as ChartDataItem;

      // Find party object to get 2021 comparison
      let deltaStr = '';
      if (isSingleMode) {
        if (chartItem.party === 'Sonstige') {
          deltaStr = formatDelta(primaryUebrigePercent, primaryUebrigePercent2021);
        } else {
          const match = primaryParties.find((p) => p.parteiKurz === chartItem.party);
          if (match) {
            deltaStr = formatDelta(match.zweitstimmenRelativ, match.zweitstimmenRelativ2021);
          }
        }
      }

      return (
        <div className="bg-white p-4 border border-slate-200 rounded-xl shadow-lg text-sm max-w-sm">
          <p className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 mb-2">{label}</p>
          <div className="space-y-2">
            <div>
              {!isSingleMode && (
                <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider">{name1}</p>
              )}
              <p className="text-slate-800">
                <span className="font-bold text-base">
                  {payload[0].value?.toLocaleString('de-DE')}%
                </span>
                {isSingleMode && deltaStr && (
                  <span className={`text-xs font-semibold ml-2 ${deltaStr.startsWith('+') ? 'text-emerald-600' : 'text-rose-600'}`}>
                    ({deltaStr})
                  </span>
                )}
                <span className="text-xs text-slate-500 ml-1.5 block sm:inline">
                  ({chartItem.votes1.toLocaleString('de-DE')} Stimmen)
                </span>
              </p>
            </div>
            {!isSingleMode && compareWith && payload[1] && (
              <div className="border-t border-slate-100 pt-2">
                <p className="font-semibold text-xs text-slate-500 uppercase tracking-wider">{name2}</p>
                <p className="text-slate-800">
                  <span className="font-bold text-base">
                    {payload[1].value?.toLocaleString('de-DE')}%
                  </span>
                  <span className="text-xs text-slate-500 ml-1.5 block sm:inline">
                    ({(payload[1].payload as ChartDataItem).votes2?.toLocaleString('de-DE')} Stimmen)
                  </span>
                </p>
              </div>
            )}
          </div>
        </div>
      );
    }
    return null;
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

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-slate-100 pb-4">
        <h3 className="text-lg font-bold text-slate-800 tracking-tight">{title}</h3>
        <span className="text-xs text-slate-500 font-medium">Zweitstimmenanteil in %</span>
      </div>

      <div className="w-full h-[400px] relative">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartItems}
            margin={{ top: 10, right: 10, left: -20, bottom: 5 }}
            barGap={4}
          >
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis
              dataKey="party"
              tickLine={false}
              axisLine={false}
              stroke="#64748b"
              fontSize={12}
              fontWeight={600}
            />
            <YAxis
              tickLine={false}
              axisLine={false}
              stroke="#64748b"
              fontSize={12}
              unit="%"
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />
            {!compareWith ? null : (
              <Legend
                verticalAlign="top"
                height={36}
                iconType="circle"
                iconSize={8}
                wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}
              />
            )}
            
            {/* Primary region bar */}
            <Bar name={name1} dataKey="percentage1" radius={[4, 4, 0, 0]}>
              {chartItems.map((entry, index) => (
                <Cell
                  key={`cell-1-${index}`}
                  fill={entry.partyColor}
                  fillOpacity={compareWith ? 1.0 : 0.85}
                />
              ))}
            </Bar>

            {/* Comparison region bar (only if compareWith is present) */}
            {compareWith && (
              <Bar name={name2} dataKey="percentage2" radius={[4, 4, 0, 0]}>
                {chartItems.map((entry, index) => (
                  <Cell
                    key={`cell-2-${index}`}
                    fill={entry.partyColor}
                    fillOpacity={0.5}
                    stroke={entry.partyColor}
                    strokeWidth={1.5}
                    strokeDasharray="4 2"
                  />
                ))}
              </Bar>
            )}
          </BarChart>
        </ResponsiveContainer>
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
                    <td>
                      {formatDelta(p.zweitstimmenRelativ, p.zweitstimmenRelativ2021)}
                    </td>
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
