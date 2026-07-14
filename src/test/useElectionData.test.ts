import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useElectionData } from '../hooks/useElectionData';

describe('useElectionData Hook', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('initially returns loading state and null data', () => {
    (fetch as any).mockReturnValue(new Promise(() => {}));

    const { result } = renderHook(() => useElectionData());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('successfully fetches and parses election data', async () => {
    const mockKergCsv = `(c) Bundeswahlleiter
License Info
Empty
Bundestagswahl 2025
Endergebnis
Nr;Gebiet;gehört zu;Gewählt;Wahlberechtigte;;;;Wählende;;;;Ungültige Stimmen;;;;Gültige Stimmen;;;;Sozialdemokratische Partei Deutschlands;;;;Christlich Demokratische Union Deutschlands;;;;BÜNDNIS 90/DIE GRÜNEN;;;;
;;;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;
;;;;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;
99;Bund;;;1000;800;;;800;600;;;10;20;;;990;580;;;;;200;150;;;300;200;;;490;230;;;`;

    const mockParteienCsv = `
# (c) Die Bundeswahlleiterin
Gruppenschluessel;Gruppenart_XML;Gruppenart_CSV;GruppennameKurz;Gruppenname
2;PARTEI;Partei;SPD;Sozialdemokratische Partei Deutschlands
1;PARTEI;Partei;CDU;Christlich Demokratische Union Deutschlands
3;PARTEI;Partei;GRÜNE;BÜNDNIS 90/DIE GRÜNEN`;

    const mockWahlkreiseCsv = `
# Wahlkreisnamen
WKR_NR;WKR_NAME;LAND_NR;LAND_NAME;LAND_ABK
99;Bundesgebiet;00;Bundesgebiet;DE`;

    (fetch as any).mockImplementation((url: string) => {
      let text = '';
      if (url.includes('kerg.csv')) text = mockKergCsv;
      else if (url.includes('btw25_parteien.csv')) text = mockParteienCsv;
      else if (url.includes('btw25_wahlkreisnamen_utf8.csv')) text = mockWahlkreiseCsv;

      return Promise.resolve({
        ok: true,
        text: () => Promise.resolve(text),
      });
    });

    const { result } = renderHook(() => useElectionData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBeNull();
    expect(result.current.data).not.toBeNull();
    
    const bundesgebiet = result.current.data!['99'];
    expect(bundesgebiet).toBeDefined();
    expect(bundesgebiet.name).toBe('Bund');
    expect(bundesgebiet.wahlberechtigte).toBe(1000);
    expect(bundesgebiet.parteien).toHaveLength(3);
    expect(bundesgebiet.parteien[0].parteiKurz).toBe('GRÜNE');
    expect(bundesgebiet.parteien[1].parteiKurz).toBe('CDU');
    expect(bundesgebiet.parteien[2].parteiKurz).toBe('SPD');
  });

  it('sets error state when a fetch fails', async () => {
    (fetch as any).mockResolvedValue({
      ok: false,
      status: 404,
    });

    const { result } = renderHook(() => useElectionData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).not.toBeNull();
    expect(result.current.error?.message).toContain('Fehler beim Laden der Wahl-Dateien');
    expect(result.current.data).toBeNull();
  });
});
