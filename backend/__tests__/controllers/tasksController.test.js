'use strict';

/**
 * Integration tests for tasksController via supertest.
 * The Express app is assembled inline (same routes + middleware as server.js)
 * so we never call app.listen() and never touch source files.
 * taskStore is mocked so no real file I/O occurs.
 */

jest.mock('../../data/taskStore');

const request = require('supertest');
const express = require('express');
const taskStore = require('../../data/taskStore');
const tasksRouter = require('../../routes/tasks');
const errorHandler = require('../../middleware/errorHandler');

// Silence winston during tests
jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Build a test app identical in wiring to server.js but without listen()
// ---------------------------------------------------------------------------
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tasks', tasksRouter);
  app.use(errorHandler);
  return app;
}

const TASK = {
  id: '11111111-1111-4111-a111-111111111111',
  title: 'Test task',
  description: 'some description',
  status: 'todo',
  priority: 'medium',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const IN_PROGRESS_TASK = { ...TASK, status: 'in-progress' };
const DONE_TASK = { ...TASK, status: 'done', completed: true };

let app;

beforeEach(() => {
  jest.clearAllMocks();
  app = buildApp();
});

// ---------------------------------------------------------------------------
// GET /api/tasks
// ---------------------------------------------------------------------------
describe('GET /api/tasks', () => {
  it('returns 200 with task array and total', async () => {
    // Arrange
    taskStore.getAllTasks.mockResolvedValue([TASK]);

    // Act
    const res = await request(app).get('/api/tasks');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveLength(1);
    expect(res.body.total).toBe(1);
  });

  it('passes status and priority query params to taskStore', async () => {
    // Arrange
    taskStore.getAllTasks.mockResolvedValue([]);

    // Act
    await request(app).get('/api/tasks?status=todo&priority=high');

    // Assert
    expect(taskStore.getAllTasks).toHaveBeenCalledWith({ status: 'todo', priority: 'high' });
  });

  it('returns 400 for invalid status query param', async () => {
    // Arrange / Act
    const res = await request(app).get('/api/tasks?status=invalid');

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/status/i)]));
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.getAllTasks.mockRejectedValue(new Error('disk failure'));

    // Act
    const res = await request(app).get('/api/tasks');

    // Assert
    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/stats
// ---------------------------------------------------------------------------
describe('GET /api/tasks/stats', () => {
  it('returns 200 with stats object', async () => {
    // Arrange
    const stats = { byStatus: { todo: 1 }, byPriority: { medium: 1 }, total: 1 };
    taskStore.getTaskStats.mockResolvedValue(stats);

    // Act
    const res = await request(app).get('/api/tasks/stats');

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toMatchObject(stats);
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.getTaskStats.mockRejectedValue(new Error('disk failure'));

    // Act
    const res = await request(app).get('/api/tasks/stats');

    // Assert
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// GET /api/tasks/:id
// ---------------------------------------------------------------------------
describe('GET /api/tasks/:id', () => {
  it('returns 200 with the task', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK);

    // Act
    const res = await request(app).get(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.id).toBe(TASK.id);
  });

  it('returns 404 when task does not exist', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(null);

    // Act
    const res = await request(app).get(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toMatch(/not found/i);
  });

  it('returns 400 for invalid UUID param', async () => {
    // Arrange / Act
    const res = await request(app).get('/api/tasks/not-a-uuid');

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.getTaskById.mockRejectedValue(new Error('io error'));

    // Act
    const res = await request(app).get(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/tasks
// ---------------------------------------------------------------------------
describe('POST /api/tasks', () => {
  it('creates a task and returns 201', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'New task', priority: 'high' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('New task');
    expect(res.body.data.priority).toBe('high');
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.id).toBeDefined();
  });

  it('defaults status to todo and priority to medium', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app).post('/api/tasks').send({ title: 'Minimal' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe('todo');
    expect(res.body.data.priority).toBe('medium');
    expect(res.body.data.completed).toBe(false);
  });

  it('sets completed true when status is done', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app).post('/api/tasks').send({ title: 'Done task', status: 'done' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.completed).toBe(true);
  });

  it('returns 400 when title is missing', async () => {
    // Arrange / Act
    const res = await request(app).post('/api/tasks').send({ priority: 'low' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/title/i)]));
  });

  it('returns 400 for invalid priority value', async () => {
    // Arrange / Act
    const res = await request(app).post('/api/tasks').send({ title: 'T', priority: 'urgent' });

    // Assert
    expect(res.status).toBe(400);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/priority/i)]));
  });

  it('returns 400 for invalid status value', async () => {
    // Arrange / Act
    const res = await request(app).post('/api/tasks').send({ title: 'T', status: 'done-done' });

    // Assert
    expect(res.status).toBe(400);
  });

  it('preserves the description when explicitly provided', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app)
      .post('/api/tasks')
      .send({ title: 'With desc', description: 'my description' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('my description');
  });

  it('defaults description to empty string when not provided', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app).post('/api/tasks').send({ title: 'No desc' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.description).toBe('');
  });

  it('strips unknown fields from body', async () => {
    // Arrange
    taskStore.createTask.mockImplementation(async (t) => t);

    // Act
    const res = await request(app).post('/api/tasks').send({ title: 'T', foo: 'bar' });

    // Assert
    expect(res.status).toBe(201);
    expect(res.body.data.foo).toBeUndefined();
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.createTask.mockRejectedValue(new Error('disk error'));

    // Act
    const res = await request(app).post('/api/tasks').send({ title: 'T' });

    // Assert
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// PUT /api/tasks/:id
// ---------------------------------------------------------------------------
describe('PUT /api/tasks/:id', () => {
  it('updates a task and returns 200', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK);
    taskStore.updateTask.mockResolvedValue({ ...TASK, title: 'Updated', updatedAt: '2026-02-01T00:00:00.000Z' });

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ title: 'Updated' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.title).toBe('Updated');
  });

  it('returns 404 when task does not exist', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(null);

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ title: 'X' });

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 for invalid status transition (todo → done)', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK); // status: todo

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ status: 'done' });

    // Assert
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.stringMatching(/transition/i)]));
  });

  it('allows same-status update (no-op transition)', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK); // status: todo
    taskStore.updateTask.mockResolvedValue(TASK);

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ status: 'todo' });

    // Assert
    expect(res.status).toBe(200);
  });

  it('allows todo → in-progress transition', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK);
    taskStore.updateTask.mockResolvedValue({ ...TASK, status: 'in-progress' });

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ status: 'in-progress' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe('in-progress');
  });

  it('sets completed true when updating status to done', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(IN_PROGRESS_TASK);
    taskStore.updateTask.mockImplementation(async (_id, updates) => ({ ...IN_PROGRESS_TASK, ...updates }));

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ status: 'done' });

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.data.completed).toBe(true);
  });

  it('returns 400 when body is empty', async () => {
    // Arrange / Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({});

    // Assert
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid UUID param', async () => {
    // Arrange / Act
    const res = await request(app).put('/api/tasks/bad-uuid').send({ title: 'X' });

    // Assert
    expect(res.status).toBe(400);
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.getTaskById.mockRejectedValue(new Error('io error'));

    // Act
    const res = await request(app).put(`/api/tasks/${TASK.id}`).send({ title: 'X' });

    // Assert
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/tasks/:id
// ---------------------------------------------------------------------------
describe('DELETE /api/tasks/:id', () => {
  it('deletes a task and returns 204 with empty body', async () => {
    // Arrange
    taskStore.deleteTask.mockResolvedValue(true);

    // Act
    const res = await request(app).delete(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(204);
    expect(res.text).toBe('');
  });

  it('returns 404 when task does not exist', async () => {
    // Arrange
    taskStore.deleteTask.mockResolvedValue(false);

    // Act
    const res = await request(app).delete(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 400 for invalid UUID param', async () => {
    // Arrange / Act
    const res = await request(app).delete('/api/tasks/not-a-uuid');

    // Assert
    expect(res.status).toBe(400);
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.deleteTask.mockRejectedValue(new Error('io error'));

    // Act
    const res = await request(app).delete(`/api/tasks/${TASK.id}`);

    // Assert
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// POST /api/tasks/:id/complete
// ---------------------------------------------------------------------------
describe('POST /api/tasks/:id/complete', () => {
  it('completes an in-progress task and returns 200', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(IN_PROGRESS_TASK);
    taskStore.updateTask.mockResolvedValue(DONE_TASK);

    // Act
    const res = await request(app).post(`/api/tasks/${TASK.id}/complete`);

    // Assert
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('done');
    expect(res.body.data.completed).toBe(true);
  });

  it('returns 404 when task does not exist', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(null);

    // Act
    const res = await request(app).post(`/api/tasks/${TASK.id}/complete`);

    // Assert
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });

  it('returns 422 when task status is todo (not in-progress)', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(TASK); // status: todo

    // Act
    const res = await request(app).post(`/api/tasks/${TASK.id}/complete`);

    // Assert
    expect(res.status).toBe(422);
    expect(res.body.success).toBe(false);
    expect(res.body.errors[0]).toMatch(/in-progress/i);
  });

  it('returns 422 when task is already done', async () => {
    // Arrange
    taskStore.getTaskById.mockResolvedValue(DONE_TASK);

    // Act
    const res = await request(app).post(`/api/tasks/${TASK.id}/complete`);

    // Assert
    expect(res.status).toBe(422);
  });

  it('returns 400 for invalid UUID param', async () => {
    // Arrange / Act
    const res = await request(app).post('/api/tasks/bad-uuid/complete');

    // Assert
    expect(res.status).toBe(400);
  });

  it('returns 500 when taskStore throws', async () => {
    // Arrange
    taskStore.getTaskById.mockRejectedValue(new Error('io error'));

    // Act
    const res = await request(app).post(`/api/tasks/${TASK.id}/complete`);

    // Assert
    expect(res.status).toBe(500);
  });
});
