// @ts-check
import { test, expect } from '@playwright/test';

// ---------------------------------------------------------------------------
// Shared fixtures
// ---------------------------------------------------------------------------

const SAMPLE_TASKS = [
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000001',
    title: 'Buy groceries',
    description: 'Milk, eggs, bread',
    status: 'todo',
    priority: 'high',
    createdAt: '2026-03-01T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000002',
    title: 'Read a book',
    description: '',
    status: 'in-progress',
    priority: 'low',
    createdAt: '2026-03-02T10:00:00.000Z',
  },
  {
    id: 'aaaaaaaa-0000-0000-0000-000000000003',
    title: 'Write report',
    description: '',
    status: 'todo',
    priority: 'medium',
    createdAt: '2026-03-03T10:00:00.000Z',
  },
];

/**
 * Intercept GET /api/tasks and return the provided task list.
 * @param {import('@playwright/test').Page} page
 * @param {object[]} tasks
 */
async function mockGetTasks(page, tasks) {
  await page.route('**/api/tasks', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, data: tasks, total: tasks.length }),
    });
  });
}

// ---------------------------------------------------------------------------
// 1. Page load
// ---------------------------------------------------------------------------

test.describe('Page load', () => {
  test('displays the app header, task table heading, and loaded tasks', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, SAMPLE_TASKS);

    // Act
    await page.goto('/');

    // Assert — app header
    await expect(page.getByText('TaskFlow')).toBeVisible();

    // Assert — "Tasks" section heading
    await expect(page.getByRole('heading', { name: 'Tasks' })).toBeVisible();

    // Assert — table is present
    await expect(page.getByRole('table', { name: 'Tasks table' })).toBeVisible();

    // Assert — sample tasks rendered
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Read a book')).toBeVisible();
    await expect(page.getByText('Write report')).toBeVisible();
  });

  test('shows empty-state message when there are no tasks', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, []);

    // Act
    await page.goto('/');

    // Assert
    await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  });

  test('shows error alert when the API call fails', async ({ page }) => {
    // Arrange
    await page.route('**/api/tasks', (route) => {
      route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ success: false, message: 'Internal error' }) });
    });

    // Act
    await page.goto('/');

    // Assert
    await expect(page.getByRole('alert')).toContainText('Failed to load tasks');
  });
});

// ---------------------------------------------------------------------------
// 2. Add task
// ---------------------------------------------------------------------------

test.describe('Add task', () => {
  test('creates a new task and shows it in the table', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, []);

    const newTask = {
      id: 'bbbbbbbb-0000-0000-0000-000000000001',
      title: 'Playwright test task',
      description: '',
      status: 'todo',
      priority: 'medium',
      createdAt: new Date().toISOString(),
    };

    await page.route('**/api/tasks', (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      route.fulfill({
        status: 201,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: newTask }),
      });
    });

    await page.goto('/');

    // Act — open dialog
    await page.getByRole('button', { name: 'Add new task' }).click();
    await expect(page.getByRole('dialog', { name: 'Add New Task' })).toBeVisible();

    // Act — fill in title and submit (scope to dialog to avoid ambiguity with
    // the search input which also uses aria-label containing "title")
    const addDialog = page.getByRole('dialog', { name: 'Add New Task' });
    await addDialog.getByRole('textbox', { name: 'Title' }).fill('Playwright test task');
    await addDialog.getByRole('button', { name: 'Add Task' }).click();

    // Assert — dialog closes and task appears in the table
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(page.getByText('Playwright test task')).toBeVisible();
  });

  test('shows inline validation error when title is empty', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, []);
    await page.goto('/');

    // Act — open dialog and submit without filling in a title
    await page.getByRole('button', { name: 'Add new task' }).click();
    await page.getByRole('button', { name: 'Add Task' }).click();

    // Assert — validation message visible and dialog still open
    await expect(page.getByText('Title is required')).toBeVisible();
    await expect(page.getByRole('dialog', { name: 'Add New Task' })).toBeVisible();
  });

  test('shows API error alert when the create request fails', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, []);

    await page.route('**/api/tasks', (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Server error' }),
      });
    });

    await page.goto('/');

    // Act
    await page.getByRole('button', { name: 'Add new task' }).click();
    const addDialog = page.getByRole('dialog', { name: 'Add New Task' });
    await addDialog.getByRole('textbox', { name: 'Title' }).fill('Fail task');
    await addDialog.getByRole('button', { name: 'Add Task' }).click();

    // Assert — error shown inside dialog
    await expect(page.getByRole('dialog').getByRole('alert')).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 3. Complete task
// ---------------------------------------------------------------------------

test.describe('Complete task', () => {
  test('advances a todo task to in-progress when Start is clicked', async ({ page }) => {
    // Arrange
    const task = { ...SAMPLE_TASKS[0] }; // status: 'todo'
    await mockGetTasks(page, [task]);

    const updatedTask = { ...task, status: 'in-progress' };

    await page.route(`**/api/tasks/${task.id}`, (route) => {
      if (route.request().method() !== 'PUT') return route.fallback();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: updatedTask }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(task.title)).toBeVisible();

    // Act — click the "Start" action button for this task
    await page.getByRole('button', { name: `Start ${task.title}` }).click();

    // Assert — status chip now shows "In Progress"
    await expect(page.getByRole('button', { name: `${task.title} is done` })).not.toBeVisible();
  });

  test('advances an in-progress task to done when Complete is clicked', async ({ page }) => {
    // Arrange
    const task = { ...SAMPLE_TASKS[1] }; // status: 'in-progress'
    await mockGetTasks(page, [task]);

    const completedTask = { ...task, status: 'done' };

    await page.route(`**/api/tasks/${task.id}/complete`, (route) => {
      if (route.request().method() !== 'POST') return route.fallback();
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, data: completedTask }),
      });
    });

    await page.goto('/');
    await expect(page.getByText(task.title)).toBeVisible();

    // Act
    await page.getByRole('button', { name: `Complete ${task.title}` }).click();

    // Assert — the complete button is now disabled (task is done)
    await expect(page.getByRole('button', { name: `${task.title} is done` })).toBeVisible();
    await expect(page.getByRole('button', { name: `${task.title} is done` })).toBeDisabled();
  });
});

// ---------------------------------------------------------------------------
// 4. Delete task
// ---------------------------------------------------------------------------

test.describe('Delete task', () => {
  test('removes a task from the list after confirming deletion', async ({ page }) => {
    // Arrange
    const task = { ...SAMPLE_TASKS[0] };
    await mockGetTasks(page, [task]);

    await page.route(`**/api/tasks/${task.id}`, (route) => {
      if (route.request().method() !== 'DELETE') return route.fallback();
      route.fulfill({ status: 204, body: '' });
    });

    await page.goto('/');
    await expect(page.getByText(task.title)).toBeVisible();

    // Act — click delete icon then confirm
    await page.getByRole('button', { name: `Delete ${task.title}` }).click();
    await expect(page.getByRole('dialog', { name: 'Delete Task?' })).toBeVisible();
    await page.getByRole('button', { name: 'Delete' }).click();

    // Assert — task row gone
    await expect(page.getByText(task.title)).not.toBeVisible();
    await expect(page.getByText('No tasks yet. Add your first task!')).toBeVisible();
  });

  test('keeps the task when the deletion confirmation is cancelled', async ({ page }) => {
    // Arrange
    const task = { ...SAMPLE_TASKS[0] };
    await mockGetTasks(page, [task]);
    await page.goto('/');

    // Act — open dialog then cancel
    await page.getByRole('button', { name: `Delete ${task.title}` }).click();
    await expect(page.getByRole('dialog', { name: 'Delete Task?' })).toBeVisible();
    await page.getByRole('button', { name: 'Cancel' }).click();

    // Assert — task still in the list
    await expect(page.getByText(task.title)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// 5. Priority filter
// ---------------------------------------------------------------------------

test.describe('Priority filter', () => {
  test('shows only high-priority tasks when "High" is selected', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, SAMPLE_TASKS);
    await page.goto('/');
    await expect(page.getByText('Buy groceries')).toBeVisible();   // high
    await expect(page.getByText('Read a book')).toBeVisible();      // low
    await expect(page.getByText('Write report')).toBeVisible();     // medium

    // Act — open the Priority select and pick "High"
    await page.getByLabel('Priority').click();
    await page.getByRole('option', { name: 'High' }).click();

    // Assert — only the high-priority task is visible
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Read a book')).not.toBeVisible();
    await expect(page.getByText('Write report')).not.toBeVisible();
  });

  test('shows only low-priority tasks when "Low" is selected', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, SAMPLE_TASKS);
    await page.goto('/');

    // Act
    await page.getByLabel('Priority').click();
    await page.getByRole('option', { name: 'Low' }).click();

    // Assert
    await expect(page.getByText('Read a book')).toBeVisible();
    await expect(page.getByText('Buy groceries')).not.toBeVisible();
    await expect(page.getByText('Write report')).not.toBeVisible();
  });

  test('restores all tasks when priority filter is cleared', async ({ page }) => {
    // Arrange
    await mockGetTasks(page, SAMPLE_TASKS);
    await page.goto('/');

    // Apply filter first
    await page.getByLabel('Priority').click();
    await page.getByRole('option', { name: 'High' }).click();
    await expect(page.getByText('Read a book')).not.toBeVisible();

    // Act — clear the filter via the clear-filters icon button
    await page.getByRole('button', { name: 'Clear status and priority filters' }).click();

    // Assert — all tasks visible again
    await expect(page.getByText('Buy groceries')).toBeVisible();
    await expect(page.getByText('Read a book')).toBeVisible();
    await expect(page.getByText('Write report')).toBeVisible();
  });
});
