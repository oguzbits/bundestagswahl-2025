import type { GebietTyp, GebietErgebnis, ParteiErgebnis, WahlDatenMap } from './types';

// Helper to round numbers to 2 decimal places robustly
function roundToTwoDecimals(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

// Helper to parse integers safely with fallback to 0
function parseSafeInt(val: string | undefined): number {
  if (!val) return 0;
  const cleaned = val.replace(/\s/g, ''); // remove any spaces
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? 0 : num;
}

// Helper to split CSV line safely supporting semicolon delimiter and optional quotes
export function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ';' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export function parseElectionData(
  kergCsvText: string,
  parteienCsvText: string,
  wahlkreiseCsvText: string
): WahlDatenMap {
  const wahlDatenMap: WahlDatenMap = {};

  // 1. Process btw25_parteien.csv
  const partiesLookup = new Map<string, string>(); // Gruppenname (long) -> GruppennameKurz (short)
  const partyLines = parteienCsvText.split(/\r?\n/);
  for (const line of partyLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = splitCsvLine(trimmed);
    if (parts.length >= 5) {
      const shortName = parts[3]?.trim();
      const longName = parts[4]?.trim();
      if (longName && shortName) {
        partiesLookup.set(longName, shortName);
      }
    }
  }

  // 2. Process btw25_wahlkreisnamen_utf8.csv
  const wahlkreisToLandMap = new Map<string, string>(); // WKR_NR -> LAND_NR
  const wahlkreisLines = wahlkreiseCsvText.split(/\r?\n/);
  for (const line of wahlkreisLines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const parts = splitCsvLine(trimmed);
    if (parts.length >= 3) {
      const wkrNrRaw = parts[0]?.trim();
      const landNrRaw = parts[2]?.trim();
      if (wkrNrRaw && landNrRaw) {
        const wkrNum = parseInt(wkrNrRaw, 10);
        const landNum = parseInt(landNrRaw, 10);
        if (!isNaN(wkrNum) && !isNaN(landNum)) {
          const wkrNrPadded = wkrNum.toString().padStart(3, '0');
          const landNrPadded = landNum.toString().padStart(2, '0');
          wahlkreisToLandMap.set(wkrNrPadded, landNrPadded);
        }
      }
    }
  }

  // 3. Process kerg.csv
  const kergLines = kergCsvText.split(/\r?\n/);
  if (kergLines.length < 9) {
    return wahlDatenMap;
  }

  // Header row is index 5 (row 6)
  const headerParts = splitCsvLine(kergLines[5] || '');

  // Extract parties from index 20 onwards (advancing in steps of 4)
  const partyColumns: { longName: string; shortName: string; colIndex: number }[] = [];
  for (let i = 20; i < headerParts.length; i += 4) {
    const longName = headerParts[i]?.trim();
    if (!longName) continue;
    const shortName = partiesLookup.get(longName) || longName;
    partyColumns.push({ longName, shortName, colIndex: i });
  }

  // Process data rows starting from index 8
  for (let rowIndex = 8; rowIndex < kergLines.length; rowIndex++) {
    const line = kergLines[rowIndex]?.trim();
    if (!line) continue;
    
    const parts = splitCsvLine(line);
    if (parts.length < 20) continue;

    const rawId = parts[0]?.trim();
    if (!rawId) continue;

    const numId = parseInt(rawId, 10);
    if (isNaN(numId)) continue;

    let paddedId: string;
    let typ: GebietTyp;
    let uebergeordnetesGebietId: string | null = null;

    if (numId === 99) {
      paddedId = '99';
      typ = 'Bund';
    } else if (numId >= 1 && numId <= 16) {
      paddedId = numId.toString().padStart(2, '0');
      typ = 'Land';
    } else if (numId >= 100) {
      paddedId = numId.toString().padStart(3, '0');
      typ = 'Wahlkreis';
      // Determine parent state ID
      const rawParentId = parts[2]?.trim();
      if (rawParentId) {
        const parentNum = parseInt(rawParentId, 10);
        if (!isNaN(parentNum)) {
          uebergeordnetesGebietId = parentNum.toString().padStart(2, '0');
        }
      }
      if (!uebergeordnetesGebietId) {
        uebergeordnetesGebietId = wahlkreisToLandMap.get(paddedId) || null;
      }
    } else {
      // Ignore other ranges or handle as fallback
      continue;
    }

    const name = parts[1]?.trim() || '';

    // Voter statistics columns
    const wahlberechtigte = parseSafeInt(parts[4]);
    const wahlberechtigte2021 = parseSafeInt(parts[5]);
    const waehler = parseSafeInt(parts[8]);
    const waehler2021 = parseSafeInt(parts[9]);

    const wahlbeteiligung = wahlberechtigte > 0
      ? roundToTwoDecimals((waehler / wahlberechtigte) * 100)
      : 0;

    const wahlbeteiligung2021 = wahlberechtigte2021 > 0
      ? roundToTwoDecimals((waehler2021 / wahlberechtigte2021) * 100)
      : 0;

    // Valid second votes
    const gueltigeZweitstimmen = parseSafeInt(parts[18]);
    const gueltigeZweitstimmen2021 = parseSafeInt(parts[19]);

    // Party results
    const rawParteien: ParteiErgebnis[] = [];

    for (const partyCol of partyColumns) {
      const zAbs = parseSafeInt(parts[partyCol.colIndex + 2]);
      const zAbs2021 = parseSafeInt(parts[partyCol.colIndex + 3]);

      const zRel = gueltigeZweitstimmen > 0
        ? roundToTwoDecimals((zAbs / gueltigeZweitstimmen) * 100)
        : 0;

      const zRel2021 = gueltigeZweitstimmen2021 > 0
        ? roundToTwoDecimals((zAbs2021 / gueltigeZweitstimmen2021) * 100)
        : 0;

      rawParteien.push({
        parteiKurz: partyCol.shortName,
        parteiLang: partyCol.longName,
        zweitstimmenAbsolut: zAbs,
        zweitstimmenRelativ: zRel,
        zweitstimmenAbsolut2021: zAbs2021,
        zweitstimmenRelativ2021: zRel2021,
      });
    }

    // Consolidate CDU and CSU into CDU/CSU (Union)
    const cduEntry = rawParteien.find((p) => p.parteiKurz.toUpperCase() === 'CDU');
    const csuEntry = rawParteien.find((p) => p.parteiKurz.toUpperCase() === 'CSU');

    const parteien: ParteiErgebnis[] = [];
    if (cduEntry || csuEntry) {
      const unionAbs = (cduEntry?.zweitstimmenAbsolut || 0) + (csuEntry?.zweitstimmenAbsolut || 0);
      const unionAbs2021 = (cduEntry?.zweitstimmenAbsolut2021 || 0) + (csuEntry?.zweitstimmenAbsolut2021 || 0);
      const unionRel = gueltigeZweitstimmen > 0
        ? roundToTwoDecimals((unionAbs / gueltigeZweitstimmen) * 100)
        : 0;
      const unionRel2021 = gueltigeZweitstimmen2021 > 0
        ? roundToTwoDecimals((unionAbs2021 / gueltigeZweitstimmen2021) * 100)
        : 0;

      parteien.push({
        parteiKurz: 'CDU/CSU',
        parteiLang: 'Christlich Demokratische Union / Christlich-Soziale Union',
        zweitstimmenAbsolut: unionAbs,
        zweitstimmenRelativ: unionRel,
        zweitstimmenAbsolut2021: unionAbs2021,
        zweitstimmenRelativ2021: unionRel2021,
      });
    }

    rawParteien.forEach((p) => {
      const nameUpper = p.parteiKurz.toUpperCase();
      if (nameUpper !== 'CDU' && nameUpper !== 'CSU') {
        parteien.push(p);
      }
    });

    // Sort descending by current relative percentage
    parteien.sort((a, b) => b.zweitstimmenRelativ - a.zweitstimmenRelativ);

    const result: GebietErgebnis = {
      id: paddedId,
      name,
      typ,
      uebergeordnetesGebietId,
      wahlberechtigte,
      waehler,
      wahlbeteiligung,
      wahlbeteiligung2021,
      gueltigeZweitstimmen,
      gueltigeZweitstimmen2021,
      parteien,
    };

    wahlDatenMap[paddedId] = result;
  }

  return wahlDatenMap;
}
