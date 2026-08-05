import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  AlertTriangle, 
  Plus, 
  Clock, 
  List, 
  Check,
  MapPin,
  User,
  Edit2,
  Trash2
} from 'lucide-react';
import { Appointment, OverlapConflict } from '../types';

interface MonthCalendarViewProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  appointments: Appointment[];
  conflicts: OverlapConflict[];
  onOpenAddModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenCsvModal: () => void;
  onSwitchToDailyView: () => void;
  onToggleComplete?: (id: string) => void;
  onEditAppointment?: (app: Appointment) => void;
  onDeleteAppointment?: (id: string) => void;
}

export const MonthCalendarView: React.FC<MonthCalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  appointments,
  conflicts,
  onOpenAddModal,
  onOpenVoiceModal,
  onOpenCsvModal,
  onSwitchToDailyView,
  onToggleComplete,
  onEditAppointment,
  onDeleteAppointment,
}) => {
  // View state for Month and Year
  const selectedDateObj = new Date(selectedDate + 'T00:00:00');
  const [viewYear, setViewYear] = useState<number>(selectedDateObj.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(selectedDateObj.getMonth()); // 0-indexed

  const todayStr = new Date().toISOString().split('T')[0];

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleTodayClick = () => {
    const now = new Date();
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    onSelectDate(todayStr);
  };

  // Build grid for the selected month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  
  // Starting day of week (0 = Sunday, 1 = Monday in standard JS)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

  const monthName = firstDayOfMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const formatYMD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const d = dateObj.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Grid array
  const gridDays: Array<{ dateStr: string; isCurrentMonth: boolean; dayNum: number }> = [];

  // Padding days from previous month
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();
  for (let i = startDayOfWeek - 1; i >= 0; i--) {
    const day = prevMonthDays - i;
    const prevDate = new Date(viewYear, viewMonth - 1, day);
    const dateStr = formatYMD(prevDate);
    gridDays.push({ dateStr, isCurrentMonth: false, dayNum: day });
  }

  // Days of current month
  for (let day = 1; day <= daysInMonth; day++) {
    const dateObj = new Date(viewYear, viewMonth, day);
    const dateStr = formatYMD(dateObj);
    gridDays.push({ dateStr, isCurrentMonth: true, dayNum: day });
  }

  // Padding days for next month to complete 35 or 42 grid
  const remaining = 35 - gridDays.length;
  if (remaining > 0) {
    for (let day = 1; day <= remaining; day++) {
      const nextDate = new Date(viewYear, viewMonth + 1, day);
      const dateStr = formatYMD(nextDate);
      gridDays.push({ dateStr, isCurrentMonth: false, dayNum: day });
    }
  }

  const handleDayClick = (dateStr: string) => {
    if (selectedDate === dateStr) {
      onSwitchToDailyView();
    } else {
      onSelectDate(dateStr);
    }
  };

  const weekdays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

  // Selected Day's Appointments Preview
  const selectedDayApps = appointments.filter(a => a.date === selectedDate);
  const selectedDayAppsSorted = [...selectedDayApps].sort((a, b) => a.startTime.localeCompare(b.startTime));

  const [selY, selM, selD] = selectedDate.split('-').map(Number);
  const selectedDateFormatted = new Date(selY, selM - 1, selD).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div id="month-calendar-view" className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      
      {/* Main Month Grid Container */}
      <div className="bg-white dark:bg-[#0c0c16] rounded-3xl border border-stone-200 dark:border-stone-800/90 p-4 sm:p-6 shadow-sm space-y-4 transition-colors duration-200">
        
        {/* Month Header & Controls Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pb-3 border-b border-stone-200 dark:border-stone-800">
          
          {/* Month Title, Icon & Navigation Controls */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <div className="p-2.5 rounded-2xl btn-gradient-calendar shadow-md shrink-0">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            
            <div className="flex items-center gap-2 sm:gap-3">
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-stone-900 dark:text-stone-100 capitalize leading-none">
                  {monthName}
                </h2>
                <p className="text-[11px] text-stone-500 dark:text-stone-400 font-medium hidden sm:block mt-0.5">
                  Calendario mensile 30 Giorni
                </p>
              </div>

              {/* Month Navigation Controls next to H2 */}
              <div className="flex items-center bg-stone-100 dark:bg-stone-800 p-1 rounded-2xl border border-stone-200 dark:border-stone-700 shadow-xs">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Mese Precedente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={handleTodayClick}
                  className="px-2.5 py-1 text-xs font-bold rounded-xl bg-white dark:bg-stone-700 text-stone-800 dark:text-stone-100 shadow-xs border border-stone-200 dark:border-stone-600 hover:bg-stone-50 dark:hover:bg-stone-600 transition-all cursor-pointer active:scale-95"
                >
                  Oggi
                </button>
                <button
                  onClick={handleNextMonth}
                  className="p-1.5 rounded-xl text-stone-700 dark:text-stone-300 hover:bg-white dark:hover:bg-stone-700 hover:text-stone-900 dark:hover:text-white transition-all cursor-pointer active:scale-95"
                  title="Mese Successivo"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Weekday Labels Header */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2 text-center font-bold text-xs sm:text-sm text-stone-700 dark:text-stone-300 pb-2 border-b border-stone-200 dark:border-stone-800">
          {weekdays.map((day, idx) => (
            <div key={`${day}_${idx}`} className="py-1 tracking-wider">{day}</div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {gridDays.map((cell, idx) => {
            const dayApps = appointments.filter(a => a.date === cell.dateStr);
            const hasConflicts = conflicts.some(c => c.event1.date === cell.dateStr || c.event2.date === cell.dateStr);
            const isSelected = cell.dateStr === selectedDate;
            const isTodayCell = cell.dateStr === todayStr;

            return (
              <button
                key={`${cell.dateStr}_${idx}`}
                onClick={() => handleDayClick(cell.dateStr)}
                className={`aspect-square w-full p-1.5 sm:p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative group active:scale-95 overflow-hidden ${
                  isSelected
                    ? 'btn-gradient-primary shadow-lg ring-2 ring-orange-400 border-orange-500 text-white'
                    : isTodayCell
                    ? 'bg-amber-50/90 dark:bg-amber-950/60 border-amber-400 dark:border-amber-600 text-stone-900 dark:text-amber-100 font-bold shadow-xs'
                    : cell.isCurrentMonth
                    ? 'bg-white dark:bg-stone-800/80 border-stone-200 dark:border-stone-700/80 hover:border-orange-300 dark:hover:border-orange-500 hover:bg-amber-50/40 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200'
                    : 'bg-stone-50/50 dark:bg-stone-900/40 border-stone-100 dark:border-stone-800/50 text-stone-400 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800/50'
                }`}
              >
                {/* Top Row: Day Number & Overlap Badge */}
                <div className="flex items-center justify-between w-full">
                  <span className={`text-xs sm:text-sm font-bold ${
                    isSelected ? 'text-white' : isTodayCell ? 'text-amber-900 dark:text-amber-200' : ''
                  }`}>
                    {cell.dayNum}
                  </span>

                  {hasConflicts && (
                    <span className="p-1 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200" title="Sovrapposizione di orari">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    </span>
                  )}
                </div>

                {/* Event previews / dots */}
                {dayApps.length > 0 && (
                  <div className="mt-1 space-y-1 w-full overflow-hidden">
                    {/* Visual cards for tablet/desktop */}
                    <div className="hidden sm:block space-y-1">
                      {dayApps.slice(0, 2).map((app) => (
                        <div
                          key={app.id}
                          className={`text-[10px] font-bold truncate px-1.5 py-0.5 rounded-lg ${
                            isSelected 
                              ? 'bg-white/20 text-white' 
                              : 'bg-orange-50 dark:bg-orange-950/80 text-orange-900 dark:text-orange-200 border border-orange-200/80 dark:border-orange-800/60'
                          }`}
                        >
                          {app.startTime} {app.title}
                        </div>
                      ))}
                    </div>

                    {/* Dots for mobile view */}
                    <div className="flex sm:hidden items-center gap-1 flex-wrap">
                      {dayApps.slice(0, 3).map((app) => (
                        <span
                          key={app.id}
                          className={`w-2 h-2 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : 'bg-orange-500 dark:bg-orange-400'
                          }`}
                        />
                      ))}
                    </div>

                    {dayApps.length > 2 && (
                      <span className={`text-[10px] font-bold block ${isSelected ? 'text-white' : 'text-stone-500 dark:text-stone-400'}`}>
                        +{dayApps.length - 2} altri
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>

      </div>

      {/* Synthetic Minimal Daily Events List underneath Month Grid */}
      <div className="bg-gradient-to-b from-white via-white to-stone-50/60 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-6 shadow-md shadow-stone-200/50 dark:shadow-none space-y-4">
        
        {/* Minimal Synthetic Items List */}
        {selectedDayAppsSorted.length === 0 ? (
          <div className="py-8 px-4 text-center rounded-2xl bg-gradient-to-b from-stone-50/90 to-amber-50/30 dark:from-stone-900/80 dark:to-stone-950/80 border border-dashed border-stone-200/80 dark:border-stone-800 space-y-2">
            <p className="text-stone-500 dark:text-stone-400 text-xs sm:text-sm font-medium">
              Nessun evento o appuntamento programmato per {selectedDate === todayStr ? 'oggi' : 'questa data'}.
            </p>
            <button
              onClick={onOpenAddModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 transition-colors cursor-pointer pt-1"
            >
              <Plus className="w-4 h-4" />
              <span>Aggiungi un nuovo appuntamento</span>
            </button>
          </div>
        ) : (
          <div className="space-y-2.5">
            {selectedDayAppsSorted.map((app) => {
              const categoryColorMap: Record<string, { bg: string; text: string; border: string; bar: string }> = {
                'Corso': { bg: 'bg-gradient-to-r from-blue-50/80 to-indigo-50/40 dark:from-blue-950/60 dark:to-indigo-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200/80 dark:border-blue-800/80', bar: 'bg-gradient-to-b from-blue-500 to-indigo-600' },
                'Lavoro': { bg: 'bg-gradient-to-r from-purple-50/80 to-indigo-50/40 dark:from-purple-950/60 dark:to-indigo-950/40', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-200/80 dark:border-purple-800/80', bar: 'bg-gradient-to-b from-purple-500 to-indigo-600' },
                'Riunione': { bg: 'bg-gradient-to-r from-indigo-50/80 to-sky-50/40 dark:from-indigo-950/60 dark:to-sky-950/40', text: 'text-indigo-700 dark:text-indigo-300', border: 'border-indigo-200/80 dark:border-indigo-800/80', bar: 'bg-gradient-to-b from-indigo-500 to-sky-600' },
                'Salute': { bg: 'bg-gradient-to-r from-emerald-50/80 to-teal-50/40 dark:from-emerald-950/60 dark:to-teal-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200/80 dark:border-emerald-800/80', bar: 'bg-gradient-to-b from-emerald-500 to-teal-600' },
                'Personale': { bg: 'bg-gradient-to-r from-amber-50/80 to-orange-50/40 dark:from-amber-950/60 dark:to-orange-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200/80 dark:border-amber-800/80', bar: 'bg-gradient-to-b from-amber-500 to-orange-500' },
              };
              const theme = categoryColorMap[app.category] || { bg: 'bg-gradient-to-r from-stone-50/90 to-stone-100/50 dark:from-stone-800/90 dark:to-stone-800/50', text: 'text-stone-700 dark:text-stone-300', border: 'border-stone-200/80 dark:border-stone-700/80', bar: 'bg-gradient-to-b from-stone-500 to-stone-700' };

              return (
                <div
                  key={app.id}
                  className={`group relative rounded-2xl border ${theme.border} ${theme.bg} p-3.5 sm:p-4 transition-all duration-200 hover:shadow-md hover:border-stone-300 dark:hover:border-stone-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3 overflow-hidden ${
                    app.completed ? 'opacity-60 bg-stone-50 dark:bg-stone-950 border-stone-200 dark:border-stone-800' : ''
                  }`}
                >
                  {/* Left Accent Color Banner */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${theme.bar}`} />

                  {/* Left Main Content */}
                  <div className="flex items-start gap-3 pl-2 min-w-0 flex-1">
                    
                    {/* Checkbox */}
                    {onToggleComplete && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleComplete(app.id);
                        }}
                        className={`mt-0.5 min-w-[22px] min-h-[22px] w-5 h-5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shrink-0 ${
                          app.completed 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 border-orange-500 text-white' 
                            : 'bg-white dark:bg-stone-800 border-stone-300 dark:border-stone-600 hover:border-stone-500'
                        }`}
                        title={app.completed ? "Segna come da completare" : "Segna come completato"}
                      >
                        {app.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                      </button>
                    )}

                    <div className="min-w-0 flex-1 space-y-1">
                      
                      {/* Time Pill & Badges */}
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* Time Banner */}
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg bg-white/90 dark:bg-stone-800/90 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 font-bold text-xs shadow-2xs shrink-0">
                          <Clock className="w-3 h-3 text-stone-500 dark:text-stone-400" />
                          {app.startTime} - {app.endTime}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className={`text-sm font-bold text-stone-900 dark:text-stone-100 leading-snug truncate ${
                        app.completed ? 'line-through text-stone-500 dark:text-stone-500' : ''
                      }`}>
                        {app.title}
                      </h4>

                      {/* Info Metadata Bar */}
                      {(app.location || app.instructor || app.description) && (
                        <div className="flex items-center gap-3 text-xs text-stone-600 dark:text-stone-400 flex-wrap pt-0.5 font-medium">
                          {app.location && (
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                              <span className="truncate">{app.location}</span>
                            </span>
                          )}
                          {app.instructor && (
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                              <span className="truncate">{app.instructor}</span>
                            </span>
                          )}
                          {app.description && (
                            <span className="text-stone-500 dark:text-stone-400 text-[11px] truncate max-w-xs">
                              {app.description}
                            </span>
                          )}
                        </div>
                      )}

                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 justify-end shrink-0 pl-1">
                    {onEditAppointment && (
                      <button
                        onClick={() => onEditAppointment(app)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-stone-600 dark:text-stone-400 hover:text-indigo-600 dark:hover:text-indigo-300 hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer active:scale-95"
                        title="Modifica Appuntamento"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                    {onDeleteAppointment && (
                      <button
                        onClick={() => onDeleteAppointment(app.id)}
                        className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center rounded-xl text-stone-400 dark:text-stone-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-white dark:hover:bg-stone-800 transition-colors cursor-pointer active:scale-95"
                        title="Elimina Appuntamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )}

      </div>

    </div>
  );
};
