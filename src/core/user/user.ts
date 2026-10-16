import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../errors';
import { err, ok, Result } from '../result';
import { hash } from './password';
import {
  findByEmail, findById, list as listFromStore, save,
} from './store';

const nonEmpty = z.string().trim().min(1);

export const UserInput = z.object({
  fullName: nonEmpty,
  email: nonEmpty.toLowerCase().email(),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be at most 64 characters')
    .regex(/[0-9]/, 'Password must contain a digit')
    .regex(/[a-z]/, 'Password must contain a lowercase letter')
    .regex(/[A-Z]/, 'Password must contain an uppercase letter'),
  createdDate: z.string().date(),
  userType: z.enum(['student', 'teacher', 'parent', 'private tutor']),
});
export type UserInput = z.infer<typeof UserInput>;

// Strips unknown keys by default, so password and passwordHash can never leak
export const UserOutput = UserInput.omit({ password: true }).extend({ id: z.string().uuid() });
export type UserOutput = z.infer<typeof UserOutput>;

// Deliberately generic: must not reveal that the email is already registered
const unusableEmail: AppError = {
  code: 'validation_failed',
  context: { issues: [{ path: ['email'], message: 'Unable to use this email' }] },
};

export async function create(input: UserInput): Promise<Result<UserOutput, AppError>> {
  if (findByEmail({ email: input.email })) return err(unusableEmail);

  const { password, ...profile } = input;
  const user = { ...profile, id: randomUUID(), passwordHash: await hash({ password }) };
  save(user);
  return ok(UserOutput.parse(user));
}

// Async like create, so a real database can replace the in-memory store without changing callers
export async function fromId({ id }: { id: string }): Promise<Result<UserOutput, AppError>> {
  const user = findById({ id });
  if (!user) return err({ code: 'user_not_found', context: { id } });

  return ok(UserOutput.parse(user));
}

// The cursor is opaque to clients: the store's sort number, encoded
function encodeCursor(seq: number) {
  return Buffer.from(String(seq)).toString('base64url');
}

function decodeCursor(cursor: string) {
  return Number(Buffer.from(cursor, 'base64url').toString());
}

export async function list({ limit, after }: { limit: number; after?: string }): Promise<Result<{
  items: UserOutput[];
  nextCursor: string | null;
}, AppError>> {
  const afterSeq = after === undefined ? undefined : decodeCursor(after);
  const page = listFromStore({ limit, after: afterSeq });
  return ok({
    items: page.items.map((user) => UserOutput.parse(user)),
    nextCursor: page.nextCursor === undefined ? null : encodeCursor(page.nextCursor),
  });
}
