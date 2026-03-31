# Copilot Code Review Instructions

When reviewing any code change in this repository, audit every modified file against the six checklists below.
After the review, output the results as a Markdown report using the **Issue Report Template** at the bottom of this file.
Only report genuine violations — do not flag issues in files that were not changed.

---

## Review Checklists

### 1. JSDoc / Docstrings on Public Functions

- Every exported function, method, route handler, and React component **must** have a JSDoc block (`/** … */`).
- The JSDoc block must include:
  - A one-line summary describing what the function does.
  - `@param` tags for every parameter (with type and description).
  - `@returns` / `@return` tag describing the return value or `void`.
  - `@throws` tag for any error that the function intentionally throws.
- Private / internal helpers (prefixed with `_` or not exported) are exempt.

**Flag if**: A public/exported function, handler, or component is missing a JSDoc block or is missing any of the required tags.

---

### 2. Input Validation on Every POST / PUT Route

- Every `POST` and `PUT` (and `PATCH`) route handler **must** validate the request body before any business logic or data access.
- Validation must use **joi** schemas (backend) or equivalent typed validation (frontend forms).
- On validation failure the handler must return `400 Bad Request` with the standard error envelope:
  ```json
  { "success": false, "message": "…", "errors": ["…"] }
  ```
- URL parameters (`:id`, etc.) must also be validated (non-empty string, uuid format where applicable).

**Flag if**: A mutating route is missing body validation, uses ad-hoc `if (!req.body.x)` checks instead of a joi schema, or does not return a proper 400 on failure.

---

### 3. Correct HTTP Status Codes

Use the table below as the single source of truth:

| Scenario | Expected status |
|---|---|
| Successful retrieval (GET) | `200` |
| Resource created (POST) | `201` |
| Successful update (PUT/PATCH) | `200` |
| Successful deletion | `204` (empty body) |
| Validation / bad input | `400` |
| Unauthenticated (future) | `401` |
| Forbidden (future) | `403` |
| Resource not found | `404` |
| Unprocessable entity / semantic error | `422` |
| Internal / unexpected server error | `500` |

**Flag if**: A handler returns a status code inconsistent with the table (e.g., `200` for a newly created resource, `500` for a missing resource, `200` instead of `204` for a deletion).

---

### 4. No Empty Catch Blocks

- Every `catch` block **must** do at least one of the following:
  - Log the error via `winston` (backend) or `console.error` (frontend, acceptable).
  - Re-throw the error (`throw err` or `next(err)` in Express).
  - Return a meaningful error response to the caller.
- A catch block that contains only a comment (`// ignore`) is also a violation.

**Flag if**: A `catch` block is empty or contains only whitespace / comments with no action taken.

---

### 5. Frontend Loading States and Error Handling

Every React component or hook that issues an API call **must**:

1. Maintain a `isLoading` (or `loading`) boolean state that is set to `true` before the request and `false` in the `finally` block.
2. Render a visible loading indicator (e.g., MUI `<CircularProgress>`) while `isLoading` is `true`.
3. Maintain an `error` state that is populated when the API call fails.
4. Render a visible error message (e.g., MUI `<Alert severity="error">`) when `error` is non-null.
5. Never call `fetch()` directly — all HTTP calls must go through the `src/services/` axios wrappers.
6. Destructure `success` and `data` from the response envelope before using them.

**Flag if**: Any of the six sub-requirements above is absent.

---

### 6. Test Coverage ≥ 80 %

- Overall line, statement, branch, and function coverage must each be **≥ 80 %**.
- Every new public function or route **must** have at least one corresponding test.
- Tests must follow the **Arrange → Act → Assert** pattern and live in:
  - `backend/__tests__/` for backend unit / integration tests (Jest + supertest).
  - `tests/e2e/` for frontend end-to-end tests (Playwright).
- Test files must not be placed inside `src/` or `backend/` source directories.

**Flag if**: A new or modified public function has no test, a test file is in the wrong directory, or the coverage threshold is known to be below 80 % on any metric.

---

## Issue Report Template

After reviewing a code change, produce a report using **exactly** this Markdown structure.
Replace placeholder text in `< >` with real values; omit sections with zero issues.

```markdown
# Code Review Issues

**Files reviewed**: <comma-separated list of changed files>
**Review date**: <YYYY-MM-DD>
**Total issues found**: <n>

---

## 1. Missing JSDoc / Docstrings

| # | File | Line | Symbol | Issue |
|---|------|------|--------|-------|
| 1 | `path/to/file.js` | 42 | `createTask()` | Missing `@param` for `taskData` |

---

## 2. Missing or Incomplete Input Validation

| # | File | Line | Route | Issue |
|---|------|------|-------|-------|
| 1 | `routes/tasks.js` | 15 | `POST /api/tasks` | No joi schema — uses bare `if (!req.body.title)` |

---

## 3. Incorrect HTTP Status Codes

| # | File | Line | Route / Handler | Expected | Actual | Issue |
|---|------|------|-----------------|----------|--------|-------|
| 1 | `controllers/tasksController.js` | 88 | `createTask` | `201` | `200` | New resource must return 201 |

---

## 4. Empty Catch Blocks

| # | File | Line | Issue |
|---|------|------|-------|
| 1 | `services/taskService.js` | 34 | Empty catch — error is silently swallowed |

---

## 5. Frontend Loading / Error State Issues

| # | File | Line | Component | Missing requirement |
|---|------|------|-----------|---------------------|
| 1 | `src/components/TaskList.tsx` | 12 | `TaskList` | No `isLoading` state; no loading indicator rendered |

---

## 6. Test Coverage Gaps

| # | Symbol / Route | Test file expected | Issue |
|---|----------------|--------------------|-------|
| 1 | `deleteTask()` | `backend/__tests__/tasksController.test.js` | No test for 404 branch |

---

## Summary

> Replace this block with a one-paragraph human-readable summary of the most critical issues and recommended next steps.
```

---

## General Notes for Copilot

- Apply these checks **only to files that are part of the diff / change being reviewed**. Do not audit unrelated files.
- When a violation is found, cite the exact file path and line number.
- Provide a brief, actionable description of each issue — do not just re-state the rule.
- If all checks pass for a category, omit that section from the report.
- If all checks pass across all categories, respond with: `All checks passed. No issues found.`
