import { Appointment, AppointmentCategory } from '../types';

export interface CSVParseResult {
  appointments: Partial<Appointment>[];
  errors: string[];
  totalParsed: number;
}

/**
 * Main entry point: Parses input string whether it's standard CSV or a Report text format.
 */
export function parseCourseScheduleCSV(input: string): CSVParseResult {
  const trimmed = input.trim();
  if (!trimmed) {
    return { appointments: [], errors: ['Testo o file vuoto.'], totalParsed: 0 };
  }

  // Detect report format or try report parser if lines contain bullet points or "REPORT CORSI"
  const isReportFormat = 
    /REPORT\s+CORSI/i.test(trimmed) || 
    /Periodo:/i.test(trimmed) || 
    /🔹/.test(trimmed) || 
    /Totale\s+lezioni/i.test(trimmed);

  if (isReportFormat) {
    const reportRes = parseTextCourseReport(trimmed);
    if (reportRes.appointments.length > 0) {
      return reportRes;
    }
  }

  // Fallback / standard CSV parsing
  const csvRes = parseStandardCSV(trimmed);
  if (csvRes.appointments.length > 0) {
    return csvRes;
  }

  // If standard CSV returned 0 items, try text report parser as fallback
  return parseTextCourseReport(trimmed);
}

/**
 * Parses structured text reports (e.g. "📅 REPORT CORSI ... 🔹 gio 03/09 | 12:30-15:30 ...").
 */
export function parseTextCourseReport(text: string): CSVParseResult {
  const lines = text.split(/\r?\n/);
  
  // Extract default year from "Periodo: 01/09/2026 - 30/09/2026" or similar, or default to current/next year
  let year = new Date().getFullYear().toString();
  const yearMatch = text.match(/\b(20\d{2})\b/);
  if (yearMatch) {
    year = yearMatch[1];
  }

  const parsedAppointments: Partial<Appointment>[] = [];
  const errors: string[] = [];

  interface PendingSlot {
    day: string;
    month: string;
    startTime: string;
    endTime: string;
  }

  let currentSlot: PendingSlot | null = null;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (!line) continue;

    // Skip report metadata/headers/separators/summary
    if (/REPORT\s+CORSI/i.test(line) || /Periodo:/i.test(line) || /^[\-\=\_]+$/.test(line) || /Totale\s+lezioni/i.test(line)) {
      continue;
    }

    // Match slot line format: "🔹 gio 03/09 | 12:30-15:30" or "lun 07/09 | 09:00-13:00" or "03/09 | 12:30-15:30"
    const slotRegex = /(?:🔹\s*)?(?:[a-zA-Zàèéìòù]{2,4}\s+)?(\d{1,2})[\/\-](\d{1,2})\s*\|?\s*(\d{1,2}[:\.]\d{2})\s*[\-\–\—\:]\s*(\d{1,2}[:\.]\d{2})/;
    const slotMatch = line.match(slotRegex);

    if (slotMatch) {
      const day = slotMatch[1].padStart(2, '0');
      const month = slotMatch[2].padStart(2, '0');
      let start = normalizeTime(slotMatch[3]) || '09:00';
      let end = normalizeTime(slotMatch[4]) || '13:00';

      // Adjust potential typos where end time is <= start time (e.g. 14:30-13:00 -> 14:30-18:00)
      if (start && end) {
        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const startMin = sh * 60 + sm;
        const endMin = eh * 60 + em;
        if (endMin <= startMin) {
          const newEh = Math.min(sh + 3, 23);
          end = `${String(newEh).padStart(2, '0')}:${String(sm).padStart(2, '0')}`;
        }
      }

      currentSlot = { day, month, startTime: start, endTime: end };
      continue;
    }

    // If we have a slot pending, this line is the course title & instructor
    if (currentSlot) {
      let title = line;
      let instructor: string | undefined = undefined;

      const parenMatch = line.match(/^(.*?)\s*\((.*?)\)$/);
      if (parenMatch) {
        title = parenMatch[1].trim();
        instructor = parenMatch[2].trim();
      }

      const formattedDate = `${year}-${currentSlot.month}-${currentSlot.day}`;

      parsedAppointments.push({
        title,
        date: formattedDate,
        startTime: currentSlot.startTime,
        endTime: currentSlot.endTime,
        category: 'Corso' as AppointmentCategory,
        reminderMinutes: 15,
        source: 'csv_course',
        instructor,
        description: instructor ? `Docente: ${instructor} | Lezione di Docenza` : 'Lezione di Docenza',
        completed: false,
      });

      currentSlot = null;
    }
  }

  return {
    appointments: parsedAppointments,
    errors,
    totalParsed: parsedAppointments.length,
  };
}

/**
 * Standard CSV parser with column header matching.
 */
function parseStandardCSV(csvText: string): CSVParseResult {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length < 2) {
    return { appointments: [], errors: ['File CSV privo di righe dati.'], totalParsed: 0 };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
  
  const colTitle = findColIndex(headers, ['corso', 'titolo', 'materia', 'subject', 'title', 'event', 'evento']);
  const colDate = findColIndex(headers, ['data', 'date', 'giorno', 'day']);
  const colStart = findColIndex(headers, ['ora inizio', 'ora_inizio', 'start', 'start time', 'ora_start', 'orario']);
  const colEnd = findColIndex(headers, ['ora fine', 'ora_fine', 'end', 'end time', 'ora_end']);
  const colInstructor = findColIndex(headers, ['docente', 'prof', 'professore', 'istruttore', 'teacher']);
  const colLocation = findColIndex(headers, ['aula', 'luogo', 'stanza', 'room', 'location']);
  const colNotes = findColIndex(headers, ['note', 'descrizione', 'description', 'notes']);

  if (colTitle === -1 || colDate === -1) {
    return {
      appointments: [],
      errors: ['Colonne obbligatorie "Corso" e "Data" non trovate.'],
      totalParsed: 0
    };
  }

  const parsedAppointments: Partial<Appointment>[] = [];
  const errors: string[] = [];

  for (let i = 1; i < lines.length; i++) {
    const row = parseCSVLine(lines[i]);
    if (row.length === 0 || row.every(c => !c.trim())) continue;

    const rawTitle = row[colTitle]?.trim();
    const rawDate = row[colDate]?.trim();
    if (!rawTitle || !rawDate) {
      errors.push(`Riga ${i + 1}: Titolo o Data mancanti.`);
      continue;
    }

    const formattedDate = normalizeDate(rawDate);
    if (!formattedDate) {
      errors.push(`Riga ${i + 1}: Formato data non valido (${rawDate}).`);
      continue;
    }

    const rawStart = colStart !== -1 ? row[colStart]?.trim() : '09:00';
    const rawEnd = colEnd !== -1 ? row[colEnd]?.trim() : '11:00';

    const startTime = normalizeTime(rawStart) || '09:00';
    const endTime = normalizeTime(rawEnd) || '10:00';
    const instructor = colInstructor !== -1 ? row[colInstructor]?.trim() : undefined;
    const location = colLocation !== -1 ? row[colLocation]?.trim() : undefined;
    const notes = colNotes !== -1 ? row[colNotes]?.trim() : undefined;

    parsedAppointments.push({
      title: rawTitle,
      date: formattedDate,
      startTime,
      endTime,
      category: 'Corso' as AppointmentCategory,
      reminderMinutes: 15,
      source: 'csv_course',
      instructor,
      location,
      description: [instructor ? `Docente: ${instructor}` : '', location ? `Aula: ${location}` : '', notes].filter(Boolean).join(' | ') || 'Importato da calendario corsi',
      completed: false
    });
  }

  return {
    appointments: parsedAppointments,
    errors,
    totalParsed: parsedAppointments.length
  };
}

/**
 * Parses a single CSV line taking quotes into account.
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"' || char === "'") {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      result.push(current.trim().replace(/^["']|["']$/g, ''));
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim().replace(/^["']|["']$/g, ''));
  return result;
}

function findColIndex(headers: string[], candidates: string[]): number {
  return headers.findIndex(h => candidates.some(c => h.includes(c)));
}

/**
 * Normalizes Italian date (DD/MM/YYYY or DD-MM-YYYY or YYYY-MM-DD) into YYYY-MM-DD.
 */
export function normalizeDate(dateStr: string): string | null {
  const clean = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) {
    return clean;
  }
  const itMatch = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (itMatch) {
    const day = itMatch[1].padStart(2, '0');
    const month = itMatch[2].padStart(2, '0');
    const year = itMatch[3];
    return `${year}-${month}-${day}`;
  }
  return null;
}

/**
 * Normalizes time string (e.g. "9:00", "09:00", "9.00", "14:30:00") into "HH:mm".
 */
export function normalizeTime(timeStr: string): string | null {
  if (!timeStr) return null;
  const clean = timeStr.trim().replace('.', ':');
  const match = clean.match(/^(\d{1,2}):(\d{2})/);
  if (match) {
    const h = match[1].padStart(2, '0');
    const m = match[2];
    return `${h}:${m}`;
  }
  return null;
}

/**
 * Generates sample report text matching docenza lessons format.
 */
export function generateSampleCourseCSV(): string {
  return `📅 REPORT CORSI
Periodo: 01/09/2026 - 30/09/2026
--------------------------

🔹 gio 03/09 | 12:30-15:30
   App AI ED 2 (Ing Palmese)

🔹 lun 07/09 | 09:00-13:00
   24091_Asacom3 G (Sturzo)

🔹 mer 09/09 | 12:30-15:30
   App AI ED 2 (Ing Palmese)

🔹 mar 15/09 | 12:30-15:30
   App AI ED 2 (Ing Palmese)

🔹 mer 16/09 | 09:00-13:00
   OSS7 M (Sturzo)

🔹 ven 18/09 | 14:30-18:00
   Seg Coa 5 (Sturzo)

🔹 lun 21/09 | 09:00-13:00
   24091_Asacom3 G (Sturzo)

🔹 mar 22/09 | 12:30-15:30
   App AI ED 2 (Ing Palmese)

🔹 mer 23/09 | 09:00-13:00
   OSS7 M (Sturzo)

🔹 gio 24/09 | 14:30-18:00
   Seg Coa 7 (Sturzo)

🔹 ven 25/09 | 14:30-18:00
   Seg Coa 5 (Sturzo)

🔹 lun 28/09 | 09:00-13:00
   24091_Asacom3 G (Sturzo)

🔹 lun 28/09 | 14:30-18:00
   Seg coa 6 (Sturzo)

🔹 mar 29/09 | 15:00-18:00
   App AI ED 2 (Ing Palmese)

🔹 mer 30/09 | 09:00-13:00
   OSS7 M (Sturzo)

🔹 mer 30/09 | 14:30-18:00
   OSS5 P (Sturzo)

Totale lezioni: 16`;
}

