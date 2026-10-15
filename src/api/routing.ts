import { DependsOnMethod, type Routing } from 'express-zod-api';
import { deleteUser } from './endpoints/delete-user';
import { getUser } from './endpoints/get-user';
import { signup } from './endpoints/signup';

export const routing: Routing = {
  users: {
    '': signup,
    ':id': new DependsOnMethod({ get: getUser, delete: deleteUser }),
  },
};
