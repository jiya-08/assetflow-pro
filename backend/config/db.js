const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  try {
    if (mongoUri && mongoUri.trim() !== '') {
      console.log(`[DB] Attempting connection to configured MongoDB: ${mongoUri.replace(/:([^:@]{3,})@/, ':***@')}`);
      const conn = await mongoose.connect(mongoUri, {
        serverSelectionTimeoutMS: 4000
      });
      console.log(`[DB] Successfully connected to MongoDB at ${conn.connection.host}:${conn.connection.port}/${conn.connection.name}`);
      return conn;
    }
  } catch (primaryErr) {
    console.warn(`[DB] Configured MongoDB connection failed (${primaryErr.message}). Initiating fallback...`);
  }

  // Fallback: in-memory MongoDB server for zero-config demonstration
  try {
    console.log('[DB] Starting Embedded In-Memory MongoDB Server for instant local testing...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    const uri = memoryServer.getUri();
    const conn = await mongoose.connect(uri);
    console.log(`[DB] Connected to In-Memory MongoDB Server: ${uri}`);
    return conn;
  } catch (fallbackErr) {
    console.error(`[DB] Fatal error connecting to database: ${fallbackErr.message}`);
    process.exit(1);
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
  } catch (err) {
    console.error(`[DB] Error disconnecting: ${err.message}`);
  }
};

module.exports = { connectDB, disconnectDB };
