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
    message: process.env.NODE_ENV === 'production' && statusCode >= 500
      ? 'Something went wrong'
      : message,
    code: err.code || null,
  });
};

module.exports = errorHandler;
