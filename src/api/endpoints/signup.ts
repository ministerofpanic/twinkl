import { z } from 'zod';
import * as User from '../../core/user/user';
import { ApiError, http201Factory } from '../factories';

export const signup = http201Factory.build({
  method: 'post',
  input: User.UserInput,
  output: z.object({ id: z.string().uuid() }),
  handler: async ({ input }) => {
    const result = await User.create(input);
    if (!result.ok) throw new ApiError(result.error);
    return { id: result.value.id };
  },
});
