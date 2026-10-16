import { DependsOnMethod, type Routing } from 'express-zod-api';
import { getUser } from './endpoints/get-user';
import { listUsers } from './endpoints/list-users';
import { signup } from './endpoints/signup';

export const routing: Routing = {
  users: {
    '': new DependsOnMethod({ post: signup, get: listUsers }),
    ':id': getUser,
  },
};
