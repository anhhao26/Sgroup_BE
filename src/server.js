import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { marked } from 'marked';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ... các middleware (cors, express.json, cookieParser, v.v.)

// --- NEW: Serve README.md at /
app.get('/', (req, res, next) => {
  const mdPath = path.join(__dirname, '../README.md');
  fs.readFile(mdPath, 'utf8', (err, data) => {
    if (err) return next(err);
    const html = marked(data);
    res.send(`<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Poll App Docs</title></head>
<body>${html}</body>
</html>`);
  });
});

// --- Sau đó là:
app.use('/api',     authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/polls', pollRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, code: 404, message: 'Route not found' });
});

// error handler
app.use(errorHandler);

export default app;
