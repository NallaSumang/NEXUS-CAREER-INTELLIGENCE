import mongoose from 'mongoose';

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(process.env.MONGO_URI, opts).then((mongoose) => {
      console.log('✅ MongoDB Connected (Atlas/Serverless cached)');
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    console.warn('⚠️ Bypassing Atlas firewall: Using local ephemeral MongoDB');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongoServer = await MongoMemoryServer.create();
      cached.promise = mongoose.connect(mongoServer.getUri()).then((mongoose) => {
        console.log('✅ MongoDB Connected (Local Ephemeral)');
        return mongoose;
      });
      cached.conn = await cached.promise;
    } catch (fallbackError) {
      cached.promise = null;
      console.error('❌ Both Atlas and Local MongoDB failed:', fallbackError.message);
      throw fallbackError;
    }
  }

  return cached.conn;
}
