import { Appointment, GoogleCalendarState } from '../types';

const STORAGE_KEY_TOKEN = 'agenda_gcal_token';

export function getStoredGoogleState(): GoogleCalendarState {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  return {
    isConnected: !!token,
    accessToken: token,
    lastSync: localStorage.getItem('agenda_gcal_last_sync') || undefined,
  };
}

export function saveGoogleToken(token: string) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem('agenda_gcal_last_sync', new Date().toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' }));
}

export function clearGoogleToken() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem('agenda_gcal_last_sync');
}

/**
 * Fetches primary calendar events from Google Calendar API.
 */
export async function fetchGoogleCalendarEvents(accessToken: string, startDate?: string, endDate?: string): Promise<Appointment[]> {
  try {
    const timeMin = startDate ? new Date(startDate).toISOString() : new Date(Date.now() - 30 * 86400000).toISOString();
    const timeMax = endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 60 * 86400000).toISOString();

    const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(timeMin)}&timeMax=${encodeURIComponent(timeMax)}&singleEvents=true&orderBy=startTime`;

    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        clearGoogleToken();
        throw new Error('Sessione Google Calendar scaduta. Riconnetti l\'account.');
      }
      throw new Error(`Errore API Google Calendar: ${res.statusText}`);
    }

    const data = await res.json();
    const items = data.items || [];

    const googleAppointments: Appointment[] = items.map((item: any) => {
      let dateStr = new Date().toISOString().split('T')[0];
      let startTime = '09:00';
      let endTime = '10:00';

      if (item.start?.dateTime) {
        const startDateObj = new Date(item.start.dateTime);
        dateStr = startDateObj.toISOString().split('T')[0];
        startTime = startDateObj.toTimeString().slice(0, 5);
      } else if (item.start?.date) {
        dateStr = item.start.date;
      }

      if (item.end?.dateTime) {
        const endDateObj = new Date(item.end.dateTime);
        endTime = endDateObj.toTimeString().slice(0, 5);
      }

      return {
        id: `gcal_${item.id}`,
        googleEventId: item.id,
        title: item.summary || '(Senza Titolo - Google)',
        description: item.description || item.location ? `Luogo: ${item.location}` : 'Sincronizzato da Google Calendar',
        date: dateStr,
        startTime,
        endTime,
        category: 'Lavoro',
        importance: 'Alta',
        reminderMinutes: 15,
        source: 'google',
        location: item.location,
        completed: false,
        createdAt: item.created || new Date().toISOString()
      };
    });

    return googleAppointments;
  } catch (err: any) {
    console.error('Google Calendar fetch error:', err);
    throw err;
  }
}

/**
 * Creates an event in Google Calendar.
 */
export async function createGoogleCalendarEvent(accessToken: string, app: Appointment): Promise<string | null> {
  try {
    const startIso = new Date(`${app.date}T${app.startTime}:00`).toISOString();
    const endIso = new Date(`${app.date}T${app.endTime}:00`).toISOString();

    const body = {
      summary: app.title,
      description: `${app.description || ''}\n[Categoria: ${app.category}]`,
      location: app.location || '',
      start: { dateTime: startIso },
      end: { dateTime: endIso },
      reminders: {
        useDefault: false,
        overrides: [{ method: 'popup', minutes: app.reminderMinutes }],
      },
    };

    const res = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      throw new Error(`Impossibile sincronizzare su Google Calendar: ${res.statusText}`);
    }

    const created = await res.json();
    return created.id || null;
  } catch (err) {
    console.error('Create Google Event error:', err);
    return null;
  }
}
