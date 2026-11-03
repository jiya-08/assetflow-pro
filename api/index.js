const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const mongoose = require('mongoose');

dotenv.config({ path: path.join(__dirname, '../backend/.env') });

const User = require('../backend/models/User');
const { seedDatabase } = require('../backend/scripts/seed');

// Route imports
const authRoutes = require('../backend/routes/authRoutes');
const assetRoutes = require('../backend/routes/assetRoutes');
const employeeRoutes = require('../backend/routes/employeeRoutes');
const assignmentRoutes = require('../backend/routes/assignmentRoutes');
const bookingRoutes = require('../backend/routes/bookingRoutes');
const maintenanceRoutes = require('../backend/routes/maintenanceRoutes');
const auditRoutes = require('../backend/routes/auditRoutes');
const dashboardRoutes = require('../backend/routes/dashboardRoutes');

const app = express();

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

let isConnected = false;

const connectServerlessDB = async () => {
  if (isConnected && mongoose.connection.readyState === 1) {
    return;
  }

  const mongoUri = process.env.MONGO_URI;
  if (mongoUri && !mongoUri.includes('localhost')) {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 5000
    });
    isConnected = true;

    // Auto seed if empty
    const count = await User.countDocuments();
    if (count === 0) {
      await seedDatabase();
    }
    return conn;
  }
};

app.use(async (req, res, next) => {
  try {
    await connectServerlessDB();
  } catch (err) {
    console.warn('[VERCEL DB WARNING]:', err.message);
  }
  next();
});

// Health Check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'AssetFlow Pro Vercel Serverless API',
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

module.exports = app;
