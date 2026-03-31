'use strict';

jest.mock('fs/promises');

const fs = require('fs/promises');
const taskStore = require('../../data/taskStore');

const TASK_A = {
  id: '11111111-1111-4111-a111-111111111111',
  title: 'Task A',
  description: 'desc A',
  status: 'todo',
  priority: 'low',
  completed: false,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

const TASK_B = {
  id: '22222222-2222-4222-b222-222222222222',
  title: 'Task B',
  description: '',
  status: 'in-progress',
  priority: 'high',
  completed: false,
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

function seedFs(tasks) {
  fs.readFile.mockResolvedValue(JSON.stringify(tasks));
  fs.writeFile.mockResolvedValue(undefined);
}

beforeEach(() => {
  jest.clearAllMocks();
});

// ---------------------------------------------------------------------------
// getAllTasks
// ---------------------------------------------------------------------------
describe('getAllTasks', () => {
  it('returns all tasks when no filters supplied', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.getAllTasks();

    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].id).toBe(TASK_A.id);
  });

  it('filters by status', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.getAllTasks({ status: 'todo' });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TASK_A.id);
  });

  it('filters by priority', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.getAllTasks({ priority: 'high' });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TASK_B.id);
  });

  it('filters by both status and priority', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.getAllTasks({ status: 'in-progress', priority: 'high' });

    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(TASK_B.id);
  });

  it('returns empty array when data file does not exist (ENOENT)', async () => {
    // Arrange
    const enoent = Object.assign(new Error('ENOENT'), { code: 'ENOENT' });
    fs.readFile.mockRejectedValue(enoent);

    // Act
    const result = await taskStore.getAllTasks();

    // Assert
    expect(result).toEqual([]);
  });

  it('throws on unexpected file read errors', async () => {
    // Arrange
    fs.readFile.mockRejectedValue(new Error('disk error'));

    // Act & Assert
    await expect(taskStore.getAllTasks()).rejects.toThrow('disk error');
  });

  it('returns empty array when filtering produced no matches', async () => {
    // Arrange
    seedFs([TASK_A]);

    // Act
    const result = await taskStore.getAllTasks({ status: 'done' });

    // Assert
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getTaskById
// ---------------------------------------------------------------------------
describe('getTaskById', () => {
  it('returns the matching task', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.getTaskById(TASK_A.id);

    // Assert
    expect(result).toMatchObject({ id: TASK_A.id, title: 'Task A' });
  });

  it('returns null when task is not found', async () => {
    // Arrange
    seedFs([TASK_A]);

    // Act
    const result = await taskStore.getTaskById('99999999-9999-4999-c999-999999999999');

    // Assert
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// createTask
// ---------------------------------------------------------------------------
describe('createTask', () => {
  it('appends the new task and writes the file', async () => {
    // Arrange
    seedFs([TASK_A]);
    const newTask = { ...TASK_B, id: '33333333-3333-4333-c333-333333333333' };

    // Act
    const result = await taskStore.createTask(newTask);

    // Assert
    expect(result).toMatchObject(newTask);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
    const written = JSON.parse(fs.writeFile.mock.calls[0][1]);
    expect(written).toHaveLength(2);
    expect(written[1].id).toBe(newTask.id);
  });
});

// ---------------------------------------------------------------------------
// updateTask
// ---------------------------------------------------------------------------
describe('updateTask', () => {
  it('merges updates and writes the file', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.updateTask(TASK_A.id, { status: 'in-progress' });

    // Assert
    expect(result.status).toBe('in-progress');
    expect(result.id).toBe(TASK_A.id);
    expect(fs.writeFile).toHaveBeenCalledTimes(1);
  });

  it('returns null and does not write when task not found', async () => {
    // Arrange
    seedFs([TASK_A]);

    // Act
    const result = await taskStore.updateTask('99999999-9999-4999-c999-999999999999', { status: 'done' });

    // Assert
    expect(result).toBeNull();
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// deleteTask
// ---------------------------------------------------------------------------
describe('deleteTask', () => {
  it('removes the task and returns true', async () => {
    // Arrange
    seedFs([TASK_A, TASK_B]);

    // Act
    const result = await taskStore.deleteTask(TASK_A.id);

    // Assert
    expect(result).toBe(true);
    const written = JSON.parse(fs.writeFile.mock.calls[0][1]);
    expect(written).toHaveLength(1);
    expect(written[0].id).toBe(TASK_B.id);
  });

  it('returns false when task not found', async () => {
    // Arrange
    seedFs([TASK_A]);

    // Act
    const result = await taskStore.deleteTask('99999999-9999-4999-c999-999999999999');

    // Assert
    expect(result).toBe(false);
    expect(fs.writeFile).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// getTaskStats
// ---------------------------------------------------------------------------
describe('getTaskStats', () => {
  it('returns correct counts grouped by status and priority', async () => {
    // Arrange
    const tasks = [
      { ...TASK_A, status: 'todo', priority: 'low' },
      { ...TASK_B, status: 'in-progress', priority: 'high' },
      { id: '33333333-3333-4333-a333-333333333333', status: 'done', priority: 'medium' },
    ];
    seedFs(tasks);

    // Act
    const stats = await taskStore.getTaskStats();

    // Assert
    expect(stats.total).toBe(3);
    expect(stats.byStatus).toEqual({ todo: 1, 'in-progress': 1, done: 1 });
    expect(stats.byPriority).toEqual({ low: 1, medium: 1, high: 1 });
  });

  it('returns zeroed counts for empty data file', async () => {
    // Arrange
    seedFs([]);

    // Act
    const stats = await taskStore.getTaskStats();

    // Assert
    expect(stats.total).toBe(0);
    expect(stats.byStatus).toEqual({ todo: 0, 'in-progress': 0, done: 0 });
    expect(stats.byPriority).toEqual({ low: 0, medium: 0, high: 0 });
  });

  it('skips unknown status/priority values safely', async () => {
    // Arrange
    seedFs([{ ...TASK_A, status: 'unknown-status', priority: 'unknown-priority' }]);

    // Act
    const stats = await taskStore.getTaskStats();

    // Assert
    expect(stats.total).toBe(1);
    expect(stats.byStatus).toEqual({ todo: 0, 'in-progress': 0, done: 0 });
    expect(stats.byPriority).toEqual({ low: 0, medium: 0, high: 0 });
  });
});
