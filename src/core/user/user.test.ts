import {
  beforeEach, describe, expect, it,
} from 'vitest';
import { create, UserInput, UserOutput } from './user';
import { clear, findByEmail } from './store';

// Valid baseline: each test overrides one field to prove that field alone is the failure
const validInput = {
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  password: 'Passw0rdOk',
  createdDate: '2024-07-09',
  userType: 'teacher',
};

function parse(override: Record<string, unknown>) {
  return UserInput.safeParse({ ...validInput, ...override });
}

describe('UserInput', () => {
  it.each(['student', 'teacher', 'parent', 'private tutor'])(
    'accepts a valid signup for userType %s',
    (userType) => {
      expect(parse({ userType }).success).toBe(true);
    },
  );

  describe.each(['fullName', 'email', 'password', 'createdDate', 'userType'])('required field %s', (field) => {
    it.each([['empty', ''], ['whitespace-only', '   '], ['missing', undefined]])('rejects %s', (_, value) => {
      expect(parse({ [field]: value }).success).toBe(false);
    });
  });

  describe('password', () => {
    it.each([
      ['7 characters', 'Passw0r', false],
      ['8 characters', 'Passw0rd', true],
      ['64 characters', `Passw0rd${'a'.repeat(56)}`, true],
      ['65 characters', `Passw0rd${'a'.repeat(57)}`, false],
    ])('enforces length: %s', (_, password, accepted) => {
      expect(parse({ password }).success).toBe(accepted);
    });

    it.each([
      ['digit', 'Password'],
      ['lowercase letter', 'PASSW0RD'],
      ['uppercase letter', 'passw0rd'],
    ])('rejects a missing %s', (_, password) => {
      expect(parse({ password }).success).toBe(false);
    });

    it('reports every failed rule together, not just the first', () => {
      // '!' breaks all four rules: length, digit, lowercase, uppercase
      const result = parse({ password: '!' });
      expect(!result.success && result.error.issues).toHaveLength(4);
    });

    it('does not trim the password', () => {
      const result = parse({ password: ' Passw0rd ' });
      expect(result.success && result.data.password).toBe(' Passw0rd ');
    });
  });

  it('rejects an invalid email', () => {
    expect(parse({ email: 'not-an-email' }).success).toBe(false);
  });

  it('lowercases the email when parsed', () => {
    const result = parse({ email: 'Ada@Example.COM' });
    expect(result.success && result.data.email).toBe('ada@example.com');
  });

  it('rejects an unknown userType', () => {
    expect(parse({ userType: 'admin' }).success).toBe(false);
  });

  it.each([
    ['2024-07-09', true],
    ['2024-07-09T10:00:00Z', false],
    ['2024-02-30', false],
    ['09/07/2024', false],
  ])('createdDate %s accepted: %s', (createdDate, accepted) => {
    expect(parse({ createdDate }).success).toBe(accepted);
  });
});

describe('UserOutput', () => {
  const user = {
    id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11',
    fullName: 'Ada Lovelace',
    email: 'ada@example.com',
    createdDate: '2024-07-09',
    userType: 'teacher',
  };

  it('contains id, fullName, email, createdDate, userType and never password or passwordHash', () => {
    const result = UserOutput.parse({ ...user, password: 'Passw0rdOk', passwordHash: '$argon2id$' });
    expect(result).toEqual(user);
  });

  it('rejects an id that is not a uuid', () => {
    expect(UserOutput.safeParse({ ...user, id: '123' }).success).toBe(false);
  });
});

describe('create', () => {
  const input = UserInput.parse(validInput);

  beforeEach(clear);

  it('returns the public user with a generated uuid and never the password', async () => {
    expect(await create(input)).toEqual({
      ok: true,
      value: {
        id: expect.stringMatching(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/),
        fullName: 'Ada Lovelace',
        email: 'ada@example.com',
        createdDate: '2024-07-09',
        userType: 'teacher',
      },
    });
  });

  it('stores a hash, never the cleartext password', async () => {
    await create(input);
    const stored = findByEmail({ email: input.email });
    expect(stored?.passwordHash).toMatch(/^\$argon2id\$/);
    expect(JSON.stringify(stored)).not.toContain(input.password);
  });

  it('rejects a duplicate email as validation_failed on path email, without saying it is registered', async () => {
    await create(input);
    expect(await create(input)).toEqual({
      ok: false,
      error: {
        code: 'validation_failed',
        context: { issues: [{ path: ['email'], message: 'Unable to use this email' }] },
      },
    });
  });
});
