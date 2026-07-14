import { useState, useEffect } from 'react';
import type { WahlDatenMap } from '../domain/types';
import { parseElectionData } from '../domain/csvParser';

export function useElectionData() {
  const [data, setData] = useState<WahlDatenMap | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      setIsLoading(true);
      setError(null);
      try {
        const [kergRes, parteienRes, wahlkreiseRes] = await Promise.all([
          fetch('/src/assets/fixtures/kerg.csv'),
          fetch('/src/assets/fixtures/btw25_parteien.csv'),
          fetch('/src/assets/fixtures/btw25_wahlkreisnamen_utf8.csv'),
        ]);

        if (!kergRes.ok || !parteienRes.ok || !wahlkreiseRes.ok) {
          throw new Error('Fehler beim Laden der Wahl-Dateien.');
        }

        const [kergText, parteienText, wahlkreiseText] = await Promise.all([
          kergRes.text(),
          parteienRes.text(),
          wahlkreiseRes.text(),
        ]);

        if (!active) return;

        const parsed = parseElectionData(kergText, parteienText, wahlkreiseText);
        setData(parsed);
      } catch (err) {
        if (!active) return;
        setError(err instanceof Error ? err : new Error('Ein unbekannter Fehler ist aufgetreten'));
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      active = false;
    };
  }, []);

  return {
    data,
    isLoading,
    error,
  };
}
