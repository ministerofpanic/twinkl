import { describe, it } from 'vitest';

// Integration: real server on a random port using the real routing, store cleared between tests
describe('GET /users/:id', () => {
  it.todo('returns 200 with the public user, never the password or its hash');
  it.todo('unknown id: 404 user_not_found with the id');
  it.todo('id that is not a uuid: 400 validation_failed on path id');
});
