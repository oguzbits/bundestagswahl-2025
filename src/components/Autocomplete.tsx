import { useState, useId, type MouseEvent, type KeyboardEvent } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from './ui/command';
import { cn } from '../lib/utils';
import type { SearchOption } from '../hooks/useElectionData';

export interface AutocompleteProps {
  options: SearchOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  placeholder: string;
  label: string;
}

export function Autocomplete({
  options,
  selectedId,
  onSelect,
  placeholder,
  label,
}: AutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const triggerId = useId();

  const selectedOption = options.find((opt) => opt.id === selectedId) || null;

  // Group the options by their type for display
  const groupedOptions = {
    Bund: options.filter((opt) => opt.type === 'Bund'),
    Land: options.filter((opt) => opt.type === 'Land'),
    Wahlkreis: options.filter((opt) => opt.type === 'Wahlkreis'),
  };

  const handleClear = (e: MouseEvent | KeyboardEvent) => {
    e.stopPropagation(); // Prevent opening popover
    onSelect(null);
    setSearchQuery('');
  };

  return (
    <div className="flex flex-col gap-1.5 w-full relative" data-testid="autocomplete">
      <label htmlFor={triggerId} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
        {label}
      </label>
      
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          id={triggerId}
          role="combobox"
          aria-expanded={open}
          aria-haspopup="listbox"
          aria-label={label}
          className={cn(
            "flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white pl-4 pr-16 py-2.5 text-sm shadow-sm transition-all text-left",
            "hover:bg-slate-50 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
            !selectedOption && "text-slate-400"
          )}
        >
          <span className="truncate flex-1 font-medium">
            {selectedOption ? (
              <span className="text-slate-900 flex items-center gap-2 min-w-0">
                <span className={cn(
                  "text-[10px] font-bold px-1.5 py-0.5 rounded-md uppercase tracking-wider border shrink-0",
                  selectedOption.type === 'Bund' && "bg-slate-900 text-white border-slate-900",
                  selectedOption.type === 'Land' && "bg-indigo-50 text-indigo-700 border-indigo-100",
                  selectedOption.type === 'Wahlkreis' && "bg-slate-100 text-slate-600 border-slate-200"
                )}>
                  {selectedOption.type}
                </span>
                <span className="truncate">{selectedOption.name}</span>
              </span>
            ) : (
              placeholder
            )}
          </span>
          <ChevronsUpDown className="h-4 w-4 text-slate-400 absolute right-4 bottom-[14px] pointer-events-none" />
        </PopoverTrigger>

        {selectedOption && (
          <button
            type="button"
            onClick={handleClear}
            aria-label="Auswahl aufheben"
            className="absolute right-10 bottom-[8px] rounded-full p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 z-10"
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <PopoverContent 
          className="p-0 w-[var(--anchor-width)] max-w-[calc(100vw-2rem)] overflow-hidden shadow-xl border border-slate-200 rounded-xl bg-white"
          align="start"
          sideOffset={8}
          finalFocus={() => {
            // Prevent pulling focus back to the trigger if the user has already tabbed out
            // to another element on the page (like the swap button).
            const activeEl = document.activeElement;
            if (activeEl && activeEl !== document.body && !activeEl.closest('[data-slot="popover-content"]')) {
              return false;
            }
            return true;
          }}
        >
          <Command
            filter={(value, search) => {
              // value contains JSON string with name and parentName and id
              try {
                const data = JSON.parse(value) as { name: string; parentName: string | null; id: string };
                const searchLower = search.toLowerCase();
                
                const matchesName = data.name.toLowerCase().includes(searchLower);
                const matchesParent = data.parentName ? data.parentName.toLowerCase().includes(searchLower) : false;
                const matchesId = data.id.includes(searchLower);
                
                if (matchesName || matchesParent || matchesId) return 1;
              } catch {
                // Fallback
                if (value.toLowerCase().includes(search.toLowerCase())) return 1;
              }
              return 0;
            }}
          >
            <CommandInput 
              placeholder="Name, Bundesland oder ID suchen..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList className="max-h-[300px] overflow-y-auto mt-2">
              <CommandEmpty className="py-6 text-center text-sm text-slate-500">
                Keine passenden Regionen gefunden.
              </CommandEmpty>
              
              {groupedOptions.Bund.length > 0 && (
                <CommandGroup heading="Bund">
                  {groupedOptions.Bund.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={JSON.stringify({ id: option.id, name: option.name, parentName: option.parentName })}
                      onSelect={() => {
                        onSelect(option.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 aria-selected:bg-slate-100"
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white border border-slate-900 uppercase tracking-wider shrink-0">
                          Bund
                        </span>
                        <span className="text-slate-900 font-bold truncate">{option.name}</span>
                      </span>
                      {selectedId === option.id && (
                        <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedOptions.Land.length > 0 && (
                <CommandGroup heading="Bundesländer">
                  {groupedOptions.Land.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={JSON.stringify({ id: option.id, name: option.name, parentName: option.parentName })}
                      onSelect={() => {
                        onSelect(option.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 aria-selected:bg-slate-100"
                    >
                      <span className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider shrink-0">
                          Land
                        </span>
                        <span className="text-slate-800 truncate">{option.name}</span>
                      </span>
                      {selectedId === option.id && (
                        <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {groupedOptions.Wahlkreis.length > 0 && (
                <CommandGroup heading="Wahlkreise">
                  {groupedOptions.Wahlkreis.map((option) => (
                    <CommandItem
                      key={option.id}
                      value={JSON.stringify({ id: option.id, name: option.name, parentName: option.parentName })}
                      onSelect={() => {
                        onSelect(option.id);
                        setOpen(false);
                        setSearchQuery('');
                      }}
                      className="flex items-center justify-between py-2 px-3 rounded-lg cursor-pointer text-sm font-medium hover:bg-slate-50 aria-selected:bg-slate-100"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 uppercase tracking-wider shrink-0">
                            Wkr {option.id}
                          </span>
                          <span className="text-slate-800 truncate font-semibold">{option.name}</span>
                        </div>
                        {option.parentName && (
                          <span className="text-xs text-slate-400 font-normal pl-1 truncate">
                            gehört zu {option.parentName}
                          </span>
                        )}
                      </div>
                      {selectedId === option.id && (
                        <Check className="h-4 w-4 text-indigo-600 shrink-0" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
