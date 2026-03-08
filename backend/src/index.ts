import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import path from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();
import { getDb } from './db/schema';
import authRouter from './routes/auth';
import hazardRouter from './routes/hazard';
import jsaRouter from './routes/jsa';
import safetyMomentRouter from './routes/safety_moment';
import momRouter from './routes/mom';
import learningRouter from './routes/learning';
import missionsRouter from './routes/missions';
import reportsRouter from './routes/reports';
import campaignRouter from './routes/campaign';
import geonovaRouter from './routes/geonova';

const app = express();
const PORT = process.env.PORT || 3001;

// Init uploads directory
const uploadsPath = path.resolve(process.env.UPLOADS_PATH || './uploads');
if (!fs.existsSync(uploadsPath)) fs.mkdirSync(uploadsPath, { recursive: true });

// Init DB
getDb();

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// ── CORS ──────────────────────────────────────────────────────────────────────
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true); // mobile / curl
    if (origin.match(/^http:\/\/localhost:\d+$/)) return callback(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return callback(null, true);
    // Allow any Vercel preview URLs for the project
    if (origin.match(/^https:\/\/[\w-]+-jun1078s-projects\.vercel\.app$/)) return callback(null, true);
    if (origin.match(/^https:\/\/gemsunpad.*\.vercel\.app$/)) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// ── Compression ───────────────────────────────────────────────────────────────
app.use(compression());

// ── Rate limiting ─────────────────────────────────────────────────────────────
// Strict limit on auth endpoints (prevent brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { error: 'Terlalu banyak percobaan. Coba lagi dalam 15 menit.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API limit
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120,
  message: { error: 'Request terlalu cepat. Mohon tunggu sebentar.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth', authLimiter);
app.use('/api', apiLimiter);

// ── Body parsing (tightened limits) ──────────────────────────────────────────
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use('/uploads', express.static(uploadsPath));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/hazards', hazardRouter);
app.use('/api/jsa', jsaRouter);
app.use('/api/safety-moments', safetyMomentRouter);
app.use('/api/mom', momRouter);
app.use('/api/learning', learningRouter);
app.use('/api/missions', missionsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/campaigns', campaignRouter);
app.use('/api/geonova', geonovaRouter);

app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'HSE Geologi Unpad', version: '1.0.0' }));

app.listen(PORT, () => {
  console.log(`HSE Geologi Unpad Backend running on port ${PORT}`);
});

export default app;
