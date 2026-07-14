export const PARTY_COLORS: Record<string, string> = {
  SPD: '#E3000F',
  'CDU/CSU': '#323232',
  CDU: '#323232',
  CSU: '#323232',
  GRÜNE: '#46962b',
  GRÜNEN: '#46962b',
  'BÜNDNIS 90/DIE GRÜNEN': '#46962b',
  FDP: '#ffed00',
  AfD: '#009ee0',
  'DIE LINKE': '#BE3075',
  LINKE: '#BE3075',
  BSW: '#7C0A02',
  Sonstige: '#9ca3af',
  Other: '#9ca3af',
};

export function getPartyColor(partyName: string): string {
  const normalized = partyName.trim().toUpperCase();

  // Match common names or prefixes
  if (normalized.includes('SPD')) return PARTY_COLORS.SPD;
  if (normalized.includes('CDU') || normalized.includes('CSU')) return PARTY_COLORS.CDU;
  if (
    normalized.includes('GRÜNE') ||
    normalized.includes('GRÜNEN') ||
    normalized.includes('BÜNDNIS')
  )
    return PARTY_COLORS.GRÜNE;
  if (normalized.includes('FDP')) return PARTY_COLORS.FDP;
  if (normalized.includes('AFD')) return PARTY_COLORS.AfD;
  if (normalized.includes('LINKE')) return PARTY_COLORS['DIE LINKE'];
  if (normalized.includes('BSW')) return PARTY_COLORS.BSW;
  if (
    normalized.includes('ÜBRIGE') ||
    normalized.includes('OTHER') ||
    normalized.includes('SONSTIGE')
  )
    return PARTY_COLORS['Sonstige'];

  // Exact map or fallback
  return PARTY_COLORS[partyName] || '#9ca3af';
}
