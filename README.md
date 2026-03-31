# Todo App — Full-Stack (React + Node/Express)

A full-stack Todo application with a **React/Vite** frontend and a **Node.js/Express** REST API backend. Task data is persisted in a JSON file on the server.

---

## Tech Stack

| Layer    | Technology                        |
|----------|-----------------------------------|
| Frontend | React 19, Vite 8, ESLint          |
| Backend  | Node.js, Express 4, uuid, dotenv  |
| Storage  | Flat-file JSON (`data/tasks.json`)|

---

## Project Structure

```
copilot-assement-todo-app/
├── backend/
│   ├── controllers/
│   │   └── tasksController.js   # Route handler logic
│   ├── data/
│   │   └── tasks.json           # Persisted task data
│   ├── middleware/
│   │   └── errorHandler.js      # Global error handler
│   ├── routes/
│   │   └── tasks.js             # /api/tasks router
│   ├── server.js                # Express entry point
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js** ≥ 18 (v20 LTS recommended)
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
```

Create a `.env` file (copy the example):

```bash
cp .env.example .env   # then edit as needed
```

| Variable | Default | Description          |
|----------|---------|----------------------|
| `PORT`   | `5000`  | Port the API runs on |

Start the backend:

```bash
# Development (auto-reload via nodemon)
npm run dev

# Production
npm start
```

The API will be available at `http://localhost:5000`.

### 3. Set up the Frontend

Open a new terminal tab:

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

---

## API Endpoints

All endpoints are prefixed with `/api/tasks`.

| Method | Endpoint           | Description         |
|--------|--------------------|---------------------|
| GET    | `/health`          | Health check        |
| GET    | `/api/tasks`       | List all tasks      |
| GET    | `/api/tasks/:id`   | Get a single task   |
| POST   | `/api/tasks`       | Create a new task   |
| PUT    | `/api/tasks/:id`   | Update a task       |
| DELETE | `/api/tasks/:id`   | Delete a task       |

### Request / Response examples

**Create a task — `POST /api/tasks`**
```json
{
  "title": "Buy groceries",
  "completed": false
}
```

**Response `201 Created`**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "title": "Buy groceries",
  "completed": false
}
```

---

## Available Scripts

### Backend (`/backend`)

| Script        | Description                          |
|---------------|--------------------------------------|
| `npm start`   | Start server with Node.js            |
| `npm run dev` | Start server with nodemon (watch mode)|

### Frontend (`/frontend`)

| Script           | Description                        |
|------------------|------------------------------------|
| `npm run dev`    | Start Vite dev server (HMR)        |
| `npm run build`  | Production build → `dist/`         |
| `npm run preview`| Preview production build locally   |
| `npm run lint`   | Run ESLint                         |

---

## Environment Variables

Create a `backend/.env` file based on the template below. **Never commit `.env` to version control.**

```env
PORT=5000
```

---

## License

MIT

