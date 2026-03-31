'use strict';

const { v4: uuidv4 } = require('uuid');
const taskStore = require('../data/taskStore');
const logger = require('../config/logger');

/** Ordered status progression used to validate workflow transitions. */
const STATUS_ORDER = ['todo', 'in-progress', 'done'];

/**
 * Determine whether a status transition is permitted.
 * Only sequential forward steps are allowed (todo→in-progress, in-progress→done).
 * Staying on the same status is also permitted (no-op transition).
 * @param {string} fromStatus - The current task status.
 * @param {string} toStatus - The requested new status.
 * @returns {boolean} True when the transition is valid.
 */
function isValidTransition(fromStatus, toStatus) {
  const fromIdx = STATUS_ORDER.indexOf(fromStatus);
  const toIdx = STATUS_ORDER.indexOf(toStatus);
  return toIdx === fromIdx || toIdx === fromIdx + 1;
}

/**
 * List all tasks with optional filtering by status and/or priority.
 * @param {import('express').Request} req - Express request; supports query params `status` and `priority`.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.listTasks = async (req, res, next) => {
  try {
    const { status, priority } = req.query;
    const filters = {};
    if (status) filters.status = status;
    if (priority) filters.priority = priority;

    const tasks = await taskStore.getAllTasks(filters);
    res.status(200).json({ success: true, data: tasks, total: tasks.length });
  } catch (err) {
    next(err);
  }
};

/**
 * Create a new task and persist it to the data store.
 * @param {import('express').Request} req - Express request; body must conform to createTaskSchema.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.createTask = async (req, res, next) => {
  try {
    const { title, description, status, priority } = req.body;
    const now = new Date().toISOString();
    const resolvedStatus = status || 'todo';

    const task = {
      id: uuidv4(),
      title,
      description: description !== undefined ? description : '',
      status: resolvedStatus,
      priority: priority || 'medium',
      completed: resolvedStatus === 'done',
      createdAt: now,
      updatedAt: now,
    };

    const created = await taskStore.createTask(task);
    logger.info(`Task created: ${created.id}`);
    res.status(201).json({ success: true, data: created });
  } catch (err) {
    next(err);
  }
};

/**
 * Return task counts grouped by status and priority.
 * @param {import('express').Request} req - Express request.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getTaskStats = async (req, res, next) => {
  try {
    const stats = await taskStore.getTaskStats();
    res.status(200).json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
};

/**
 * Retrieve a single task by its UUID.
 * @param {import('express').Request} req - Express request; `req.params.id` must be a UUID v4.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.getTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const task = await taskStore.getTaskById(id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'Task not found', errors: [] });
    }
    res.status(200).json({ success: true, data: task });
  } catch (err) {
    next(err);
  }
};

/**
 * Update an existing task. Enforces the status workflow (todo→in-progress→done).
 * @param {import('express').Request} req - Express request; body must conform to updateTaskSchema.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 * @throws {422} When the requested status transition violates the workflow.
 */
exports.updateTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const existing = await taskStore.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found', errors: [] });
    }

    if (updates.status && updates.status !== existing.status) {
      if (!isValidTransition(existing.status, updates.status)) {
        return res.status(422).json({
          success: false,
          message: 'Invalid status transition',
          errors: [
            `Cannot transition from '${existing.status}' to '${updates.status}'`,
          ],
        });
      }
    }

    const now = new Date().toISOString();
    const resolvedStatus = updates.status !== undefined ? updates.status : existing.status;
    const completed = resolvedStatus === 'done';

    const updated = await taskStore.updateTask(id, {
      ...updates,
      completed,
      updatedAt: now,
    });

    logger.info(`Task updated: ${id}`);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};

/**
 * Delete a task by its UUID. Returns 204 No Content on success.
 * @param {import('express').Request} req - Express request; `req.params.id` must be a UUID v4.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 */
exports.deleteTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await taskStore.deleteTask(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Task not found', errors: [] });
    }
    logger.info(`Task deleted: ${id}`);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
};

/**
 * Mark a task as complete (status → 'done', completed → true).
 * Only tasks currently in 'in-progress' status may be completed.
 * @param {import('express').Request} req - Express request; `req.params.id` must be a UUID v4.
 * @param {import('express').Response} res - Express response.
 * @param {import('express').NextFunction} next - Express next middleware function.
 * @returns {Promise<void>}
 * @throws {422} When the task status is not 'in-progress'.
 */
exports.completeTask = async (req, res, next) => {
  try {
    const { id } = req.params;
    const existing = await taskStore.getTaskById(id);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Task not found', errors: [] });
    }

    if (existing.status !== 'in-progress') {
      return res.status(422).json({
        success: false,
        message: 'Invalid status transition',
        errors: [
          `Cannot complete a task with status '${existing.status}'. Task must be 'in-progress' first.`,
        ],
      });
    }

    const now = new Date().toISOString();
    const updated = await taskStore.updateTask(id, {
      status: 'done',
      completed: true,
      updatedAt: now,
    });

    logger.info(`Task completed: ${id}`);
    res.status(200).json({ success: true, data: updated });
  } catch (err) {
    next(err);
  }
};