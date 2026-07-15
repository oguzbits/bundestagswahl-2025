import { useState } from 'react';
import type { GebietErgebnis } from '../domain/types';
import { cn } from '../lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { PartyRow } from './PartyRow';
import { formatDeltaInfo, partitionParties } from '../utils/dataTransformer';

export interface MetadataHeaderProps {
  gebiet: GebietErgebnis;
  parentName?: string | null;
}

export function MetadatenHeader({ gebiet, parentName }: MetadataHeaderProps) {
  const [showAll, setShowAll] = useState(false);

  // Use the decoupled data transformation logic
  const { displayList, sortedAndFilteredMinorParties } = partitionParties(gebiet.parteien);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col gap-0">
      {/* Top Banner */}
      <div
        className={cn(
          'px-6 py-3 text-white flex justify-between items-center',
          gebiet.typ === 'Bund' && 'bg-slate-900',
          gebiet.typ === 'Land' && 'bg-indigo-900',
          gebiet.typ === 'Wahlkreis' && 'bg-slate-800',
        )}
      >
        <div className="flex flex-col justify-center h-[68px] sm:h-[88px] w-full min-w-0">
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300 opacity-90 font-mono">
            {gebiet.typ}-Auswahl
          </span>
          <h3
            className="text-[11px] xs:text-xs sm:text-sm md:text-base lg:text-lg font-black tracking-tight mt-0.5 leading-tight break-words"
            title={gebiet.name}
          >
            {gebiet.name}
          </h3>
          <p className="text-xs text-slate-300 mt-0.5 font-medium min-h-[16px]">
            {parentName ? `Bundesland: ${parentName}` : '\u00A0'}
          </p>
        </div>
      </div>

      {/* Main Stats */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-1.5 xl:gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-2 xl:p-3 border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-[9px] xl:text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-tight">
              <span className="hidden xl:inline">Wahlberechtigte</span>
              <span className="xl:hidden">
                Wahl-
                <br />
                berechtigte
              </span>
            </div>
            <div className="text-[11px] xs:text-xs xl:text-base font-extrabold text-slate-800 mt-0.5 xl:mt-1 font-mono break-all">
              {gebiet.wahlberechtigte.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-2 xl:p-3 border border-slate-100 flex flex-col justify-between min-w-0">
            <div className="text-[9px] xl:text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-tight">
              Wähler
            </div>
            <div className="text-[11px] xs:text-xs xl:text-base font-extrabold text-slate-800 mt-0.5 xl:mt-1 font-mono break-all">
              {gebiet.waehler.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-indigo-50/50 rounded-xl p-2 xl:p-3 border border-indigo-100 flex flex-col justify-between min-w-0">
            <div className="text-[9px] xl:text-[10px] text-indigo-600 font-bold uppercase tracking-wider leading-tight">
              <span className="hidden xl:inline">Wahlbeteiligung</span>
              <span className="xl:hidden">
                Wahl-
                <br />
                beteiligung
              </span>
            </div>
            <div className="text-[11px] xs:text-xs xl:text-base font-black text-indigo-700 mt-0.5 font-mono break-all">
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
            <span className="font-mono">
              Gültig: {gebiet.gueltigeZweitstimmen.toLocaleString('de-DE')}
            </span>
          </h4>

          {/* SECTION 1: STATIC MAIN LIST (Always Visible) */}
          <div className="space-y-3">
            {displayList.map((p) => (
              <PartyRow key={p.parteiKurz} party={p} formatDeltaInfo={formatDeltaInfo} />
            ))}
          </div>

          {/* SECTION 2 + 3: SHADCN POPOVER — portal-rendered, zero layout shift */}
          {sortedAndFilteredMinorParties.length > 0 && (
            <div className="mt-4 border-t border-slate-100 pt-3">
              <Popover open={showAll} onOpenChange={setShowAll}>
                {/* Section 2: Trigger button */}
                <PopoverTrigger
                  render={
                    <button
                      aria-expanded={showAll}
                      aria-controls={`minor-parties-${gebiet.id}`}
                      className="w-full py-2 px-3 flex items-center justify-between text-xs font-semibold text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-xl transition-all border border-slate-200 shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <span>{showAll ? 'Weniger anzeigen' : 'Mehr Parteien anzeigen'}</span>
                      {showAll ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </button>
                  }
                />

                {/* Section 3: Portal-rendered overlay — floats above all content */}
                <PopoverContent
                  align="start"
                  side="bottom"
                  sideOffset={8}
                  className="w-[var(--anchor-width)] max-h-[250px] overflow-y-auto p-3 space-y-3 bg-white border border-slate-200 rounded-xl shadow-xl scrollbar-thin"
                >
                  <div id={`minor-parties-${gebiet.id}`}>
                    {sortedAndFilteredMinorParties.map((p) => (
                      <PartyRow key={p.parteiKurz} party={p} formatDeltaInfo={formatDeltaInfo} />
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Aliasing for compatibility
export { MetadatenHeader as MetadataHeader };
