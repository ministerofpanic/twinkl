import type { UserOutput } from './user';

export type StoredUser = UserOutput & { passwordHash: string };

// seq is a hidden, ever-increasing number used as the pagination cursor. It never leaves the store
type Entry = { seq: number; user: StoredUser };

const entries = new Map<string, Entry>();
let lastSeq = 0;

export function save(user: StoredUser) {
  const existing = entries.get(user.id);
  if (existing) {
    // Saving again keeps the original position
    entries.set(user.id, { ...existing, user });
    return;
  }
  lastSeq += 1;
  entries.set(user.id, { seq: lastSeq, user });
}

export function findById({ id }: { id: string }) {
  return entries.get(id)?.user;
}

export function findByEmail({ email }: { email: string }) {
  return [...entries.values()].find((entry) => entry.user.email === email)?.user;
}

export function list({ limit, after = 0 }: { limit: number; after?: number }) {
  // Ask for one extra to learn whether another page exists, without counting everyone
  const page = [...entries.values()].filter((entry) => entry.seq > after).slice(0, limit + 1);
  const items = page.slice(0, limit);
  const nextCursor = page.length > limit ? items[items.length - 1].seq : undefined;
  return { items: items.map((entry) => entry.user), nextCursor };
}

// Test isolation only
export function clear() {
  entries.clear();
  lastSeq = 0;
}
