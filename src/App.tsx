/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { CleanDailyView } from './components/CleanDailyView';
import { MonthCalendarView } from './components/MonthCalendarView';
import { MonthCalendarModal } from './components/MonthCalendarModal';
import { AppointmentModal } from './components/AppointmentModal';
import { VoiceInputDialog } from './components/VoiceInputDialog';
import { CourseCsvModal } from './components/CourseCsvModal';
import { SearchAndFilterBar } from './components/SearchAndFilterBar';
import { NotificationToast } from './components/NotificationToast';
import { MobileBottomNav } from './components/MobileBottomNav';
import { ConfirmModal } from './components/ConfirmModal';
import { AuthProfileDialog } from './components/AuthProfileDialog';

import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  subscribeToAppointments, 
  saveAppointmentToCloud, 
  deleteAppointmentFromCloud, 
  syncBatchAppointmentsToCloud 
} from './lib/firestoreService';

import { Appointment, FilterOptions, GoogleCalendarState } from './types';
import { getInitialAppointments } from './data/initialAppointments';
import { detectAllConflicts, mergeAndReplaceOverlaps } from './utils/conflictDetector';
import { getTodayDateString } from './utils/dateUtils';
import { 
  getStoredGoogleState, 
  saveGoogleToken, 
  clearGoogleToken, 
  fetchGoogleCalendarEvents 
} from './services/googleCalendar';

const LOCAL_STORAGE_KEY = 'agenda_classica_appointments_v1';

export default function App() {
  // 0. Dark Mode toggle with persistent localStorage
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('theme');
    if (saved !== null) {
      return saved === 'dark';
    }
    return true; // default dark
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => !prev);
  };

  // 0. Firebase User Authentication State
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  // 1. Appointments State
  const [appointments, setAppointments] = useState<Appointment[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error('Failed to load localStorage', e);
    }
    return [];
  });

  // Helper to update state AND sync directly to localStorage synchronously
  const saveAppointmentsState = (
    newValOrFn: Appointment[] | ((prev: Appointment[]) => Appointment[])
  ) => {
    setAppointments(prev => {
      const nextList = typeof newValOrFn === 'function' ? newValOrFn(prev) : newValOrFn;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(nextList));
      } catch (e) {
        console.error('Failed to save to localStorage', e);
      }
      return nextList;
    });
  };

  // Real-time Firestore sync when user is logged in
  useEffect(() => {
    if (!user) return;

    const unsubscribe = subscribeToAppointments(user.uid, (cloudApps) => {
      saveAppointmentsState(prevLocal => {
        const mergedMap = new Map<string, Appointment>();

        // 1. Load existing local appointments
        prevLocal.forEach(app => {
          if (app.id) mergedMap.set(app.id, app);
        });

        // 2. Merge cloud appointments (cloud items take precedence for existing IDs)
        cloudApps.forEach(app => {
          if (app.id) mergedMap.set(app.id, app);
        });

        const mergedList = Array.from(mergedMap.values());

        // 3. Auto-sync local items that are missing from cloud to Firestore
        const cloudIds = new Set(cloudApps.map(a => a.id));
        const missingInCloud = prevLocal.filter(a => a.id && !cloudIds.has(a.id));

        if (missingInCloud.length > 0) {
          syncBatchAppointmentsToCloud(user.uid, missingInCloud).catch(err => {
            console.error('Failed to auto-sync missing local items to cloud:', err);
          });
        }

        return mergedList;
      });
    });

    return () => unsubscribe();
  }, [user]);

  // Save appointments to localStorage on change as safety fallback
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appointments));
    } catch (e) {
      console.error('Failed to save appointments to localStorage', e);
    }
  }, [appointments]);

  // 2. Active View & Date State (YYYY-MM-DD)
  const [activeView, setActiveView] = useState<'month' | 'daily'>('month'); // Default is 30 Giorni
  const [viewDirection, setViewDirection] = useState<number>(1); // 1 = slide left (to daily), -1 = slide right (to month)
  const [currentDate, setCurrentDate] = useState<string>(getTodayDateString());

  const handleViewChange = (newView: 'month' | 'daily') => {
    if (newView !== activeView) {
      setViewDirection(newView === 'daily' ? 1 : -1);
      setActiveView(newView);
    }
  };

  // 3. Modals & UI Controls State
  const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
  const [isVoiceModalOpen, setIsVoiceModalOpen] = useState(false);
  const [isCsvModalOpen, setIsCsvModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [slotDefaultHour, setSlotDefaultHour] = useState<string>('09:00');
  const [deletingAppointmentId, setDeletingAppointmentId] = useState<string | null>(null);

  // 4. Search & Filter State
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    category: 'Tutte',
    timeRange: 'all',
    source: 'all',
  });

  // 5. Google Calendar State
  const [googleState, setGoogleState] = useState<GoogleCalendarState>(getStoredGoogleState());

  // 6. Notifications State
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(() => {
    return typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted';
  });
  const [upcomingNotificationApp, setUpcomingNotificationApp] = useState<Appointment | null>(null);

  // Detect Overlap Conflicts
  const allConflicts = useMemo(() => {
    return detectAllConflicts(appointments);
  }, [appointments]);

  // Request Notification Permissions
  const handleRequestNotifications = async () => {
    if (!('Notification' in window)) {
      alert('Il tuo browser non supporta le Notifiche Push.');
      return;
    }
    if (Notification.permission === 'granted') {
      setNotificationsEnabled(true);
      alert('Notifiche Push già attivate per questo browser!');
    } else {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setNotificationsEnabled(true);
        // Play welcome audio chime test
        playNotificationChime();
      } else {
        setNotificationsEnabled(false);
        alert('Permesso notifiche rifiutato. Puoi riattivarlo dalle impostazioni del browser.');
      }
    }
  };

  // Sound Chime Generator using Web Audio API
  const playNotificationChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.3); // A5

      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } catch (e) {
      console.error('Audio chime error:', e);
    }
  };

  // Periodic Reminder Notification Checker (Runs every 10 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      const todayStr = getTodayDateString();
      const now = new Date();
      const nowMins = now.getHours() * 60 + now.getMinutes();

      appointments.forEach(app => {
        if (app.date === todayStr && !app.completed && !app.notified) {
          const [startH, startM] = app.startTime.split(':').map(Number);
          const appStartMins = startH * 60 + startM;
          const diffMins = appStartMins - nowMins;

          // Trigger notification if event is within reminder timeframe (e.g. 0 to reminderMinutes)
          if (diffMins >= 0 && diffMins <= (app.reminderMinutes || 15)) {
            // Mark as notified to avoid repeating
            setAppointments(prev => prev.map(a => a.id === app.id ? { ...a, notified: true } : a));
            
            setUpcomingNotificationApp(app);
            playNotificationChime();

            // Native Push Notification
            if (notificationsEnabled && typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
              new Notification(`🔔 Promemoria: ${app.title}`, {
                body: `Inizio alle ${app.startTime} (${app.category})`,
                icon: '/icon.png',
              });
            }
          }
        }
      });
    }, 10000);

    return () => clearInterval(interval);
  }, [appointments, notificationsEnabled]);

  // Google Sync Handler
  const handleSyncGoogle = async () => {
    if (!googleState.accessToken) {
      // Simulate Google OAuth flow or Prompt for Token / Demo Auth
      const simulatedToken = prompt(
        'Sincronizzazione Google Calendar:\nPer collegare il tuo account Google e scaricare gli appuntamenti in tempo reale, inserisci un Token OAuth oppure clicca OK per attivare la modalità dimostrativa integrata.',
        'demo_google_oauth_token_' + Date.now()
      );

      if (simulatedToken) {
        saveGoogleToken(simulatedToken);
        setGoogleState({
          isConnected: true,
          accessToken: simulatedToken,
          lastSync: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }),
        });

        // Add sample Google Calendar Event to demonstrate overlap detection with Google Calendar
        const todayStr = getTodayDateString();
        const googleApp: Appointment = {
          id: 'gcal_imported_sample_1',
          title: 'Meeting Google Calendar (Assegnato)',
          description: 'Sincronizzato da Google. Verifica sovrapposizioni orarie.',
          date: todayStr,
          startTime: '11:00',
          endTime: '12:00',
          category: 'Lavoro',
          reminderMinutes: 15,
          source: 'google',
          location: 'Google Meet',
          completed: false,
          createdAt: new Date().toISOString()
        };

        setAppointments(prev => {
          if (prev.some(a => a.id === googleApp.id)) return prev;
          return [googleApp, ...prev];
        });

        alert('✅ Connessione con Google Calendar completata! Eventi sincronizzati con verifica sovrapposizioni.');
      }
    } else {
      // Refresh sync
      saveGoogleToken(googleState.accessToken);
      setGoogleState(prev => ({ ...prev, lastSync: new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }) }));
      alert(`✅ Sincronizzazione Google Calendar aggiornata alle ${new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`);
    }
  };

  // CRUD Operations for Appointments
  const handleSaveAppointment = async (appData: Partial<Appointment>) => {
    let savedApp: Appointment | null = null;

    if (appData.id) {
      // Edit existing
      saveAppointmentsState(prev =>
        prev.map(a => {
          if (a.id === appData.id) {
            savedApp = { ...a, ...appData } as Appointment;
            return savedApp;
          }
          return a;
        })
      );
    } else {
      // Add new - safely merge with existing appointments
      const newApp: Appointment = {
        id: `app_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        title: appData.title || 'Nuovo Appuntamento',
        description: appData.description,
        date: appData.date || currentDate,
        startTime: appData.startTime || '09:00',
        endTime: appData.endTime || '10:00',
        category: appData.category || 'Lavoro',
        reminderMinutes: appData.reminderMinutes ?? 15,
        source: appData.source || 'local',
        location: appData.location,
        instructor: appData.instructor,
        completed: false,
        createdAt: new Date().toISOString()
      };
      savedApp = newApp;

      saveAppointmentsState(prev => {
        const { updatedAppointments } = mergeAndReplaceOverlaps(prev, [newApp]);
        return updatedAppointments;
      });
    }

    setEditingAppointment(null);

    if (user && savedApp) {
      try {
        await saveAppointmentToCloud(user.uid, savedApp);
      } catch (err) {
        console.error('Failed to save to cloud:', err);
      }
    }
  };

  const handleToggleComplete = async (id: string) => {
    let updatedApp: Appointment | null = null;
    saveAppointmentsState(prev =>
      prev.map(a => {
        if (a.id === id) {
          updatedApp = { ...a, completed: !a.completed };
          return updatedApp;
        }
        return a;
      })
    );

    if (user && updatedApp) {
      try {
        await saveAppointmentToCloud(user.uid, updatedApp);
      } catch (err) {
        console.error('Failed to update completion status in cloud:', err);
      }
    }
  };

  const handleDeleteAppointment = (id: string) => {
    setDeletingAppointmentId(id);
  };

  const confirmDeleteAppointment = async () => {
    if (deletingAppointmentId) {
      const idToDelete = deletingAppointmentId;
      saveAppointmentsState(prev => prev.filter(a => a.id !== idToDelete));
      setDeletingAppointmentId(null);

      if (user) {
        try {
          await deleteAppointmentFromCloud(user.uid, idToDelete);
        } catch (err) {
          console.error('Failed to delete from cloud:', err);
        }
      }
    }
  };

  const handleAddCourseCSV = async (newApps: Partial<Appointment>[]) => {
    const created: Appointment[] = newApps.map((a, i) => ({
      id: `csv_course_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 4)}`,
      title: a.title || 'Lezione Corso',
      description: a.description || '',
      date: a.date || currentDate,
      startTime: a.startTime || '09:00',
      endTime: a.endTime || '10:00',
      category: 'Corso',
      reminderMinutes: 15,
      source: 'csv_course',
      instructor: a.instructor || '',
      location: a.location || '',
      completed: false,
      createdAt: new Date().toISOString()
    }));

    saveAppointmentsState(prev => {
      const { updatedAppointments } = mergeAndReplaceOverlaps(prev, created);
      return updatedAppointments;
    });

    if (user && created.length > 0) {
      try {
        await syncBatchAppointmentsToCloud(user.uid, created);
      } catch (err) {
        console.error('Failed to batch save CSV appointments to cloud:', err);
      }
    }
  };

  const handleSyncLocalToCloud = async () => {
    if (user && appointments.length > 0) {
      await syncBatchAppointmentsToCloud(user.uid, appointments);
    }
  };

  // Open Add Modal for specific hour
  const handleOpenAddForHour = (hourStr: string) => {
    setEditingAppointment(null);
    setSlotDefaultHour(hourStr);
    setIsAddModalOpen(true);
  };

  // Filter Logic
  const filteredAppointments = useMemo(() => {
    return appointments.filter(app => {
      // 1. Search Query
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matchTitle = app.title.toLowerCase().includes(query);
        const matchDesc = app.description?.toLowerCase().includes(query) || false;
        const matchLoc = app.location?.toLowerCase().includes(query) || false;
        const matchInst = app.instructor?.toLowerCase().includes(query) || false;
        if (!matchTitle && !matchDesc && !matchLoc && !matchInst) return false;
      }

      // 2. Category
      if (filters.category !== 'Tutte' && app.category !== filters.category) {
        return false;
      }

      // 3. Time Range
      const todayStr = getTodayDateString();
      if (filters.timeRange === 'today' && app.date !== todayStr) {
        return false;
      }
      if (filters.timeRange === 'upcoming' && app.date < todayStr) {
        return false;
      }
      if (filters.timeRange === 'past' && app.date >= todayStr) {
        return false;
      }
      if (filters.timeRange === 'conflicts') {
        const isConflicting = allConflicts.some(
          c => c.event1.id === app.id || c.event2.id === app.id
        );
        if (!isConflicting) return false;
      }

      return true;
    });
  }, [appointments, filters, allConflicts]);

  return (
    <div className="min-h-screen bg-[#fffcfa] dark:bg-[#05050a] text-stone-900 dark:text-stone-100 font-sans antialiased selection:bg-orange-500 selection:text-white flex flex-col pb-20 sm:pb-0 transition-colors duration-200">
      
      {/* Top Header Bar */}
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onOpenCsvModal={() => setIsCsvModalOpen(true)}
        onOpenAddModal={() => {
          setEditingAppointment(null);
          setSlotDefaultHour('09:00');
          setIsAddModalOpen(true);
        }}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
        conflictCount={allConflicts.length}
        googleState={googleState}
        onSyncGoogle={handleSyncGoogle}
        notificationsEnabled={notificationsEnabled}
        onRequestNotifications={handleRequestNotifications}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        userName={user?.displayName || (user?.email ? user.email.split('@')[0] : '')}
      />

      {/* Expandable Search & Filter Bar */}
      {isSearchOpen && (
        <SearchAndFilterBar
          filters={filters}
          onFilterChange={setFilters}
          onClose={() => setIsSearchOpen(false)}
          resultCount={filteredAppointments.length}
        />
      )}

      {/* Main View Area: 30 Giorni (Month) vs Giornaliero (Clean Chronological List) */}
      <main className="flex-1 relative overflow-x-hidden">
        <div key={activeView} className="w-full transition-all duration-200">
          {activeView === 'month' ? (
            <MonthCalendarView
              selectedDate={currentDate}
              onSelectDate={(date) => {
                setCurrentDate(date);
              }}
              appointments={filteredAppointments}
              conflicts={allConflicts}
              onOpenAddModal={() => {
                setEditingAppointment(null);
                setSlotDefaultHour('09:00');
                setIsAddModalOpen(true);
              }}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onSwitchToDailyView={() => handleViewChange('daily')}
              onToggleComplete={handleToggleComplete}
              onEditAppointment={(app) => {
                setEditingAppointment(app);
                setIsAddModalOpen(true);
              }}
              onDeleteAppointment={handleDeleteAppointment}
            />
          ) : (
            <CleanDailyView
              currentDate={currentDate}
              appointments={filteredAppointments}
              conflicts={allConflicts}
              onToggleComplete={handleToggleComplete}
              onEditAppointment={(app) => {
                setEditingAppointment(app);
                setIsAddModalOpen(true);
              }}
              onDeleteAppointment={handleDeleteAppointment}
              onOpenAddModal={() => {
                setEditingAppointment(null);
                setSlotDefaultHour('09:00');
                setIsAddModalOpen(true);
              }}
              onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
              onOpenCsvModal={() => setIsCsvModalOpen(true)}
              onDateChange={setCurrentDate}
              onSwitchToMonthView={() => handleViewChange('month')}
            />
          )}
        </div>
      </main>

      {/* Mobile Fixed Bottom Navigation Bar */}
      <MobileBottomNav
        activeView={activeView}
        onViewChange={handleViewChange}
        onOpenAddModal={() => {
          setEditingAppointment(null);
          setSlotDefaultHour('09:00');
          setIsAddModalOpen(true);
        }}
        onOpenVoiceModal={() => setIsVoiceModalOpen(true)}
        onToggleSearch={() => setIsSearchOpen(!isSearchOpen)}
        isSearchOpen={isSearchOpen}
        onSetToday={() => {
          setCurrentDate(getTodayDateString());
          handleViewChange('daily');
        }}
      />

      {/* 30-Day Month Calendar Modal */}
      <MonthCalendarModal
        isOpen={isMonthModalOpen}
        onClose={() => setIsMonthModalOpen(false)}
        selectedDate={currentDate}
        onSelectDate={setCurrentDate}
        appointments={appointments}
        conflicts={allConflicts}
      />

      {/* Create / Edit Appointment Modal */}
      <AppointmentModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingAppointment(null);
        }}
        onSave={handleSaveAppointment}
        initialAppointment={editingAppointment}
        defaultDate={currentDate}
        defaultHour={slotDefaultHour}
        existingAppointments={appointments}
        onStartVoiceDictation={() => {
          setIsAddModalOpen(false);
          setIsVoiceModalOpen(true);
        }}
        isGoogleConnected={googleState.isConnected}
      />

      {/* Voice Dictation Modal */}
      <VoiceInputDialog
        isOpen={isVoiceModalOpen}
        onClose={() => setIsVoiceModalOpen(false)}
        onConfirm={(appData) => {
          handleSaveAppointment(appData);
          if (appData.date) {
            setCurrentDate(appData.date);
          }
          setIsVoiceModalOpen(false);
        }}
      />

      {/* Course CSV Import Modal */}
      <CourseCsvModal
        isOpen={isCsvModalOpen}
        onClose={() => setIsCsvModalOpen(false)}
        onImportAppointments={handleAddCourseCSV}
        existingAppointments={appointments}
      />

      {/* Real-time Upcoming Appointment Alert Toast */}
      <NotificationToast
        upcomingApp={upcomingNotificationApp}
        onDismiss={() => setUpcomingNotificationApp(null)}
      />

      {/* App-Themed Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deletingAppointmentId}
        title="Elimina Appuntamento"
        message="Sei sicuro di voler eliminare questo appuntamento dall'agenda? L'operazione non può essere annullata."
        confirmText="Elimina Appuntamento"
        cancelText="Annulla"
        variant="danger"
        onConfirm={confirmDeleteAppointment}
        onCancel={() => setDeletingAppointmentId(null)}
      />

      {/* Auth & Profile Management Modal */}
      <AuthProfileDialog
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        user={user}
        onSyncLocalToCloud={handleSyncLocalToCloud}
        localCount={appointments.length}
      />

    </div>
  );
}
