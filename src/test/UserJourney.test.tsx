import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../App';

// Mock ResizeObserver and scrollIntoView for JSDOM
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
vi.stubGlobal('ResizeObserver', ResizeObserverMock);
window.HTMLElement.prototype.scrollIntoView = vi.fn();

// Mock Recharts components so they render cleanly in JSDOM and can be asserted on.
vi.mock('recharts', () => {
  return {
    ResponsiveContainer: ({ children }: { children?: React.ReactNode }) => (
      <div data-testid="responsive-container">{children}</div>
    ),
    BarChart: ({ children, data }: { children?: React.ReactNode; data?: unknown[] }) => (
      <div data-testid="bar-chart" data-chartdata={JSON.stringify(data)}>
        {children}
      </div>
    ),
    Bar: ({ name, dataKey }: { name?: string; dataKey?: string }) => (
      <div data-testid="bar" data-name={name} data-datakey={dataKey} />
    ),
    Cell: () => null,
    XAxis: () => null,
    YAxis: () => null,
    CartesianGrid: () => null,
    Tooltip: () => null,
    Legend: () => <div data-testid="legend" />,
    LabelList: () => null,
  };
});

describe('performs full user journey successfully: initial state, select primary region, select comparison region', () => {
  const originalLocation = window.location;

  // Mock election data
  const mockKergCsv = `(c) Bundeswahlleiter
License Info
Empty
Bundestagswahl 2025
Endergebnis
Nr;Gebiet;gehört zu;Gewählt;Wahlberechtigte;;;;Wählende;;;;Ungültige Stimmen;;;;Gültige Stimmen;;;;Sozialdemokratische Partei Deutschlands;;;;Christlich Demokratische Union Deutschlands;;;;BÜNDNIS 90/DIE GRÜNEN;;;;
;;;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;
;;;;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;
99;Bundesgebiet;;;1000;800;;;800;600;;;10;20;;;990;580;990;580;;;200;150;;;300;200;;;490;230;;;
11;Berlin;99;;1000;800;;;800;600;;;10;20;;;990;580;990;580;;;100;100;;;400;300;;;490;180;;;`;

  const mockParteienCsv = `
# (c) Die Bundeswahlleiterin
Gruppenschluessel;Gruppenart_XML;Gruppenart_CSV;GruppennameKurz;Gruppenname
2;PARTEI;Partei;SPD;Sozialdemokratische Partei Deutschlands
1;PARTEI;Partei;CDU;Christlich Demokratische Union Deutschlands
3;PARTEI;Partei;GRÜNE;BÜNDNIS 90/DIE GRÜNEN`;

  const mockWahlkreiseCsv = `
# Wahlkreisnamen
WKR_NR;WKR_NAME;LAND_NR;LAND_NAME;LAND_ABK
99;Bundesgebiet;00;Bundesgebiet;DE
11;Berlin;11;Berlin;BE`;

  beforeEach(() => {
    // Mock fetch for election data
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        let text = '';
        if (url.includes('kerg.csv')) text = mockKergCsv;
        else if (url.includes('btw25_parteien.csv')) text = mockParteienCsv;
        else if (url.includes('btw25_wahlkreisnamen_utf8.csv')) text = mockWahlkreiseCsv;

        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(text),
        });
      }),
    );

    // Mock window.location and pushState for URL routing tests
    const mockLocation = {
      ...originalLocation,
      pathname: '/',
      search: '',
    } as unknown as Location;

    Object.defineProperty(window, 'location', {
      value: mockLocation,
      writable: true,
      configurable: true,
    });

    vi.spyOn(window.history, 'pushState').mockImplementation((_state, _title, url) => {
      const urlStr = url ? url.toString() : '';
      const searchIndex = urlStr.indexOf('?');
      mockLocation.search = searchIndex !== -1 ? urlStr.slice(searchIndex) : '';
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'location', {
      value: originalLocation,
      configurable: true,
    });
    vi.restoreAllMocks();
  });

  it('performs full user journey successfully: initial state, select primary region, select comparison region', async () => {
    // 1. INITIAL STATE
    render(<App />);

    // Wait for the data to finish loading and the initial empty state to render
    await waitFor(() => {
      expect(
        screen.queryByText('Wahldaten werden verarbeitet und Ergebnisse geladen...'),
      ).not.toBeInTheDocument();
    });

    // Verify the app renders with only the primary search input visible
    const primarySelect = screen.getByRole('combobox', { name: 'Primäre Region' });
    expect(primarySelect).toBeInTheDocument();

    // Verify the "VERGLEICHSREGION" search input is NOT in the DOM
    expect(
      screen.queryByRole('combobox', { name: 'Vergleichsregion (Optional)' }),
    ).not.toBeInTheDocument();

    // Verify the "Keine Wahlregion ausgewählt" empty state is displayed
    expect(screen.getByText('Keine Wahlregion ausgewählt')).toBeInTheDocument();

    // 2. SELECT PRIMARY REGION
    // Open primary region dropdown
    fireEvent.click(primarySelect);

    // Search and select "Bundesgebiet"
    const searchInput = screen.getByPlaceholderText('Name, Bundesland oder ID suchen...');
    fireEvent.change(searchInput, { target: { value: 'Bundesgebiet' } });

    const optionBundesgebiet = await screen.findByText('Bundesgebiet', { selector: 'span' });
    fireEvent.click(optionBundesgebiet);

    // Assertions:
    // * The primary results card (MetadataHeader) appears with "Bundesgebiet" results
    await waitFor(() => {
      expect(screen.getByText('Wahlbeteiligung')).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Bundesgebiet' })).toBeInTheDocument();

    // * The secondary comparison search field ("VERGLEICHSREGION") is now dynamically rendered in the DOM
    const secondarySelect = screen.getByRole('combobox', { name: 'Vergleichsregion (Optional)' });
    expect(secondarySelect).toBeInTheDocument();

    // * The initial full-screen "Keine Wahlregion ausgewählt" empty state is replaced
    expect(screen.queryByText('Keine Wahlregion ausgewählt')).not.toBeInTheDocument();

    // 3. SELECT COMPARISON REGION
    // Open secondary comparison dropdown
    fireEvent.click(secondarySelect);

    // Search and select "Berlin"
    const comparisonSearchInput = screen.getByPlaceholderText('Name, Bundesland oder ID suchen...');
    fireEvent.change(comparisonSearchInput, { target: { value: 'Berlin' } });

    const optionBerlin = await screen.findByText('Berlin', { selector: 'span' });
    fireEvent.click(optionBerlin);

    // Assertions:
    // * The secondary results card appears next to the primary one
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Berlin' })).toBeInTheDocument();
    });
    expect(screen.getByRole('heading', { name: 'Bundesgebiet' })).toBeInTheDocument();

    // * The comparison chart at the bottom is successfully rendered in the DOM
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Vergleich: Bundesgebiet vs. Berlin')).toBeInTheDocument();
  });

  it('loads pre-selected regions based on initial URL query parameters', async () => {
    // Set initial search parameters
    window.location.search = '?gebiet1=99&gebiet2=11';

    render(<App />);

    // Wait for the data loading to complete
    await waitFor(() => {
      expect(
        screen.queryByText('Wahldaten werden verarbeitet und Ergebnisse geladen...'),
      ).not.toBeInTheDocument();
    });

    // Verify both MetadataHeaders render for pre-selected regions
    expect(screen.getByRole('heading', { name: 'Bundesgebiet' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Berlin' })).toBeInTheDocument();

    // Verify the comparison chart is also loaded
    expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    expect(screen.getByText('Vergleich: Bundesgebiet vs. Berlin')).toBeInTheDocument();
  });

  it('clears selection and returns to empty state when clicking the reset button', async () => {
    // Load with pre-selected regions
    window.location.search = '?gebiet1=99&gebiet2=11';

    render(<App />);

    await waitFor(() => {
      expect(
        screen.queryByText('Wahldaten werden verarbeitet und Ergebnisse geladen...'),
      ).not.toBeInTheDocument();
    });

    // Find and click the global reset/clear button
    const clearBtn = screen.getByRole('button', { name: 'Auswahl zurücksetzen' });
    expect(clearBtn).toBeInTheDocument();
    fireEvent.click(clearBtn);

    // Verify both headers are removed and we are back to empty state
    await waitFor(() => {
      expect(screen.queryByRole('heading', { name: 'Bundesgebiet' })).not.toBeInTheDocument();
    });
    expect(screen.queryByRole('heading', { name: 'Berlin' })).not.toBeInTheDocument();
    expect(screen.getByText('Keine Wahlregion ausgewählt')).toBeInTheDocument();
    expect(window.location.search).toBe('');
  });

  it('swaps primary and comparison regions when clicking the swap button', async () => {
    // Load with pre-selected regions (gebiet1 = 99 (Bundesgebiet), gebiet2 = 11 (Berlin))
    window.location.search = '?gebiet1=99&gebiet2=11';

    render(<App />);

    await waitFor(() => {
      expect(
        screen.queryByText('Wahldaten werden verarbeitet und Ergebnisse geladen...'),
      ).not.toBeInTheDocument();
    });

    // Find and click the swap button
    const swapBtn = screen.getByRole('button', { name: 'Regionen tauschen' });
    expect(swapBtn).toBeInTheDocument();
    fireEvent.click(swapBtn);

    // Verify the query parameters are updated/swapped in the URL
    await waitFor(() => {
      expect(window.location.search).toContain('gebiet1=11');
    });
    expect(window.location.search).toContain('gebiet2=99');

    // Verify the comparison chart title reflects the swap: comparison order is reversed
    expect(screen.getByText('Vergleich: Berlin vs. Bundesgebiet')).toBeInTheDocument();
  });
});
