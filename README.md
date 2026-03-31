# TaskFlow — Full-Stack Todo App (React + Node/Express)

A full-stack task-management application with a **React 19/Vite** frontend and a **Node.js/Express** REST API backend. Task data is persisted in a flat-file JSON store on the server.

---

## Tech Stack

| Layer    | Technology                                                       |
|----------|------------------------------------------------------------------|
| Frontend | React 19, Vite 8, MUI (Material UI v7), axios, ESLint           |
| Backend  | Node.js ≥ 20, Express 4, joi, uuid v4, winston, dotenv          |
| API Docs | swagger-jsdoc + swagger-ui-express (served at `/api-docs`)      |
| Testing  | Jest + supertest (backend), Playwright (frontend E2E)            |
| Storage  | Flat-file JSON (`backend/data/tasks.json`)                       |

---

## Project Structure

```
copilot-assement-todo-app/
├── backend/
│   ├── __tests__/                  # Jest unit + integration tests
│   │   ├── controllers/
│   │   ├── data/
│   │   ├── middleware/
│   │   └── validators/
│   ├── config/
│   │   ├── logger.js               # Winston logger configuration
│   │   └── swagger.js              # swagger-jsdoc spec configuration
│   ├── controllers/
│   │   └── tasksController.js      # Route handler logic
│   ├── data/
│   │   ├── tasks.json              # Persisted task data
│   │   └── taskStore.js            # fs/promises read/write helpers
│   ├── middleware/
│   │   └── errorHandler.js         # Global error handler
│   ├── routes/
│   │   └── tasks.js                # /api/tasks router with Swagger annotations
│   ├── validators/
│   │   └── taskValidator.js        # joi validation schemas
│   ├── server.js                   # Express entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── AddTaskDialog/      # Dialog for creating tasks
│   │   │   ├── EditTaskDialog/     # Dialog for editing tasks
│   │   │   └── TaskTable/          # Main task list table with filters
│   │   ├── services/
│   │   │   └── tasksService.js     # axios API wrappers (all HTTP calls)
│   │   ├── App.jsx                 # Root component
│   │   └── main.jsx                # ReactDOM entry point
│   ├── tests/
│   │   └── e2e/
│   │       └── tasks.spec.js       # Playwright end-to-end tests
│   ├── index.html
│   ├── playwright.config.js
│   ├── vite.config.js
│   └── package.json
├── .github/
│   ├── agents/                     # Sub-agent instruction files
│   └── copilot-instructions.md     # Code review checklist for Copilot
├── AGENTS.md                       # Agent guide and coding standards
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 20 LTS
- **npm** ≥ 9

---

## Getting Started

### 1. Clone the repository

```bash
git clone <repo-url>
cd copilot-assement-todo-app
```

### 2. Set up the Backend

```bash
cd backend
npm install
cp .env.example .env   # edit as needed
```

| Variable | Default | Description          |
|----------|---------|----------------------|
| `PORT`   | `5000`  | Port the API runs on |

Start the backend:

```bash
npm run dev    # Development with auto-reload (nodemon)
npm start      # Production
```

The API is available at `http://localhost:5000`.
Interactive API docs (Swagger UI) are at `http://localhost:5000/api-docs`.

### 3. Set up the Frontend

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

The frontend is available at `http://localhost:5173`.

---

## API Endpoints

All task endpoints are prefixed with `/api/tasks`.

| Method | Endpoint                    | Description                                     |
|--------|-----------------------------|-------------------------------------------------|
| GET    | `/health`                   | Health check                                    |
| GET    | `/api/tasks`                | List all tasks (filterable by status / priority)|
| GET    | `/api/tasks/stats`          | Task counts grouped by status and priority      |
| GET    | `/api/tasks/:id`            | Get a single task by UUID                       |
| POST   | `/api/tasks`                | Create a new task                               |
| PUT    | `/api/tasks/:id`            | Update a task (partial update supported)        |
| DELETE | `/api/tasks/:id`            | Delete a task — returns `204 No Content`        |
| POST   | `/api/tasks/:id/complete`   | Mark a task as done                             |

### Task Model

```json
{
  "id":          "uuid-v4",
  "title":       "Buy groceries",
  "description": "Milk, eggs, bread",
  "status":      "todo | in-progress | done",
  "priority":    "low | medium | high",
  "completed":   false,
  "createdAt":   "2026-03-31T10:00:00.000Z",
  "updatedAt":   "2026-03-31T10:00:00.000Z"
}
```

### Create a task — `POST /api/tasks`

```json
{
  "title":       "Buy groceries",
  "description": "Milk, eggs, bread",
  "priority":    "medium",
  "status":      "todo"
}
```

**Response `201 Created`**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "title": "Buy groceries",
    "description": "Milk, eggs, bread",
    "status": "todo",
    "priority": "medium",
    "completed": false,
    "createdAt": "2026-03-31T10:00:00.000Z",
    "updatedAt": "2026-03-31T10:00:00.000Z"
  }
}
```

### Filter tasks — `GET /api/tasks?status=todo&priority=high`

| Query param | Accepted values               | Description             |
|-------------|-------------------------------|-------------------------|
| `status`    | `todo`, `in-progress`, `done` | Filter by task status   |
| `priority`  | `low`, `medium`, `high`       | Filter by task priority |

---

## Available Scripts

### Backend (`/backend`)

| Script               | Description                            |
|----------------------|----------------------------------------|
| `npm start`          | Start server with Node.js              |
| `npm run dev`        | Start server with nodemon (watch mode) |
| `npm test`           | Run Jest tests with coverage report    |
| `npm run test:watch` | Run Jest in interactive watch mode     |

### Frontend (`/frontend`)

| Script                    | Description                             |
|---------------------------|-----------------------------------------|
| `npm run dev`             | Start Vite dev server (HMR)             |
| `npm run build`           | Production build → `dist/`              |
| `npm run preview`         | Preview production build locally        |
| `npm run lint`            | Run ESLint                              |
| `npm run test:e2e`        | Run Playwright E2E tests (headless)     |
| `npm run test:e2e:headed` | Run Playwright tests in headed mode     |
| `npm run test:e2e:ui`     | Open Playwright interactive UI          |

---

## Testing

### Backend (Jest + supertest)

```bash
cd backend
npm test
```

Coverage thresholds (enforced): **≥ 80 %** on lines, statements, branches, and functions.
Test files live in `backend/__tests__/`.

### Frontend E2E (Playwright)

Requires both backend and frontend dev servers to be running:

```bash
# Terminal 1
cd backend && npm run dev

# Terminal 2
cd frontend && npm run dev

# Terminal 3
cd frontend && npm run test:e2e
```

E2E test files live in `frontend/tests/e2e/`.

---

## Environment Variables

Create `backend/.env` from the example template. **Never commit `.env` to version control.**

```env
PORT=5000
```

---

## License

MIT

