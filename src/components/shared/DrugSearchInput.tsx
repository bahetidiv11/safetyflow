import { useState, useEffect } from 'react';
import { Search, X, Pill, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrugSearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

// Common drug suggestions for autocomplete
const COMMON_DRUGS = [
  'Pembrolizumab', 'Nivolumab', 'Atezolizumab', 'Ipilimumab',
  'Adalimumab', 'Infliximab', 'Etanercept', 'Rituximab',
  'Trastuzumab', 'Bevacizumab', 'Cetuximab',
  'Metformin', 'Lisinopril', 'Atorvastatin', 'Omeprazole',
  'Amlodipine', 'Metoprolol', 'Losartan', 'Gabapentin',
  'Sertraline', 'Escitalopram', 'Duloxetine', 'Venlafaxine'
];

export default function DrugSearchInput({
  value,
  onChange,
  placeholder = 'Search for medication...',
  className
}: DrugSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  const filteredDrugs = COMMON_DRUGS.filter(drug =>
    drug.toLowerCase().includes(search.toLowerCase())
  ).slice(0, 8);

  const handleSelect = (drug: string) => {
    onChange(drug);
    setSearch(drug);
    setIsOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearch(newValue);
    onChange(newValue);
    setIsOpen(newValue.length > 0);
  };

  const handleClear = () => {
    setSearch('');
    onChange('');
    setIsOpen(false);
  };

  return (
    <div className={cn('relative', className)}>
      <div className="relative">
        <Pill className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={handleInputChange}
          onFocus={() => search.length > 0 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2 border border-input rounded-lg bg-background text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
        />
        {search && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {isOpen && filteredDrugs.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            filteredDrugs.map(drug => (
              <button
                key={drug}
                type="button"
                onClick={() => handleSelect(drug)}
                className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors text-sm flex items-center gap-2"
              >
                <Pill className="h-4 w-4 text-accent" />
                {drug}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
