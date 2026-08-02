import React from 'react';
import { 
  Clock, 
  Tag, 
  MapPin, 
  User, 
  AlertTriangle, 
  CheckSquare, 
  Square, 
  Edit3, 
  Trash2, 
  Calendar as CalendarIcon,
  Plus,
  Bell,
  Sparkles
} from 'lucide-react';
import { Appointment, OverlapConflict } from '../types';
import { doAppointmentsOverlap } from '../utils/conflictDetector';

interface ClassicAgendaViewProps {
  currentDate: string; // YYYY-MM-DD
  appointments: Appointment[];
  conflicts: OverlapConflict[];
  onToggleComplete: (id: string) => void;
  onEditAppointment: (app: Appointment) => void;
  onDeleteAppointment: (id: string) => void;
  onAddAppointmentForHour: (hour: string) => void;
  onSelectDate: (date: string) => void;
}

export const ClassicAgendaView: React.FC<ClassicAgendaViewProps> = ({
  currentDate,
  appointments,
  conflicts,
  onToggleComplete,
  onEditAppointment,
  onDeleteAppointment,
  onAddAppointmentForHour,
  onSelectDate,
}) => {
  // Hours from 07:00 to 22:00
  const hours = Array.from({ length: 16 }, (_, i) => {
    const h = i + 7;
    return `${h.toString().padStart(2, '0')}:00`;
  });

  // Today's appointments sorted chronologically
  const dayAppointments = appointments
    .filter(a => a.date === currentDate)
    .sort((a, b) => a.startTime.localeCompare(b.startTime));

  // Find overlaps on this day
  const dayConflicts = conflicts.filter(c => c.event1.date === currentDate || c.event2.date === currentDate);

  const isToday = currentDate === new Date().toISOString().split('T')[0];
  const now = new Date();
  const currentHourMinutes = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="flex-1 py-4 sm:py-6 px-2 sm:px-6 md:px-8 pb-28 sm:pb-12 min-h-[calc(100vh-120px)]">
      <div className="max-w-5xl mx-auto">
        
        {/* Conflict Warning Banner on Daily View */}
        {dayConflicts.length > 0 && (
          <div className="mb-4 sm:mb-6 p-3.5 sm:p-4 rounded-2xl bg-amber-50 border-2 border-amber-300 shadow-sm text-amber-900 animate-fadeIn">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-amber-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h3 className="font-bold text-sm sm:text-base text-amber-950">
                  ⚠️ Sovrapposizione Orari Rilevata ({dayConflicts.length})
                </h3>
                <div className="mt-1 space-y-1 text-xs sm:text-sm text-amber-800">
                  {dayConflicts.map(c => (
                    <div key={c.id} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                      <span>{c.message}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Paper Notebook Sheet Container with Classic Gray Lines */}
        <div id="classic-agenda-paper" className="bg-white rounded-2xl sm:rounded-3xl border border-stone-300 shadow-lg overflow-hidden relative">
          
          {/* Header of Paper Sheet */}
          <div className="bg-gradient-to-r from-stone-100/90 via-stone-50 to-stone-100/90 border-b-2 border-stone-300 px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-amber-900 bg-amber-100/90 px-2.5 py-0.5 rounded-full border border-amber-200">
                Orario Giornaliero
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900 mt-1">
                Incontri & Impegni di Oggi
              </h2>
            </div>
            
            <div className="text-xs text-stone-500 font-semibold flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
                <span>{dayAppointments.length} {dayAppointments.length === 1 ? 'evento' : 'eventi'}</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>{dayAppointments.filter(a => a.completed).length} completati</span>
              </span>
            </div>
          </div>

          {/* Hourly Lined Notebook Section */}
          <div className="divide-y divide-stone-200/90 relative">
            
            {/* Red Margin Line on the left (Classic Notebook effect) */}
            <div className="absolute top-0 bottom-0 left-12 sm:left-24 w-0.5 bg-red-300/60 z-10 pointer-events-none"></div>

            {hours.map((hourStr) => {
              const hourNum = parseInt(hourStr.split(':')[0], 10);
              const hourStartMins = hourNum * 60;
              const hourEndMins = hourStartMins + 59;

              // Find appointments starting in this hour slot
              const slotAppointments = dayAppointments.filter(a => {
                const [h] = a.startTime.split(':').map(Number);
                return h === hourNum;
              });

              // Check if current hour line
              const isCurrentHour = isToday && currentHourMinutes >= hourStartMins && currentHourMinutes <= hourEndMins;

              return (
                <div 
                  key={hourStr}
                  className={`group relative flex min-h-[68px] sm:min-h-[72px] transition-colors hover:bg-stone-50/80 ${
                    isCurrentHour ? 'bg-amber-50/40' : ''
                  }`}
                >
                  {/* Left Column: Hour Time Label */}
                  <div className="w-12 sm:w-24 px-1.5 sm:px-4 py-2.5 text-right font-bold text-[11px] sm:text-sm text-stone-500 select-none shrink-0 border-r border-stone-200/80 bg-stone-50/40">
                    {hourStr}
                  </div>

                  {/* Main Content Area: Lined Paper Row */}
                  <div className="flex-1 pl-3 sm:pl-6 pr-3 sm:pr-4 py-2 flex flex-col justify-center relative">
                    
                    {/* Add Button on Hover for empty line slot */}
                    {slotAppointments.length === 0 && (
                      <button
                        onClick={() => onAddAppointmentForHour(hourStr)}
                        className="opacity-60 sm:opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-stone-400 hover:text-indigo-700 font-semibold cursor-pointer py-1.5 min-h-[40px]"
                      >
                        <Plus className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="hidden sm:inline">Aggiungi appuntamento alle {hourStr}</span>
                        <span className="sm:hidden text-[11px]">Aggiungi +</span>
                      </button>
                    )}

                    {/* Render Appointments in this hour slot */}
                    {slotAppointments.length > 0 && (
                      <div className="space-y-2 w-full py-1">
                        {slotAppointments.map((app) => {
                          // Check if app has conflict with any other app
                          const hasOverlap = dayAppointments.some(
                            other => other.id !== app.id && doAppointmentsOverlap(app, other)
                          );

                          return (
                            <div
                              key={app.id}
                              className={`p-3 sm:p-3.5 rounded-2xl border transition-all shadow-xs relative ${
                                app.completed
                                  ? 'bg-stone-100/90 border-stone-200 text-stone-400 opacity-75'
                                  : hasOverlap
                                  ? 'bg-amber-50/90 border-amber-400 text-stone-900 shadow-amber-100'
                                  : 'bg-white border-stone-300 text-stone-900 hover:border-stone-400'
                              }`}
                            >
                              <div className="flex items-start justify-between gap-2.5">
                                
                                {/* Left Checkbox & Event Content */}
                                <div className="flex items-start gap-2.5 sm:gap-3 flex-1 min-w-0">
                                  
                                  {/* Checkbox Touch Target */}
                                  <button
                                    onClick={() => onToggleComplete(app.id)}
                                    className="mt-0.5 min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-400 hover:text-amber-700 transition-colors cursor-pointer shrink-0 active:scale-95"
                                    title={app.completed ? 'Segna come non completato' : 'Segna come completato'}
                                  >
                                    {app.completed ? (
                                      <CheckSquare className="w-5 h-5 text-emerald-600" />
                                    ) : (
                                      <Square className="w-5 h-5" />
                                    )}
                                  </button>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center flex-wrap gap-1.5">
                                      
                                      {/* Time Tag */}
                                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-lg bg-stone-100 text-stone-700 border border-stone-200">
                                        <Clock className="w-3 h-3 text-stone-500" />
                                        {app.startTime} - {app.endTime}
                                      </span>

                                      {/* Conflict Tag */}
                                      {hasOverlap && !app.completed && (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-200 text-amber-900 border border-amber-400">
                                          <AlertTriangle className="w-3 h-3 text-amber-700" />
                                          Sovrapposizione
                                        </span>
                                      )}

                                    </div>

                                    {/* Appointment Title */}
                                    <h4 className={`text-sm sm:text-base font-bold mt-1.5 leading-snug ${app.completed ? 'line-through text-stone-400' : 'text-stone-900'}`}>
                                      {app.title}
                                    </h4>

                                    {/* Subtitle / Details */}
                                    {(app.location || app.instructor || app.description) && (
                                      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-600">
                                        {app.location && (
                                          <span className="flex items-center gap-1">
                                            <MapPin className="w-3.5 h-3.5 text-stone-400" />
                                            {app.location}
                                          </span>
                                        )}
                                        {app.instructor && (
                                          <span className="flex items-center gap-1">
                                            <User className="w-3.5 h-3.5 text-stone-400" />
                                            Docente: {app.instructor}
                                          </span>
                                        )}
                                        {app.description && (
                                          <span className="text-stone-500 line-clamp-1 italic">
                                            "{app.description}"
                                          </span>
                                        )}
                                      </div>
                                    )}

                                  </div>

                                </div>

                                {/* Right Actions */}
                                <div className="flex items-center gap-0.5">
                                  <button
                                    onClick={() => onEditAppointment(app)}
                                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded-xl transition-colors cursor-pointer active:scale-95"
                                    title="Modifica Appuntamento"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => onDeleteAppointment(app.id)}
                                    className="p-2 min-w-[36px] min-h-[36px] flex items-center justify-center text-stone-400 hover:text-red-700 hover:bg-red-50 rounded-xl transition-colors cursor-pointer active:scale-95"
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
            })}

          </div>

          {/* Footer of Paper Sheet */}
          <div className="bg-stone-50 border-t border-stone-300 px-4 sm:px-6 py-3 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <span>Agenda Classica • Formato Giornaliero</span>
            <button
              onClick={() => onAddAppointmentForHour('09:00')}
              className="font-bold text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer min-h-[36px]"
            >
              <Plus className="w-4 h-4" />
              Aggiungi in qualsiasi orario
            </button>
          </div>

        </div>

      </div>
    </div>
  );
};

function getCategoryBadgeStyle(category: string): string {
  switch (category) {
    case 'Corso':
      return 'bg-amber-100 text-amber-900 border border-amber-300';
    case 'Lavoro':
      return 'bg-blue-100 text-blue-900 border border-blue-200';
    case 'Riunione':
      return 'bg-purple-100 text-purple-900 border border-purple-200';
    case 'Personale':
      return 'bg-emerald-100 text-emerald-900 border border-emerald-200';
    case 'Salute':
      return 'bg-rose-100 text-rose-900 border border-rose-200';
    default:
      return 'bg-stone-100 text-stone-800 border border-stone-300';
  }
}
