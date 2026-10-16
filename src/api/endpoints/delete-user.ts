import { z } from 'zod';
import * as User from '../../core/user/user';
import { ApiError, http204Factory } from '../factories';

export const deleteUser = http204Factory.build({
  method: 'delete',
  input: z.object({ id: z.string().uuid() }),
  output: z.object({}),
  handler: async ({ input }) => {
    const result = await User.remove({ id: input.id });
    if (!result.ok) throw new ApiError(result.error);
    return {};
  },
});
