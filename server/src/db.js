// MongoDB Atlas connection (Mongoose)
import mongoose from 'mongoose';
import { config } from './config.js';

mongoose.set('strictQuery', true);

export async function connectDB() {
  mongoose.connection.on('disconnected', () => console.warn('⚠ MongoDB disconnected — retrying…'));
  mongoose.connection.on('reconnected', () => console.log('✔ MongoDB reconnected'));
  await mongoose.connect(config.mongoUri, {
    dbName: process.env.MONGO_DB_NAME || 'becoming-an-artist',
    serverSelectionTimeoutMS: 15000,
  });
  console.log(`✔ Connected to MongoDB (${mongoose.connection.name})`);
}
