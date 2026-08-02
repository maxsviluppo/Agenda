import { AppointmentCategory } from '../types';

export interface ParsedVoiceData {
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  category: AppointmentCategory;
  rawTranscript: string;
}

/**
 * Format a Date object to YYYY-MM-DD using local time (prevents UTC timezone shift).
 */
function formatLocalDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const monthsMap: Record<string, number> = {
  gennaio: 0,
  febbraio: 1,
  marzo: 2,
  aprile: 3,
  maggio: 4,
  giugno: 5,
  luglio: 6,
  agosto: 7,
  settembre: 8,
  ottobre: 9,
  novembre: 10,
  dicembre: 11,
};

const numberWordsMap: Record<string, number> = {
  primo: 1, uno: 1, due: 2, tre: 3, quattro: 4, cinque: 5,
  sei: 6, sette: 7, otto: 8, nove: 9, dieci: 10,
  undici: 11, dodici: 12, tredici: 13, quattordici: 14, quindici: 15,
  sedici: 16, diciassette: 17, diciotto: 18, diciannove: 19, venti: 20,
  ventuno: 21, ventidue: 22, ventitre: 23, ventitré: 23, ventiquattro: 24,
  venticinque: 25, ventisei: 26, ventisette: 27, ventotto: 28, ventinove: 29,
  trenta: 30, trentuno: 31,
};

const daysMap: Record<string, number> = {
  'lunedì': 1, 'lunedi': 1,
  'martedì': 2, 'martedi': 2,
  'mercoledì': 3, 'mercoledi': 3,
  'giovedì': 4, 'giovedi': 4,
  'venerdì': 5, 'venerdi': 5,
  'sabato': 6,
  'domenica': 0,
};

/**
 * Natural language Italian speech parser for appointment dictation.
 */
export function parseItalianSpeech(transcript: string, baseDate: Date = new Date()): ParsedVoiceData {
  const text = transcript.toLowerCase().trim();
  let targetDate = new Date(baseDate);
  let dateMatched = false;

  // --- 1. DATE PARSING ---

  // A. Relative expressions: dopodomani, domani, oggi
  if (text.includes('dopodomani')) {
    targetDate.setDate(targetDate.getDate() + 2);
    dateMatched = true;
  } else if (text.includes('domani')) {
    targetDate.setDate(targetDate.getDate() + 1);
    dateMatched = true;
  } else if (/\boggi\b/.test(text)) {
    dateMatched = true;
  }

  // B. "tra N giorni" / "fra N giorni" / "tra una settimana"
  if (!dateMatched) {
    const traGiorniMatch = text.match(/(?:tra|fra)\s+(\d+|un|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|una\s+settimana)\s*(giorn[io]|settiman[ae])?/);
    if (traGiorniMatch) {
      dateMatched = true;
      const val = traGiorniMatch[1];
      if (val.includes('settimana')) {
        targetDate.setDate(targetDate.getDate() + 7);
      } else {
        const num = numberWordsMap[val] || parseInt(val, 10) || 1;
        targetDate.setDate(targetDate.getDate() + num);
      }
    }
  }

  // C. Explicit Day + Month name (e.g. "15 agosto", "il 15 di agosto", "quindici agosto", "1º maggio", "15 agosto 2026")
  if (!dateMatched) {
    const dayMonthRegex = /(?:il\s+|giorno\s+)?(\d{1,2}|primo|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette|diciotto|diciannove|venti|ventuno|ventidue|ventitr[eé]|ventiquattro|venticinque|ventisei|ventisette|ventotto|ventinove|trenta|trentuno)\s*(?:º|°)?\s*(?:di|del|dell'|de)?\s*(gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre)(?:\s+(\d{4}))?/;
    const dmMatch = text.match(dayMonthRegex);
    if (dmMatch) {
      dateMatched = true;
      const dayRaw = dmMatch[1];
      const monthName = dmMatch[2];
      const yearStr = dmMatch[3];

      const dayNum = numberWordsMap[dayRaw] || parseInt(dayRaw, 10);
      const monthNum = monthsMap[monthName];

      if (dayNum >= 1 && dayNum <= 31 && monthNum !== undefined) {
        let year = yearStr ? parseInt(yearStr, 10) : baseDate.getFullYear();
        if (!yearStr && monthNum < baseDate.getMonth()) {
          year += 1;
        }
        targetDate = new Date(year, monthNum, dayNum);
      }
    }
  }

  // D. Slash/Dot Date formats: "15/08", "15-08-2026", "15.08"
  if (!dateMatched) {
    const slashMatch = text.match(/\b(\d{1,2})[\/\.-](\d{1,2})(?:[\/\.-](\d{2,4}))?\b/);
    if (slashMatch) {
      dateMatched = true;
      const dayNum = parseInt(slashMatch[1], 10);
      const monthNum = parseInt(slashMatch[2], 10) - 1;
      let year = slashMatch[3] ? parseInt(slashMatch[3], 10) : baseDate.getFullYear();
      if (year < 100) year += 2000;

      if (dayNum >= 1 && dayNum <= 31 && monthNum >= 0 && monthNum <= 11) {
        targetDate = new Date(year, monthNum, dayNum);
      }
    }
  }

  // E. Weekdays ("lunedì", "prossimo martedì", "martedì prossimo")
  if (!dateMatched) {
    for (const [dayName, dayIndex] of Object.entries(daysMap)) {
      if (text.includes(dayName)) {
        dateMatched = true;
        const currentDay = targetDate.getDay();
        let distance = dayIndex - currentDay;
        if (distance <= 0) distance += 7;
        targetDate.setDate(targetDate.getDate() + distance);
        break;
      }
    }
  }

  // F. "il 25 del mese", "il giorno 25" (Day without month)
  if (!dateMatched) {
    const dayOnlyMatch = text.match(/(?:il\s+|giorno\s+)(\d{1,2})\b/);
    if (dayOnlyMatch) {
      const dayNum = parseInt(dayOnlyMatch[1], 10);
      if (dayNum >= 1 && dayNum <= 31) {
        dateMatched = true;
        let month = baseDate.getMonth();
        let year = baseDate.getFullYear();
        if (dayNum < baseDate.getDate()) {
          month += 1;
          if (month > 11) {
            month = 0;
            year += 1;
          }
        }
        targetDate = new Date(year, month, dayNum);
      }
    }
  }

  const dateString = formatLocalDate(targetDate);

  // --- 2. TIME PARSING ---
  let startTime = '09:00';
  let endTime = '10:00';

  const normalizedText = text
    .replace(/\be\s+mezz[ao]\b/g, ':30')
    .replace(/\be\s+un\s+quarto\b/g, ':15')
    .replace(/\be\s+tre\s+quarti\b/g, ':45');

  const rangeMatch = normalizedText.match(/dalle\s+(\d{1,2})(?::(\d{2})|\s+e\s+(\d{2}))?\s+alle\s+(\d{1,2})(?::(\d{2})|\s+e\s+(\d{2}))?/);
  if (rangeMatch) {
    const h1 = rangeMatch[1].padStart(2, '0');
    const m1 = (rangeMatch[2] || rangeMatch[3] || '00').padStart(2, '0');
    const h2 = rangeMatch[4].padStart(2, '0');
    const m2 = (rangeMatch[5] || rangeMatch[6] || '00').padStart(2, '0');
    startTime = `${h1}:${m1}`;
    endTime = `${h2}:${m2}`;
  } else {
    const singleTimeMatch = normalizedText.match(/(?:alle|ore)\s+(\d{1,2})(?::(\d{2})|\s+e\s+(\d{2}))?/);
    if (singleTimeMatch) {
      const h = singleTimeMatch[1].padStart(2, '0');
      const m = (singleTimeMatch[2] || singleTimeMatch[3] || '00').padStart(2, '0');
      startTime = `${h}:${m}`;
      
      const endH = (parseInt(h, 10) + 1) % 24;
      endTime = `${endH.toString().padStart(2, '0')}:${m}`;
    }
  }

  // --- 3. CATEGORY PARSING ---
  let category: AppointmentCategory = 'Lavoro';
  if (text.includes('corso') || text.includes('lezione') || text.includes('esame') || text.includes('università') || text.includes('scuola') || text.includes('studio')) {
    category = 'Corso';
  } else if (text.includes('visita') || text.includes('medico') || text.includes('dottore') || text.includes('dentista') || text.includes('salute') || text.includes('palestra') || text.includes('terapia')) {
    category = 'Salute';
  } else if (text.includes('riunione') || text.includes('call') || text.includes('meeting') || text.includes('progetto') || text.includes('cliente') || text.includes('lavoro')) {
    category = 'Riunione';
  } else if (text.includes('cena') || text.includes('pranzo') || text.includes('aperitivo') || text.includes('compleanno') || text.includes('spesa') || text.includes('famiglia') || text.includes('casa')) {
    category = 'Personale';
  }

  // --- 4. CLEAN TITLE ---
  let title = transcript
    .replace(/dalle\s+\d{1,2}(?::\d{2}|\s+e\s+\d{2})?\s+alle\s+\d{1,2}(?::\d{2}|\s+e\s+\d{2})?/gi, '')
    .replace(/(?:alle|ore)\s+\d{1,2}(?::\d{2}|\s+e\s+\d{2})?/gi, '')
    .replace(/dopodomani|domani|oggi|lunedì|martedì|mercoledì|giovedì|venerdì|sabato|domenica/gi, '')
    .replace(/gennaio|febbraio|marzo|aprile|maggio|giugno|luglio|agosto|settembre|ottobre|novembre|dicembre/gi, '')
    .replace(/(?:il\s+|giorno\s+)?(?:\d{1,2}|primo|uno|due|tre|quattro|cinque|sei|sette|otto|nove|dieci|undici|dodici|tredici|quattordici|quindici|sedici|diciassette|diciotto|diciannove|venti|ventuno|ventidue|ventitr[eé]|ventiquattro|venticinque|ventisei|ventisette|ventotto|ventinove|trenta|trentuno)(?:\s*º|\s*°)?(?:\s+(?:di|del|dell'|de))?/gi, '')
    .replace(/\b\d{1,2}[\/\.-]\d{1,2}(?:[\/\.-]\d{2,4})?\b/gi, '')
    .replace(/importante|urgente|priorità alta|bassa priorità/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  title = title.replace(/^(per|di|il|lo|la|i|gli|le|a|da|in|con|su|per|tra|fra|-|,)\s+/i, '');

  if (title.length > 0) {
    title = title.charAt(0).toUpperCase() + title.slice(1);
  } else {
    title = `Nuovo Appuntamento (${category})`;
  }

  return {
    title,
    date: dateString,
    startTime,
    endTime,
    category,
    rawTranscript: transcript,
  };
}

