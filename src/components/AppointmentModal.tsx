import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar as CalendarIcon, Tag, MapPin, User, Bell, Mic, AlertTriangle, RefreshCw } from 'lucide-react';
import { Appointment, AppointmentCategory } from '../types';
import { doAppointmentsOverlap } from '../utils/conflictDetector';

interface AppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (appData: Partial<Appointment>) => void;
  initialAppointment?: Appointment | null;
  defaultDate: string;
  defaultHour?: string;
  existingAppointments: Appointment[];
  onStartVoiceDictation?: () => void;
  isGoogleConnected: boolean;
}

export const AppointmentModal: React.FC<AppointmentModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialAppointment,
  defaultDate,
  defaultHour = '09:00',
  existingAppointments,
  onStartVoiceDictation,
  isGoogleConnected,
}) => {
  if (!isOpen) return null;

  const [title, setTitle] = useState(initialAppointment?.title || '');
  const [date, setDate] = useState(initialAppointment?.date || defaultDate);
  const [startTime, setStartTime] = useState(initialAppointment?.startTime || defaultHour);
  
  // Calculate default end time (+1 hour)
  const defaultEndTime = () => {
    const [h, m] = defaultHour.split(':').map(Number);
    const endH = (h + 1) % 24;
    return `${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`;
  };

  const [endTime, setEndTime] = useState(initialAppointment?.endTime || defaultEndTime());
  const [category, setCategory] = useState<AppointmentCategory>(initialAppointment?.category || 'Lavoro');
  const [reminderMinutes, setReminderMinutes] = useState<number>(initialAppointment?.reminderMinutes ?? 15);
  const [location, setLocation] = useState(initialAppointment?.location || '');
  const [instructor, setInstructor] = useState(initialAppointment?.instructor || '');
  const [description, setDescription] = useState(initialAppointment?.description || '');
  const [syncGoogle, setSyncGoogle] = useState(isGoogleConnected);

  // Sync state if initialAppointment changes
  useEffect(() => {
    if (initialAppointment) {
      setTitle(initialAppointment.title);
      setDate(initialAppointment.date);
      setStartTime(initialAppointment.startTime);
      setEndTime(initialAppointment.endTime);
      setCategory(initialAppointment.category);
      setReminderMinutes(initialAppointment.reminderMinutes);
      setLocation(initialAppointment.location || '');
      setInstructor(initialAppointment.instructor || '');
      setDescription(initialAppointment.description || '');
    }
  }, [initialAppointment]);

  // Live overlap calculation for the form's current values
  const dummyCurrent: Appointment = {
    id: initialAppointment?.id || 'temp_check',
    title,
    date,
    startTime,
    endTime,
    category,
    reminderMinutes,
    source: 'local',
    createdAt: new Date().toISOString()
  };

  const collidingApp = existingAppointments.find(
    a => a.id !== initialAppointment?.id && doAppointmentsOverlap(dummyCurrent, a)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = title.trim() || category || 'Nuovo Appuntamento';

    onSave({
      id: initialAppointment?.id,
      title: finalTitle,
      date,
      startTime,
      endTime,
      category,
      reminderMinutes,
      location: location.trim() || undefined,
      instructor: instructor.trim() || undefined,
      description: description.trim() || undefined,
      source: initialAppointment?.source || 'local'
    });

    onClose();
  };

  const categories: AppointmentCategory[] = ['Lavoro', 'Corso', 'Riunione', 'Personale', 'Salute', 'Altro'];

  return (
    <div id="appointment-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-950/70 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-t-[32px] sm:rounded-3xl border border-stone-200 dark:border-stone-800 shadow-2xl w-full max-w-lg max-h-[92vh] sm:max-h-[88vh] flex flex-col overflow-hidden animate-scaleIn text-stone-900 dark:text-stone-100">
        
        {/* Header with Gradient Accent */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between shadow-md shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-white/20 border border-white/30 flex items-center justify-center text-white shadow-inner">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg leading-tight text-white">
                {initialAppointment ? 'Modifica Appuntamento' : 'Nuovo Appuntamento'}
              </h3>
              <p className="text-[11px] text-orange-100 dark:text-stone-300 font-medium">
                Inserisci dati, orario, categoria e note
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 min-w-[40px] min-h-[40px] flex items-center justify-center text-orange-100 dark:text-stone-300 hover:text-white hover:bg-white/20 rounded-2xl transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body - Scrollable Area */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 text-sm pb-8 sm:pb-6">
          
          {/* Overlap Alert Warning Banner if colliding */}
          {collidingApp && (
            <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 flex items-start gap-2.5 shadow-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-bold">⚠️ Sovrapposizione oraria:</span> Si sovrappone con "{collidingApp.title}" ({collidingApp.startTime} - {collidingApp.endTime}).
              </div>
            </div>
          )}

          {/* Title Input */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Tag className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                <span>Titolo o Oggetto</span>
              </span>
              <span className="text-[11px] text-stone-400 font-normal">Obbligatorio</span>
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Lezione di Matematica, Visita Medica, Riunione..."
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-xs h-11"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-stone-400" />
              <span>Descrizione</span>
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Inserisci la descrizione..."
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm shadow-xs"
            />
          </div>

          {/* Live Preview Element Badge right under Title */}
          <div className="p-3 rounded-2xl bg-stone-100/80 dark:bg-stone-800/80 border border-stone-200 dark:border-stone-700 flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-stone-600 dark:text-stone-300">Anteprima Etichetta Orario:</span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-stone-700 border border-stone-300 dark:border-stone-600 text-stone-900 dark:text-stone-100 font-bold text-xs shadow-xs shrink-0">
              <Clock className="w-3.5 h-3.5 text-stone-500 dark:text-stone-400" />
              <span>{startTime || '09:00'} - {endTime || '10:00'}</span>
            </span>
          </div>

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5">
              Categoria
            </label>
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    category === cat
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-stone-200 dark:border-stone-700'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Date & Time Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div className="min-w-0">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5 truncate">
                <CalendarIcon className="w-4 h-4 text-orange-500 dark:text-orange-400 shrink-0" />
                <span className="truncate">Data</span>
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full pl-2.5 pr-1 sm:px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-xs sm:text-sm shadow-xs h-11"
              />
            </div>

            <div className="min-w-0">
              <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5 truncate">
                <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                <span className="truncate">Ora Inizio & Fine</span>
              </label>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2.5 min-w-0">
                <input
                  type="time"
                  required
                  value={startTime}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartTime(newStart);
                    if (newStart) {
                      const [h, m] = newStart.split(':').map(Number);
                      const endH = (h + 1) % 24;
                      setEndTime(`${endH.toString().padStart(2, '0')}:${(m || 0).toString().padStart(2, '0')}`);
                    }
                  }}
                  className="w-full pl-1 pr-0.5 sm:px-2.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl sm:rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[11px] sm:text-sm shadow-xs h-11 text-center min-w-0"
                />
                <input
                  type="time"
                  required
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full pl-1 pr-0.5 sm:px-2.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-xl sm:rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-[11px] sm:text-sm shadow-xs h-11 text-center min-w-0"
                />
              </div>
            </div>
          </div>

          {/* Notification Reminder */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1.5 flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-amber-500" />
              <span>Promemoria Notifica</span>
            </label>
            <select
              value={reminderMinutes}
              onChange={(e) => setReminderMinutes(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer font-medium text-sm shadow-xs min-h-[42px]"
            >
              <option value={0} className="dark:bg-stone-800">Al momento dell'evento</option>
              <option value={5} className="dark:bg-stone-800">5 minuti prima</option>
              <option value={15} className="dark:bg-stone-800">15 minuti prima</option>
              <option value={30} className="dark:bg-stone-800">30 minuti prima</option>
              <option value={60} className="dark:bg-stone-800">1 ora prima</option>
              <option value={1440} className="dark:bg-stone-800">1 giorno prima</option>
            </select>
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-bold text-stone-800 dark:text-stone-200 mb-1 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-orange-500" />
              <span>Luogo / Aula</span>
            </label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Es. Aula 12, Sede centrale, Online..."
              className="w-full px-3.5 py-2.5 bg-stone-50 dark:bg-stone-800 border border-stone-300 dark:border-stone-700 rounded-2xl text-stone-900 dark:text-stone-100 placeholder-stone-400 dark:placeholder-stone-500 focus:outline-none focus:ring-2 focus:ring-orange-500 font-medium text-sm shadow-xs"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-3 rounded-2xl text-xs font-bold text-stone-600 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer min-h-[46px] active:scale-95"
            >
              Annulla
            </button>
            <button
              type="submit"
              className="btn-gradient-primary px-7 py-3 rounded-2xl text-xs font-bold shadow-lg shadow-orange-200 dark:shadow-none cursor-pointer min-h-[46px] active:scale-95 text-white"
            >
              {initialAppointment ? 'Salva Modifiche' : 'Aggiungi Appuntamento'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
