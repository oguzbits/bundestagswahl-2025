import { useState, useEffect } from 'react';
import type { WahlDatenMap } from '../domain/types';
import { parseElectionData } from '../domain/csvParser';

export interface SearchOption {
  id: string;
  name: string;
  type: 'Bund' | 'Land' | 'Wahlkreis';
  parentName: string | null;
}

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
          fetch('/fixtures/kerg.csv'),
          fetch('/fixtures/btw25_parteien.csv'),
          fetch('/fixtures/btw25_wahlkreisnamen_utf8.csv'),
        ]);

        if (!kergRes.ok || !parteienRes.ok || !wahlkreiseRes.ok) {
          throw new Error('Fehler beim Laden der Wahl-Dateien.');
        }

        const kergCsv = await kergRes.text();
        const parteienCsv = await parteienRes.text();
        const wahlkreiseCsv = await wahlkreiseRes.text();

        if (active) {
          const parsed = parseElectionData(kergCsv, parteienCsv, wahlkreiseCsv);
          setData(parsed);
        }
      } catch (err) {
        if (active) {
          setError(err instanceof Error ? err : new Error('Ein unbekannter Fehler ist aufgetreten'));
        }
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

  const searchOptions = (() => {
    if (!data) return [];

    const options: SearchOption[] = Object.values(data).map((gebiet) => {
      let parentName: string | null = null;
      if (gebiet.typ === 'Wahlkreis' && gebiet.uebergeordnetesGebietId) {
        const parent = data[gebiet.uebergeordnetesGebietId];
        parentName = parent ? parent.name : null;
      }
      return {
        id: gebiet.id,
        name: gebiet.name,
        type: gebiet.typ,
        parentName,
      };
    });

    options.sort((a, b) => {
      if (a.id === '99') return -1;
      if (b.id === '99') return 1;

      if (a.type === 'Land' && b.type !== 'Land') return -1;
      if (b.type === 'Land' && a.type !== 'Land') return 1;
      if (a.type === 'Land' && b.type === 'Land') {
        return a.name.localeCompare(b.name, 'de');
      }

      const parentA = a.parentName || '';
      const parentB = b.parentName || '';
      if (parentA !== parentB) {
        return parentA.localeCompare(parentB, 'de');
      }
      return a.name.localeCompare(b.name, 'de');
    });

    return options;
  })();

  return {
    data,
    searchOptions,
    isLoading,
    error,
  };
}

