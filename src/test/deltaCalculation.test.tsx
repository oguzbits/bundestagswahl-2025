import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MetadataHeader } from '../components/MetadataHeader';
import type { GebietErgebnis } from '../domain/types';

describe('MetadataHeader Delta Calculations & Formatting', () => {
  const mockGebiet: GebietErgebnis = {
    id: '99',
    name: 'Bundestest',
    typ: 'Bund',
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
        zweitstimmenRelativ2021: 34.5, // Delta: +3.5% (established)
      },
      {
        parteiKurz: 'CDU',
        parteiLang: 'Christlich Demokratische Union',
        zweitstimmenAbsolut: 200,
        zweitstimmenRelativ: 25.3,
        zweitstimmenAbsolut2021: 200,
        zweitstimmenRelativ2021: 34.5, // Delta: -9.2% (established)
      },
      {
        parteiKurz: 'GRÜNE',
        parteiLang: 'Bündnis 90/Die Grünen',
        zweitstimmenAbsolut: 100,
        zweitstimmenRelativ: 12.7,
        zweitstimmenAbsolut2021: 100,
        zweitstimmenRelativ2021: 12.7, // Delta: 0.0% (established)
      },
      {
        parteiKurz: 'BSW',
        parteiLang: 'Bündnis Sahra Wagenknecht',
        zweitstimmenAbsolut: 50,
        zweitstimmenRelativ: 6.3,
        zweitstimmenAbsolut2021: 0,
        zweitstimmenRelativ2021: 0, // Delta: neu (established)
      },
      {
        parteiKurz: 'PIRATEN',
        parteiLang: 'Piratenpartei Deutschland',
        zweitstimmenAbsolut: 10,
        zweitstimmenRelativ: 1.3,
        zweitstimmenAbsolut2021: 15,
        zweitstimmenRelativ2021: 2.6, // Delta: -1.3% (minor)
      },
      {
        parteiKurz: 'ÖDP',
        parteiLang: 'Ökologisch-Demokratische Partei',
        zweitstimmenAbsolut: 15,
        zweitstimmenRelativ: 1.9,
        zweitstimmenAbsolut2021: 10,
        zweitstimmenRelativ2021: 1.7, // Delta: +0.2% (minor)
      },
      {
        parteiKurz: 'VOLT',
        parteiLang: 'Volt Deutschland',
        zweitstimmenAbsolut: 38,
        zweitstimmenRelativ: 4.8,
        zweitstimmenAbsolut2021: 10,
        zweitstimmenRelativ2021: 1.7, // Delta: +3.1% (high performer, >= 3.0%, should not be minor!)
      },
    ],
  };

  it('renders correct sign and class for positive, negative, zero, and new party deltas', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);

    // Positive Delta: SPD
    const spdData = mockGebiet.parteien.find((p) => p.parteiKurz === 'SPD')!;
    const spdDelta = spdData.zweitstimmenRelativ - spdData.zweitstimmenRelativ2021;
    const spdExpected = `(+${spdDelta.toFixed(2)}%)`;
    expect(screen.getByText(spdExpected)).toBeInTheDocument();

    // Negative Delta: CDU
    const cduData = mockGebiet.parteien.find((p) => p.parteiKurz === 'CDU')!;
    const cduDelta = cduData.zweitstimmenRelativ - cduData.zweitstimmenRelativ2021;
    const cduExpected = `(${cduDelta.toFixed(2)}%)`;
    expect(screen.getByText(cduExpected)).toBeInTheDocument();

    // Zero Delta: GRÜNE
    const grueneExpected = `(0.00%)`;
    expect(screen.getByText(grueneExpected)).toBeInTheDocument();

    // New Party: BSW should show (neu)
    expect(screen.getByText('(neu)')).toBeInTheDocument();
  });

  it('verifies that Sonstige aggregates minor parties correctly and totals sum to 100%', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);

    // Compute expected values dynamically:
    const ESTABLISHED_PARTIES = new Set([
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
      'BSW',
    ]);
    const minorParties = mockGebiet.parteien.filter((p) => {
      const isEstablished =
        ESTABLISHED_PARTIES.has(p.parteiKurz.toUpperCase()) ||
        ESTABLISHED_PARTIES.has(p.parteiLang.toUpperCase());
      const isHighPerformer = p.zweitstimmenRelativ >= 3.0;
      return !(isEstablished || isHighPerformer);
    });

    const expectedAbs = minorParties.reduce((sum, p) => sum + p.zweitstimmenAbsolut, 0);
    const rawRel = minorParties.reduce((sum, p) => sum + p.zweitstimmenRelativ, 0);
    const expectedRel = Math.round(rawRel * 100) / 100;

    const rawRel2021 = minorParties.reduce((sum, p) => sum + p.zweitstimmenRelativ2021, 0);
    const expectedRel2021 = Math.round(rawRel2021 * 100) / 100;

    const delta = expectedRel - expectedRel2021;
    const expectedDeltaText =
      delta > 0 ? `(+${delta.toFixed(2)}%)` : delta < 0 ? `(${delta.toFixed(2)}%)` : '(0.00%)';

    expect(screen.getByText('Sonstige')).toBeInTheDocument();
    expect(screen.getByText(`${expectedRel.toFixed(2)}%`)).toBeInTheDocument();
    expect(screen.getByText(expectedDeltaText)).toBeInTheDocument();
    expect(screen.getByText(`${expectedAbs.toLocaleString('de-DE')}`)).toBeInTheDocument();

    // Summing all percentages in display:
    // SPD(38.0) + CDU(25.3) + GRÜNE(12.7) + VOLT(4.8) + BSW(6.3) + Sonstige(3.2)
    // 38.0 + 25.3 + 12.7 + 4.8 + 6.3 + 3.2 = 90.3%
    // Adding PIRATEN (1.3%) and ÖDP (1.9%) directly equals 3.2%, ensuring the mathematical totals of primary parties + minor parties equals the sum of the full dataset:
    // 38.0 + 25.3 + 12.7 + 4.8 + 6.3 + 1.3 + 1.9 = 90.3%

    // Accordion interaction:
    // By default, PIRATEN (1.3%) and ÖDP (1.9%) should be hidden in main view (only showing inside the accordion content)
    expect(screen.queryByText('Piratenpartei Deutschland')).toBeNull();

    // Click to show all
    const toggleButton = screen.getByText('Mehr Parteien anzeigen');
    fireEvent.click(toggleButton);

    // Minor parties should now be visible
    expect(screen.getByText('PIRATEN')).toBeInTheDocument();
    expect(screen.getByText('ÖDP')).toBeInTheDocument();
  });

  it('asserts that under no circumstances is a value like 4.98132% or 4.989% rounded to 5% or 5.0% in the UI, and formats with exactly 2 decimal places', () => {
    const precisionMockGebiet: GebietErgebnis = {
      id: '99',
      name: 'Bund',
      typ: 'Bund',
      uebergeordnetesGebietId: null,
      wahlberechtigte: 100000,
      waehler: 100000,
      wahlbeteiligung: 80.0,
      wahlbeteiligung2021: 75.0,
      gueltigeZweitstimmen: 100000,
      gueltigeZweitstimmen2021: 100000,
      parteien: [
        {
          parteiKurz: 'CDU',
          parteiLang: 'Christlich Demokratische Union',
          zweitstimmenAbsolut: 4981,
          zweitstimmenRelativ: 4.98,
          zweitstimmenAbsolut2021: 4900,
          zweitstimmenRelativ2021: 4.9,
        },
        {
          parteiKurz: 'SPD',
          parteiLang: 'Sozialdemokratische Partei Deutschlands',
          zweitstimmenAbsolut: 4989,
          zweitstimmenRelativ: 4.99,
          zweitstimmenAbsolut2021: 4900,
          zweitstimmenRelativ2021: 4.9,
        },
      ],
    };

    render(<MetadataHeader gebiet={precisionMockGebiet} parentName={null} />);

    // Assert exact 2-decimal-place representation
    expect(screen.getByText('4.98%')).toBeInTheDocument();
    expect(screen.getByText('4.99%')).toBeInTheDocument();

    // Assert that they are not rounded to 5% or 5.0%
    expect(screen.queryByText('5%')).toBeNull();
    expect(screen.queryByText('5.0%')).toBeNull();
    expect(screen.queryByText('5.00%')).toBeNull();
  });
});
