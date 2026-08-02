import React from 'react';
import { 
  Plus, 
  Clock, 
  MapPin, 
  User, 
  CheckCircle2, 
  Circle, 
  Trash2, 
  Edit3, 
  AlertTriangle, 
  Calendar as CalendarIcon,
  Tag,
  Mic,
  ChevronLeft,
  ChevronRight,
  BookOpen
} from 'lucide-react';
import { Appointment, OverlapConflict } from '../types';
import { getTodayDateString, formatDateYMD } from '../utils/dateUtils';

interface CleanDailyViewProps {
  currentDate: string; // YYYY-MM-DD
  appointments: Appointment[]; // Already filtered for currentDate or search
  conflicts: OverlapConflict[];
  onToggleComplete: (id: string) => void;
  onEditAppointment: (appointment: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onOpenAddModal: () => void;
  onOpenVoiceModal: () => void;
  onOpenCsvModal: () => void;
  onDateChange: (date: string) => void;
  onSwitchToMonthView: () => void;
}

export const CleanDailyView: React.FC<CleanDailyViewProps> = ({
  currentDate,
  appointments,
  conflicts,
  onToggleComplete,
  onEditAppointment,
  onDeleteAppointment,
  onOpenAddModal,
  onOpenVoiceModal,
  onOpenCsvModal,
  onDateChange,
  onSwitchToMonthView,
}) => {
  const [yearNum, monthNum, dayNum] = currentDate.split('-').map(Number);
  const dateObj = new Date(yearNum, monthNum - 1, dayNum);
  
  const formattedDate = dateObj.toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const todayStr = getTodayDateString();
  const isToday = currentDate === todayStr;

  // Filter appointments specifically for the active date and sort chronologically by startTime
  const dayAppointments = appointments
    .filter(a => a.date === currentDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  const handlePrevDay = () => {
    const d = new Date(yearNum, monthNum - 1, dayNum - 1);
    onDateChange(formatDateYMD(d));
  };

  const handleNextDay = () => {
    const d = new Date(yearNum, monthNum - 1, dayNum + 1);
    onDateChange(formatDateYMD(d));
  };

  const handleSetToday = () => {
    onDateChange(todayStr);
  };

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'Lavoro':
        return 'bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800';
      case 'Corso':
        return 'bg-purple-50 dark:bg-purple-950/70 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800';
      case 'Riunione':
        return 'bg-blue-50 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800';
      case 'Salute':
        return 'bg-emerald-50 dark:bg-emerald-950/70 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800';
      case 'Personale':
        return 'bg-pink-50 dark:bg-pink-950/70 text-pink-700 dark:text-pink-300 border-pink-200 dark:border-pink-800';
      default:
        return 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div id="clean-daily-view" className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      
      {/* Date Header & Quick Navigation Bar */}
      <div className="bg-gradient-to-r from-white via-stone-50/70 to-amber-50/30 dark:from-stone-900 dark:via-stone-900/90 dark:to-stone-950/80 rounded-3xl border border-stone-200/90 dark:border-stone-800 p-4 sm:p-5 shadow-md shadow-stone-200/50 dark:shadow-none transition-all hover:border-stone-300 dark:hover:border-stone-700">
        
        {/* Day Navigator */}
        <div className="flex items-center justify-between gap-2 sm:gap-4 w-full">
          <button
            onClick={handlePrevDay}
            className="p-2.5 rounded-2xl bg-white dark:bg-stone-800 hover:bg-orange-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-orange-700 border border-stone-200/80 dark:border-stone-700 hover:border-orange-200 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="Giorno Precedente"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* Single Line Date & Colored Event Counter */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-center">
            <span className="font-extrabold text-base sm:text-xl text-stone-900 dark:text-stone-100 capitalize tracking-tight">
              {formattedDate}
            </span>

            {isToday && (
              <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs shrink-0">
                Oggi
              </span>
            )}

            {!isToday && (
              <button
                onClick={handleSetToday}
                className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700 transition-all cursor-pointer active:scale-95 shrink-0"
              >
                Torna a Oggi
              </button>
            )}

            {/* Colored Badge for Event Count */}
            <div className="shrink-0">
              {dayAppointments.length === 0 ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100/80 dark:bg-amber-950/80 text-amber-900 dark:text-amber-200 border border-amber-200/90 dark:border-amber-800 shadow-2xs">
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  0 eventi
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-sm shadow-orange-200 dark:shadow-none">
                  <CalendarIcon className="w-3.5 h-3.5 text-orange-100" />
                  {dayAppointments.length} {dayAppointments.length === 1 ? 'evento' : 'eventi'}
                </span>
              )}
            </div>
          </div>

          <button
            onClick={handleNextDay}
            className="p-2.5 rounded-2xl bg-white dark:bg-stone-800 hover:bg-orange-50 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-200 hover:text-orange-700 border border-stone-200/80 dark:border-stone-700 hover:border-orange-200 shadow-xs transition-all cursor-pointer active:scale-95 shrink-0"
            title="Giorno Successivo"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

      </div>

      {/* Clean Chronological List Section */}
      <div className="space-y-3">
        {dayAppointments.length === 0 ? (
          
          /* Clean Empty State */
          <div className="bg-white dark:bg-stone-900 rounded-3xl border border-dashed border-stone-300 dark:border-stone-800 p-8 sm:p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-400 flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="font-bold text-lg text-stone-800 dark:text-stone-200">
                Nessun appuntamento per questo giorno
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                La giornata è completamente libera. Aggiungi i tuoi impegni, corsi o lezioni di lavoro.
              </p>
            </div>
            <div className="pt-2 flex items-center justify-center gap-3">
              <button
                onClick={onOpenAddModal}
                className="btn-gradient-primary px-5 py-2.5 rounded-xl text-xs font-bold shadow-md cursor-pointer active:scale-95"
              >
                + Aggiungi Appuntamento
              </button>
              <button
                onClick={onOpenCsvModal}
                className="px-4 py-2.5 rounded-xl text-xs font-bold bg-orange-50 dark:bg-orange-950/60 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-orange-900 dark:text-orange-200 border border-orange-200 dark:border-orange-800 transition-all cursor-pointer active:scale-95"
              >
                <BookOpen className="w-4 h-4 inline mr-1 text-orange-700 dark:text-orange-300" />
                Importa Corsi CSV
              </button>
            </div>
          </div>

        ) : (

          /* Chronological Event Cards */
          <div className="space-y-3">
            {dayAppointments.map((app) => {
              const hasConflict = conflicts.some(
                c => c.event1.id === app.id || c.event2.id === app.id
              );

              return (
                <div
                  key={app.id}
                  className={`bg-white dark:bg-stone-900/90 rounded-2xl border p-4 sm:p-5 shadow-xs hover:shadow-md transition-all relative group ${
                    app.completed 
                      ? 'bg-stone-50/70 dark:bg-stone-950/40 border-stone-200 dark:border-stone-800/80 opacity-75' 
                      : hasConflict 
                      ? 'border-amber-400 dark:border-amber-600 bg-amber-50/30 dark:bg-amber-950/30' 
                      : 'border-stone-200 dark:border-stone-800 hover:border-indigo-300 dark:hover:border-indigo-600'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    
                    {/* Left: Completion Checkbox & Details */}
                    <div className="flex items-start gap-3.5 flex-1 min-w-0">
                      
                      {/* Completion Checkbox */}
                      <button
                        onClick={() => onToggleComplete(app.id)}
                        className="mt-0.5 shrink-0 text-stone-400 dark:text-stone-500 hover:text-indigo-600 transition-colors cursor-pointer active:scale-95"
                        title={app.completed ? "Segna come incompleto" : "Segna come completato"}
                      >
                        {app.completed ? (
                          <CheckCircle2 className="w-6 h-6 text-orange-500 dark:text-orange-400" />
                        ) : (
                          <Circle className="w-6 h-6 text-stone-300 dark:text-stone-600 hover:text-indigo-500" />
                        )}
                      </button>

                      <div className="space-y-2 flex-1 min-w-0">
                        
                        {/* Title & Badges Header */}
                        <div className="flex flex-wrap items-center gap-2">
                          
                          {/* Time Badge */}
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-stone-900 dark:bg-stone-800 text-white font-bold text-xs shrink-0 shadow-xs border dark:border-stone-700">
                            <Clock className="w-3.5 h-3.5 text-amber-400" />
                            {app.startTime} - {app.endTime}
                          </span>

                          {/* Overlap Warning Badge */}
                          {hasConflict && (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700 shrink-0">
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                              Sovrapposizione
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h4 className={`text-base sm:text-lg font-bold text-stone-900 dark:text-stone-100 leading-snug break-words ${
                          app.completed ? 'line-through text-stone-500 dark:text-stone-500' : ''
                        }`}>
                          {app.title}
                        </h4>

                        {/* Subdetails: Location & Instructor */}
                        {(app.location || app.instructor) && (
                          <div className="flex flex-wrap items-center gap-4 text-xs text-stone-600 dark:text-stone-400 font-medium pt-0.5">
                            {app.location && (
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0" />
                                {app.location}
                              </span>
                            )}
                            {app.instructor && (
                              <span className="flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                                {app.instructor}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Notes / Description */}
                        {app.description && (
                          <p className="text-xs text-stone-600 dark:text-stone-300 font-medium bg-stone-50 dark:bg-stone-800/60 p-2.5 rounded-xl border border-stone-200/80 dark:border-stone-700/80 mt-1">
                            {app.description}
                          </p>
                        )}

                      </div>

                    </div>

                    {/* Right: Quick Action Buttons (Edit & Delete) */}
                    <div className="flex items-center gap-1 shrink-0 pt-0.5">
                      <button
                        onClick={() => onEditAppointment(app)}
                        className="p-2 text-stone-400 dark:text-stone-500 hover:text-indigo-700 dark:hover:text-indigo-300 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Modifica Appuntamento"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => onDeleteAppointment(app.id)}
                        className="p-2 text-stone-400 dark:text-stone-500 hover:text-red-700 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/60 rounded-xl transition-all cursor-pointer active:scale-95"
                        title="Elimina Appuntamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

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
