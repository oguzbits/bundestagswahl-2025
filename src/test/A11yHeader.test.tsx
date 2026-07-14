import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MetadataHeader } from '../components/MetadataHeader';
import App from '../App';
import type { GebietErgebnis } from '../domain/types';

// Mock the hooks used in App.tsx
vi.mock('../hooks/useUrlState', () => ({
  useUrlState: () => ({
    gebiet1Id: '1',
    gebiet2Id: '2',
    setGebiet1Id: vi.fn(),
    setGebiet2Id: vi.fn(),
    clearSelection: vi.fn(),
    swapPositions: vi.fn(),
  }),
}));

vi.mock('../hooks/useElectionData', () => ({
  useElectionData: () => ({
    data: {
      '1': {
        id: '1',
        name: 'Region Eins',
        typ: 'Wahlkreis',
        uebergeordnetesGebietId: '16',
        wahlberechtigte: 100000,
        waehler: 80000,
        wahlbeteiligung: 80,
        gueltigeZweitstimmen: 79000,
        parteien: [],
      },
      '2': {
        id: '2',
        name: 'Region Zwei',
        typ: 'Land',
        uebergeordnetesGebietId: null,
        wahlberechtigte: 200000,
        waehler: 150000,
        wahlbeteiligung: 75,
        gueltigeZweitstimmen: 148000,
        parteien: [],
      },
      '16': {
        id: '16',
        name: 'Bundesland Eins',
        typ: 'Land',
        uebergeordnetesGebietId: null,
        wahlberechtigte: 500000,
        waehler: 400000,
        wahlbeteiligung: 80,
        gueltigeZweitstimmen: 395000,
        parteien: [],
      },
    },
    isLoading: false,
    error: null,
    searchOptions: [],
  }),
}));

// Mock Recharts and lucide-react to avoid layout issues in testing-library
vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: any) => <div>{children}</div>,
  BarChart: ({ children }: any) => <div>{children}</div>,
  Bar: ({ children }: any) => <div>{children}</div>,
  XAxis: () => null,
  YAxis: () => null,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
  Cell: () => null,
  LabelList: () => null,
}));

const mockGebiet: GebietErgebnis = {
  id: '09',
  name: 'Bayern',
  typ: 'Land',
  uebergeordnetesGebietId: null,
  wahlberechtigte: 1000000,
  waehler: 750000,
  wahlbeteiligung: 75,
  gueltigeZweitstimmen: 740000,
  parteien: [
    {
      parteiKurz: 'CSU',
      parteiLang: 'Christlich-Soziale Union in Bayern e.V.',
      zweitstimmenAbsolut: 300000,
      zweitstimmenRelativ: 40.54,
      zweitstimmenAbsolut2021: 290000,
      zweitstimmenRelativ2021: 39.19,
    },
    {
      parteiKurz: 'Sonstige',
      parteiLang: 'Sonstige Parteien unter 3.0%',
      zweitstimmenAbsolut: 10000,
      zweitstimmenRelativ: 1.35,
      zweitstimmenAbsolut2021: 8000,
      zweitstimmenRelativ2021: 1.08,
    }
  ],
};

describe('MetadataHeader Accessibility and Visual Layout', () => {
  it('compiles and renders title, ID and stats correctly', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);
    expect(screen.getByText('Bayern')).toBeInTheDocument();
    expect(screen.getByText('ID: 09')).toBeInTheDocument();
  });

  it('renders accordion toggle button with accessibility attributes', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);
    
    const accordionBtn = screen.getByRole('button', { name: /Alle Parteien anzeigen/i });
    expect(accordionBtn).toBeInTheDocument();
    expect(accordionBtn).toHaveAttribute('aria-expanded', 'false');
    expect(accordionBtn).toHaveAttribute('aria-controls', `minor-parties-${mockGebiet.id}`);
  });
});

describe('App Component Accessibility Audit', () => {
  it('verifies that the region swap button has a valid title, aria-label, and focus classes', () => {
    render(<App />);

    const swapBtn = screen.getByRole('button', { name: 'Regionen tauschen' });
    expect(swapBtn).toBeInTheDocument();
    expect(swapBtn).toHaveAttribute('title', 'Regionen tauschen');
    expect(swapBtn).toHaveAttribute('aria-label', 'Regionen tauschen');
    expect(swapBtn.className).toContain('focus-visible:ring-2');
    expect(swapBtn.className).toContain('focus-visible:ring-primary');
  });
});
