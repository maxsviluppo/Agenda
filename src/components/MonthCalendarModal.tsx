import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, AlertTriangle } from 'lucide-react';
import { Appointment, OverlapConflict } from '../types';
import { doAppointmentsOverlap } from '../utils/conflictDetector';

interface MonthCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  appointments: Appointment[];
  conflicts: OverlapConflict[];
}

export const MonthCalendarModal: React.FC<MonthCalendarModalProps> = ({
  isOpen,
  onClose,
  selectedDate,
  onSelectDate,
  appointments,
  conflicts,
}) => {
  if (!isOpen) return null;

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

  // Build grid for the selected month
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1);
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  
  // Starting day of week (0 = Sunday, 1 = Monday in standard JS, let's align to Monday = 0)
  let startDayOfWeek = firstDayOfMonth.getDay() - 1;
  if (startDayOfWeek === -1) startDayOfWeek = 6; // Sunday becomes 6

  const monthName = firstDayOfMonth.toLocaleDateString('it-IT', { month: 'long', year: 'numeric' });

  const formatYMD = (dateObj: Date) => {
    const y = dateObj.getFullYear();
    const m = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const d = dateObj.getDate().toString().padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Array of 35-42 day slots
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
    onSelectDate(dateStr);
    onClose();
  };

  const weekdays = ['L', 'M', 'M', 'G', 'V', 'S', 'D'];

  return (
    <div id="month-calendar-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-300 dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-scaleIn text-stone-900 dark:text-stone-100">
        
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 border-b border-stone-200 dark:border-stone-800 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl btn-gradient-calendar">
              <CalendarIcon className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                Calendario 30 Giorni
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Seleziona un giorno per gli appuntamenti
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Month Switcher Controls */}
        <div className="px-5 sm:px-6 py-3 bg-stone-50 dark:bg-stone-800 border-b border-stone-200 dark:border-stone-700 flex items-center justify-between">
          <button
            onClick={handlePrevMonth}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <span className="font-bold text-sm sm:text-base text-stone-900 dark:text-stone-100 capitalize">
            {monthName}
          </span>

          <button
            onClick={handleNextMonth}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-stone-700 dark:text-stone-300 hover:bg-stone-200/80 dark:hover:bg-stone-700 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Month Grid */}
        <div className="p-4 sm:p-6">
          
          {/* Weekday Labels */}
          <div className="grid grid-cols-7 gap-1 text-center font-bold text-xs sm:text-sm text-stone-700 mb-2">
            {weekdays.map((day, idx) => (
              <div key={`${day}_${idx}`} className="py-1 font-bold">{day}</div>
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
                  className={`aspect-square w-full p-1.5 sm:p-2 rounded-xl sm:rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer relative active:scale-95 overflow-hidden ${
                    isSelected
                      ? 'btn-gradient-primary shadow-md border-indigo-700 text-white'
                      : isTodayCell
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200 font-bold dark:bg-amber-500/20 dark:border-amber-500 dark:text-amber-200'
                      : cell.isCurrentMonth
                      ? 'bg-white dark:bg-stone-800/90 border-stone-200 dark:border-stone-700 hover:border-stone-400 dark:hover:border-stone-500 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100'
                      : 'bg-stone-50/50 dark:bg-stone-900/40 border-stone-100 dark:border-stone-800/60 text-stone-300 dark:text-stone-600 hover:bg-stone-100 dark:hover:bg-stone-800/40'
                  }`}
                >
                  {/* Top Day Number & Badges */}
                  <div className="flex items-center justify-between w-full">
                    <span className={`text-xs font-bold ${isSelected ? 'text-white' : ''}`}>
                      {cell.dayNum}
                    </span>

                    {hasConflicts && (
                      <span className="p-0.5 rounded-full bg-amber-100 text-amber-800" title="Sovrapposizione oraria">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                      </span>
                    )}
                  </div>

                  {/* Event Dots / Count */}
                  {dayApps.length > 0 && (
                    <div className="flex items-center gap-1 mt-1 flex-wrap">
                      {dayApps.slice(0, 3).map((a, i) => (
                        <span
                          key={a.id}
                          className={`w-1.5 h-1.5 rounded-full ${
                            isSelected 
                              ? 'bg-white' 
                              : a.importance === 'Alta' 
                              ? 'bg-red-500' 
                              : 'bg-indigo-500'
                          }`}
                        ></span>
                      ))}
                      {dayApps.length > 3 && (
                        <span className={`text-[9px] font-bold ${isSelected ? 'text-white' : 'text-stone-500'}`}>
                          +{dayApps.length - 3}
                        </span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>

        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-5 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-2 text-xs text-stone-500">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-600"></span> Selezionato
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-indigo-400"></span> Incontro
            </span>
            <span className="flex items-center gap-1 font-medium">
              <span className="w-2 h-2 rounded-full bg-red-500"></span> ⭐ Alta
            </span>
          </div>

          <button
            onClick={() => handleDayClick(todayStr)}
            className="font-bold text-indigo-700 hover:underline cursor-pointer min-h-[36px]"
          >
            Vai a Oggi
          </button>
        </div>

      </div>
    </div>
  );
};
