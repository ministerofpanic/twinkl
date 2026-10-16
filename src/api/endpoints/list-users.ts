import { z } from 'zod';
import * as User from '../../core/user/user';
import { ApiError, http200Factory } from '../factories';

export const listUsers = http200Factory.build({
  method: 'get',
  input: z.object({
    limit: z.coerce.number().int().min(1).max(100)
      .default(20),
    after: z.string().optional(),
  }),
  output: z.object({ items: z.array(User.UserOutput), nextCursor: z.string().nullable() }),
  handler: async ({ input }) => {
    const result = await User.list({ limit: input.limit, after: input.after });
    if (!result.ok) throw new ApiError(result.error);
    return result.value;
  },
});
