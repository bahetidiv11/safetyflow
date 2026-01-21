import { useState, useRef, useEffect } from 'react';
import { Search, X, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SearchableMultiSelectProps {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  placeholder?: string;
  className?: string;
  allowCustom?: boolean;
}

export default function SearchableMultiSelect({
  options,
  value,
  onChange,
  placeholder = 'Search and select...',
  className,
  allowCustom = true
}: SearchableMultiSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(opt =>
    opt.toLowerCase().includes(search.toLowerCase()) && !value.includes(opt)
  );

  const handleSelect = (option: string) => {
    onChange([...value, option]);
    setSearch('');
  };

  const handleRemove = (option: string) => {
    onChange(value.filter(v => v !== option));
  };

  const handleAddCustom = () => {
    if (search.trim() && !value.includes(search.trim())) {
      onChange([...value, search.trim()]);
      setSearch('');
    }
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      <div className="flex flex-wrap gap-2 p-2 border border-input rounded-lg bg-background min-h-[44px]">
        {value.map(item => (
          <span
            key={item}
            className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-accent/10 text-accent text-sm"
          >
            {item}
            <button
              type="button"
              onClick={() => handleRemove(item)}
              className="hover:text-destructive transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <div className="flex-1 min-w-[120px] relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onFocus={() => setIsOpen(true)}
            placeholder={value.length === 0 ? placeholder : 'Add more...'}
            className="w-full pl-8 py-1 bg-transparent outline-none text-sm"
          />
        </div>
      </div>

      {isOpen && (search.length > 0 || filteredOptions.length > 0) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-auto">
          {isLoading ? (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <>
              {filteredOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onClick={() => handleSelect(option)}
                  className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors text-sm flex items-center justify-between"
                >
                  {option}
                  <Check className="h-4 w-4 text-accent opacity-0" />
                </button>
              ))}
              {allowCustom && search.trim() && !filteredOptions.includes(search.trim()) && !value.includes(search.trim()) && (
                <button
                  type="button"
                  onClick={handleAddCustom}
                  className="w-full px-4 py-2 text-left hover:bg-muted/50 transition-colors text-sm border-t border-border text-accent"
                >
                  Add "{search.trim()}"
                </button>
              )}
              {filteredOptions.length === 0 && !search.trim() && (
                <div className="px-4 py-2 text-sm text-muted-foreground">
                  No options available
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
