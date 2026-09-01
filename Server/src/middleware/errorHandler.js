const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Log error stack for debugging in development environment
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(`[Error] ${statusCode} - ${message}`);
  }

  res.status(statusCode).json({
    success: false,
    message,
    // stack: process.env.NODE_ENV === 'production' ? null : err.stack
  });
};

module.exports = errorHandler;
