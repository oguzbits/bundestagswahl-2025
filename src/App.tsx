import { useUrlState } from './hooks/useUrlState';
import { useElectionData } from './hooks/useElectionData';
import { Autocomplete } from './components/Autocomplete';
import { MetadataHeader } from './components/MetadataHeader';
import { ElectionChart } from './components/ElectionChart';
import { X, ArrowLeftRight } from 'lucide-react';

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
          <div className="text-xs text-slate-500 font-medium bg-slate-100 px-2.5 py-1 rounded-full">
            Datenquelle: Bundeswahlleiter-Ergebnisdateien
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
                    {gebiet1Id && gebiet2Id && (
                      <button
                        onClick={swapPositions}
                        title="Regionen tauschen"
                        className="px-4 py-2 text-xs font-bold bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-all border border-slate-200 flex items-center gap-1.5"
                      >
                        <ArrowLeftRight className="h-3.5 w-3.5" /> Spalten tauschen
                      </button>
                    )}
                    <button
                      onClick={clearSelection}
                      className="px-4 py-2 text-xs font-bold bg-red-50 text-red-700 hover:bg-red-100 rounded-xl transition-all border border-red-100 flex items-center gap-1.5"
                    >
                      <X className="h-3.5 w-3.5" /> Alle Auswahlen aufheben
                    </button>
                  </div>
                )}
              </div>

              {/* 2-Column Autocomplete Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
                {/* Column 1 Autocomplete */}
                <div className="space-y-4">
                  <Autocomplete
                    options={gebiet2Id ? searchOptions.filter((opt) => opt.id !== gebiet2Id) : searchOptions}
                    selectedId={gebiet1Id}
                    onSelect={setGebiet1Id}
                    placeholder="Suchen Sie nach einem Wahlkreis, Land oder dem Bund..."
                    label="Primäre Region"
                  />
                </div>

                {/* Column 2 Autocomplete (Only if gebiet1 is selected) */}
                <div className="space-y-4">
                  {gebiet1Id ? (
                    <Autocomplete
                      options={searchOptions.filter((opt) => opt.id !== gebiet1Id)}
                      selectedId={gebiet2Id}
                      onSelect={setGebiet2Id}
                      placeholder="Vergleichsregion suchen..."
                      label="Vergleichsregion (Optional)"
                    />
                  ) : (
                    <div className="h-full flex items-end">
                      <div className="text-sm text-slate-400 italic bg-slate-50 border border-dashed border-slate-200 rounded-xl p-4 w-full">
                        Bitte wählen Sie zuerst eine primäre Region aus, um den Vergleich zu aktivieren.
                      </div>
                    </div>
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
                    <ElectionChart
                      data={selectedGebiet1}
                      title={`Wahlergebnis: ${selectedGebiet1.name}`}
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
                        <ElectionChart
                          data={selectedGebiet1}
                          title={`Wahlergebnis: ${selectedGebiet1.name}`}
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
                        <ElectionChart
                          data={selectedGebiet2}
                          title={`Wahlergebnis: ${selectedGebiet2.name}`}
                        />
                      </div>
                    </div>

                    {/* Combined comparison card */}
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
