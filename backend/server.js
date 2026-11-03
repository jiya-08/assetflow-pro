const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '.env') });

const { connectDB } = require('./config/db');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');
const User = require('./models/User');
const { seedDatabase } = require('./scripts/seed');

// Route imports
const authRoutes = require('./routes/authRoutes');
const assetRoutes = require('./routes/assetRoutes');
const employeeRoutes = require('./routes/employeeRoutes');
const assignmentRoutes = require('./routes/assignmentRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const maintenanceRoutes = require('./routes/maintenanceRoutes');
const auditRoutes = require('./routes/auditRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');

const app = express();

// Global Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health Check API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'AssetFlow Pro Backend API',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/assets', assetRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/maintenance', maintenanceRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Initialize Server after DB connection & seed verification
const startServer = async () => {
  try {
    await connectDB();

    // Verify if database needs initial seeding
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('[STARTUP] Database appears uninitialized. Running initial seed...');
      await seedDatabase();
      console.log('[STARTUP] Initial database seeding completed.');
    }

    if (process.env.NODE_ENV !== 'test') {
      const server = app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`🚀 AssetFlow Pro API Server Running on port ${PORT}`);
        console.log(`📡 Health Check: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
      });
      return server;
    }
    return app;
  } catch (err) {
    console.error(`[STARTUP ERROR]: ${err.message}`);
    process.exit(1);
  }
};

const readyPromise = startServer();

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`[UNHANDLED REJECTION]: ${err.message}`);
});

module.exports = { app, readyPromise };
