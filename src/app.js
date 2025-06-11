import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middleware chung
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);
app.use('/api/polls', pollRoutes);

// 404 handler (nếu không có route nào khớp)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    code: 404,
    message: 'Route not found'
  });
});

// Error handler
app.use(errorHandler);

export default app;
