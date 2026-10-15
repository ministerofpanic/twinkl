import {
  beforeEach, describe, expect, it,
} from 'vitest';
import {
  clear, findByEmail, findById, remove, save,
} from './store';

const user = {
  id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  createdDate: '2024-07-09',
  userType: 'teacher' as const,
  passwordHash: '$argon2id$example',
};

const otherUser = {
  ...user,
  id: '9b2d4c6e-1a3f-4e5d-8c7b-2f1e0d9c8b7a',
  fullName: 'Grace Hopper',
  email: 'grace@example.com',
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

  it('removes one user and leaves the others', () => {
    save(user);
    save(otherUser);
    remove({ id: user.id });
    expect(findById({ id: user.id })).toBeUndefined();
    expect(findById({ id: otherUser.id })).toEqual(otherUser);
  });

  it('removing an unknown id does nothing', () => {
    save(user);
    expect(() => remove({ id: '00000000-0000-4000-8000-000000000000' })).not.toThrow();
    expect(findById({ id: user.id })).toEqual(user);
  });

  it('clear removes all saved users (test isolation)', () => {
    save(user);
    clear();
    expect(findByEmail({ email: 'ada@example.com' })).toBeUndefined();
  });
});
