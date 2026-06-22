require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { connectDB } = require('./config/database');
const errorHandler = require('./utils/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const textContentRoutes = require('./routes/textContent');
const marketingContentRoutes = require('./routes/marketingContent');
const mediaContentRoutes = require('./routes/mediaContent');
const chatRoutes = require('./routes/chat');
const contentSessionRoutes = require('./routes/contentSession');

// Initialize Express app
const app = express();

// Connect to database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/text-content', textContentRoutes);
app.use('/api/marketing-content', marketingContentRoutes);
app.use('/api/media-content', mediaContentRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/content-sessions', contentSessionRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
    code: 'NOT_FOUND',
  });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

