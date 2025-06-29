// src/app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { marked } from 'marked';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const app = express();

// Middleware chung
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Hiển thị README.md ở route "/"
app.get('/', (req, res) => {
  const mdPath = path.join(process.cwd(), 'README.md');
  fs.readFile(mdPath, 'utf8', (err, data) => {
    if (err) {
      console.error('❌ Lỗi đọc README.md:', err);
      return res.status(500).send('Internal Server Error');
    }
    const html = marked(data);
    res.send(`
      <!doctype html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width,initial-scale=1">
          <title>Poll App Docs</title>
          <style>
            body { font-family: sans-serif; max-width: 800px; margin: auto; padding: 2rem; }
            pre, code { background: #f4f4f4; padding: .2rem .4rem; border-radius: 4px; }
          </style>
        </head>
        <body>${html}</body>
      </html>
    `);
  });
});

// Các route API
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);

// Router 404
app.use((req, res) => {
  res.status(404).json({ success: false, code: 404, message: 'Route not found' });
});

// Middleware handle lỗi
app.use(errorHandler);

export default app;
