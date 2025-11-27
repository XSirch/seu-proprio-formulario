import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import formsRoutes from './routes/forms.js';
import submissionsRoutes from './routes/submissions.js';
import userSettingsRoutes from './routes/userSettings.js';
import uploadRoutes from './routes/upload.js';
import { initDatabase } from './init-db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/forms', formsRoutes);
app.use('/api/submissions', submissionsRoutes);
app.use('/api/user', userSettingsRoutes);
app.use('/api/upload', uploadRoutes);

// Static frontend (built Vite app) - served from / for non-API routes
app.use('/uploads', express.static(path.join(__dirname, 'public/uploads')));

const publicPath = path.resolve(__dirname, 'public');
app.use(express.static(publicPath));

// SPA fallback: for any non-API route, send index.html so React can handle routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path.startsWith('/health')) {
    return next();
  }
  res.sendFile(path.join(publicPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
  });

