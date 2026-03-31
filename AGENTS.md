# AGENTS.md — Copilot Agent Guide

This file is the single source of truth for all AI agents working in this repository.
Read it fully before making any changes.

---

## Table of Contents

1. [Project Architecture](#1-project-architecture)
2. [Tech Stack](#2-tech-stack)
3. [Backend Coding Standards](#3-backend-coding-standards)
4. [Frontend Coding Standards](#4-frontend-coding-standards)
5. [API Response Envelope](#5-api-response-envelope)
6. [Sub-Agent Descriptions](#6-sub-agent-descriptions)
7. [Patterns to Follow](#7-patterns-to-follow)
8. [Patterns to Avoid](#8-patterns-to-avoid)

---

## 1. Project Architecture

This is a full-stack **Todo application** with a clearly separated backend and frontend. The two halves are independent — they never import from each other.

```
copilot-assement-todo-app/
├── backend/                        # Node.js / Express REST API
│   ├── controllers/
│   │   └── tasksController.js      # Pure business logic — no req/res beyond what is needed
│   ├── data/
│   │   └── tasks.json              # Flat-file JSON persistence layer
│   ├── middleware/
│   │   └── errorHandler.js         # Central 4-parameter Express error handler
│   ├── routes/
│   │   └── tasks.js                # Express Router — thin, delegates to controllers
│   ├── server.js                   # App entry point: middleware wiring, router mounting
│   └── package.json
├── frontend/                       # React 19 + Vite SPA
│   ├── public/
│   ├── src/
│   │   ├── assets/                 # Static images / SVGs
│   │   ├── components/             # Reusable UI components (create as needed)
│   │   ├── pages/                  # Route-level page components (create as needed)
│   │   ├── services/               # Axios API wrappers (create as needed)
│   │   ├── App.jsx / App.tsx       # Root component and router outlet
│   │   ├── App.css
│   │   ├── index.css
│   │   └── main.jsx / main.tsx     # ReactDOM.createRoot entry
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── .github/
│   └── agents/                     # Agent instruction files
│       ├── backend-agent.agent.md
│       ├── testing-agent.agent.md
│       └── ui-agent.agent.md
├── AGENTS.md                       # ← you are here
└── README.md
```

**Data flow**: React UI → `services/` (axios) → Express routes → controllers → `data/tasks.json`.

---

## 2. Tech Stack

### Backend

| Concern          | Library / Tool              | Version   |
|------------------|-----------------------------|-----------|
| Runtime          | Node.js                     | ≥ 20 LTS  |
| Framework        | Express                     | ^4.18.2   |
| CORS             | cors                        | ^2.8.5    |
| Environment vars | dotenv                      | ^16.4.5   |
| ID generation    | uuid (v4)                   | ^9.0.0    |
| Validation       | joi                         | (to add)  |
| Logging          | winston                     | (to add)  |
| API docs         | swagger-jsdoc + swagger-ui-express | (to add) |
| Dev server       | nodemon                     | ^3.1.0    |

### Frontend

| Concern          | Library / Tool              | Version   |
|------------------|-----------------------------|-----------|
| UI Library       | React                       | ^19.2.4   |
| Bundler          | Vite                        | ^8.0.1    |
| Component lib    | MUI (Material UI)           | (to add)  |
| HTTP client      | axios                       | (to add)  |
| Routing          | React Router                | (to add)  |
| Linting          | ESLint                      | ^9.39.4   |
| TypeScript types | @types/react, @types/react-dom | ^19.x  |

### Storage

Flat-file JSON persistence — `backend/data/tasks.json` (array of task objects). No database is used.

---

## 3. Backend Coding Standards

### Language & Module System

- Use **CommonJS** (`require` / `module.exports`) — the backend is not an ES module project.
- TypeScript migration is in scope for future work; `.js` files are acceptable now.

### File Responsibilities

| File              | Responsibility |
|-------------------|----------------|
| `server.js`       | Mount middleware, mount routers, start server. No business logic. |
| `routes/tasks.js` | Map HTTP verbs + paths → controller methods. No logic. |
| `controllers/tasksController.js` | Validate input, call data helpers, return response. |
| `middleware/errorHandler.js` | Catch all unhandled errors, format error response envelope. |
| `data/`           | `fs/promises` read/write helpers only. No Express objects. |

### Validation

- Validate all incoming request bodies using **joi** schemas before any data access.
- Return `400 Bad Request` with a `{ success: false, message, errors[] }` body on validation failure.

### HTTP Status Codes

| Scenario                         | Status |
|----------------------------------|--------|
| Successful retrieval             | 200    |
| Resource created                 | 201    |
| Successful update                | 200    |
| Successful deletion (no body)    | 204    |
| Validation failure               | 400    |
| Resource not found               | 404    |
| Internal / unexpected error      | 500    |

### Logging

- Use **winston** for all server-side logging. Never use bare `console.log` in production code (health checks and startup messages are the only exceptions).

### Environment Variables

- All configuration lives in `.env` and is accessed via `process.env`. Never hard-code ports, file paths, or secrets.

### ID Generation

- All new task IDs must be **uuid v4** strings.

---

## 4. Frontend Coding Standards

### Language

- Current files are `.jsx`. Migrate any file you touch to **`.tsx`** (TypeScript JSX) as you work.
- Strict TypeScript — no implicit `any`.

### Component Rules

- One component per file; filename matches the exported component name (PascalCase).
- Prefer **functional components** with hooks — no class components.
- State management: **`useState`** for local state, **`useReducer`** for complex state — no external state library (no Redux, no Zustand).

### Styling

- **MUI (Material UI)** is the component library for all UI elements.
- Global resets and CSS custom properties only in `index.css`.
- No inline `style={{}}` props except for truly one-off dynamic values.

### API Calls

- All HTTP calls must go through **axios** wrappers in `frontend/src/services/`.
- Never call `fetch()` directly from a component.
- Always destructure `success` and `data` from the response envelope.

### Routing

- Use **React Router** for all navigation. No manual `window.location` manipulation.

### Accessibility

- All interactive elements require keyboard navigation.
- Images require meaningful `alt` text (or `alt=""` for decorative images).
- Aim for **WCAG AA** compliance.

---

## 5. API Response Envelope

**Every** endpoint must return a consistent JSON envelope. No ad-hoc response shapes.

### Success — single resource

```json
{
  "success": true,
  "data": {
    "id": "uuid-v4",
    "title": "Buy groceries",
    "completed": false,
    "createdAt": "2026-03-31T10:00:00.000Z"
  }
}
```

### Success — collection

```json
{
  "success": true,
  "data": [
    { "id": "...", "title": "...", "completed": false }
  ],
  "total": 1
}
```

### Success — deletion (no body)

HTTP `204 No Content` — empty body, no JSON.

### Error

```json
{
  "success": false,
  "message": "Human-readable summary of the error",
  "errors": [
    "title is required",
    "completed must be a boolean"
  ]
}
```

> **Rule**: The `errors` array is present on validation failures (400). For 404 and 500 responses, `errors` may be omitted or left as an empty array.

The central `errorHandler.js` middleware must emit this shape for all unhandled errors.

---

## 6. Sub-Agent Descriptions

Three specialised agents are configured in `.github/agents/`. Each agent is **strictly scoped** — it never modifies files outside its domain.

---

### Backend Agent

**File**: `.github/agents/backend-agent.agent.md`

**Purpose**: Builds and maintains everything under `backend/` — routes, controllers, middleware, validation schemas, logging, Swagger documentation, and server configuration.

**When to invoke**: Adding or modifying an API route; fixing a backend bug; adding joi validation; updating error handling; generating Swagger/OpenAPI docs; migrating a file to TypeScript.

**Scope**: `backend/` only. Must never touch `frontend/`.

**Key behaviours**:
- Follows the API response envelope (section 5) for every endpoint.
- Uses `joi` for all request body validation.
- Uses `uuid.v4()` for every new task ID.
- Uses `winston` for logging; removes bare `console.log` calls.
- Adds JSDoc `@swagger` annotations to every route.
- Emits correct HTTP status codes per the table in section 3.

---

### UI Agent

**File**: `.github/agents/ui-agent.agent.md`

**Purpose**: Builds and maintains everything under `frontend/src/` — React components, pages, routing, styling (MUI), and the axios service layer.

**When to invoke**: Creating a new component or page; building the todo list UI; wiring up API calls; fixing a layout or accessibility issue; migrating a `.jsx` file to `.tsx`.

**Scope**: `frontend/` only. Must never touch `backend/`.

**Key behaviours**:
- Migrates any file it touches from `.jsx` → `.tsx`.
- Uses MUI components — does not invent custom primitives when MUI has an equivalent.
- Wraps all API calls in `frontend/src/services/` using axios; never calls `fetch` from a component.
- Destructures `success` and `data` from the response envelope before rendering.
- Meets WCAG AA accessibility requirements on every component it creates.

---

### Testing Agent

**File**: `.github/agents/testing-agent.agent.md`

**Purpose**: Writes, fixes, and runs tests for both the backend (unit + integration) and frontend (end-to-end with Playwright).

**When to invoke**: Writing unit tests for a controller or middleware; writing Playwright E2E tests for a user flow; fixing failing tests; checking or improving code coverage.

**Scope**: Writes to `backend/__tests__/` and `tests/e2e/` only. **Never modifies source files.**

**Key behaviours**:
- Backend tests use **Jest** + **supertest**; coverage threshold is 80 % on all metrics.
- Frontend E2E tests use **Playwright** (Chromium only by default) in `tests/e2e/`.
- Every test follows the **Arrange → Act → Assert** pattern with descriptive `describe`/`it` blocks.
- Mocks `fs/promises` for data-layer tests — no real file I/O in unit tests.
- Runs `npm test` after writing tests to confirm they pass before finishing.

---

## 7. Patterns to Follow

### General

- **Single Responsibility**: each file does exactly one thing. Controllers orchestrate; routes map; middleware intercepts; data helpers persist.
- **Fail fast**: validate inputs at the boundary (request body, URL params) before touching any data.
- **Consistent envelope**: always wrap responses in `{ success, data }` or `{ success, message, errors }` — no exceptions.
- **Environment-driven config**: use `process.env` for every configurable value. Provide sensible defaults in code.
- **Meaningful names**: variable and function names must convey intent — avoid abbreviations like `d`, `tmp`, `obj`.

### Backend

- Mount the router in `server.js` under a versioned path: `app.use('/api/tasks', tasksRouter)`.
- Keep request handlers thin — extract business logic into helper functions.
- Always `await` async operations and wrap them in `try/catch` or pass errors to `next(err)`.
- Use `uuid.v4()` — never `Math.random()` or date-based IDs.

### Frontend

- Co-locate a component's styles with the component when using MUI's `sx` prop.
- Always handle loading and error states in components that fetch data.
- Use React Router `<Link>` / `useNavigate` for navigation — never mutate `window.location` directly.
- Keep API service functions in `src/services/` and return typed responses.

### Testing

- Name tests descriptively: `it('returns 404 when task does not exist')` not `it('works')`.
- One logical assertion per test where practical; group related assertions with `expect.objectContaining`.
- Mock only what is necessary — prefer real implementations at unit level.

---

## 8. Patterns to Avoid

### General

- **Do not** mix backend and frontend code in the same file.
- **Do not** commit secrets, tokens, or passwords. Use `.env` (git-ignored).
- **Do not** use `console.log` for production logging — use `winston`.
- **Do not** hard-code IDs, ports, or file paths.

### Backend

- **Do not** put business logic in route files — that belongs in controllers.
- **Do not** return raw error stacks (`err.stack`) to the client — log them server-side only.
- **Do not** skip validation — every mutating endpoint (`POST`, `PUT`, `PATCH`) must validate its body with joi.
- **Do not** use synchronous file I/O (`fs.readFileSync`) — always use `fs/promises`.
- **Do not** use non-standard response shapes — every response must conform to the envelope in section 5.
- **Do not** generate IDs with `Math.random()` or timestamps.

### Frontend

- **Do not** call `fetch()` directly from a component — use the service layer.
- **Do not** store sensitive data in `localStorage` or component state beyond what is needed.
- **Do not** use class components or lifecycle methods (`componentDidMount`, etc.).
- **Do not** import from `backend/` — the frontend is a separate package.
- **Do not** use inline `style={{}}` for layout concerns that belong in MUI's `sx` prop or `index.css`.

### Testing

- **Do not** modify source files when writing tests — test files only go in `backend/__tests__/` or `tests/e2e/`.
- **Do not** write tests that depend on execution order or shared mutable state.
- **Do not** leave skipped tests (`it.skip`, `test.skip`) committed to main without a comment explaining why.
- **Do not** test implementation details — test observable behaviour (inputs → outputs).
