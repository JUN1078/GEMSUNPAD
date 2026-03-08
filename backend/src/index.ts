import express from 'express';
import cors from 'cors';
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

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    // Allow any localhost port in development
    if (origin.match(/^http:\/\/localhost:\d+$/)) return callback(null, true);
    // Allow configured frontend URL
    if (origin === (process.env.FRONTEND_URL || 'http://localhost:5173')) return callback(null, true);
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static(uploadsPath));

// Routes
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
  console.log(`🚀 HSE Geologi Unpad Backend running on http://localhost:${PORT}`);
});

export default app;
