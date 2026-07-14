import { useUrlState } from './hooks/useUrlState';
import { useElectionData } from './hooks/useElectionData';

// Simple function to get a color class for popular parties to enrich aesthetics
function getPartyColor(party: string): string {
  const name = party.toUpperCase();
  if (name.includes('SPD')) return '#e3000f';
  if (name.includes('CDU') || name.includes('CSU')) return '#111111';
  if (name.includes('GRÜNE') || name.includes('BÜNDNIS')) return '#46962b';
  if (name.includes('FDP')) return '#ffed00';
  if (name.includes('AFD')) return '#009ee0';
  if (name.includes('LINKE')) return '#be3075';
  if (name.includes('BSW')) return '#a22c54';
  return '#6b7280';
}

function App() {
  const { gebiet1Id, setGebiet1Id, clearSelection } = useUrlState();
  const { data, isLoading, error } = useElectionData();

  const selectedGebiet = gebiet1Id && data ? data[gebiet1Id] : null;

  return (
    <div className="min-h-screen bg-slate-50/50 dark:bg-zinc-950 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <header className="flex flex-col items-center justify-center text-center mb-10">
          <div className="inline-flex items-center justify-center space-x-2 bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 rounded-full text-xs font-semibold tracking-wider uppercase mb-3 border border-amber-500/20">
            🇩🇪 Amtliche Daten
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 dark:text-zinc-50 tracking-tight !my-2">
            Bundestagswahl 2025
          </h1>
          <p className="text-sm sm:text-base text-slate-500 dark:text-zinc-400 max-w-md">
            Ergebnisse und Analysen im detaillierten Wahl-Explorer
          </p>
        </header>

        {/* Main Content Area */}
        <main className="bg-white dark:bg-zinc-900/40 rounded-2xl border border-slate-200/80 dark:border-zinc-800/80 shadow-sm p-6 sm:p-8 backdrop-blur-sm transition-all">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4" role="status">
              <div className="w-12 h-12 border-4 border-slate-200 dark:border-zinc-850 border-t-amber-500 rounded-full animate-spin"></div>
              <p className="text-sm font-medium text-slate-500 dark:text-zinc-400">Daten werden geladen...</p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 text-center" role="alert">
              <span className="block text-2xl mb-1">⚠️</span>
              <p className="text-sm font-semibold text-red-800 dark:text-red-400">{error.message || 'Fehler beim Laden der Wahldaten'}</p>
            </div>
          )}

          {!isLoading && !error && (
            <>
              {!gebiet1Id ? (
                /* Empty State */
                <div className="flex flex-col items-center justify-center text-center py-12 px-4 border border-dashed border-slate-200 dark:border-zinc-800 rounded-xl">
                  <div className="text-4xl mb-4">🔍</div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
                    Kein Gebiet ausgewählt
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-sm mb-6">
                    Bitte wählen Sie ein Gebiet aus oder hängen Sie <code className="text-amber-600 dark:text-amber-400 font-mono bg-slate-100 dark:bg-zinc-800 px-1 py-0.5 rounded">?gebiet1=99</code> an die URL an.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center">
                    <button
                      onClick={() => setGebiet1Id('99')}
                      className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 rounded-lg shadow-sm transition"
                    >
                      Bund (Gesamt) anzeigen
                    </button>
                    <button
                      onClick={() => setGebiet1Id('11')}
                      className="px-4 py-2 text-sm font-medium text-slate-750 bg-slate-100 dark:bg-zinc-800 dark:text-zinc-200 hover:bg-slate-200 dark:hover:bg-zinc-700 rounded-lg transition"
                    >
                      Berlin anzeigen
                    </button>
                  </div>
                </div>
              ) : selectedGebiet ? (
                /* Gebiet Details Card */
                <div className="space-y-6 animate-in fade-in duration-300">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-slate-100 dark:border-zinc-850 pb-5 gap-4">
                    <div>
                      <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 dark:bg-zinc-800 text-slate-700 dark:text-zinc-300 mb-1">
                        {selectedGebiet.typ === 'Bund' ? 'Gesamtgebiet' : selectedGebiet.typ === 'Land' ? 'Bundesland' : 'Wahlkreis'} (ID: {selectedGebiet.id})
                      </span>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-zinc-50 !m-0">
                        {selectedGebiet.name}
                      </h2>
                    </div>
                    <button
                      onClick={clearSelection}
                      className="text-xs font-medium text-slate-500 hover:text-slate-750 dark:hover:text-zinc-300 bg-slate-50 dark:bg-zinc-850 border border-slate-200 dark:border-zinc-800 px-3 py-1.5 rounded-lg transition self-start sm:self-center"
                    >
                      Auswahl aufheben
                    </button>
                  </div>

                  {/* Metadata Header Stats */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl p-4">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider mb-1">Wahlbeteiligung 2025</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-slate-900 dark:text-zinc-50">{selectedGebiet.wahlbeteiligung}%</span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500">({selectedGebiet.waehler.toLocaleString('de-DE')} Wähler)</span>
                      </div>
                    </div>

                    <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-100 dark:border-zinc-850 rounded-xl p-4">
                      <p className="text-xs text-slate-500 dark:text-zinc-400 font-medium uppercase tracking-wider mb-1">Wahlbeteiligung 2021</p>
                      <div className="flex items-baseline space-x-2">
                        <span className="text-3xl font-extrabold text-slate-500 dark:text-zinc-400">{selectedGebiet.wahlbeteiligung2021}%</span>
                        {selectedGebiet.wahlbeteiligung !== selectedGebiet.wahlbeteiligung2021 && (
                          <span className={`text-xs font-semibold ${selectedGebiet.wahlbeteiligung > selectedGebiet.wahlbeteiligung2021 ? 'text-emerald-600' : 'text-rose-600'}`}>
                            {selectedGebiet.wahlbeteiligung > selectedGebiet.wahlbeteiligung2021 ? '▲' : '▼'} {(selectedGebiet.wahlbeteiligung - selectedGebiet.wahlbeteiligung2021).toFixed(1)}%
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Top Parties List */}
                  <div>
                    <h3 className="text-sm font-semibold text-slate-500 dark:text-zinc-450 uppercase tracking-wider mb-3">Stärkste Kräfte (Zweitstimmen)</h3>
                    <div className="space-y-4">
                      {selectedGebiet.parteien.slice(0, 3).map((partei) => (
                        <div key={partei.parteiKurz} className="relative bg-slate-50 dark:bg-zinc-900/60 p-4 rounded-xl border border-slate-100 dark:border-zinc-850">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-base font-bold text-slate-900 dark:text-zinc-50">{partei.parteiKurz}</span>
                              <span className="text-xs text-slate-500 dark:text-zinc-400 ml-2 font-normal hidden sm:inline">{partei.parteiLang}</span>
                            </div>
                            <div className="text-right">
                              <span className="text-lg font-extrabold text-slate-900 dark:text-zinc-50">{partei.zweitstimmenRelativ}%</span>
                              <span className="block text-xs text-slate-400 dark:text-zinc-500">{partei.zweitstimmenAbsolut.toLocaleString('de-DE')} Stimmen</span>
                            </div>
                          </div>

                          {/* Beautiful custom styled bar representing the vote share */}
                          <div className="w-full bg-slate-200 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${partei.zweitstimmenRelativ}%`,
                                backgroundColor: getPartyColor(partei.parteiKurz)
                              }}
                            />
                          </div>

                          {/* 2021 comparison line */}
                          {partei.zweitstimmenRelativ2021 > 0 && (
                            <div className="flex justify-between items-center mt-2 text-xs text-slate-500 dark:text-zinc-450">
                              <span>Ergebnis 2021: {partei.zweitstimmenRelativ2021}%</span>
                              <span className={partei.zweitstimmenRelativ > partei.zweitstimmenRelativ2021 ? 'text-emerald-600' : 'text-rose-600'}>
                                {partei.zweitstimmenRelativ > partei.zweitstimmenRelativ2021 ? '+' : ''}{(partei.zweitstimmenRelativ - partei.zweitstimmenRelativ2021).toFixed(1)}%
                              </span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                /* Not Found state if gebiet1Id is present but not in WahlDatenMap */
                <div className="text-center py-12 px-4 border border-dashed border-red-200 dark:border-red-900/30 rounded-xl">
                  <div className="text-4xl mb-4">❓</div>
                  <h3 className="text-lg font-semibold text-slate-800 dark:text-zinc-200 mb-2">
                    Gebiet nicht gefunden
                  </h3>
                  <p className="text-sm text-slate-500 dark:text-zinc-400 mb-6">
                    Die Gebiets-ID <code className="text-rose-600 dark:text-rose-450 font-mono bg-red-50 dark:bg-red-950/20 px-1 py-0.5 rounded">"{gebiet1Id}"</code> konnte in den Wahldaten nicht gefunden werden.
                  </p>
                  <button
                    onClick={clearSelection}
                    className="px-4 py-2 text-sm font-medium text-white bg-slate-900 dark:bg-zinc-100 dark:text-zinc-900 hover:bg-slate-800 dark:hover:bg-zinc-200 rounded-lg shadow-sm transition"
                  >
                    Zurück zur Auswahl
                  </button>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
