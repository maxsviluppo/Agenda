import React from 'react';
import { User, X, ShieldCheck, Trash2, Sparkles } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onClearAll?: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({ isOpen, onClose, onClearAll }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/50 backdrop-blur-xs animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-stone-900 rounded-3xl border border-stone-200 dark:border-stone-800 p-6 shadow-2xl max-w-md w-full space-y-6 relative overflow-hidden transform transition-all text-stone-900 dark:text-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100 dark:border-stone-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white flex items-center justify-center shadow-md shadow-orange-500/20">
              <User className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-stone-100 leading-tight">Profilo Utente</h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">Dati Personali & Gestione Dati</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-stone-400 dark:text-stone-500 hover:text-stone-600 dark:hover:text-stone-200 p-2 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors cursor-pointer"
            title="Chiudi"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile Card Info */}
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-200/80 dark:border-stone-700 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300 font-bold flex items-center justify-center text-lg border-2 border-white dark:border-stone-700 shadow-xs">
                U
              </div>
              <div>
                <h4 className="font-bold text-stone-900 dark:text-stone-100 text-base">Utente Calendario</h4>
                <p className="text-xs text-stone-500 dark:text-stone-400 font-medium flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" /> Account Locale Privato
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-orange-50/60 dark:bg-orange-950/40 border border-orange-100 dark:border-orange-900/60 text-orange-900 dark:text-orange-200 text-xs font-medium space-y-2">
            <div className="flex items-center gap-2 font-bold text-orange-950 dark:text-orange-100">
              <Sparkles className="w-4 h-4 text-orange-600 dark:text-orange-400 shrink-0" />
              <span>Dati Personali</span>
            </div>
            <p className="text-stone-600 dark:text-stone-300 leading-relaxed">
              Al momento non sono stati inseriti dati personali. Agenda pulita e pronta per nuovi inserimenti.
            </p>
          </div>

          {/* Reset / Clear Data Action */}
          {onClearAll && (
            <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/40 border border-red-200/80 dark:border-red-900/60 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-red-950 dark:text-red-200 text-xs">Gestione Dati Agenda</h5>
                  <p className="text-[11px] text-stone-500 dark:text-stone-400">Cancella tutti gli appuntamenti e svuota l'agenda.</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClearAll();
                    onClose();
                  }}
                  className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer active:scale-95 shrink-0"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Svuota Tutti</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs sm:text-sm transition-colors shadow-xs cursor-pointer active:scale-95"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

