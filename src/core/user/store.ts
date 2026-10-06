import type { UserOutput } from './user';

export type StoredUser = UserOutput & { passwordHash: string };

const users = new Map<string, StoredUser>();

export function save(user: StoredUser) {
  users.set(user.id, user);
}

export function findByEmail({ email }: { email: string }) {
  return [...users.values()].find((user) => user.email === email);
}

// Test isolation only
export function clear() {
  users.clear();
}
