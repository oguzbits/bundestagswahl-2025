import { cn } from '../lib/utils';
import { getPartyColor } from '../domain/partyColors';
import type { ParteiErgebnis } from '../domain/types';

export interface PartyRowProps {
  party: ParteiErgebnis;
  formatDeltaInfo: (current: number, prev: number) => { text: string; className: string };
}

export function PartyRow({ party, formatDeltaInfo }: PartyRowProps) {
  const deltaInfo = formatDeltaInfo(party.zweitstimmenRelativ, party.zweitstimmenRelativ2021);
  const partyColor = getPartyColor(party.parteiKurz);

  return (
    <div className="group p-2.5 rounded-xl transition-all border border-transparent flex flex-col space-y-1.5">
      {/* LINE 1 */}
      <div className="flex justify-between items-center">
        {/* Left: Colored dot + Party short name in bold */}
        <div className="flex items-center space-x-2">
          <span
            className="w-3 h-3 rounded-full shrink-0 border border-black/10 shadow-sm"
            style={{ backgroundColor: partyColor }}
            aria-hidden="true"
          />
          <span className="font-semibold text-sm text-slate-800">{party.parteiKurz}</span>
        </div>
        {/* Right: Current relative percentage (bold) + its dynamic 2021 delta in parentheses */}
        <div className="flex items-center space-x-1.5 font-mono">
          <span className="font-bold text-sm text-slate-900">
            {party.zweitstimmenRelativ.toFixed(2)}%
          </span>
          <span className={cn('text-xs font-semibold', deltaInfo.className)}>
            ({deltaInfo.text})
          </span>
        </div>
      </div>

      {/* LINE 2 */}
      <div className="flex justify-between items-center text-xs text-slate-600">
        {/* Left: Full official party name */}
        <span className="truncate mr-4" title={party.parteiLang}>
          {party.parteiLang}
        </span>
        {/* Right: Absolute votes formatted with thousands separators followed by the word "Stimmen" */}
        <span className="font-mono shrink-0">
          {party.zweitstimmenAbsolut.toLocaleString('de-DE')}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden" aria-hidden="true">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${party.zweitstimmenRelativ}%`,
            backgroundColor: partyColor,
          }}
        />
      </div>
    </div>
  );
}
