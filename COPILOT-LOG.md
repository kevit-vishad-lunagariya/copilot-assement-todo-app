# Copilot Usage Log

---

## 1. Inline Suggestions

<!-- Minimum: 3 examples. Format: `[file]: [comment typed] → [what Copilot generated]` -->

<!-- Example (replace with real entries as you work):
- `backend/controllers/tasksController.js`: `// Read all tasks from tasks.json and return them` → Copilot generated `getTasks` async function with fs.readFile, JSON.parse, and 200 response
- `backend/routes/tasks.js`: `// DELETE /api/tasks/:id – remove a task by id` → Copilot generated full Express route delegating to deleteTask controller
- `frontend/src/services/taskService.ts`: `// Fetch all tasks from the API using axios` → Copilot generated axiosGet wrapper with response envelope destructuring
-->

---

## 2. Agent Mode Prompts

<!-- Minimum: 3 prompts. Format: `[prompt] → [files changed / result]` -->

<!-- Example (replace with real entries as you work):
- "Generate the entire frontend task list UI with MUI, loading states, and error toasts" → Created `src/components/TaskList.tsx`, `src/services/taskService.ts`, `src/pages/HomePage.tsx`
- "Add the GET /api/tasks/stats route and wire the stats card on the frontend" → Modified `backend/routes/tasks.js`, `backend/controllers/tasksController.js`, created `src/components/StatsCard.tsx`
- "Add joi validation to all POST and PUT routes in the backend" → Modified `backend/controllers/tasksController.js`, created `backend/validators/taskValidator.js`
-->

---

## 3. Sub-Agent Usage

<!-- Minimum: at least 1 prompt per agent (3 total). Format: `@agent-name: [prompt] → [result]` -->

<!-- Example (replace with real entries as you work):
- @backend-agent: "Add the POST /api/tasks/:id/complete route with status workflow validation (todo → in-progress → done)" → Created route in `routes/tasks.js`, added `completeTask` controller with 422 guard
- @ui-agent: "Build the Add Task modal form with MUI Dialog, controlled inputs, and validation error display" → Created `src/components/AddTaskModal.tsx` with form state, loading button, and error Alert
- @testing-agent: "Write unit tests for tasksController covering all CRUD methods, validation errors, and 404 branches — target >80% coverage" → Created `backend/__tests__/tasksController.test.js` with 18 test cases
-->

---

## 4. Review Agent

<!-- Format: bullet list of issues found, then bullet list of fixes applied -->

**Issues found:**

<!-- Example (replace with real entries after running the review):
- `backend/controllers/tasksController.js` line 12: `createTask` missing JSDoc `@param` and `@returns`
- `backend/routes/tasks.js` line 34: `PUT /api/tasks/:id` uses bare `if (!req.body.title)` instead of joi schema
- `backend/controllers/tasksController.js` line 88: `createTask` returns `200` instead of `201` for new resource
-->

**Fixes applied:**

<!-- Example (replace with real entries after fixing):
- Added JSDoc block with `@param {Object} req`, `@param {Object} res`, `@returns {void}` to `createTask`
- Replaced ad-hoc body check with `taskCreateSchema.validate(req.body)` joi schema in PUT handler
- Changed status code from `res.status(200)` to `res.status(201)` in `createTask`
-->

---

## 5. Skills

<!-- Minimum: 2 suggestions applied. Format: `Skill: [name] | Prompt: [prompt] | Changes: [what improved]` -->

<!-- Example (replace with real entries as you work):
- Skill: `vercel-react-best-practices` | Prompt: "Review my TaskList component for React performance issues" | Changes: Wrapped callback props in `useCallback`, added `React.memo` to `TaskRow`, moved static data outside component
- Skill: `vercel-react-best-practices` | Prompt: "Optimise data fetching in the HomePage component" | Changes: Moved fetch into a custom `useTasks` hook, added `Suspense` boundary, used `startTransition` for filter updates
-->

---

## 6. Playwright MCP

<!-- Format: screenshot confirmation + generated E2E test filename -->

- Screenshot taken: <!-- yes / no -->
- E2E test generated: <!-- e.g. `tests/e2e/tasks.spec.ts` -->

<!-- Example prompt used (replace with actual):
  "Take a screenshot of the running app at http://localhost:5173, then generate a Playwright E2E test that covers: page load, adding a task, completing a task, deleting a task, and filtering by priority."
-->
