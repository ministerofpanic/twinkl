import { EndpointsFactory, ResultHandler } from 'express-zod-api';
import { AppError } from '../core/errors';

const resultHandler = new ResultHandler({
  positive: (output) => output,
  negative: { schema: AppError, statusCode: [400, 404, 500] },
  handler: ({ output, response }) => {
    response.status(200).json(output);
  },
});

export const factory = new EndpointsFactory(resultHandler);
