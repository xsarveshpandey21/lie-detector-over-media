const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { AppError } = require('./utils/errors');

dotenv.config();

const app = express();

// Security headers with helmet
app.use(helmet({
  contentSecurityPolicy: false, // Allows Vite inline styles & loaded fonts
  crossOriginEmbedderPolicy: false
}));

// CORS configuration: restrict to ALLOWED_ORIGIN or same-origin in production
const allowedOriginsEnv = process.env.ALLOWED_ORIGIN;
const allowedOrigins = allowedOriginsEnv
  ? allowedOriginsEnv.split(',').map(o => o.trim()).filter(Boolean)
  : null;

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, server-to-server)
    if (!origin) return callback(null, true);
    if (!allowedOrigins) {
      // In dev or without explicit ALLOWED_ORIGIN, allow all
      if (process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      // In production without ALLOWED_ORIGIN, same-origin only
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      return callback(null, true);
    }
    return callback(new AppError(403, 'cors_forbidden', 'Cross-origin request not allowed.'));
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

// Rate limiting: 30 requests / 15 minutes / IP (configurable)
const rateLimitWindowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000;
const rateLimitMax = Number(process.env.RATE_LIMIT_MAX) || 30;

const limiter = rateLimit({
  windowMs: rateLimitWindowMs,
  max: rateLimitMax,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'rate_limit_exceeded',
      message: 'Too many requests. Please wait a few minutes before checking again.'
    });
  }
});

// Apply rate limiting to analyze endpoint
app.use('/api/analyze', limiter);

const maxUploadMB = Number(process.env.MAX_UPLOAD_MB) || 4;
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: maxUploadMB * 1024 * 1024 }
});

app.use(express.json({ limit: `${maxUploadMB + 1}mb` }));
app.use(express.urlencoded({ extended: true, limit: `${maxUploadMB + 1}mb` }));

// Health check with operational info (booleans only, never keys)
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'Satya Lens',
    status: 'operational',
    version: '1.0.0',
    time: new Date().toISOString(),
    integrations: {
      factCheckApi: Boolean(process.env.FACT_CHECK_GOOGLE_API_KEY),
      openAi: Boolean(process.env.OPENAI_API_KEY),
      googleTranslate: Boolean(process.env.GOOGLE_TRANSLATE_API_KEY),
      googleSafeBrowsing: Boolean(process.env.GOOGLE_SAFE_BROWSING_KEY),
      textMicroservice: Boolean(process.env.TEXT_MODEL_URL),
      imageDetector: Boolean(process.env.IMAGE_DETECTOR_URL),
      videoDetector: Boolean(process.env.VIDEO_DETECTOR_URL),
      audioDetector: Boolean(process.env.AUDIO_DETECTOR_URL)
    }
  });
});

// Routes
const analyzeRouter = require('./routes/analyze');
const chatRouter = require('./routes/chat');
app.use('/api/analyze', upload.single('file'), analyzeRouter);
app.use('/api/chat', chatRouter);

// Serve frontend static build in production or if dist exists
const distPath = path.resolve(__dirname, '../../frontend/dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
      return next();
    }
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

// Centralized error handling
app.use((err, req, res, next) => {
  // Handle multer file size limit
  if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      error: 'file_too_large',
      message: `File is too large. Maximum upload size is ${maxUploadMB} MB.`
    });
  }

  // Handle custom AppError
  if (err instanceof AppError || (err.status && err.code)) {
    return res.status(err.status || 400).json({
      error: err.code || 'bad_request',
      message: err.message || 'The request could not be processed.'
    });
  }

  // Timeout error
  if (err.code === 'ECONNABORTED' || err.name === 'TimeoutError') {
    return res.status(504).json({
      error: 'timeout',
      message: 'The check took too long to complete. Please try again with shorter text or a smaller file.'
    });
  }

  console.error('[Satya Lens Server Error]:', err.message || err);
  return res.status(500).json({
    error: 'server_error',
    message: 'Something went wrong while checking this content. Please try again.'
  });
});

module.exports = app;
