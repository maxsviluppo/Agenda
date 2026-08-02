import React from 'react';
import { Search, X, Filter, AlertTriangle, Tag, Calendar, Sparkles } from 'lucide-react';
import { FilterOptions } from '../types';

interface SearchAndFilterBarProps {
  filters: FilterOptions;
  onFilterChange: (newFilters: FilterOptions) => void;
  onClose: () => void;
  resultCount: number;
}

export const SearchAndFilterBar: React.FC<SearchAndFilterBarProps> = ({
  filters,
  onFilterChange,
  onClose,
  resultCount,
}) => {
  const handleSearchTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleCategoryChange = (cat: string) => {
    onFilterChange({ ...filters, category: cat });
  };

  const handleTimeRangeChange = (range: FilterOptions['timeRange']) => {
    onFilterChange({ ...filters, timeRange: range });
  };

  const handleResetFilters = () => {
    onFilterChange({
      search: '',
      category: 'Tutte',
      timeRange: 'all',
      source: 'all',
    });
  };

  const categories = ['Tutte', 'Lavoro', 'Corso', 'Riunione', 'Personale', 'Salute', 'Altro'];

  return (
    <div id="search-filter-panel" className="bg-stone-100 dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 py-3.5 px-4 sm:px-6 shadow-inner transition-all animate-fadeIn">
      <div className="max-w-7xl mx-auto space-y-3">
        
        {/* Search Row & Quick Close */}
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 dark:text-stone-500" />
            <input
              id="search-input"
              type="text"
              value={filters.search}
              onChange={handleSearchTextChange}
              placeholder="Cerca per titolo, luogo, docente o note negli appuntamenti..."
              className="w-full pl-9 pr-8 py-2.5 bg-white dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl text-sm font-medium text-stone-800 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              autoFocus
            />
            {filters.search && (
              <button
                onClick={() => onFilterChange({ ...filters, search: '' })}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-stone-600 dark:text-stone-300 whitespace-nowrap bg-stone-200/80 dark:bg-stone-800 px-3 py-2 rounded-xl hidden sm:block">
            {resultCount} {resultCount === 1 ? 'risultato' : 'risultati'}
          </div>

          <button
            onClick={onClose}
            className="p-2.5 min-w-[40px] min-h-[40px] flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-100 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer active:scale-95"
            title="Chiudi Filtri"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Advanced Filters Grid */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          
          {/* Time Range Pills */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 overflow-x-auto max-w-full">
            <span className="text-stone-400 dark:text-stone-500 px-1 font-bold text-[11px] shrink-0">Periodo:</span>
            {[
              { id: 'all', label: 'Tutti' },
              { id: 'today', label: 'Oggi' },
              { id: 'upcoming', label: 'Futuri' },
              { id: 'past', label: 'Passati' },
              { id: 'conflicts', label: '⚠️ Conflitti' }
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => handleTimeRangeChange(p.id as any)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer whitespace-nowrap active:scale-95 text-[11px] ${
                  filters.timeRange === p.id 
                    ? 'btn-gradient-primary shadow-xs' 
                    : 'text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Category Filter Dropdown */}
          <div className="flex items-center gap-1 bg-white dark:bg-stone-800 p-1 rounded-xl border border-stone-200 dark:border-stone-700 min-h-[36px]">
            <span className="text-stone-400 dark:text-stone-500 px-1 font-bold text-[11px] flex items-center gap-1">
              <Filter className="w-3 h-3 text-stone-400 dark:text-stone-500" /> Categoria:
            </span>
            <select
              value={filters.category}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="bg-transparent text-stone-800 dark:text-stone-100 font-bold focus:outline-none cursor-pointer pr-2 text-xs"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="dark:bg-stone-800 dark:text-stone-100">
                  {cat}
                </option>
              ))}
            </select>
          </div>

          {/* Reset Filters button if any active */}
          {(filters.search || filters.category !== 'Tutte' || filters.timeRange !== 'all') && (
            <button
              onClick={handleResetFilters}
              className="px-3 py-1.5 text-xs text-amber-900 dark:text-amber-200 bg-amber-100 dark:bg-amber-950 hover:bg-amber-200 dark:hover:bg-amber-900 border border-amber-300 dark:border-amber-800 rounded-xl transition-colors cursor-pointer font-bold active:scale-95"
            >
              Azzera Filtri
            </button>
          )}

        </div>

      </div>
    </div>
  );
};
