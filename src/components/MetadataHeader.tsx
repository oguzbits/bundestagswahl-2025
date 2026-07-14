import { useState } from 'react';
import type { GebietErgebnis, ParteiErgebnis } from '../domain/types';
import { cn } from '../lib/utils';
import { getPartyColor } from '../domain/partyColors';
import { ChevronDown, ChevronUp } from 'lucide-react';

export interface MetadataHeaderProps {
  gebiet: GebietErgebnis;
  parentName?: string | null;
}

// Established major parties list as requested
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
  'BSW'
]);

export function MetadatenHeader({ gebiet, parentName }: MetadataHeaderProps) {
  const [showAll, setShowAll] = useState(false);

  // Helper to format delta value compared to 2021
  const formatDeltaInfo = (current: number, prev: number) => {
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
  };

  // Smart Filtering and Grouping Logic
  const primaryParties: ParteiErgebnis[] = [];
  const minorParties: ParteiErgebnis[] = [];

  // Group minor and major parties
  gebiet.parteien.forEach((p) => {
    const isEstablished = ESTABLISHED_PARTIES.has(p.parteiKurz.toUpperCase()) || 
                          ESTABLISHED_PARTIES.has(p.parteiLang.toUpperCase());
    const isHighPerformer = p.zweitstimmenRelativ >= 3.0;

    if (isEstablished || isHighPerformer) {
      primaryParties.push(p);
    } else {
      minorParties.push(p);
    }
  });

  // Calculate "Sonstige" aggregations
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

  // Round relative values to 2 decimal places
  sonstigeRelativ = Math.round(sonstigeRelativ * 100) / 100;
  sonstigeRelativ2021 = Math.round(sonstigeRelativ2021 * 100) / 100;

  // Create virtual "Sonstige" row if there are minor parties
  const sonstigeRow: ParteiErgebnis | null = minorParties.length > 0 ? {
    parteiKurz: 'Sonstige',
    parteiLang: 'Sonstige Parteien unter 3.0%',
    zweitstimmenAbsolut: sonstigeAbsolut,
    zweitstimmenRelativ: sonstigeRelativ,
    zweitstimmenAbsolut2021: sonstigeAbsolut2021,
    zweitstimmenRelativ2021: sonstigeRelativ2021,
  } : null;

  // Main displayed list (primary major/established + optional Sonstige row)
  const displayList = [...primaryParties];
  if (sonstigeRow) {
    displayList.push(sonstigeRow);
  }

  // Sort displayList by percentage descending, ensuring 'Sonstige' stays at the end
  displayList.sort((a, b) => {
    if (a.parteiKurz === 'Sonstige') return 1;
    if (b.parteiKurz === 'Sonstige') return -1;
    return b.zweitstimmenRelativ - a.zweitstimmenRelativ;
  });

  // Sort minorParties descending for the accordion view
  const sortedMinorParties = [...minorParties].sort((a, b) => b.zweitstimmenRelativ - a.zweitstimmenRelativ);

  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all hover:shadow-lg">
      {/* Top Banner */}
      <div className={cn(
        "px-6 py-5 text-white flex justify-between items-center",
        gebiet.typ === 'Bund' && "bg-slate-900",
        gebiet.typ === 'Land' && "bg-indigo-900",
        gebiet.typ === 'Wahlkreis' && "bg-slate-800"
      )}>
        <div className="flex flex-col justify-center min-h-[76px]">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300 opacity-90 font-mono">
            {gebiet.typ}-Auswahl
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5 truncate max-w-[240px] sm:max-w-xs md:max-w-sm" title={gebiet.name}>
            {gebiet.name}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium min-h-[16px]">
            {parentName ? `Bundesland: ${parentName}` : '\u00A0'}
          </p>
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 shrink-0 font-mono">
          ID: {gebiet.id}
        </span>
      </div>

      {/* Main Stats */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wahlberechtigte</div>
            <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 font-mono">
              {gebiet.wahlberechtigte.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wähler</div>
            <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1 font-mono">
              {gebiet.waehler.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex flex-col justify-center">
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Wahlbeteiligung</div>
            <div className="text-base sm:text-lg font-black text-indigo-700 mt-0.5 font-mono">
              {gebiet.wahlbeteiligung.toFixed(2)}%
            </div>
          </div>
        </div>
      </div>

      {/* Second Votes Party Results */}
      <div className="px-6 pb-6">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex justify-between border-b border-slate-100 pb-2">
            <span>Zweitstimmen</span>
            <span className="font-mono">Gültig: {gebiet.gueltigeZweitstimmen.toLocaleString('de-DE')}</span>
          </h4>

          {/* Clean Main List */}
          <div className="space-y-3">
            {displayList.map((p) => {
              const deltaInfo = formatDeltaInfo(p.zweitstimmenRelativ, p.zweitstimmenRelativ2021);
              const partyColor = getPartyColor(p.parteiKurz);
              
              return (
                <div key={p.parteiKurz} className="group p-2.5 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 flex flex-col space-y-1.5">
                  {/* LINE 1 */}
                  <div className="flex justify-between items-center">
                    {/* Left: Colored dot + Party short name in bold */}
                    <div className="flex items-center space-x-2">
                      <span 
                        className="w-3 h-3 rounded-full shrink-0 border border-black/10 shadow-sm"
                        style={{ backgroundColor: partyColor }}
                      />
                      <span className="font-semibold text-sm text-slate-800">{p.parteiKurz}</span>
                    </div>
                    {/* Right: Current relative percentage (bold) + its dynamic 2021 delta in parentheses */}
                    <div className="flex items-center space-x-1.5 font-mono">
                      <span className="font-bold text-sm text-slate-900">
                        {p.zweitstimmenRelativ.toFixed(2)}%
                      </span>
                      <span className={cn("text-xs font-semibold", deltaInfo.className)}>
                        ({deltaInfo.text})
                      </span>
                    </div>
                  </div>

                  {/* LINE 2 */}
                  <div className="flex justify-between items-center text-xs text-slate-500">
                    {/* Left: Full official party name */}
                    <span className="truncate mr-4" title={p.parteiLang}>
                      {p.parteiLang}
                    </span>
                    {/* Right: Absolute votes formatted with thousands separators followed by the word "Stimmen" */}
                    <span className="font-mono shrink-0">
                      {p.zweitstimmenAbsolut.toLocaleString('de-DE')} Stimmen
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ 
                        width: `${p.zweitstimmenRelativ}%`,
                        backgroundColor: partyColor
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Toggle Accordion for micro-parties */}
          {sortedMinorParties.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <button
                onClick={() => setShowAll(!showAll)}
                aria-expanded={showAll}
                aria-controls={`minor-parties-${gebiet.id}`}
                className="w-full py-2 px-3 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              >
                <span>{showAll ? 'Weniger anzeigen' : 'Alle Parteien anzeigen'}</span>
                {showAll ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </button>

              {showAll && (
                <div 
                  id={`minor-parties-${gebiet.id}`}
                  className="mt-3 space-y-2.5 max-h-60 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-1 duration-200"
                >
                  {sortedMinorParties.map((p) => {
                    const deltaInfo = formatDeltaInfo(p.zweitstimmenRelativ, p.zweitstimmenRelativ2021);
                    const partyColor = getPartyColor(p.parteiKurz);

                    return (
                      <div key={p.parteiKurz} className="flex justify-between items-center text-xs font-medium py-1 px-1.5 hover:bg-slate-50 rounded-lg">
                        <span className="flex items-center space-x-2 truncate mr-4">
                          <span 
                            className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/10 shadow-sm"
                            style={{ backgroundColor: partyColor }}
                          />
                          <span className="font-bold text-slate-700">{p.parteiKurz}</span>
                          <span className="text-[10px] text-slate-400 font-normal truncate hidden sm:inline" title={p.parteiLang}>
                            {p.parteiLang}
                          </span>
                        </span>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <span className="text-slate-800 font-bold font-mono">
                            {p.zweitstimmenRelativ.toFixed(2)}%
                          </span>
                          <span className={cn("text-[10px] font-mono", deltaInfo.className)}>
                            ({deltaInfo.text})
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {p.zweitstimmenAbsolut.toLocaleString('de-DE')}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Aliasing for compatibility
export { MetadatenHeader as MetadataHeader };
