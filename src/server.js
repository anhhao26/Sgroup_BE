import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

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

// Hiển thị README.md dưới dạng HTML tại /
app.get('/', (req, res, next) => {
  const mdPath = path.join(__dirname, '../README.md');
  fs.readFile(mdPath, 'utf8', (err, data) => {
    if (err) return next(err);
    const htmlContent = marked(data);
    res.send(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Poll App Documentation</title>
</head>
<body>
  ${htmlContent}
</body>
</html>`);
  });
});

// Các API routes
app.use('/api', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, code: 404, message: 'Route not found' });
});

// Error handler
app.use(errorHandler);

export default app;
