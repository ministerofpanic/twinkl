import { z } from 'zod';

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
