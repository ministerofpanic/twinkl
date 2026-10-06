import { createConfig } from 'express-zod-api';
import { resultHandler } from './factories';

export const config = createConfig({
  http: { listen: Number(process.env.PORT) || 3000 },
  cors: false,
  errorHandler: resultHandler,
});
