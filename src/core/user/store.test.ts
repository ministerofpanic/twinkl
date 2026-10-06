import {
  beforeEach, describe, expect, it,
} from 'vitest';
import {
  clear, findByEmail, findById, save,
} from './store';

const user = {
  id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  createdDate: '2024-07-09',
  userType: 'teacher' as const,
  passwordHash: '$argon2id$example',
};

describe('store', () => {
  beforeEach(clear);

  it('finds a saved user by email', () => {
    save(user);
    expect(findByEmail({ email: 'ada@example.com' })).toEqual(user);
  });

  it('returns undefined for an unknown email', () => {
    save(user);
    expect(findByEmail({ email: 'grace@example.com' })).toBeUndefined();
  });

  it('finds a saved user by id', () => {
    save(user);
    expect(findById({ id: user.id })).toEqual(user);
  });

  it('returns undefined for an unknown id', () => {
    save(user);
    expect(findById({ id: '00000000-0000-4000-8000-000000000000' })).toBeUndefined();
  });

  it('clear removes all saved users (test isolation)', () => {
    save(user);
    clear();
    expect(findByEmail({ email: 'ada@example.com' })).toBeUndefined();
  });
});
