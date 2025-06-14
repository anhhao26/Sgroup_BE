import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middleware chung
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api', authRoutes);       // /api/auth/register, /api/auth/login, /api/auth/refresh-token, /api/auth/logout, /api/users/me
app.use('/api/users', userRoutes); // /api/users (admin CRUD, update profile)
app.use('/api/polls', pollRoutes); // /api/polls/*

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
