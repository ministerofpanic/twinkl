import { z } from 'zod';

const Issue = z.object({
  path: z.array(z.union([z.string(), z.number()])),
  message: z.string(),
}).strict();

export const AppError = z.discriminatedUnion('code', [
  z.object({
    code: z.literal('validation_failed'),
    context: z.object({ issues: z.array(Issue).min(1) }).strict(),
  }).strict(),
  z.object({
    code: z.literal('user_not_found'),
    context: z.object({ id: z.string() }).strict(),
  }).strict(),
  z.object({ code: z.literal('not_found'), context: z.object({}).strict() }).strict(),
  z.object({ code: z.literal('internal_error'), context: z.object({}).strict() }).strict(),
]);

export type AppError = z.infer<typeof AppError>;
