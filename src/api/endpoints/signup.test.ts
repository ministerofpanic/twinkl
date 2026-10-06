import { describe, it } from 'vitest';

// Integration: real server on a random port using the real routing, store cleared between tests
describe('POST /users', () => {
  it.todo('creates a user: 201 with { id } (uuid) and nothing else');
  it.todo('stores the user with a hashed password');
  it.todo('invalid input: 400 validation_failed listing every failed field, including all password rules');
  it.todo('duplicate email: 400 validation_failed on email, without saying it is registered');
  it.todo('duplicate email ignores upper or lower case');
});
