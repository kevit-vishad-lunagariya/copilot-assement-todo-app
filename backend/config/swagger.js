'use strict';

const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Todo App API',
      version: '1.0.0',
      description: 'REST API for the Todo application — flat-file JSON persistence.',
    },
    servers: [
      {
        url: `http://localhost:${process.env.PORT || 5000}`,
        description: 'Local development server',
      },
    ],
    components: {
      schemas: {
        Task: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
              format: 'uuid',
              example: 'f47ac10b-58cc-4372-a567-0e02b2c3d479',
            },
            title: { type: 'string', example: 'Buy groceries' },
            description: { type: 'string', example: 'Milk, bread, eggs' },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'done'],
              example: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium',
            },
            completed: { type: 'boolean', example: false },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        CreateTaskBody: {
          type: 'object',
          required: ['title'],
          properties: {
            title: {
              type: 'string',
              minLength: 1,
              maxLength: 200,
              example: 'Buy groceries',
            },
            description: {
              type: 'string',
              maxLength: 1000,
              example: 'Milk, bread, eggs',
            },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'done'],
              example: 'todo',
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
              example: 'medium',
            },
          },
        },
        UpdateTaskBody: {
          type: 'object',
          minProperties: 1,
          properties: {
            title: { type: 'string', minLength: 1, maxLength: 200 },
            description: { type: 'string', maxLength: 1000 },
            status: {
              type: 'string',
              enum: ['todo', 'in-progress', 'done'],
            },
            priority: {
              type: 'string',
              enum: ['low', 'medium', 'high'],
            },
          },
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: 'Task not found' },
            errors: {
              type: 'array',
              items: { type: 'string' },
              example: [],
            },
          },
        },
        TaskStats: {
          type: 'object',
          properties: {
            byStatus: {
              type: 'object',
              properties: {
                todo: { type: 'integer', example: 3 },
                'in-progress': { type: 'integer', example: 2 },
                done: { type: 'integer', example: 5 },
              },
            },
            byPriority: {
              type: 'object',
              properties: {
                low: { type: 'integer', example: 2 },
                medium: { type: 'integer', example: 5 },
                high: { type: 'integer', example: 3 },
              },
            },
            total: { type: 'integer', example: 10 },
          },
        },
      },
    },
  },
  apis: [require('path').join(__dirname, '../routes/*.js')],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
