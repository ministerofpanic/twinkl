import type { UserOutput } from './user';

export type StoredUser = UserOutput & { passwordHash: string };

const users = new Map<string, StoredUser>();

export const save = (user: StoredUser) => { users.set(user.id, user); };

export const findByEmail = ({ email }: { email: string }) => (
  [...users.values()].find((user) => user.email === email)
);

// Test isolation only
export const clear = () => users.clear();
