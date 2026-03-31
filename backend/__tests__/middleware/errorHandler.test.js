'use strict';

jest.mock('../../config/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const errorHandler = require('../../middleware/errorHandler');

function makeResMock() {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
}

describe('errorHandler middleware', () => {
  const next = jest.fn();

  it('returns 500 with generic message for plain Error', () => {
    // Arrange
    const err = new Error('Something broke');
    const req = { path: '/api/tasks', method: 'GET' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Internal Server Error',
      errors: [],
    });
  });

  it('respects err.status when set (e.g. 404)', () => {
    // Arrange
    const err = Object.assign(new Error('Not found'), { status: 404 });
    const req = { path: '/api/tasks/x', method: 'GET' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Not found' })
    );
  });

  it('respects err.statusCode as an alternative to err.status', () => {
    // Arrange
    const err = Object.assign(new Error('Bad gateway'), { statusCode: 502 });
    const req = { path: '/health', method: 'GET' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(502);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Bad gateway' })
    );
  });

  it('returns 500 for Internal Server Error and hides message', () => {
    // Arrange
    const err = new Error('sensitive internal detail');
    const req = { path: '/api/tasks', method: 'POST' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false, message: 'Internal Server Error' })
    );
    // Raw error detail must NOT leak to client
    expect(res.json.mock.calls[0][0].message).not.toBe('sensitive internal detail');
  });

  it('always includes an empty errors array', () => {
    // Arrange
    const err = new Error('oops');
    const req = { path: '/', method: 'DELETE' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.json.mock.calls[0][0].errors).toEqual([]);
  });

  it('falls back to Internal Server Error when err.message is empty and status is 500', () => {
    // Arrange — error with no message and no status (covers the || branch on line 17)
    const err = Object.assign(new Error(), { message: '' });
    const req = { path: '/api/tasks', method: 'GET' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json.mock.calls[0][0].message).toBe('Internal Server Error');
  });

  it('falls back to Internal Server Error when non-500 status but message is falsy', () => {
    // Arrange — covers err.message || 'Internal Server Error' false branch (non-500, empty message)
    const err = Object.assign(new Error(), { status: 422, message: '' });
    const req = { path: '/api/tasks/x', method: 'PUT' };
    const res = makeResMock();

    // Act
    errorHandler(err, req, res, next);

    // Assert
    expect(res.status).toHaveBeenCalledWith(422);
    expect(res.json.mock.calls[0][0].message).toBe('Internal Server Error');
  });
});
