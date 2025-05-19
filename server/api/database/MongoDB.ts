import mongoose from 'mongoose';

const dbName = process.env.DATABASE_NAME || 'auth-service';
const dbUrl = process.env.DATABASE_URL || 'mongodb://localhost:27017/test';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }
  try {
    await mongoose.connect(dbUrl, {
      dbName,
      maxPoolSize: 10,
    });
    isConnected = true;
    console.info(`✅ Successfully connected to database ${dbName}!`);
  } catch (error) {
    console.error('🚨 Error connecting to database: ', error);
    process.exit(1);
  }
};

mongoose.connection.on('disconnected', () => {
  console.warn('❌ MongoDB disconnected.');
  isConnected = false;
});

export { connectDB, mongoose, isConnected };
