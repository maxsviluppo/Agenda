export type AppointmentCategory = 
  | 'Lavoro' 
  | 'Corso' 
  | 'Personale' 
  | 'Riunione' 
  | 'Salute' 
  | 'Altro';

export type EventSource = 'local' | 'google' | 'csv_course';

export interface Appointment {
  id: string;
  title: string;
  description?: string;
  date: string; // Format: YYYY-MM-DD
  startTime: string; // Format: HH:mm
  endTime: string; // Format: HH:mm
  category: AppointmentCategory;
  reminderMinutes: number; // e.g. 5, 15, 30, 60, 1440
  source: EventSource;
  color?: string;
  completed?: boolean;
  location?: string;
  instructor?: string;
  googleEventId?: string;
  notified?: boolean;
  createdAt: string;
}

export interface OverlapConflict {
  id: string;
  event1: Appointment;
  event2: Appointment;
  message: string;
}

export interface FilterOptions {
  search: string;
  category: string; // 'Tutte' or specific category
  timeRange: 'all' | 'today' | 'upcoming' | 'past' | 'conflicts';
  source: string; // 'all' | 'local' | 'google' | 'csv_course'
}

export interface NotificationSettings {
  enabled: boolean;
  soundEnabled: boolean;
  defaultReminderMinutes: number;
}

export interface GoogleCalendarState {
  isConnected: boolean;
  accessToken: string | null;
  userEmail?: string;
  lastSync?: string;
}
