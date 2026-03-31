'use strict';

const { validate, createTaskSchema, updateTaskSchema, idParamSchema, queryFilterSchema } = require('../../validators/taskValidator');

// ---------------------------------------------------------------------------
// validate() middleware factory
// ---------------------------------------------------------------------------
describe('validate() middleware', () => {
  function makeResMock() {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    return res;
  }

  it('calls next() and mutates req.body when validation passes', () => {
    // Arrange
    const req = { body: { title: 'My task' } };
    const res = makeResMock();
    const next = jest.fn();
    const middleware = validate(createTaskSchema);

    // Act
    middleware(req, res, next);

    // Assert
    expect(next).toHaveBeenCalledTimes(1);
    expect(res.status).not.toHaveBeenCalled();
  });

  it('strips unknown fields from req.body', () => {
    // Arrange
    const req = { body: { title: 'T', unknown: 'field' } };
    const res = makeResMock();
    const next = jest.fn();

    // Act
    validate(createTaskSchema)(req, res, next);

    // Assert
    expect(req.body.unknown).toBeUndefined();
    expect(next).toHaveBeenCalled();
  });

  it('returns 400 with errors array when validation fails', () => {
    // Arrange
    const req = { body: {} }; // missing required title
    const res = makeResMock();
    const next = jest.fn();

    // Act
    validate(createTaskSchema)(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        message: 'Validation failed',
        errors: expect.arrayContaining([expect.stringMatching(/title/i)]),
      })
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('validates req.params when property="params"', () => {
    // Arrange
    const req = { params: { id: 'not-a-uuid' } };
    const res = makeResMock();
    const next = jest.fn();

    // Act
    validate(idParamSchema, 'params')(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });

  it('validates req.query when property="query"', () => {
    // Arrange
    const req = { query: { status: 'INVALID' } };
    const res = makeResMock();
    const next = jest.fn();

    // Act
    validate(queryFilterSchema, 'query')(req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(400);
    expect(next).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// createTaskSchema
// ---------------------------------------------------------------------------
describe('createTaskSchema', () => {
  const valid = (obj) => createTaskSchema.validate(obj, { abortEarly: false });

  it('accepts a minimal valid body', () => {
    const { error } = valid({ title: 'Test' });
    expect(error).toBeUndefined();
  });

  it('accepts all valid fields', () => {
    const { error } = valid({ title: 'T', description: 'desc', status: 'in-progress', priority: 'high' });
    expect(error).toBeUndefined();
  });

  it('rejects missing title', () => {
    const { error } = valid({ priority: 'low' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/title/i);
  });

  it('rejects title longer than 200 characters', () => {
    const { error } = valid({ title: 'x'.repeat(201) });
    expect(error).toBeDefined();
  });

  it('rejects invalid status', () => {
    const { error } = valid({ title: 'T', status: 'archived' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/status/i);
  });

  it('rejects invalid priority', () => {
    const { error } = valid({ title: 'T', priority: 'critical' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/priority/i);
  });

  it('accepts empty description', () => {
    const { error } = valid({ title: 'T', description: '' });
    expect(error).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// updateTaskSchema
// ---------------------------------------------------------------------------
describe('updateTaskSchema', () => {
  const valid = (obj) => updateTaskSchema.validate(obj, { abortEarly: false });

  it('accepts a single field', () => {
    const { error } = valid({ title: 'Updated' });
    expect(error).toBeUndefined();
  });

  it('rejects empty body (no fields)', () => {
    const { error } = valid({});
    expect(error).toBeDefined();
  });

  it('rejects empty title string', () => {
    const { error } = valid({ title: '' });
    expect(error).toBeDefined();
    expect(error.details[0].message).toMatch(/title/i);
  });
});

// ---------------------------------------------------------------------------
// idParamSchema
// ---------------------------------------------------------------------------
describe('idParamSchema', () => {
  const valid = (obj) => idParamSchema.validate(obj, { abortEarly: false });

  it('accepts a valid UUID v4', () => {
    const { error } = valid({ id: '11111111-1111-4111-a111-111111111111' });
    expect(error).toBeUndefined();
  });

  it('rejects a non-UUID string', () => {
    const { error } = valid({ id: 'not-a-uuid' });
    expect(error).toBeDefined();
  });

  it('rejects missing id', () => {
    const { error } = valid({});
    expect(error).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// queryFilterSchema
// ---------------------------------------------------------------------------
describe('queryFilterSchema', () => {
  const valid = (obj) => queryFilterSchema.validate(obj, { abortEarly: false });

  it('accepts empty query', () => {
    const { error } = valid({});
    expect(error).toBeUndefined();
  });

  it('accepts valid status filter', () => {
    const { error } = valid({ status: 'done' });
    expect(error).toBeUndefined();
  });

  it('rejects invalid priority filter', () => {
    const { error } = valid({ priority: 'urgent' });
    expect(error).toBeDefined();
  });
});
