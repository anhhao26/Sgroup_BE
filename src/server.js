import dotenv from 'dotenv';
import path from 'path';
import express from 'express';               // ← phải import express
import { fileURLToPath } from 'url';          // ← để giả lập __dirname
import app from './app.js';
import { connectDB } from './config/db.js';

// tạo __dirname cho ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const PORT = process.env.PORT || 3000;

// Kết nối MongoDB
await connectDB();

app.set('trust proxy', true);

// Xử lý tệp tĩnh (index.html và css/js nếu có)
app.use(express.static(path.join(__dirname, '..')));

// Route cho landing page (README → index.html)
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

// Các route /api/... được định nghĩa trong app.js
// ...

// Khởi động server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at port ${PORT} on 0.0.0.0`);
});
