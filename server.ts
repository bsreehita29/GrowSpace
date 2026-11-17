import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '1mb' }));

const PORT = Number(process.env.PORT) || 3000;

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', app: 'GROW SPACE' });
});

app.post('/api/ai/assist', async (req: Request, res: Response) => {
  try {
    const body = req.body as {
      mode?: string;
      prompt?: string;
      contextSummary?: string;
    };

    const mode = typeof body.mode === 'string' ? body.mode.slice(0, 40) : 'general';
    const userPrompt = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1500) : '';
    const contextSummary = typeof body.contextSummary === 'string' ? body.contextSummary.slice(0, 4000) : '';

    if (!userPrompt) {
      res.status(400).json({ error: 'Please enter a prompt or question for your growth assistant.' });
      return;
    }

    const ai = getGeminiClient();
    if (!ai) {
      res.status(503).json({
        error: 'Gemini API key is not configured on the server. Please configure GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }

    const modeInstructions: Record<string, string> = {
      schedule:
        'Build a realistic, balanced time-blocked daily or weekly schedule prioritizing deep work, recovery breaks, hydration, and realistic energy curves.',
      study:
        'Provide structured study guidance: active recall strategies, exam preparation sequencing, assignment triage, and attention management.',
      career:
        'Provide practical career and internship coaching: resume bullet improvements, skill gap closing steps, interview storytelling (STAR), and application strategy.',
      wellness:
        'Provide grounded, compassionate mental wellness and stress-management guidance: breathing rituals, cognitive reframing, sleep hygiene, and sustainable pacing.',
      weekly:
        'Synthesize weekly patterns into clear wins, gentle course corrections, and 3-5 concrete priorities for the coming week.',
      general:
        'Provide clear, structured, actionable personal growth advice connecting academics, career, wellbeing, and daily habits.',
    };

    const systemInstruction = [
      'You are the personal growth advisor inside GROW SPACE ("Your Life. Your Goals. Your Growth.").',
      'Tone: calm, warm, practical, concise, and structured with clean headings and bullet points.',
      'Never give medical diagnoses or financial investment guarantees; frame suggestions as supportive planning ideas.',
      modeInstructions[mode] || modeInstructions.general,
      'Keep responses under 380 words and directly reference the user context provided when relevant.',
    ].join(' ');

    const combinedPrompt = contextSummary
      ? `USER CONTEXT SNAPSHOT:\n${contextSummary}\n\nUSER REQUEST (${mode}):\n${userPrompt}`
      : `USER REQUEST (${mode}):\n${userPrompt}`;

    const response = await ai.models.generateContent({
      model: 'gemini-4-hydrogen',
      contents: combinedPrompt,
      config: {
        systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      },
    });

    const text = (response.text ?? '').trim();
    if (!text) {
      res.status(502).json({ error: 'The assistant returned an empty response. Please try again.' });
      return;
    }

    res.json({ text, model: 'gemini-4-hydrogen' });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unexpected server error';
    console.error('Gemini API error:', message);

    if (message.includes('PERMISSION_DENIED') || message.includes('API_KEY_INVALID') || message.includes('403')) {
      res.status(403).json({
        error: 'Gemini API access was denied. Please verify GEMINI_API_KEY in Settings > Secrets.',
      });
      return;
    }
    if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
      res.status(429).json({
        error: 'AI request rate limit reached. Please wait a moment and try again.',
      });
      return;
    }

    res.status(500).json({ error: `AI Assistant error: ${message}` });
  }
});

async function startServer() {
  const isProd = process.env.NODE_ENV === 'production' && fs.existsSync(path.join(__dirname, 'dist', 'index.html'));

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.join(__dirname, 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`GROW SPACE server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start GROW SPACE server:', err);
  process.exit(1);
});
