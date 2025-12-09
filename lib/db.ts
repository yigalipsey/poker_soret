import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

// Don't throw error during build time if MONGODB_URI is not set
// This allows the build to complete even if DB connection is not available
if (!MONGODB_URI && process.env.NODE_ENV !== 'production') {
  console.warn(
    'MONGODB_URI is not defined. Database operations will fail.'
  );
}

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  var mongoose: MongooseCache;
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error(
      'MONGODB_URI is not defined. Please set it in your environment variables.'
    );
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;
