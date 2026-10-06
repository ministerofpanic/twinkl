import { createServer } from 'express-zod-api';
import { config } from './api/config';
import { routing } from './api/routing';

createServer(config, routing);
