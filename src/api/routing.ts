import type { Routing } from 'express-zod-api';
import { signup } from './endpoints/signup';

export const routing: Routing = {
  users: signup,
};
