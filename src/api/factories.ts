import { EndpointsFactory, InputValidationError, ResultHandler } from 'express-zod-api';
import { AppError } from '../core/errors';

const resultHandler = new ResultHandler({
  positive: (output) => output,
  negative: { schema: AppError, statusCode: [400, 404, 500] },
  handler: ({ error, output, response }) => {
    if (error instanceof InputValidationError) {
      const issues = error.cause.issues.map(({ path, message }) => ({ path, message }));
      response.status(400).json({ code: 'validation_failed', context: { issues } });
      return;
    }
    response.status(200).json(output);
  },
});

export const factory = new EndpointsFactory(resultHandler);
