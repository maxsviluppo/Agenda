import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Health check
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // Server-side Gemini AI endpoint for smart Italian voice parsing
  app.post('/api/parse-voice', async (req, res) => {
    try {
      const { transcript } = req.body;
      if (!transcript) {
        return res.status(400).json({ error: 'Manca la trascrizione vocale' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(503).json({ error: 'GEMINI_API_KEY non configurata' });
      }

      const ai = new GoogleGenAI({ apiKey });
      const prompt = `Analizza questa trascrizione vocale in italiano di un appuntamento o corso ed estrai un oggetto JSON con questi campi:
- title: stringa (titolo pulito dell'evento)
- date: YYYY-MM-DD (data rilevata, oggi è ${new Date().toISOString().split('T')[0]})
- startTime: HH:mm (orario di inizio)
- endTime: HH:mm (orario di fine, se non indicato aggiungere 1 ora)
- category: "Lavoro" | "Corso" | "Riunione" | "Personale" | "Salute" | "Altro"
- importance: "Alta" | "Media" | "Bassa"

Rispondi ESCLUSIVAMENTE con il JSON puro senza markdown o testo aggiuntivo.
Trascrizione: "${transcript}"`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const responseText = response.text?.trim() || '';
      const cleanJson = responseText.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleanJson);

      return res.json(parsed);
    } catch (err: any) {
      console.error('Error in /api/parse-voice:', err);
      return res.status(500).json({ error: err.message || 'Errore elaborazione vocale AI' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
