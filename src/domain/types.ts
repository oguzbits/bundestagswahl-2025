export type GebietTyp = 'Bund' | 'Land' | 'Wahlkreis';

export interface ParteiErgebnis {
  parteiKurz: string;
  parteiLang: string;
  zweitstimmenAbsolut: number;
  zweitstimmenRelativ: number; // percentage rounded to 1 decimal place
  zweitstimmenAbsolut2021: number;
  zweitstimmenRelativ2021: number; // percentage rounded to 1 decimal place
}

export interface GebietErgebnis {
  id: string; // numeric ID, padded with leading zeros (e.g., "01" or "001")
  name: string;
  typ: GebietTyp;
  uebergeordnetesGebietId: string | null; // parent state ID for a constituency, null for Bund/Land
  wahlberechtigte: number;
  waehler: number;
  wahlbeteiligung: number; // percentage, rounded to 1 decimal place
  wahlbeteiligung2021: number; // percentage, rounded to 1 decimal place
  gueltigeZweitstimmen: number;
  gueltigeZweitstimmen2021: number;
  parteien: ParteiErgebnis[]; // sorted descending by current relative percentage
}

export type WahlDatenMap = Record<string, GebietErgebnis>;
