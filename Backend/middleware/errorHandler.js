// Global central error handler middleware
const errorHandler = (err, req, res, next) => {
  // Log the full error to the console for development
  console.error('Error occurred:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Structure error response
  res.status(statusCode).json({
    success: false,
    status: statusCode,
    message: message,
    // Provide stack trace only in development
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
};

module.exports = errorHandler;
