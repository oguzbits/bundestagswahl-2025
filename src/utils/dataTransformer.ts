import type { ParteiErgebnis } from '../domain/types';

export const ESTABLISHED_PARTIES = new Set([
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
  'BSW'
]);

/**
 * Formats the delta value compared to 2021
 */
export function formatDeltaInfo(current: number, prev: number) {
  if (prev === 0 && current > 0) {
    return { text: 'neu', className: 'text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded' };
  }
  const delta = current - prev;
  if (delta > 0) {
    return { text: `+${delta.toFixed(2)}%`, className: 'text-emerald-600 font-bold' };
  }
  if (delta < 0) {
    return { text: `${delta.toFixed(2)}%`, className: 'text-rose-600 font-bold' };
  }
  return { text: '0.00%', className: 'text-slate-400' };
}

export interface PartitionedParties {
  displayList: ParteiErgebnis[];
  sortedAndFilteredMinorParties: ParteiErgebnis[];
}

/**
 * Partitions parties into primary (established or >= 3%) and minor parties,
 * aggregating minor parties into a virtual "Sonstige" row.
 */
export function partitionParties(parties: ParteiErgebnis[]): PartitionedParties {
  const primaryParties: ParteiErgebnis[] = [];
  const minorParties: ParteiErgebnis[] = [];

  parties.forEach((p) => {
    const isEstablished = ESTABLISHED_PARTIES.has(p.parteiKurz.toUpperCase()) || 
                          ESTABLISHED_PARTIES.has(p.parteiLang.toUpperCase());
    const isHighPerformer = p.zweitstimmenRelativ >= 3.0;

    if (isEstablished || isHighPerformer) {
      primaryParties.push(p);
    } else {
      minorParties.push(p);
    }
  });

  let sonstigeAbsolut = 0;
  let sonstigeRelativ = 0;
  let sonstigeAbsolut2021 = 0;
  let sonstigeRelativ2021 = 0;

  minorParties.forEach((p) => {
    sonstigeAbsolut += p.zweitstimmenAbsolut;
    sonstigeRelativ += p.zweitstimmenRelativ;
    sonstigeAbsolut2021 += p.zweitstimmenAbsolut2021;
    sonstigeRelativ2021 += p.zweitstimmenRelativ2021;
  });

  sonstigeRelativ = Math.round(sonstigeRelativ * 100) / 100;
  sonstigeRelativ2021 = Math.round(sonstigeRelativ2021 * 100) / 100;

  const sonstigeRow: ParteiErgebnis | null = minorParties.length > 0 ? {
    parteiKurz: 'Sonstige',
    parteiLang: 'Sonstige Parteien unter 3.0%',
    zweitstimmenAbsolut: sonstigeAbsolut,
    zweitstimmenRelativ: sonstigeRelativ,
    zweitstimmenAbsolut2021: sonstigeAbsolut2021,
    zweitstimmenRelativ2021: sonstigeRelativ2021,
  } : null;

  const displayList = [...primaryParties];
  if (sonstigeRow) {
    displayList.push(sonstigeRow);
  }

  displayList.sort((a, b) => {
    if (a.parteiKurz === 'Sonstige') return 1;
    if (b.parteiKurz === 'Sonstige') return -1;
    return b.zweitstimmenRelativ - a.zweitstimmenRelativ;
  });

  const sortedAndFilteredMinorParties = [...minorParties]
    .filter((p) => p.zweitstimmenAbsolut > 0)
    .sort((a, b) => b.zweitstimmenRelativ - a.zweitstimmenRelativ);

  return {
    displayList,
    sortedAndFilteredMinorParties,
  };
}
