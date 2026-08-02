import React from 'react';
import { Bell, Clock, X, CheckCircle2 } from 'lucide-react';
import { Appointment } from '../types';

interface NotificationToastProps {
  upcomingApp: Appointment | null;
  onDismiss: () => void;
}

export const NotificationToast: React.FC<NotificationToastProps> = ({
  upcomingApp,
  onDismiss,
}) => {
  if (!upcomingApp) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full bg-stone-900 text-white rounded-2xl p-4 shadow-2xl border border-stone-700 animate-slideUp">
      <div className="flex items-start justify-between gap-3">
        
        <div className="p-2.5 rounded-xl bg-amber-500 text-stone-950 shrink-0 animate-bounce">
          <Bell className="w-5 h-5" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
              🔔 Promemoria Imminente
            </span>
            <span className="text-xs text-stone-400">
              {upcomingApp.startTime}
            </span>
          </div>

          <h4 className="font-serif font-bold text-base text-white mt-1">
            {upcomingApp.title}
          </h4>

          <p className="text-xs text-stone-300 mt-0.5 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-400" />
            <span>Tra poco ({upcomingApp.startTime} - {upcomingApp.endTime})</span>
          </p>

          {upcomingApp.location && (
            <p className="text-xs text-stone-400 mt-1 italic">
              📍 {upcomingApp.location}
            </p>
          )}
        </div>

        <button
          onClick={onDismiss}
          className="p-1 text-stone-400 hover:text-white rounded-lg transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

      </div>
    </div>
  );
};
