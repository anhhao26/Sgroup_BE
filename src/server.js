import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { marked } from 'marked';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import pollRoutes from './routes/pollRoutes.js';
import errorHandler from './middlewares/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();

app.use(cors());
app.use(express.json());
app.use(cookieParser());

// hiển thị README.md
app.get('/', (req, res, next) => {
  const mdPath = path.join(__dirname, '../README.md');
  fs.readFile(mdPath, 'utf8', (err, data) => err
    ? next(err)
    : res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Docs</title></head><body>${marked(data)}</body></html>`)
  );
});

// các route cần có
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, code: 404, message: 'Route not found' });
});
app.use(errorHandler);

export default app;
