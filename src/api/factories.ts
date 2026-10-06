import { EndpointsFactory, InputValidationError, ResultHandler } from 'express-zod-api';
import { AppError } from '../core/errors';

const statusByCode = {
  validation_failed: 400,
  user_not_found: 404,
  not_found: 404,
  internal_error: 500,
} satisfies Record<AppError['code'], number>;

// Endpoint handlers can only return output, so a domain error is thrown at this boundary
export class ApiError extends Error {
  constructor(readonly appError: AppError) {
    super(appError.code);
  }
}

const resultHandler = new ResultHandler({
  positive: (output) => output,
  negative: { schema: AppError, statusCode: [400, 404, 500] },
  handler: ({
    error, output, response, logger,
  }) => {
    if (error instanceof ApiError) {
      response.status(statusByCode[error.appError.code]).json(error.appError);
      return;
    }
    if (error instanceof InputValidationError) {
      const issues = error.cause.issues.map(({ path, message }) => ({ path, message }));
      response.status(400).json({ code: 'validation_failed', context: { issues } });
      return;
    }
    if (error) {
      // Real error stays in the server log, the body is deliberately generic
      logger.error('Unexpected error', error);
      response.status(500).json({ code: 'internal_error', context: {} });
      return;
    }
    response.status(200).json(output);
  },
});

export const factory = new EndpointsFactory(resultHandler);
