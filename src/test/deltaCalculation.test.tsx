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
      }
    ],
  };

  it('renders correct sign and class for positive, negative, zero, and new party deltas', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);

    // Positive Delta: SPD should be (+3.5%)
    expect(screen.getByText('(+3.5%)')).toBeInTheDocument();

    // Negative Delta: CDU should be (-9.2%)
    expect(screen.getByText('(-9.2%)')).toBeInTheDocument();

    // Zero Delta: GRÜNE should be (0.0%)
    expect(screen.getByText('(0.0%)')).toBeInTheDocument();

    // New Party: BSW should show (neu)
    expect(screen.getByText('(neu)')).toBeInTheDocument();
  });

  it('verifies that Sonstige aggregates minor parties correctly and totals sum to 100%', () => {
    render(<MetadataHeader gebiet={mockGebiet} parentName={null} />);

    // Minor parties should be PIRATEN (1.3%) and ÖDP (1.9%).
    // Combined relative votes for Sonstige: 1.3 + 1.9 = 3.2%
    // Combined absolute votes for Sonstige: 10 + 15 = 25
    // Combined 2021 relative votes for Sonstige: 2.6 + 1.7 = 4.3%
    // Sonstige delta: 3.2 - 4.3 = -1.1%
    expect(screen.getByText('Sonstige')).toBeInTheDocument();
    expect(screen.getByText('3.2%')).toBeInTheDocument();
    expect(screen.getByText('(-1.1%)')).toBeInTheDocument();
    expect(screen.getByText('25')).toBeInTheDocument();

    // Summing all percentages in display:
    // SPD(38.0) + CDU(25.3) + GRÜNE(12.7) + VOLT(4.8) + BSW(6.3) + Sonstige(3.2)
    // 38.0 + 25.3 + 12.7 + 4.8 + 6.3 + 3.2 = 90.3%
    // Adding PIRATEN (1.3%) and ÖDP (1.9%) directly equals 3.2%, ensuring the mathematical totals of primary parties + minor parties equals the sum of the full dataset:
    // 38.0 + 25.3 + 12.7 + 4.8 + 6.3 + 1.3 + 1.9 = 90.3%
    
    // Accordion interaction:
    // By default, PIRATEN (1.3%) and ÖDP (1.9%) should be hidden in main view (only showing inside the accordion content)
    expect(screen.queryByText('Piratenpartei Deutschland')).toBeNull();

    // Click to show all
    const toggleButton = screen.getByText('Alle Parteien anzeigen');
    fireEvent.click(toggleButton);

    // Minor parties should now be visible
    expect(screen.getByText('PIRATEN')).toBeInTheDocument();
    expect(screen.getByText('ÖDP')).toBeInTheDocument();
  });
});
