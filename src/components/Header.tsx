import React from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Mic, 
  Upload, 
  Search, 
  Bell, 
  BellOff, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  List,
  User,
  FileSpreadsheet,
  Moon,
  Sun
} from 'lucide-react';
import { GoogleCalendarState } from '../types';
import { getTodayDateString, formatDateYMD } from '../utils/dateUtils';

interface HeaderProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  activeView: 'month' | 'daily';
  onViewChange: (view: 'month' | 'daily') => void;
  onOpenVoiceModal: () => void;
  onOpenCsvModal: () => void;
  onOpenAddModal: () => void;
  onToggleSearch: () => void;
  isSearchOpen: boolean;
  conflictCount: number;
  googleState: GoogleCalendarState;
  onSyncGoogle: () => void;
  notificationsEnabled: boolean;
  onRequestNotifications: () => void;
  onOpenProfile?: () => void;
  isDarkMode?: boolean;
  onToggleDarkMode?: () => void;
  userName?: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeView,
  onViewChange,
  onOpenVoiceModal,
  onOpenCsvModal,
  onOpenAddModal,
  onToggleSearch,
  isSearchOpen,
  conflictCount,
  googleState,
  onSyncGoogle,
  notificationsEnabled,
  onRequestNotifications,
  onOpenProfile,
  isDarkMode = false,
  onToggleDarkMode,
  userName,
}) => {
  const [y, m, d] = currentDate.split('-').map(Number);
  const dateObj = new Date(y, m - 1, d);
  
  const formattedDate = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const todayStr = getTodayDateString();
  const isToday = currentDate === todayStr;

  const handlePrevDay = () => {
    const prevDate = new Date(y, m - 1, d - 1);
    onDateChange(formatDateYMD(prevDate));
  };

  const handleNextDay = () => {
    const nextDate = new Date(y, m - 1, d + 1);
    onDateChange(formatDateYMD(nextDate));
  };

  const handleSetToday = () => {
    onDateChange(todayStr);
  };

  return (
    <header id="agenda-header" className="bg-[#fcfbf9] dark:bg-[#181824] border-b border-stone-200 dark:border-stone-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top bar with Branding, Date Navigator and Quick Actions */}
        <div className="flex flex-row items-center justify-between gap-2 sm:gap-3">
          
          {/* Logo & Main Title */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-md shadow-orange-500/20">
              C
            </div>
            <div>
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-stone-900 dark:text-stone-100 leading-tight">
                Calendario
              </h1>
              <p className="text-[11px] sm:text-xs font-semibold text-orange-600 dark:text-orange-400 leading-none mt-0.5 truncate max-w-[160px] sm:max-w-[220px]">
                {userName ? `Agenda di ${userName}` : 'Agenda Personale'}
              </p>
            </div>
          </div>

          {/* Right Header Controls (Actions) */}
          <div className="flex items-center gap-1.5 sm:gap-2 justify-end">
            
            {/* Action Bar (Desktop / Tablet extra tools) */}
            <div className="hidden sm:flex items-center gap-1.5 sm:gap-2">
            
            {/* Voice Dictation Trigger */}
            <button
              id="voice-input-btn"
              onClick={onOpenVoiceModal}
              className="btn-gradient-voice flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shadow-xs cursor-pointer min-h-[38px]"
              title="Inserimento Vocale Rapido"
            >
              <Mic className="w-4 h-4 text-white animate-pulse" />
              <span>Vocale</span>
            </button>

            {/* CSV Import Trigger */}
            <button
              id="import-csv-btn"
              onClick={onOpenCsvModal}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 shadow-xs transition-all cursor-pointer active:scale-95 min-h-[38px]"
              title="Importa Calendario Corsi (CSV)"
            >
              <Upload className="w-4 h-4 text-purple-700 dark:text-purple-300" />
              <span className="hidden lg:inline">Importa</span> CSV
            </button>

            {/* Toggle Search */}
            <button
              id="toggle-search-btn"
              onClick={onToggleSearch}
              className={`p-2 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                isSearchOpen 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-orange-500 shadow-sm' 
                  : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-700 dark:text-stone-200 hover:bg-stone-50 dark:hover:bg-stone-700/60'
              }`}
              title="Ricerca Rapida e Filtri"
            >
              <Search className="w-4 h-4" />
            </button>

            {/* Notification Permission Toggle */}
            <button
              id="notification-toggle-btn"
              onClick={onRequestNotifications}
              className={`p-2 rounded-xl border text-xs transition-all cursor-pointer active:scale-95 min-h-[38px] ${
                notificationsEnabled 
                  ? 'bg-orange-50 dark:bg-orange-950/60 border-orange-300 dark:border-orange-800 text-orange-800 dark:text-orange-200' 
                  : 'bg-stone-100 dark:bg-stone-800 border-stone-300 dark:border-stone-700 text-stone-500 dark:text-stone-400 hover:bg-stone-200 dark:hover:bg-stone-700'
              }`}
              title={notificationsEnabled ? 'Notifiche Push Attive' : 'Attiva Notifiche Push Browser'}
            >
              {notificationsEnabled ? <Bell className="w-4 h-4 text-orange-600 dark:text-orange-400" /> : <BellOff className="w-4 h-4" />}
            </button>

            {/* Google Calendar Sync */}
            <button
              id="google-sync-btn"
              onClick={onSyncGoogle}
              className={`btn-gradient-google flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl shadow-xs cursor-pointer min-h-[38px]`}
              title="Sincronizza con Google Calendar"
            >
              <RefreshCw className="w-3.5 h-3.5 text-white" />
              <span>Google</span>
              {googleState.isConnected && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />}
            </button>

            </div>

            {/* CSV Acquisition Icon Button (Top Right) */}
            <button
              id="csv-acquire-btn"
              onClick={onOpenCsvModal}
              className="p-2.5 rounded-xl bg-orange-100 dark:bg-orange-950/80 hover:bg-orange-200 dark:hover:bg-orange-900/80 text-orange-900 dark:text-orange-200 border border-orange-300/80 dark:border-orange-800 shadow-xs transition-all cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0"
              title="Acquisisci / Importa Calendario CSV"
            >
              <FileSpreadsheet className="w-5 h-5 text-orange-700 dark:text-orange-300" />
            </button>

            {/* Profile Icon (Top Right) */}
            <button
              id="profile-btn"
              onClick={onOpenProfile}
              className="p-2.5 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/25 hover:opacity-95 transition-all cursor-pointer active:scale-95 min-h-[38px] min-w-[38px] flex items-center justify-center shrink-0 border-0"
              title="Profilo & Dati Personali"
            >
              <User className="w-5 h-5 text-white" />
            </button>

          </div>

        </div>
      </div>
    </header>
  );
};

