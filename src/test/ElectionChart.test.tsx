import { describe, it, expect, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { ElectionChart, formatFloorPercentage } from '../components/ElectionChart';
import type { GebietErgebnis } from '../domain/types';

// Mock Recharts components to allow direct inspection of props passed to them in JSDOM
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
    BarChart: ({ children, barGap, data, margin }: any) => (
      <div data-testid="bar-chart" data-bargap={barGap} data-margin={JSON.stringify(margin)} data-chartdata={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: ({ children, name, dataKey }: any) => (
      <div data-testid="bar" data-name={name} data-datakey={dataKey}>
        {children}
      </div>
    ),
    Cell: ({ fill, fillOpacity }: any) => (
      <div data-testid="cell" data-fill={fill} data-fillopacity={fillOpacity} />
    ),
    XAxis: () => <div data-testid="x-axis" />,
    YAxis: ({ tickFormatter, domain }: any) => (
      <div 
        data-testid="y-axis" 
        data-domain={JSON.stringify(domain)}
        data-formatted-value-test={tickFormatter ? tickFormatter(32) : undefined}
      />
    ),
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => <div data-testid="legend" />,
    LabelList: ({ dataKey, content }: any) => {
      const renderedContent = content ? content({ value: 31.7432, x: 10, y: 20, width: 50 }) : null;
      return (
        <div data-testid="label-list" data-datakey={dataKey}>
          {renderedContent}
        </div>
      );
    },
  };
});

const mockGebiet1: GebietErgebnis = {
  id: '01',
  name: 'Schleswig-Holstein',
  typ: 'Land',
  uebergeordnetesGebietId: null,
  wahlberechtigte: 1000,
  waehler: 800,
  wahlbeteiligung: 80.0,
  wahlbeteiligung2021: 75.0,
  gueltigeZweitstimmen: 790,
  gueltigeZweitstimmen2021: 580,
  parteien: [
    {
      parteiKurz: 'SPD',
      parteiLang: 'Sozialdemokratische Partei Deutschlands',
      zweitstimmenAbsolut: 300,
      zweitstimmenRelativ: 38.0,
      zweitstimmenAbsolut2021: 200,
      zweitstimmenRelativ2021: 34.5,
    },
    {
      parteiKurz: 'CDU',
      parteiLang: 'Christlich Demokratische Union',
      zweitstimmenAbsolut: 200,
      zweitstimmenRelativ: 25.3,
      zweitstimmenAbsolut2021: 200,
      zweitstimmenRelativ2021: 34.5,
    },
    {
      parteiKurz: 'PIRATEN',
      parteiLang: 'Piratenpartei Deutschland',
      zweitstimmenAbsolut: 10,
      zweitstimmenRelativ: 1.3,
      zweitstimmenAbsolut2021: 15,
      zweitstimmenRelativ2021: 2.6,
    },
    {
      parteiKurz: 'ÖDP',
      parteiLang: 'Ökologisch-Demokratische Partei',
      zweitstimmenAbsolut: 15,
      zweitstimmenRelativ: 1.9,
      zweitstimmenAbsolut2021: 10,
      zweitstimmenRelativ2021: 1.7,
    }
  ],
};

const mockGebiet2: GebietErgebnis = {
  id: '02',
  name: 'Hamburg',
  typ: 'Land',
  uebergeordnetesGebietId: null,
  wahlberechtigte: 1000,
  waehler: 800,
  wahlbeteiligung: 80.0,
  wahlbeteiligung2021: 75.0,
  gueltigeZweitstimmen: 790,
  gueltigeZweitstimmen2021: 580,
  parteien: [
    {
      parteiKurz: 'SPD',
      parteiLang: 'Sozialdemokratische Partei Deutschlands',
      zweitstimmenAbsolut: 250,
      zweitstimmenRelativ: 31.6,
      zweitstimmenAbsolut2021: 220,
      zweitstimmenRelativ2021: 27.8,
    },
    {
      parteiKurz: 'CDU',
      parteiLang: 'Christlich Demokratische Union',
      zweitstimmenAbsolut: 180,
      zweitstimmenRelativ: 22.8,
      zweitstimmenAbsolut2021: 190,
      zweitstimmenRelativ2021: 24.1,
    },
    {
      parteiKurz: 'PIRATEN',
      parteiLang: 'Piratenpartei Deutschland',
      zweitstimmenAbsolut: 20,
      zweitstimmenRelativ: 2.5,
      zweitstimmenAbsolut2021: 25,
      zweitstimmenRelativ2021: 3.2,
    },
    {
      parteiKurz: 'ÖDP',
      parteiLang: 'Ökologisch-Demokratische Partei',
      zweitstimmenAbsolut: 5,
      zweitstimmenRelativ: 0.6,
      zweitstimmenAbsolut2021: 5,
      zweitstimmenRelativ2021: 0.6,
    }
  ],
};

describe('ElectionChart Component', () => {
  it('correctly aggregates data matching the list logic (major/established + Sonstige)', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        compareWith={mockGebiet2}
        title="Test Vergleich"
      />
    );

    const chartEl = screen.getByTestId('bar-chart');
    const chartDataRaw = chartEl.getAttribute('data-chartdata');
    expect(chartDataRaw).toBeDefined();

    const chartData = JSON.parse(chartDataRaw || '[]');
    // Only major/established (SPD, CDU) and Sonstige should be present
    expect(chartData).toHaveLength(3);

    const spd = chartData.find((d: any) => d.party === 'SPD');
    const cdu = chartData.find((d: any) => d.party === 'CDU');
    const sonstige = chartData.find((d: any) => d.party === 'Sonstige');

    expect(spd).toBeDefined();
    expect(cdu).toBeDefined();
    expect(sonstige).toBeDefined();

    // Dynamically calculate expected Sonstige values
    const ESTABLISHED_PARTIES = new Set([
      'CDU', 'CSU', 'CDU/CSU', 'SPD', 'GRÜNE', 'GRÜNEN', 'BÜNDNIS 90/DIE GRÜNEN', 'FDP', 'AFD', 'DIE LINKE', 'LINKE', 'BSW'
    ]);
    const isMajorParty = (p: any) => {
      const isEstablished = ESTABLISHED_PARTIES.has(p.parteiKurz.toUpperCase()) || 
                            ESTABLISHED_PARTIES.has(p.parteiLang.toUpperCase());
      const isHighPerformer = p.zweitstimmenRelativ >= 3.0;
      return isEstablished || isHighPerformer;
    };

    const expectedSonstige1 = Math.round(
      mockGebiet1.parteien
        .filter((p) => !isMajorParty(p))
        .reduce((sum, p) => sum + p.zweitstimmenRelativ, 0) * 100
    ) / 100;

    const expectedSonstige2 = Math.round(
      mockGebiet2.parteien
        .filter((p) => !isMajorParty(p))
        .reduce((sum, p) => sum + p.zweitstimmenRelativ, 0) * 100
    ) / 100;

    expect(sonstige.percentage1).toBe(expectedSonstige1);
    expect(sonstige.percentage2).toBe(expectedSonstige2);
  });

  it('verifies that barGap={0} is set on BarChart', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        compareWith={mockGebiet2}
        title="Test Vergleich"
      />
    );

    const chartEl = screen.getByTestId('bar-chart');
    expect(chartEl.getAttribute('data-bargap')).toBe('0');
  });

  it('verifies visual styling properties (legend suffix and opacity mapping)', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        compareWith={mockGebiet2}
        title="Test Vergleich"
      />
    );

    const bars = screen.getAllByTestId('bar');
    expect(bars).toHaveLength(2);

    const bar1 = bars[0];
    const bar2 = bars[1];

    // Bar 1 should represent Gebiet 1
    expect(bar1.getAttribute('data-name')).toBe('Schleswig-Holstein');
    expect(bar1.getAttribute('data-datakey')).toBe('percentage1');

    // Bar 2 should represent Gebiet 2 with "(heller)" suffix
    expect(bar2.getAttribute('data-name')).toBe('Hamburg (heller)');
    expect(bar2.getAttribute('data-datakey')).toBe('percentage2');

    // Verify opacity: Cell 1 should have opacity 1.0, Cell 2 should have opacity 0.5
    const cells = screen.getAllByTestId('cell');
    // First 3 cells are for Bar 1 (SPD, CDU, Sonstige)
    expect(cells[0].getAttribute('data-fillopacity')).toBe('1');
    // Next 3 cells are for Bar 2 (SPD, CDU, Sonstige)
    expect(cells[3].getAttribute('data-fillopacity')).toBe('0.5');
  });

  it('verifies Y-axis margins, domain, and tick formatter', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        title="Test Y-Axis"
      />
    );

    const chartEl = screen.getByTestId('bar-chart');
    const margin = JSON.parse(chartEl.getAttribute('data-margin') || '{}');
    expect(margin.left).toBeGreaterThanOrEqual(20);

    const yAxisEl = screen.getByTestId('y-axis');
    expect(yAxisEl.getAttribute('data-domain')).toBe(JSON.stringify(['auto', 'auto']));
    expect(yAxisEl.getAttribute('data-formatted-value-test')).toBe('32.0%');
  });

  it('verifies persistent LabelList components and their formatters', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        compareWith={mockGebiet2}
        title="Test Labels"
      />
    );

    const labelLists = screen.getAllByTestId('label-list');
    expect(labelLists).toHaveLength(2);

    expect(labelLists[0].getAttribute('data-datakey')).toBe('percentage1');
    const textEl1 = labelLists[0].querySelector('text');
    expect(textEl1).toBeDefined();
    expect(textEl1?.textContent).toBe('31.7%');
    expect(textEl1?.getAttribute('class')).toContain('hidden lg:block');

    expect(labelLists[1].getAttribute('data-datakey')).toBe('percentage2');
    const textEl2 = labelLists[1].querySelector('text');
    expect(textEl2).toBeDefined();
    expect(textEl2?.textContent).toBe('31.7%');
    expect(textEl2?.getAttribute('class')).toContain('hidden lg:block');
  });

  it('verifies formatFloorPercentage behaves correctly for boundary cases', () => {
    expect(formatFloorPercentage(4.98)).toBe('4.9%');
    expect(formatFloorPercentage(4.91)).toBe('4.9%');
    expect(formatFloorPercentage(5.0)).toBe('5.0%');
    expect(formatFloorPercentage(30.48)).toBe('30.4%');
  });

  it('verifies that LabelList is responsive via Tailwind CSS classes', () => {
    render(
      <ElectionChart
        data={mockGebiet1}
        title="Test Responsive Labels"
      />
    );

    const labelList = screen.getByTestId('label-list');
    const textEl = labelList.querySelector('text');
    expect(textEl).toBeDefined();
    expect(textEl?.getAttribute('class')).toContain('hidden lg:block');
  });
});
