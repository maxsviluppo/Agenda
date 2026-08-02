import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  Lock, 
  LogOut, 
  Cloud, 
  CheckCircle2, 
  AlertCircle, 
  LogIn, 
  UserPlus, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

interface AuthProfileDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: FirebaseUser | null;
  onSyncLocalToCloud: () => Promise<void>;
  localCount: number;
}

export const AuthProfileDialog: React.FC<AuthProfileDialogProps> = ({
  isOpen,
  onClose,
  user,
  onSyncLocalToCloud,
  localCount,
}) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsLoading(true);

    try {
      if (isRegistering) {
        const res = await createUserWithEmailAndPassword(auth, email, password);
        if (displayName && res.user) {
          await updateProfile(res.user, { displayName });
        }
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      setEmail('');
      setPassword('');
      setDisplayName('');
    } catch (err: any) {
      console.error('Auth error:', err);
      let msg = 'Errore durante l\'autenticazione. Verifica i dati inseriti.';
      if (err.code === 'auth/invalid-email') msg = 'Indirizzo e-mail non valido.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') msg = 'E-mail o password errati.';
      if (err.code === 'auth/email-already-in-use') msg = 'Questa e-mail è già registrata. Prova ad accedere.';
      if (err.code === 'auth/weak-password') msg = 'La password deve contenere almeno 6 caratteri.';
      setErrorMsg(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (err.code === 'auth/popup-blocked') {
        setErrorMsg('Il popup per l\'accesso Google è stato bloccato. Apri l\'applicazione in una nuova finestra/scheda o usa l\'accesso con Email e Password.');
      } else if (err.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Impossibile accedere con Google. Riprova o usa Email e Password.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Signout error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSyncData = async () => {
    setSyncSuccessMsg(null);
    setIsLoading(true);
    try {
      await onSyncLocalToCloud();
      setSyncSuccessMsg('I tuoi appuntamenti locali sono stati salvati sul Cloud!');
    } catch (err) {
      console.error('Sync error:', err);
      setErrorMsg('Errore durante la sincronizzazione sul Cloud.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 border border-stone-200 dark:border-stone-800 rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh] text-stone-900 dark:text-stone-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 dark:from-stone-900 dark:to-stone-950 text-white px-5 sm:px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white border border-white/30">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white leading-snug">
                {user ? 'Il Tuo Account' : 'Accedi o Registrati'}
              </h2>
              <p className="text-xs text-orange-100 dark:text-stone-400">
                {user ? 'Gestisci profilo e sincronizzazione Cloud' : 'Salva i tuoi appuntamenti online in sicurezza'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-orange-100 dark:text-stone-400 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {syncSuccessMsg && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/80 border border-amber-300 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {user ? (
            /* Logged in View */
            <div className="space-y-5">
              <div className="bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-2xl p-4 flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-amber-500 via-orange-500 to-amber-600 text-white font-bold flex items-center justify-center text-lg shadow-sm shrink-0">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="Avatar" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    (user.displayName || user.email || 'U').charAt(0).toUpperCase()
                  )}
                </div>
                <div className="overflow-hidden">
                  <p className="text-sm font-bold text-stone-900 dark:text-stone-100 truncate">
                    {user.displayName || 'Utente Registrato'}
                  </p>
                  <p className="text-xs text-stone-500 dark:text-stone-400 truncate">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold text-orange-800 dark:text-orange-200 bg-gradient-to-r from-amber-100 to-orange-100 dark:from-amber-950 dark:to-orange-950 px-2 py-0.5 rounded-full border border-orange-300 dark:border-orange-800">
                    <ShieldCheck className="w-3 h-3 text-orange-600 dark:text-orange-400" /> Account Attivo & Cloud Sincronizzato
                  </span>
                </div>
              </div>

              {/* Cloud Sync Status Card */}
              <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-amber-700" />
                    <h4 className="text-xs font-bold text-amber-950">Database Firestore</h4>
                  </div>
                  <span className="text-xs font-semibold text-stone-600">
                    {localCount} appuntamenti
                  </span>
                </div>
                <p className="text-xs text-amber-900/80 leading-relaxed">
                  I tuoi appuntamenti vengono salvati automaticamente nel tuo account personale Cloud Firestore.
                </p>
                {localCount > 0 && (
                  <button
                    onClick={handleSyncData}
                    disabled={isLoading}
                    className="w-full py-2.5 px-3 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    Forza Sincronizzazione Dati Locali
                  </button>
                )}
              </div>

              {/* Sign out */}
              <button
                onClick={handleSignOut}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-stone-100 hover:bg-red-50 text-stone-700 hover:text-red-700 border border-stone-200 hover:border-red-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                Disconnetti Account
              </button>
            </div>
          ) : (
            /* Auth Form (Login / Register) */
            <div className="space-y-4">
              <form onSubmit={handleEmailAuth} className="space-y-3">
                {isRegistering && (
                  <div>
                    <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Nome Completo</label>
                    <div className="relative">
                      <User className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="Mario Rossi"
                        className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">E-mail</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nome@esempio.it"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-2.5" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-3 py-2 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 text-stone-900 dark:text-stone-100 rounded-xl text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Crea Account Gratuitamente
                    </>
                  ) : (
                    <>
                      <LogIn className="w-4 h-4" />
                      Accedi all'Account
                    </>
                  )}
                </button>
              </form>

              <div className="relative flex py-1 items-center">
                <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
                <span className="shrink mx-3 text-[11px] text-stone-400 font-medium">oppure</span>
                <div className="flex-grow border-t border-stone-200 dark:border-stone-700"></div>
              </div>

              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isLoading}
                className="w-full py-2.5 px-4 bg-white dark:bg-stone-800 hover:bg-stone-50 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-100 border border-stone-300 dark:border-stone-700 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                Accedi con Google
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold underline cursor-pointer"
                >
                  {isRegistering
                    ? 'Hai già un account? Accedi qui'
                    : 'Non hai un account? Registrati ora'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
