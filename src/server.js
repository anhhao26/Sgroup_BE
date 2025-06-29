// src/server.js
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { fileURLToPath } from 'url';
import marked from 'marked';

import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

// __dirname cho ESModule
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 8000;

// 1. Kết nối MongoDB
connectDB();

// 2. Nếu app.js có mount /api, giữ nguyên
//    Thiết lập proxy trust
app.set('trust proxy', true);

// 3. Phục vụ tĩnh nếu bạn có index.html, css/js
app.use(express.static(path.join(__dirname, '..')));

// 4. Route GET "/" → đọc README.md và render thành HTML
app.get('/', (req, res) => {
  try {
    const md = fs.readFileSync(path.join(__dirname, '..', 'README.md'), 'utf8');
    const html = marked.parse(md);
    res.send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8">
    <title>README.md</title>
  </head>
  <body>${html}</body>
</html>`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error reading README.md');
  }
});

// 5. Khởi chạy server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at port ${PORT} on 0.0.0.0`);
});
