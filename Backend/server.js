const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const cookieParser = require('cookie-parser');
const path = require('path');
require('dotenv').config();

// Import DB and SMTP configs to initialize verification connections
require('./config/db');
require('./config/mail');

const apiRouter = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Apply Middlewares
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173', // Vite default port
    credentials: true
  })
);
app.use(compression()); // Compress responses

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev')); // Dev logging
} else {
  app.use(morgan('combined')); // Production logging
}

app.use(express.json()); // Parse JSON body
app.use(express.urlencoded({ extended: true })); // Parse URL encoded body
app.use(cookieParser()); // Parse cookies

// Static folder for uploaded files (e.g. post photos)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API routes
app.use('/api', apiRouter);

// Fallback Route for Undefined Endpoints (404)
app.use((req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  error.statusCode = 404;
  next(error);
});

// Centralized Error Handler
app.use(errorHandler);

// Start server listening
app.listen(PORT, () => {
  console.log(
    `Server is running in ${
      process.env.NODE_ENV || 'development'
    } mode on port ${PORT}`
  );
});
