import type { UserOutput } from './user';

export type StoredUser = UserOutput & { passwordHash: string };

const users = new Map<string, StoredUser>();

export function save(user: StoredUser) {
  users.set(user.id, user);
}

export function findById({ id }: { id: string }) {
  return users.get(id);
}

export function findByEmail({ email }: { email: string }) {
  return [...users.values()].find((user) => user.email === email);
}

export function list({ limit }: { limit: number }) {
  return { items: [...users.values()].slice(0, limit) };
}

// Test isolation only
export function clear() {
  users.clear();
}
