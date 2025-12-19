import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/environment';
import { errorHandler } from './middleware/error.middleware';
import { apiLimiter } from './middleware/rateLimit.middleware';

// Import routes
import authRoutes from './routes/auth.routes';
// import userRoutes from './routes/user.routes';
import scoreRoutes from './routes/score.routes';
import preferencesRoutes from './routes/preferences.routes';
// import songRoutes from './routes/song.routes';

const app: Application = express();

// CORS configuration
const corsOptions = {
  origin: env.CORS_ORIGIN.split(','),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api', apiLimiter);

// Health check endpoint
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      environment: env.NODE_ENV
    }
  });
});

// API routes
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
app.use('/api/scores', scoreRoutes);
app.use('/api/preferences', preferencesRoutes);
// app.use('/api/songs', songRoutes);

// 404 handler - must be after all routes
app.use((_req, res, _next) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route not found',
      code: 'NOT_FOUND'
    }
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export default app;
