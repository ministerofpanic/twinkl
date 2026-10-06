import { z } from 'zod';
import * as User from '../../core/user/user';
import { ApiError, http200Factory } from '../factories';

export const getUser = http200Factory.build({
  method: 'get',
  input: z.object({ id: z.string().uuid() }),
  output: User.UserOutput,
  handler: async ({ input }) => {
    const result = await User.fromId({ id: input.id });
    if (!result.ok) throw new ApiError(result.error);
    return result.value;
  },
});
