import { Appointment, OverlapConflict } from '../types';

/**
 * Checks if two appointments on the same date overlap in time.
 */
export function doAppointmentsOverlap(app1: Appointment, app2: Appointment): boolean {
  if (app1.id === app2.id) return false;
  if (app1.date !== app2.date) return false;

  const start1 = timeToMinutes(app1.startTime);
  const end1 = timeToMinutes(app1.endTime);
  const start2 = timeToMinutes(app2.startTime);
  const end2 = timeToMinutes(app2.endTime);

  return start1 < end2 && start2 < end1;
}

/**
 * Converts "HH:mm" time string into total minutes from midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return 0;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return (hours || 0) * 60 + (minutes || 0);
}

/**
 * Converts total minutes from midnight back into "HH:mm" string.
 */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

/**
 * Scans all non-completed appointments and returns list of overlap conflicts.
 */
export function detectAllConflicts(appointments: Appointment[]): OverlapConflict[] {
  const activeEvents = appointments.filter(a => !a.completed);
  const conflicts: OverlapConflict[] = [];
  const processedPairs = new Set<string>();

  for (let i = 0; i < activeEvents.length; i++) {
    for (let j = i + 1; j < activeEvents.length; j++) {
      const app1 = activeEvents[i];
      const app2 = activeEvents[j];

      if (doAppointmentsOverlap(app1, app2)) {
        const pairKey = [app1.id, app2.id].sort().join('_');
        if (!processedPairs.has(pairKey)) {
          processedPairs.add(pairKey);
          conflicts.push({
            id: pairKey,
            event1: app1,
            event2: app2,
            message: `Sovrapposizione oraria tra "${app1.title}" (${app1.startTime}-${app1.endTime}) e "${app2.title}" (${app2.startTime}-${app2.endTime}) il ${formatItalianDate(app1.date)}`
          });
        }
      }
    }
  }

  return conflicts;
}

/**
 * Safely merges incoming appointments with existing ones.
 * Updates items if ID matches or exact duplicate (same date, title, startTime, endTime) exists,
 * preserving all other events and allowing overlaps to be displayed cleanly.
 */
export function mergeAndReplaceOverlaps(
  existingApps: Appointment[],
  incomingApps: Appointment[]
): { updatedAppointments: Appointment[]; replacedCount: number } {
  let currentList = [...existingApps];
  let replacedCount = 0;

  for (const incoming of incomingApps) {
    if (!incoming.date) continue;

    const initialLen = currentList.length;

    // Remove exact duplicate or item with matching ID being edited/replaced
    currentList = currentList.filter(ex => {
      if (ex.id && incoming.id && ex.id === incoming.id) return false;

      // Match exact duplicate (same date, title, start and end time)
      const sameDate = ex.date === incoming.date;
      const sameTitle = ex.title.trim().toLowerCase() === (incoming.title || '').trim().toLowerCase();
      const sameStart = ex.startTime === incoming.startTime;
      const sameEnd = ex.endTime === incoming.endTime;

      if (sameDate && sameTitle && sameStart && sameEnd) {
        return false;
      }

      return true;
    });

    if (currentList.length < initialLen) {
      replacedCount += (initialLen - currentList.length);
    }

    currentList.unshift(incoming as Appointment);
  }

  return { updatedAppointments: currentList, replacedCount };
}

/**
 * Formats YYYY-MM-DD into Italian date format DD/MM/YYYY.
 */
export function formatItalianDate(dateStr: string): string {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}
