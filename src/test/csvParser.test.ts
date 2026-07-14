import { describe, it, expect } from 'vitest';
import { parseElectionData, splitCsvLine } from '../domain/csvParser';

describe('splitCsvLine', () => {
  it('should split simple semicolon-delimited values', () => {
    const line = 'A;B;C';
    expect(splitCsvLine(line)).toEqual(['A', 'B', 'C']);
  });

  it('should handle quoted values containing semicolons', () => {
    const line = 'A;"B;C";D';
    expect(splitCsvLine(line)).toEqual(['A', 'B;C', 'D']);
  });

  it('should trim whitespace around fields', () => {
    const line = '  A  ; B ; C  ';
    expect(splitCsvLine(line)).toEqual(['A', 'B', 'C']);
  });
});

describe('parseElectionData', () => {
  const mockParteienCsv = `
# (c) Die Bundeswahlleiterin
Gruppenschluessel;Gruppenart_XML;Gruppenart_CSV;GruppennameKurz;Gruppenname
2;PARTEI;Partei;SPD;Sozialdemokratische Partei Deutschlands
1;PARTEI;Partei;CDU;Christlich Demokratische Union Deutschlands
3;PARTEI;Partei;GRÜNE;BÜNDNIS 90/DIE GRÜNEN
`;

  const mockWahlkreiseCsv = `
# Wahlkreisnamen
WKR_NR;WKR_NAME;LAND_NR;LAND_NAME;LAND_ABK
100;Testkreis A;01;Schleswig-Holstein;SH
101;Testkreis B;01;Schleswig-Holstein;SH
`;

  const mockKergCsv = `(c) Bundeswahlleiter
License Info
Empty
Bundestagswahl 2025
Endergebnis
Nr;Gebiet;gehört zu;Gewählt;Wahlberechtigte;;;;Wählende;;;;Ungültige Stimmen;;;;Gültige Stimmen;;;;Sozialdemokratische Partei Deutschlands;;;;Christlich Demokratische Union Deutschlands;;;;BÜNDNIS 90/DIE GRÜNEN;;;;
;;;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;
;;;;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;
99;Bund;;;1000;800;;;800;600;;;10;20;;;990;580;;;;;200;150;;;300;200;;;490;230;;;
1;Schleswig-Holstein;99;;500;400;;;400;300;;;5;10;;;495;290;;;;;100;75;;;150;100;;;245;115;;;
100;Testkreis A;1;;300;250;;;250;200;;;2;5;;;297;195;;;;;60;50;;;97;70;;;140;75;;;
`;

  it('correctly parses election results and classifies regions', () => {
    const results = parseElectionData(mockKergCsv, mockParteienCsv, mockWahlkreiseCsv);

    // Verify all regions are parsed
    expect(results['99']).toBeDefined();
    expect(results['01']).toBeDefined();
    expect(results['100']).toBeDefined();

    // Verify typ classification
    expect(results['99'].typ).toBe('Bund');
    expect(results['01'].typ).toBe('Land');
    expect(results['100'].typ).toBe('Wahlkreis');

    // Verify names
    expect(results['99'].name).toBe('Bund');
    expect(results['01'].name).toBe('Schleswig-Holstein');
    expect(results['100'].name).toBe('Testkreis A');

    // Verify parent relationships
    expect(results['99'].uebergeordnetesGebietId).toBeNull();
    expect(results['01'].uebergeordnetesGebietId).toBeNull();
    expect(results['100'].uebergeordnetesGebietId).toBe('01');
  });

  it('calculates voter turnout (Wahlbeteiligung) accurately for 2025 and 2021', () => {
    const results = parseElectionData(mockKergCsv, mockParteienCsv, mockWahlkreiseCsv);
    const bund = results['99'];

    // Dynamically calculate from mock data: 800 Wähler / 1000 Wahlberechtigte * 100 = 80.0
    const expectedTurnout = (800 / 1000) * 100;
    const expectedTurnout2021 = (600 / 800) * 100;

    expect(bund.wahlbeteiligung).toBe(expectedTurnout);
    expect(bund.wahlbeteiligung2021).toBe(expectedTurnout2021);
  });

  it('calculates party relative percentages correctly and sorts them descending', () => {
    const results = parseElectionData(mockKergCsv, mockParteienCsv, mockWahlkreiseCsv);
    const bund = results['99'];

    // Valid second votes: 990 (current), 580 (2021)
    // SPD: 200 (current), 150 (2021)
    // CDU: 300 (current), 200 (2021)
    // GRÜNE: 490 (current), 230 (2021)
    const totalGueltige = 990;
    const totalGueltige2021 = 580;

    const expectedGrueneRel = Math.round((490 / totalGueltige) * 100 * 10) / 10;
    const expectedGrueneRel2021 = Math.round((230 / totalGueltige2021) * 100 * 10) / 10;

    const expectedCduRel = Math.round((300 / totalGueltige) * 100 * 10) / 10;
    const expectedCduRel2021 = Math.round((200 / totalGueltige2021) * 100 * 10) / 10;

    const expectedSpdRel = Math.round((200 / totalGueltige) * 100 * 10) / 10;
    const expectedSpdRel2021 = Math.round((150 / totalGueltige2021) * 100 * 10) / 10;

    expect(bund.parteien[0].parteiKurz).toBe('GRÜNE');
    expect(bund.parteien[0].zweitstimmenRelativ).toBe(expectedGrueneRel);
    expect(bund.parteien[0].zweitstimmenRelativ2021).toBe(expectedGrueneRel2021);

    expect(bund.parteien[1].parteiKurz).toBe('CDU');
    expect(bund.parteien[1].zweitstimmenRelativ).toBe(expectedCduRel);
    expect(bund.parteien[1].zweitstimmenRelativ2021).toBe(expectedCduRel2021);

    expect(bund.parteien[2].parteiKurz).toBe('SPD');
    expect(bund.parteien[2].zweitstimmenRelativ).toBe(expectedSpdRel);
    expect(bund.parteien[2].zweitstimmenRelativ2021).toBe(expectedSpdRel2021);
  });

  it('falls back safely when division by zero occurs or values are missing', () => {
    const zeroKergCsv = `(c) Bundeswahlleiter
License Info
Empty
Bundestagswahl 2025
Endergebnis
Nr;Gebiet;gehört zu;Gewählt;Wahlberechtigte;;;;Wählende;;;;Ungültige Stimmen;;;;Gültige Stimmen;;;;Sozialdemokratische Partei Deutschlands;;;;CDU;;;;
;;;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;Erststimmen;;Zweitstimmen;;
;;;;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;Endgültig;Vorperiode;
99;Bund;;;0;0;;;100;100;;;10;10;;;0;0;;;200;150;;;300;200;;;
`;
    const results = parseElectionData(zeroKergCsv, mockParteienCsv, mockWahlkreiseCsv);
    const bund = results['99'];

    expect(bund.wahlbeteiligung).toBe(0);
    expect(bund.wahlbeteiligung2021).toBe(0);
    expect(bund.parteien[0].zweitstimmenRelativ).toBe(0);
    expect(bund.parteien[0].zweitstimmenRelativ2021).toBe(0);
  });
});
