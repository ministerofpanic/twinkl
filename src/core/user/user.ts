import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { AppError } from '../errors';
import { err, ok, Result } from '../result';
import { hash } from './password';
import { findByEmail, save } from './store';

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
