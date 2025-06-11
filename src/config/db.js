import mongoose from 'mongoose';

export function connectDB() {
  const uri = process.env.MONGO_URI;
  mongoose.set('strictQuery', true);
  mongoose
    .connect(uri, { })
    .then(() => console.log('✅ MongoDB connected'))
    .catch(err => {
      console.error('🚨 MongoDB connection error:', err);
      process.exit(1);
    });
}
