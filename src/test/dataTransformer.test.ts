import { describe, it, expect } from 'vitest';
import { consolidateUnion } from '../utils/dataTransformer';
import type { ParteiErgebnis } from '../domain/types';

describe('consolidateUnion', () => {
  it('should correctly merge CDU and CSU into "CDU/CSU" at federal level (Bund)', () => {
    const mockParties: ParteiErgebnis[] = [
      {
        parteiKurz: 'CDU',
        parteiLang: 'Christlich Demokratische Union Deutschlands',
        zweitstimmenAbsolut: 5000,
        zweitstimmenRelativ: 25.0,
        zweitstimmenAbsolut2021: 4500,
        zweitstimmenRelativ2021: 22.5,
      },
      {
        parteiKurz: 'CSU',
        parteiLang: 'Christlich-Soziale Union in Bayern e.V.',
        zweitstimmenAbsolut: 1500,
        zweitstimmenRelativ: 7.5,
        zweitstimmenAbsolut2021: 1400,
        zweitstimmenRelativ2021: 7.0,
      },
      {
        parteiKurz: 'SPD',
        parteiLang: 'Sozialdemokratische Partei Deutschlands',
        zweitstimmenAbsolut: 4000,
        zweitstimmenRelativ: 20.0,
        zweitstimmenAbsolut2021: 4200,
        zweitstimmenRelativ2021: 21.0,
      },
    ];

    const result = consolidateUnion(mockParties);

    // Assert only one CDU/CSU entry exists
    const unionMatches = result.filter((p) => p.parteiKurz === 'CDU/CSU');
    expect(unionMatches).toHaveLength(1);

    const union = unionMatches[0];
    expect(union.parteiLang).toBe('Christlich Demokratische Union / Christlich-Soziale Union');
    expect(union.zweitstimmenAbsolut).toBe(6500); // 5000 + 1500
    expect(union.zweitstimmenRelativ).toBe(32.5); // 25.0 + 7.5
    expect(union.zweitstimmenAbsolut2021).toBe(5900); // 4500 + 1400
    expect(union.zweitstimmenRelativ2021).toBe(29.5); // 22.5 + 7.0

    // Assert neither CDU nor CSU exists separately
    expect(result.some((p) => p.parteiKurz === 'CDU')).toBe(false);
    expect(result.some((p) => p.parteiKurz === 'CSU')).toBe(false);

    // SPD should still exist untouched
    const spd = result.find((p) => p.parteiKurz === 'SPD');
    expect(spd).toBeDefined();
    expect(spd?.zweitstimmenAbsolut).toBe(4000);
  });

  it('should map only CDU to "CDU/CSU" outside Bavaria (e.g., Berlin) and completely remove the 0% CSU entry', () => {
    const mockParties: ParteiErgebnis[] = [
      {
        parteiKurz: 'CDU',
        parteiLang: 'Christlich Demokratische Union Deutschlands',
        zweitstimmenAbsolut: 5000,
        zweitstimmenRelativ: 25.0,
        zweitstimmenAbsolut2021: 4500,
        zweitstimmenRelativ2021: 22.5,
      },
      {
        parteiKurz: 'CSU',
        parteiLang: 'Christlich-Soziale Union in Bayern e.V.',
        zweitstimmenAbsolut: 0,
        zweitstimmenRelativ: 0.0,
        zweitstimmenAbsolut2021: 0,
        zweitstimmenRelativ2021: 0.0,
      },
      {
        parteiKurz: 'SPD',
        parteiLang: 'Sozialdemokratische Partei Deutschlands',
        zweitstimmenAbsolut: 4000,
        zweitstimmenRelativ: 20.0,
        zweitstimmenAbsolut2021: 4200,
        zweitstimmenRelativ2021: 21.0,
      },
    ];

    const result = consolidateUnion(mockParties);

    const unionMatches = result.filter((p) => p.parteiKurz === 'CDU/CSU');
    expect(unionMatches).toHaveLength(1);

    const union = unionMatches[0];
    expect(union.zweitstimmenAbsolut).toBe(5000);
    expect(union.zweitstimmenRelativ).toBe(25.0);

    expect(result.some((p) => p.parteiKurz === 'CDU')).toBe(false);
    expect(result.some((p) => p.parteiKurz === 'CSU')).toBe(false);
  });

  it('should map only CSU to "CDU/CSU" inside Bavaria and completely remove the 0% CDU entry', () => {
    const mockParties: ParteiErgebnis[] = [
      {
        parteiKurz: 'CDU',
        parteiLang: 'Christlich Demokratische Union Deutschlands',
        zweitstimmenAbsolut: 0,
        zweitstimmenRelativ: 0.0,
        zweitstimmenAbsolut2021: 0,
        zweitstimmenRelativ2021: 0.0,
      },
      {
        parteiKurz: 'CSU',
        parteiLang: 'Christlich-Soziale Union in Bayern e.V.',
        zweitstimmenAbsolut: 6000,
        zweitstimmenRelativ: 35.0,
        zweitstimmenAbsolut2021: 5800,
        zweitstimmenRelativ2021: 34.0,
      },
      {
        parteiKurz: 'SPD',
        parteiLang: 'Sozialdemokratische Partei Deutschlands',
        zweitstimmenAbsolut: 2000,
        zweitstimmenRelativ: 11.0,
        zweitstimmenAbsolut2021: 2200,
        zweitstimmenRelativ2021: 12.0,
      },
    ];

    const result = consolidateUnion(mockParties);

    const unionMatches = result.filter((p) => p.parteiKurz === 'CDU/CSU');
    expect(unionMatches).toHaveLength(1);

    const union = unionMatches[0];
    expect(union.zweitstimmenAbsolut).toBe(6000);
    expect(union.zweitstimmenRelativ).toBe(35.0);

    expect(result.some((p) => p.parteiKurz === 'CDU')).toBe(false);
    expect(result.some((p) => p.parteiKurz === 'CSU')).toBe(false);
  });
});
