const validate = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (error) {
    if (error.errors && error.errors.length > 0) {
      const firstError = error.errors[0];
      const field = firstError.path.join('.');
      const reason = firstError.message;
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        error: {
          field,
          reason,
        },
      });
    }
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: {
        field: 'unknown',
        reason: 'Malformed request body',
      },
    });
  }
};

module.exports = validate;
