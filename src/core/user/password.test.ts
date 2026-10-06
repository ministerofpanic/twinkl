import { describe, it } from 'vitest';

describe('hash', () => {
  it.todo('produces an argon2id hash with OWASP minimum parameters (m=19456, t=2, p=1)');
  it.todo('verifies against the original password only');
  it.todo('uses a random salt, so the same password hashes differently');
});
