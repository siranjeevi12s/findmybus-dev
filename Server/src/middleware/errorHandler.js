const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  // Log full detail server-side, but never expose internal error text (DB
  // driver messages, stack-derived info) to clients on 5xx responses.
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  } else {
    console.error(`[Error] ${statusCode} - ${err.message}`);
  }

  const message =
    statusCode >= 500 ? 'Internal Server Error' : err.message || 'Request failed';

  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
