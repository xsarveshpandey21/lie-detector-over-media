const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const fs = require('fs');

dotenv.config();

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    ok: true,
    name: 'Satya Lens',
    status: 'operational',
    time: new Date().toISOString()
  });
});

// Routes
const analyzeRouter = require('./routes/analyze');
app.use('/api/analyze', upload.single('file'), analyzeRouter);

// Community (mock)
const { votes, leaderboard, vote } = require('./db/mock');
app.get('/api/community/leaderboard', (req, res) => res.json(leaderboard()));
app.get('/api/community/votes', (req, res) => res.json(votes()));
app.post('/api/community/vote', (req, res) => {
  const { id, decision } = req.body || {};
  return res.json(vote(id, decision));
});

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
  console.error('[API Error]:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.code || 'internal_server_error',
    message: err.message || 'An unexpected error occurred during processing.'
  });
});

module.exports = app;

