import React from 'react';
import { Calendar as CalendarIcon, Mic, Search, Plus, RefreshCw, CheckCircle2, LayoutList } from 'lucide-react';
import { GoogleCalendarState } from '../types';

interface MobileBottomNavProps {
  activeView: 'month' | 'daily';
  onViewChange: (view: 'month' | 'daily') => void;
  onOpenVoiceModal: () => void;
  onOpenAddModal: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  onSetToday: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeView,
  onViewChange,
  onOpenVoiceModal,
  onOpenAddModal,
  onToggleSearch,
  isSearchOpen,
  onSetToday,
}) => {
  const isMonthActive = activeView === 'month' && !isSearchOpen;
  const isDailyActive = activeView === 'daily' && !isSearchOpen;

  return (
    <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 glass-nav border-t border-stone-200/90 dark:border-stone-800 px-2 py-1.5 shadow-2xl transition-all">
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* 30 Giorni (Month) */}
        <button
          onClick={() => {
            if (isSearchOpen) onToggleSearch();
            onViewChange('month');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
            isMonthActive
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95'
          }`}
          title="Vista 30 Giorni"
        >
          <CalendarIcon className={`w-5 h-5 ${isMonthActive ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isMonthActive ? 'font-bold' : 'font-medium'}`}>30 Giorni</span>
        </button>

        {/* Giornaliero */}
        <button
          onClick={() => {
            if (isSearchOpen) onToggleSearch();
            onViewChange('daily');
          }}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[54px] ${
            isDailyActive
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 active:scale-95'
          }`}
          title="Vista Giornaliera"
        >
          <LayoutList className={`w-5 h-5 ${isDailyActive ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isDailyActive ? 'font-bold' : 'font-medium'}`}>Giornaliero</span>
        </button>

        {/* Center Floating Primary Add Button */}
        <button
          onClick={onOpenAddModal}
          className="-mt-5 w-12 h-12 rounded-2xl btn-gradient-primary flex items-center justify-center shadow-lg shadow-orange-500/35 active:scale-90 transition-all cursor-pointer"
          title="Aggiungi Nuovo Appuntamento"
        >
          <Plus className="w-6 h-6 text-white stroke-[2.5]" />
        </button>

        {/* Oggi Shortcut */}
        <button
          onClick={onSetToday}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-stone-600 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white active:scale-95 transition-all cursor-pointer min-w-[50px]"
          title="Vai ad Oggi"
        >
          <div className="w-5 h-5 rounded-md border-2 border-stone-700 dark:border-stone-400 flex items-center justify-center text-[9px] font-extrabold text-stone-800 dark:text-stone-200">
            {new Date().getDate()}
          </div>
          <span className="text-[10px] font-medium mt-0.5">Oggi</span>
        </button>

        {/* Voice Dictation */}
        <button
          onClick={onOpenVoiceModal}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl text-amber-600 hover:text-amber-800 active:scale-95 transition-all cursor-pointer min-w-[50px]"
          title="Dettato Vocale"
        >
          <Mic className="w-5 h-5 text-amber-500 animate-pulse" />
          <span className="text-[10px] font-semibold mt-0.5 text-amber-700">Voce</span>
        </button>

        {/* Search Toggle */}
        <button
          onClick={onToggleSearch}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            isSearchOpen
              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-orange-500/25 scale-[1.02]'
              : 'text-stone-500 hover:text-stone-800 active:scale-95'
          }`}
          title="Cerca Appuntamenti"
        >
          <Search className={`w-5 h-5 ${isSearchOpen ? 'stroke-[2.5]' : ''}`} />
          <span className={`text-[10px] mt-0.5 ${isSearchOpen ? 'font-bold' : 'font-medium'}`}>Cerca</span>
        </button>

      </div>
    </nav>
  );
};
