import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Check, X, Sparkles, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { parseItalianSpeech, ParsedVoiceData } from '../utils/voiceParser';
import { Appointment } from '../types';

interface VoiceInputDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (appData: Partial<Appointment>) => void;
}

export const VoiceInputDialog: React.FC<VoiceInputDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedVoiceData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

  const stopListening = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.abort();
      } catch (e) {}
      try {
        recognitionRef.current.stop();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setIsListening(false);
  };

  const handleClose = () => {
    stopListening();
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      stopListening();
    }
    return () => {
      stopListening();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleListening = () => {
    setErrorMessage(null);

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMessage('La sintesi vocale non è supportata da questo browser. Puoi digitare la frase qui sotto.');
      return;
    }

    if (isListening) {
      stopListening();
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'it-IT';

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMessage(null);
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
        if (currentTranscript.trim()) {
          const parsed = parseItalianSpeech(currentTranscript);
          setParsedData(parsed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition status/error:', event.error);
        stopListening();
        if (event.error === 'not-allowed') {
          setErrorMessage('Accesso al microfono non consentito o bloccato nel browser. È comunque possibile digitare la frase manualmente.');
        } else if (event.error === 'no-speech') {
          setErrorMessage('Nessun audio rilevato. Riprova a parlare o digita il testo.');
        } else {
          setErrorMessage('Impossibile avviare il microfono. Digita il testo nella casella sottostante.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Could not start speech recognition:', err);
      stopListening();
      setErrorMessage('Accesso al microfono non disponibile in questa finestra. Digita il testo sottostante.');
    }
  };

  const handleManualTextChange = (text: string) => {
    setTranscript(text);
    if (text.trim()) {
      const parsed = parseItalianSpeech(text);
      setParsedData(parsed);
    } else {
      setParsedData(null);
    }
  };

  const handleSave = () => {
    if (!parsedData) return;
    stopListening();
    onConfirm({
      title: parsedData.title,
      date: parsedData.date,
      startTime: parsedData.startTime,
      endTime: parsedData.endTime,
      category: parsedData.category,
      reminderMinutes: 15,
      source: 'local',
      description: `Inserito tramite vocale: "${parsedData.rawTranscript}"`,
    });
    onClose();
  };

  return (
    <div id="voice-input-modal" className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-stone-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white dark:bg-stone-900 rounded-t-3xl sm:rounded-3xl border border-stone-300 dark:border-stone-800 shadow-2xl w-full max-w-md max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-scaleIn text-stone-900 dark:text-stone-100">
        
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-stone-100 via-stone-50 to-stone-100 dark:from-stone-900 dark:via-stone-900 dark:to-stone-950 border-b border-stone-200 dark:border-stone-800 px-5 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl btn-gradient-voice">
              <Mic className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-900 dark:text-stone-100">
                Inserimento Vocale
              </h3>
              <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
                Detta il tuo appuntamento in italiano naturale
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 min-w-[38px] min-h-[38px] flex items-center justify-center text-stone-400 dark:text-stone-500 hover:text-stone-700 dark:hover:text-stone-200 hover:bg-stone-200/80 dark:hover:bg-stone-800 rounded-xl transition-colors cursor-pointer active:scale-95"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Microphone Graphic & Recording Status */}
        <div className="p-5 sm:p-6 text-center space-y-4">
          
          <div className="relative inline-block">
            <button
              type="button"
              onClick={toggleListening}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
                isListening 
                  ? 'btn-gradient-voice ring-8 ring-amber-200 animate-pulse' 
                  : 'bg-stone-100 hover:bg-amber-100 text-stone-600 border border-stone-300 shadow-sm'
              }`}
              title={isListening ? 'Clicca per fermare la registrazione' : 'Clicca per avviare il microfono'}
            >
              {isListening ? <Mic className="w-10 h-10 text-white animate-bounce" /> : <MicOff className="w-10 h-10 text-stone-500" />}
            </button>
          </div>

          <p className="text-xs font-bold text-stone-700">
            {isListening ? '🎙️ In ascolto... Parla adesso' : 'Clicca sul microfono per iniziare o digita sotto.'}
          </p>

          <p className="text-[11px] text-stone-500 italic">
            Esempio: "Riunione di lavoro domani alle 14:30 fino alle 16:00 molto importante"
          </p>

          {errorMessage && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium">
              {errorMessage}
            </div>
          )}

          {/* Transcript Box */}
          <div className="text-left">
            <label className="block text-xs font-bold text-stone-700 mb-1">
              Testo Riconosciuto:
            </label>
            <textarea
              rows={2}
              value={transcript}
              onChange={(e) => handleManualTextChange(e.target.value)}
              placeholder="Inizia a parlare o digita la frase qui..."
              className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {/* Parsed Fields Preview */}
          {parsedData && (
            <div className="p-3.5 bg-amber-50/90 rounded-2xl border border-amber-300 text-left space-y-2 animate-fadeIn">
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-950 border-b border-amber-200/80 pb-1">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <span>Dati Estratti Automaticamente:</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs text-stone-800">
                <div>
                  <span className="text-stone-500 block">Titolo:</span>
                  <span className="font-bold truncate block" title={parsedData.title}>{parsedData.title}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">Categoria:</span>
                  <span className="font-bold">{parsedData.category}</span>
                </div>
                <div>
                  <label className="text-stone-500 block">Data Riconosciuta:</label>
                  <div className="flex items-center gap-1 font-bold mt-0.5">
                    <CalendarIcon className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    <input
                      type="date"
                      value={parsedData.date}
                      onChange={(e) => setParsedData({ ...parsedData, date: e.target.value })}
                      className="bg-amber-100/80 border border-amber-300 rounded px-1 py-0.5 text-xs font-bold text-amber-950 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                </div>
                <div>
                  <span className="text-stone-500 block">Orario:</span>
                  <span className="font-bold flex items-center gap-1 mt-1">
                    <Clock className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                    {parsedData.startTime} - {parsedData.endTime}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="bg-stone-50 border-t border-stone-200 px-5 sm:px-6 py-3.5 flex items-center justify-between gap-3">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 rounded-xl text-xs font-bold text-stone-600 hover:bg-stone-200 transition-colors cursor-pointer min-h-[42px] active:scale-95"
          >
            Annulla
          </button>
          
          <button
            onClick={handleSave}
            disabled={!parsedData}
            className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer min-h-[42px] active:scale-95 ${
              parsedData 
                ? 'btn-gradient-voice shadow-md' 
                : 'bg-stone-200 text-stone-400 cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>Conferma e Inserisci</span>
          </button>
        </div>

      </div>
    </div>
  );
};
