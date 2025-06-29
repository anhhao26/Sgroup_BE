// src/server.js
import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 8000;

// Kết nối DB
connectDB();

// Khởi chạy server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on 0.0.0.0:${PORT}`);
});
