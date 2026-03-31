'use strict';

const fs = require('fs/promises');
const path = require('path');

const DATA_FILE = path.join(__dirname, 'tasks.json');

/**
 * Read all tasks from the JSON file.
 * @returns {Promise<Array>} Array of task objects.
 */
async function readTasks() {
  try {
    const content = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(content);
  } catch (err) {
    if (err.code === 'ENOENT') {
      return [];
    }
    throw err;
  }
}

/**
 * Write the full tasks array back to the JSON file.
 * @param {Array} tasks - Array of task objects to persist.
 * @returns {Promise<void>}
 */
async function writeTasks(tasks) {
  await fs.writeFile(DATA_FILE, JSON.stringify(tasks, null, 2), 'utf8');
}

/**
 * Get all tasks, optionally filtered by status and/or priority.
 * @param {Object} [filters={}] - Optional filters.
 * @param {string} [filters.status] - Filter by status value.
 * @param {string} [filters.priority] - Filter by priority value.
 * @returns {Promise<Array>} Filtered array of task objects.
 */
async function getAllTasks(filters = {}) {
  let tasks = await readTasks();
  if (filters.status) {
    tasks = tasks.filter((t) => t.status === filters.status);
  }
  if (filters.priority) {
    tasks = tasks.filter((t) => t.priority === filters.priority);
  }
  return tasks;
}

/**
 * Get a single task by its UUID.
 * @param {string} id - UUID v4 of the task.
 * @returns {Promise<Object|null>} The task object, or null if not found.
 */
async function getTaskById(id) {
  const tasks = await readTasks();
  return tasks.find((t) => t.id === id) || null;
}

/**
 * Persist a new task to the data file.
 * @param {Object} task - Complete task object to create (including generated id and timestamps).
 * @returns {Promise<Object>} The created task object.
 */
async function createTask(task) {
  const tasks = await readTasks();
  tasks.push(task);
  await writeTasks(tasks);
  return task;
}

/**
 * Apply partial updates to an existing task.
 * @param {string} id - UUID v4 of the task to update.
 * @param {Object} updates - Fields to merge into the existing task.
 * @returns {Promise<Object|null>} The updated task object, or null if not found.
 */
async function updateTask(id, updates) {
  const tasks = await readTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;
  tasks[index] = { ...tasks[index], ...updates };
  await writeTasks(tasks);
  return tasks[index];
}

/**
 * Delete a task by its UUID.
 * @param {string} id - UUID v4 of the task to delete.
 * @returns {Promise<boolean>} True if the task was deleted, false if not found.
 */
async function deleteTask(id) {
  const tasks = await readTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return false;
  tasks.splice(index, 1);
  await writeTasks(tasks);
  return true;
}

/**
 * Compute task counts grouped by status and priority.
 * @returns {Promise<Object>} Object containing byStatus, byPriority, and total counts.
 */
async function getTaskStats() {
  const tasks = await readTasks();

  const byStatus = { todo: 0, 'in-progress': 0, done: 0 };
  const byPriority = { low: 0, medium: 0, high: 0 };

  for (const task of tasks) {
    if (Object.prototype.hasOwnProperty.call(byStatus, task.status)) {
      byStatus[task.status]++;
    }
    if (Object.prototype.hasOwnProperty.call(byPriority, task.priority)) {
      byPriority[task.priority]++;
    }
  }

  return { byStatus, byPriority, total: tasks.length };
}

module.exports = { getAllTasks, getTaskById, createTask, updateTask, deleteTask, getTaskStats };
