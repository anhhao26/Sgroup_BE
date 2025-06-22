import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import { connectDB } from './config/db.js';

const PORT = process.env.PORT || 3000;

// Kết nối MongoDB
connectDB();
app.set('trust proxy', true);

// Khởi động Express
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running at port ${PORT} on 0.0.0.0`);
});

