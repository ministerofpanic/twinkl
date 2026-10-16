import {
  beforeEach, describe, expect, it,
} from 'vitest';
import {
  clear, findByEmail, findById, list, save,
} from './store';

const user = {
  id: '6f1f3a52-0f1e-4f56-9d5b-0f0c8f3b1d11',
  fullName: 'Ada Lovelace',
  email: 'ada@example.com',
  createdDate: '2024-07-09',
  userType: 'teacher' as const,
  passwordHash: '$argon2id$example',
};

function makeUser({ n }: { n: number }) {
  return {
    ...user,
    id: `00000000-0000-4000-8000-00000000000${n}`,
    email: `user${n}@example.com`,
  };
}

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

  // Cursor is a number the store gives each user when saved (never shown to clients)
  describe('paginated list', () => {
    it('first page: returns saved users in a fixed order, no more than the limit', () => {
      const [first, second, third] = [1, 2, 3].map((n) => makeUser({ n }));
      [first, second, third].forEach(save);
      expect(list({ limit: 2 }).items).toEqual([first, second]);
    });

    it('returns a next cursor when more users remain, and none on the last page', () => {
      [1, 2, 3].map((n) => makeUser({ n })).forEach(save);
      expect(list({ limit: 2 }).nextCursor).toBeDefined();
      expect(list({ limit: 5 }).nextCursor).toBeUndefined();
    });

    it('exactly the limit remaining: no next cursor', () => {
      [1, 2, 3].map((n) => makeUser({ n })).forEach(save);
      const page = list({ limit: 3 });
      expect(page.items).toHaveLength(3);
      expect(page.nextCursor).toBeUndefined();
    });

    it('after a cursor: returns the users that follow it', () => {
      const [first, second, third, fourth] = [1, 2, 3, 4].map((n) => makeUser({ n }));
      [first, second, third, fourth].forEach(save);
      const { nextCursor } = list({ limit: 2 });
      expect(list({ limit: 2, after: nextCursor }).items).toEqual([third, fourth]);
    });

    it.todo('following the cursors to the end returns every user once, with no gaps or repeats');
    it.todo('empty store: an empty list and no cursor');
    it.todo('a cursor past the end: an empty list and no cursor');
    it.todo('a user saved between pages appears later, with nothing repeated');
    it.todo('returns the full stored users, including passwordHash (the core strips it)');
    // Needs remove, which is on the delete-endpoint branch
    it.todo('the cursor of a since-deleted user still continues from the right place');
  });
});
