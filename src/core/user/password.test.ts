import { argon2Verify } from 'hash-wasm';
import { describe, expect, it } from 'vitest';
import { hash } from './password';

describe('hash', () => {
  it('produces an argon2id hash with OWASP minimum parameters (m=19456, t=2, p=1)', async () => {
    expect(await hash({ password: 'Passw0rdOk' })).toMatch(
      /^\$argon2id\$v=19\$m=19456,t=2,p=1\$/,
    );
  });

  it('verifies against the original password only', async () => {
    const encoded = await hash({ password: 'Passw0rdOk' });
    expect(await argon2Verify({ password: 'Passw0rdOk', hash: encoded })).toBe(true);
    expect(await argon2Verify({ password: 'Passw0rdNo', hash: encoded })).toBe(false);
  });

  it('uses a random salt, so the same password hashes differently', async () => {
    const first = await hash({ password: 'Passw0rdOk' });
    const second = await hash({ password: 'Passw0rdOk' });
    expect(first).not.toBe(second);
  });
});
