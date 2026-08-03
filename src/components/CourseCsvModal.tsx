import React, { useState } from 'react';
import { Upload, X, FileSpreadsheet, Check, AlertTriangle, BookOpen, Clock, Calendar as CalendarIcon, FileText } from 'lucide-react';
import { parseCourseScheduleCSV, generateSampleCourseCSV } from '../utils/csvParser';
import { Appointment } from '../types';
import { doAppointmentsOverlap } from '../utils/conflictDetector';

interface CourseCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportAppointments: (newApps: Partial<Appointment>[]) => void;
  existingAppointments: Appointment[];
}

export const CourseCsvModal: React.FC<CourseCsvModalProps> = ({
  isOpen,
  onClose,
  onImportAppointments,
  existingAppointments,
}) => {
  if (!isOpen) return null;

  const [csvContent, setCsvContent] = useState('');
  const [parsedPreview, setParsedPreview] = useState<Partial<Appointment>[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isAnalyzed, setIsAnalyzed] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setCsvContent(text);
      processCSVText(text);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setCsvContent(val);
    if (val.trim()) {
      processCSVText(val);
    } else {
      setParsedPreview([]);
      setIsAnalyzed(false);
    }
  };

  const handleLoadSampleCSV = () => {
    const sample = generateSampleCourseCSV();
    setCsvContent(sample);
    processCSVText(sample);
  };

  const processCSVText = (text: string) => {
    const result = parseCourseScheduleCSV(text);
    setParsedPreview(result.appointments);
    setParseErrors(result.errors);
    setIsAnalyzed(true);
  };

  const handleConfirmImport = () => {
    if (parsedPreview.length === 0) return;
    onImportAppointments(parsedPreview);
    onClose();
  };

  // Check potential conflicts in preview
  const potentialConflictsCount = parsedPreview.filter(pApp => {
    if (!pApp.date || !pApp.startTime || !pApp.endTime) return false;
    const dummy: Appointment = {
      id: 'preview',
      title: pApp.title || '',
      date: pApp.date,
      startTime: pApp.startTime,
      endTime: pApp.endTime,
      category: 'Corso',
      reminderMinutes: 15,
      source: 'csv_course',
      createdAt: ''
    };
    return existingAppointments.some(ex => doAppointmentsOverlap(dummy, ex));
  }).length;

  return (
    <div id="course-csv-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-300 dark:border-stone-800 shadow-2xl w-full max-w-2xl max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-scaleIn text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 border-b border-stone-200 dark:border-stone-800 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-orange-500 text-white shadow-md shadow-orange-500/20">
              <FileSpreadsheet className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100 leading-tight">
                Importa Lezioni di Docenza & Corsi
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Incolla il Report Corsi o carica un file CSV / TXT
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

        {/* Content Body */}
        <div className="p-5 sm:p-6 space-y-4 text-sm">
          
          {/* Quick Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-stone-50 border-2 border-dashed border-stone-300 hover:border-purple-500 rounded-2xl cursor-pointer transition-all hover:bg-purple-50/40 text-stone-700 active:scale-95 min-h-[44px]">
              <Upload className="w-4 h-4 text-purple-600" />
              <span className="font-bold text-xs">Carica File (.csv, .txt)</span>
              <input type="file" accept=".csv, .txt" onChange={handleFileUpload} className="hidden" />
            </label>

            <button
              type="button"
              onClick={handleLoadSampleCSV}
              className="px-4 py-2.5 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-purple-900 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 min-h-[44px]"
              title="Carica un report di esempio con lezioni di docenza"
            >
              <BookOpen className="w-4 h-4 text-purple-700" />
              <span>Esempio Report Docenza</span>
            </button>
          </div>

          {/* Textarea for pasting report */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-purple-600" />
              <span>Incolla qui il testo del Report Corsi:</span>
            </label>
            <textarea
              value={csvContent}
              onChange={handleTextChange}
              placeholder="Incolla il report corsi (es. 📅 REPORT CORSI ... 🔹 gio 03/09 | 12:30-15:30 App AI ED 2 (Ing Palmese))"
              rows={5}
              className="w-full p-3 text-xs font-mono bg-stone-50 border border-stone-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500/30 focus:border-purple-500 text-stone-800 transition-all placeholder:text-stone-400"
            />
          </div>

          {/* Analysis Summary */}
          {isAnalyzed && (
            <div className="space-y-3 pt-1">
              <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-100 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-stone-800">
                  <span className="font-bold text-purple-900 text-sm">{parsedPreview.length}</span> lezioni di docenza rilevate.
                </div>

                {potentialConflictsCount > 0 ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-purple-100 text-purple-900 border border-purple-300">
                    <Check className="w-3.5 h-3.5 text-purple-700" />
                    {potentialConflictsCount} sovrapposizioni (sostituzione automatica: 1 sola lezione)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300">
                    <Check className="w-3.5 h-3.5 text-emerald-700" />
                    Nessun conflitto
                  </span>
                )}
              </div>

              {parseErrors.length > 0 && (
                <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-800 space-y-1 font-medium">
                  <span className="font-bold">Note di Formattazione:</span>
                  {parseErrors.map((err, i) => (
                    <p key={i}>• {err}</p>
                  ))}
                </div>
              )}

              {/* Preview List */}
              <div className="border border-stone-200 dark:border-stone-800 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-stone-100 dark:bg-stone-800 px-4 py-2.5 border-b border-stone-200 dark:border-stone-700 text-xs font-bold text-stone-800 dark:text-stone-200 flex justify-between items-center">
                  <span>Anteprima Lezioni ({parsedPreview.length})</span>
                  <span className="text-[11px] font-medium text-stone-500 dark:text-stone-400">Pronto per l'agenda</span>
                </div>

                <div className="divide-y divide-stone-100 dark:divide-stone-800 max-h-52 overflow-y-auto bg-white dark:bg-stone-900 text-xs">
                  {parsedPreview.map((item, idx) => (
                    <div key={idx} className="p-3 flex items-start justify-between gap-3 hover:bg-purple-50/30 dark:hover:bg-purple-900/20 transition-colors">
                      <div className="space-y-1">
                        <div className="font-bold text-stone-900 dark:text-stone-100 text-sm">{item.title}</div>
                        <div className="text-stone-600 dark:text-stone-300 font-medium flex flex-wrap items-center gap-3 text-xs">
                          <span className="flex items-center gap-1 text-purple-900 dark:text-purple-300 font-bold">
                            <CalendarIcon className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" /> {item.date}
                          </span>
                          <span className="flex items-center gap-1 text-stone-700 dark:text-stone-300 font-bold">
                            <Clock className="w-3.5 h-3.5 text-stone-400 dark:text-stone-500" /> {item.startTime} - {item.endTime}
                          </span>
                        </div>
                        {item.instructor && (
                          <div className="text-stone-500 dark:text-stone-400 text-[11px]">Docente: <strong className="text-stone-700 dark:text-stone-200">{item.instructor}</strong></div>
                        )}
                      </div>

                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950/80 text-purple-900 dark:text-purple-200 border border-purple-200 dark:border-purple-800 shrink-0">
                        Corso / Docenza
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer min-h-[42px] active:scale-95"
          >
            Annulla
          </button>

          <button
            type="button"
            onClick={handleConfirmImport}
            disabled={parsedPreview.length === 0}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[42px] active:scale-95 ${
              parsedPreview.length > 0 
                ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-md shadow-purple-500/20' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Importa {parsedPreview.length} Lezioni</span>
          </button>
        </div>

      </div>
    </div>
  );
};

