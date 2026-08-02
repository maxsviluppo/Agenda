import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  writeBatch 
} from 'firebase/firestore';
import { db } from './firebase';
import { Appointment } from '../types';

/**
 * Subscribe to real-time appointments updates for a given user.
 */
export function subscribeToAppointments(
  userId: string, 
  onData: (appointments: Appointment[]) => void,
  onError?: (err: Error) => void
) {
  const appointmentsRef = collection(db, 'users', userId, 'appointments');
  const q = query(appointmentsRef);

  return onSnapshot(q, (snapshot) => {
    const appointments: Appointment[] = [];
    snapshot.forEach((docSnap) => {
      appointments.push(docSnap.data() as Appointment);
    });
    onData(appointments);
  }, (err) => {
    console.error('Firestore subscription error:', err);
    if (onError) onError(err);
  });
}

/**
 * Helper to recursively sanitize objects for Firestore (removes undefined properties).
 */
function sanitizeForFirestore<T extends Record<string, any>>(obj: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = sanitizeForFirestore(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

/**
 * Save or update a single appointment in Firestore.
 */
export async function saveAppointmentToCloud(userId: string, appointment: Appointment): Promise<void> {
  if (!userId || !appointment.id) return;
  const docRef = doc(db, 'users', userId, 'appointments', appointment.id);
  const data = sanitizeForFirestore({ ...appointment, userId });
  await setDoc(docRef, data, { merge: true });
}

/**
 * Delete an appointment from Firestore.
 */
export async function deleteAppointmentFromCloud(userId: string, appointmentId: string): Promise<void> {
  if (!userId || !appointmentId) return;
  const docRef = doc(db, 'users', userId, 'appointments', appointmentId);
  await deleteDoc(docRef);
}

/**
 * Batch upload/sync an array of appointments to Firestore.
 */
export async function syncBatchAppointmentsToCloud(userId: string, appointments: Appointment[]): Promise<void> {
  if (!userId || appointments.length === 0) return;
  
  // Firestore batch limit is 500
  const chunks = [];
  for (let i = 0; i < appointments.length; i += 400) {
    chunks.push(appointments.slice(i, i + 400));
  }

  for (const chunk of chunks) {
    const batch = writeBatch(db);
    chunk.forEach((app) => {
      if (!app.id) return;
      const docRef = doc(db, 'users', userId, 'appointments', app.id);
      const data = sanitizeForFirestore({ ...app, userId });
      batch.set(docRef, data, { merge: true });
    });
    await batch.commit();
  }
}
