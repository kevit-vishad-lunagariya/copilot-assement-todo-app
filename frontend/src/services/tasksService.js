import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000',
  headers: { 'Content-Type': 'application/json' },
});

/**
 * Fetch all tasks, optionally filtered by status and/or priority.
 * @param {{ status?: string, priority?: string }} [filters={}] - Optional query filters.
 * @returns {Promise<{ success: boolean, data: Array, total: number }>} Response envelope from the API.
 */
export async function fetchTasks(filters = {}) {
  const { data } = await api.get('/api/tasks', { params: filters });
  return data;
}

/**
 * Create a new task.
 * @param {{ title: string, description?: string, status?: string, priority?: string }} payload - Task fields.
 * @returns {Promise<{ success: boolean, data: object }>} Response envelope containing the created task.
 */
export async function createTask(payload) {
  const { data } = await api.post('/api/tasks', payload);
  return data;
}

/**
 * Update an existing task by ID.
 * @param {string} id - The UUID of the task to update.
 * @param {Partial<{ title: string, description: string, status: string, priority: string }>} payload - Fields to update.
 * @returns {Promise<{ success: boolean, data: object }>} Response envelope containing the updated task.
 */
export async function updateTask(id, payload) {
  const { data } = await api.put(`/api/tasks/${id}`, payload);
  return data;
}

/**
 * Delete a task by ID.
 * @param {string} id - The UUID of the task to delete.
 * @returns {Promise<void>}
 */
export async function deleteTask(id) {
  await api.delete(`/api/tasks/${id}`);
}

/**
 * Mark an in-progress task as done via the dedicated complete endpoint.
 * @param {string} id - The UUID of the task to complete.
 * @returns {Promise<{ success: boolean, data: object }>} Response envelope containing the completed task.
 */
export async function completeTask(id) {
  const { data } = await api.post(`/api/tasks/${id}/complete`);
  return data;
}
