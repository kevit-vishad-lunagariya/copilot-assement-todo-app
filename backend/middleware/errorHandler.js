'use strict';

const logger = require('../config/logger');

/**
 * Central 4-parameter Express error handler.
 * Catches all errors forwarded via next(err) and returns a consistent
 * { success, message, errors } JSON envelope.
 * @param {Error} err - The error object forwarded by Express.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} _next - Express next (required for 4-param signature).
 * @returns {void}
 */
const errorHandler = (err, req, res, _next) => {
  const status = err.status || err.statusCode || 500;
  const message = status === 500 ? 'Internal Server Error' : err.message || 'Internal Server Error';

  logger.error({
    message: err.message,
    status,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  res.status(status).json({
    success: false,
    message,
    errors: [],
  });
};

module.exports = errorHandler;
