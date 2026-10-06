import { describe, it } from 'vitest';

// Integration: real server on a random port, a throwaway endpoint built from the factory
describe('endpoints factory result handler', () => {
  it.todo('success: responds with the endpoint output as JSON, no envelope');
  it.todo('invalid input: 400 validation_failed listing every issue with path and message');
  it.todo('domain error from the endpoint: body is { code, context }, status mapped from code (validation_failed 400, user_not_found 404)');
  it.todo('unexpected exception: 500 with a generic body and no internal details leaked');
  it.todo('errors outside endpoints (unknown route, malformed JSON) use the same { code, context } body');
});
