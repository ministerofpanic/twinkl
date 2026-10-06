import { describe, expect, it } from 'vitest';
import { AppError } from './errors';

const validationFailed = {
  code: 'validation_failed',
  context: { issues: [{ path: ['password'], message: 'Too short' }] },
};
const userNotFound = {
  code: 'user_not_found',
  context: { id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11' },
};
const notFound = { code: 'not_found', context: {} };
const internalError = { code: 'internal_error', context: {} };

describe('AppError', () => {
  it.each([validationFailed, userNotFound, notFound, internalError])('accepts a valid $code error', (error) => {
    expect(AppError.safeParse(error).success).toBe(true);
  });

  it('rejects an unknown code', () => {
    expect(AppError.safeParse({ code: 'email_taken', context: {} }).success).toBe(false);
  });

  it('rejects unexpected keys, top level and in context (strict)', () => {
    expect(AppError.safeParse({ ...userNotFound, extra: true }).success).toBe(false);
    expect(
      AppError.safeParse({ ...userNotFound, context: { ...userNotFound.context, extra: true } })
        .success,
    ).toBe(false);
  });

  it('rejects context that belongs to a different code', () => {
    expect(
      AppError.safeParse({ code: 'user_not_found', context: validationFailed.context }).success,
    ).toBe(false);
  });

  it('validation_failed requires issues with path and message', () => {
    expect(
      AppError.safeParse({ ...validationFailed, context: { issues: [] } }).success,
    ).toBe(false);
    expect(
      AppError.safeParse({ ...validationFailed, context: { issues: [{ path: ['a'] }] } }).success,
    ).toBe(false);
  });

  it('user_not_found requires the id', () => {
    expect(AppError.safeParse({ ...userNotFound, context: {} }).success).toBe(false);
  });

  it.each([notFound, internalError])('$code has an empty context, so nothing internal can leak', (error) => {
    expect(AppError.safeParse({ ...error, context: { detail: 'stack trace' } }).success).toBe(false);
  });
});
