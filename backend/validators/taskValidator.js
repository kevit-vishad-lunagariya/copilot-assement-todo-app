'use strict';

const Joi = require('joi');

const STATUS_VALUES = ['todo', 'in-progress', 'done'];
const PRIORITY_VALUES = ['low', 'medium', 'high'];

const createTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).required().messages({
    'string.base': 'title must be a string',
    'string.empty': 'title is required',
    'string.min': 'title must be at least 1 character',
    'string.max': 'title must be at most 200 characters',
    'any.required': 'title is required',
  }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.base': 'description must be a string',
    'string.max': 'description must be at most 1000 characters',
  }),
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .optional()
    .messages({
      'any.only': `priority must be one of: ${PRIORITY_VALUES.join(', ')}`,
    }),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().min(1).max(200).optional().messages({
    'string.base': 'title must be a string',
    'string.empty': 'title cannot be empty',
    'string.min': 'title must be at least 1 character',
    'string.max': 'title must be at most 200 characters',
  }),
  description: Joi.string().max(1000).allow('').optional().messages({
    'string.base': 'description must be a string',
    'string.max': 'description must be at most 1000 characters',
  }),
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .optional()
    .messages({
      'any.only': `priority must be one of: ${PRIORITY_VALUES.join(', ')}`,
    }),
})
  .min(1)
  .messages({
    'object.min': 'At least one field must be provided for update',
  });

const idParamSchema = Joi.object({
  id: Joi.string()
    .uuid({ version: 'uuidv4' })
    .required()
    .messages({
      'string.base': 'id must be a string',
      'string.guid': 'id must be a valid UUID v4',
      'any.required': 'id is required',
    }),
});

const queryFilterSchema = Joi.object({
  status: Joi.string()
    .valid(...STATUS_VALUES)
    .optional()
    .messages({
      'any.only': `status must be one of: ${STATUS_VALUES.join(', ')}`,
    }),
  priority: Joi.string()
    .valid(...PRIORITY_VALUES)
    .optional()
    .messages({
      'any.only': `priority must be one of: ${PRIORITY_VALUES.join(', ')}`,
    }),
});

/**
 * Middleware factory that validates req[property] against a Joi schema.
 * @param {import('joi').Schema} schema - Joi schema to validate against.
 * @param {string} [property='body'] - Which part of req to validate ('body', 'params', 'query').
 * @returns {import('express').RequestHandler} Express middleware function.
 */
const validate = (schema, property = 'body') => (req, res, next) => {
  const { error, value } = schema.validate(req[property], {
    abortEarly: false,
    stripUnknown: true,
  });
  if (error) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: error.details.map((d) => d.message),
    });
  }
  req[property] = value;
  next();
};

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  idParamSchema,
  queryFilterSchema,
  validate,
};
