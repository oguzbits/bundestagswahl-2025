import type { GebietErgebnis } from '../domain/types';
import { cn } from '../lib/utils';

export interface MetadataHeaderProps {
  gebiet: GebietErgebnis;
  parentName?: string | null;
}

function getPartyColorClass(party: string): string {
  const normalized = party.toUpperCase();
  if (normalized.includes('SPD')) return 'bg-red-600 text-white';
  if (normalized.includes('CDU') || normalized.includes('CSU')) return 'bg-zinc-800 text-white';
  if (normalized.includes('GRÜNE') || normalized.includes('GRUENEN')) return 'bg-emerald-600 text-white';
  if (normalized.includes('FDP')) return 'bg-yellow-400 text-black';
  if (normalized.includes('AFD')) return 'bg-sky-600 text-white';
  if (normalized.includes('LINKE')) return 'bg-pink-600 text-white';
  if (normalized.includes('BSW')) return 'bg-orange-800 text-white';
  return 'bg-slate-400 text-slate-900';
}

export function MetadatenHeader({ gebiet, parentName }: MetadataHeaderProps) {
  return (
    <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden transition-all hover:shadow-lg">
      {/* Top Banner */}
      <div className={cn(
        "px-6 py-5 text-white flex justify-between items-center",
        gebiet.typ === 'Bund' && "bg-slate-900",
        gebiet.typ === 'Land' && "bg-indigo-900",
        gebiet.typ === 'Wahlkreis' && "bg-slate-800"
      )}>
        <div>
          <span className="text-[10px] uppercase font-extrabold tracking-widest text-indigo-300 opacity-90">
            {gebiet.typ}-Auswahl
          </span>
          <h3 className="text-xl sm:text-2xl font-black tracking-tight mt-0.5">{gebiet.name}</h3>
          {parentName && (
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Bundesland: {parentName}
            </p>
          )}
        </div>
        <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 text-white border border-white/20 shrink-0">
          ID: {gebiet.id}
        </span>
      </div>

      {/* Main Stats */}
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wahlberechtigte</div>
            <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">
              {gebiet.wahlberechtigte.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 flex flex-col justify-center">
            <div className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Wähler</div>
            <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">
              {gebiet.waehler.toLocaleString('de-DE')}
            </div>
          </div>
          <div className="bg-indigo-50/50 rounded-xl p-3 border border-indigo-100 flex flex-col justify-center">
            <div className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider">Wahlbeteiligung</div>
            <div className="text-base sm:text-lg font-black text-indigo-700 mt-0.5">
              {gebiet.wahlbeteiligung}%
            </div>
          </div>
        </div>
      </div>

      {/* Second Votes Party Results */}
      <div className="px-6 pb-6">
        <div>
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex justify-between">
            <span>Zweitstimmen (Stärkste Parteien)</span>
            <span>Gültig: {gebiet.gueltigeZweitstimmen.toLocaleString('de-DE')}</span>
          </h4>

          <div className="space-y-3.5">
            {gebiet.parteien.slice(0, 5).map((p) => (
              <div key={p.parteiKurz} className="space-y-1">
                <div className="flex justify-between items-center text-xs sm:text-sm font-semibold">
                  <span className="flex items-center space-x-2 truncate mr-4">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", getPartyColorClass(p.parteiKurz).split(' ')[0])}></span>
                    <span className="font-bold text-slate-800">{p.parteiKurz}</span>
                    <span className="text-xs text-slate-400 font-normal truncate hidden sm:inline" title={p.parteiLang}>
                      {p.parteiLang}
                    </span>
                  </span>
                  <span className="text-slate-800 shrink-0 font-bold">
                    {p.zweitstimmenRelativ}% <span className="text-[10px] text-slate-400 font-normal">({p.zweitstimmenAbsolut.toLocaleString('de-DE')})</span>
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className={cn("h-full rounded-full transition-all duration-500", getPartyColorClass(p.parteiKurz).split(' ')[0])}
                    style={{ width: `${p.zweitstimmenRelativ}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Aliasing for compatibility
export { MetadatenHeader as MetadataHeader };
