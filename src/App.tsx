import { useUrlState } from './hooks/useUrlState';
import { useElectionData } from './hooks/useElectionData';
import { Autocomplete } from './components/Autocomplete';
import { MetadataHeader } from './components/MetadataHeader';
import { ElectionChart } from './components/ElectionChart';
import { RotateCcw, ArrowLeftRight } from 'lucide-react';

export default function App() {
  const { gebiet1Id, gebiet2Id, setGebiet1Id, setGebiet2Id, clearSelection, swapPositions } = useUrlState();
  const { data, isLoading, error, searchOptions } = useElectionData();

  // Find the selected Gebiet in our map
  const selectedGebiet1 = gebiet1Id && data ? data[gebiet1Id] : null;
  const selectedGebiet2 = gebiet2Id && data ? data[gebiet2Id] : null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className="text-2xl" role="img" aria-label="German Flag">🇩🇪</span>
            <h1 className="text-xl font-bold tracking-tight text-slate-900">
              Bundestagswahl 2025
            </h1>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="text-slate-600 font-medium">Wahldaten werden verarbeitet und Ergebnisse geladen...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <span className="text-red-500 text-xl font-bold">⚠️</span>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-bold text-red-800">Fehler beim Laden der Daten</h3>
                <p className="text-sm text-red-700 mt-1">{error.message}</p>
              </div>
            </div>
          </div>
        )}

        {/* Loaded Content */}
        {!isLoading && !error && (
          <div className="space-y-8">
            {/* Search Controls Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div>
                  <h2 className="text-lg font-bold text-slate-800">Region für Analyse auswählen</h2>
                  <p className="text-xs text-slate-500 mt-0.5">Ergebnisse auf Bundes-, Landes- oder Wahlkreisebene erkunden</p>
                </div>
                {(gebiet1Id || gebiet2Id) && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={clearSelection}
                      title="Auswahl zurücksetzen"
                      aria-label="Auswahl zurücksetzen"
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all border border-slate-200 hover:border-red-200 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                    >
                      <RotateCcw className="h-4 w-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* 2-Column Autocomplete Grid with swap button elegantly positioned in between */}
              <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end relative">
                {/* Column 1 Autocomplete */}
                <div className="w-full">
                  <Autocomplete
                    options={gebiet2Id ? searchOptions.filter((opt) => opt.id !== gebiet2Id) : searchOptions}
                    selectedId={gebiet1Id}
                    onSelect={setGebiet1Id}
                    placeholder="Suchen Sie nach einem Wahlkreis, Land oder dem Bund..."
                    label="Primäre Region"
                  />
                </div>

                {/* Elegant Swap Button in between Autocompletes */}
                <div className="flex items-center justify-center h-11 pb-0.5">
                  {gebiet1Id && gebiet2Id ? (
                    <button
                      onClick={swapPositions}
                      title="Regionen tauschen"
                      aria-label="Regionen tauschen"
                      className="p-2.5 text-slate-600 hover:text-indigo-600 bg-slate-100 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-100 rounded-xl transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <ArrowLeftRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <div className="w-9 h-9" /> // spacer
                  )}
                </div>

                {/* Column 2 Autocomplete */}
                <div className="w-full">
                  {gebiet1Id ? (
                    <Autocomplete
                      options={searchOptions.filter((opt) => opt.id !== gebiet1Id)}
                      selectedId={gebiet2Id}
                      onSelect={setGebiet2Id}
                      placeholder="Vergleichsregion suchen..."
                      label="Vergleichsregion (Optional)"
                    />
                  ) : (
                    <div className="hidden md:block h-11" /> // spacer to keep track width 1fr
                  )}
                </div>
              </div>
            </div>

            {/* Display Selected Gebiet & Comparison Side-by-Side */}
            {(selectedGebiet1 || selectedGebiet2) ? (
              <div className="space-y-8">
                {selectedGebiet1 && !selectedGebiet2 ? (
                  /* CASE 1: Only gebiet1 is selected */
                  <div className="space-y-6 max-w-4xl mx-auto">
                    <MetadataHeader
                      gebiet={selectedGebiet1}
                      parentName={
                        selectedGebiet1.typ === 'Wahlkreis' && selectedGebiet1.uebergeordnetesGebietId && data
                          ? data[selectedGebiet1.uebergeordnetesGebietId]?.name
                          : null
                      }
                    />
                  </div>
                ) : selectedGebiet1 && selectedGebiet2 ? (
                  /* CASE 2: Both gebiet1 and gebiet2 are selected */
                  <div className="space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Column 1: Primary Region */}
                      <div className="space-y-6">
                        <MetadataHeader
                          gebiet={selectedGebiet1}
                          parentName={
                            selectedGebiet1.typ === 'Wahlkreis' && selectedGebiet1.uebergeordnetesGebietId && data
                              ? data[selectedGebiet1.uebergeordnetesGebietId]?.name
                              : null
                          }
                        />
                      </div>

                      {/* Column 2: Comparison Region */}
                      <div className="space-y-6">
                        <MetadataHeader
                          gebiet={selectedGebiet2}
                          parentName={
                            selectedGebiet2.typ === 'Wahlkreis' && selectedGebiet2.uebergeordnetesGebietId && data
                              ? data[selectedGebiet2.uebergeordnetesGebietId]?.name
                              : null
                          }
                        />
                      </div>
                    </div>

                    {/* Combined comparison chart at the bottom */}
                    <div className="border-t border-slate-200 pt-8">
                      <ElectionChart
                        data={selectedGebiet1}
                        compareWith={selectedGebiet2}
                        title={`Vergleich: ${selectedGebiet1.name} vs. ${selectedGebiet2.name}`}
                      />
                    </div>
                  </div>
                ) : null}
              </div>
            ) : (
              /* Fallback message if neither is selected */
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 max-w-2xl mx-auto py-16 px-8 text-center flex flex-col items-center">
                <div className="bg-indigo-50 text-indigo-600 rounded-full p-4 mb-4 text-4xl shadow-sm">
                  🔍
                </div>
                <h3 className="text-xl font-black text-slate-800">Keine Wahlregion ausgewählt</h3>
                <p className="text-sm text-slate-500 mt-2.5 max-w-md leading-relaxed">
                  Wählen Sie oben über das Suchfeld einen Wahlkreis, ein Bundesland oder das gesamte Bundesgebiet aus, um die Wahlbeteiligung und die Zweitstimmenverteilung anzuzeigen.
                </p>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="py-4 bg-slate-100/50 text-xs text-muted-foreground border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500">
          © 2025 Bundestagswahl. Alle Rechte vorbehalten. | Datenquelle: Bundeswahlleiter-Ergebnisdateien
        </div>
      </footer>
    </div>
  );
}
