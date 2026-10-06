import {
  EndpointsFactory, ensureHttpError, InputValidationError, ResultHandler,
} from 'express-zod-api';
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

// Anything that is not a known failure (including HTTP 501, 413, 429) is an internal_error
function toAppError(error: Error): AppError {
  if (error instanceof ApiError) return error.appError;
  if (error instanceof InputValidationError) {
    const issues = error.cause.issues.map(({ path, message }) => ({ path, message }));
    return { code: 'validation_failed', context: { issues } };
  }
  const { statusCode } = ensureHttpError(error);
  if (statusCode === 404) return { code: 'not_found', context: {} };
  if (statusCode === 400) {
    return {
      code: 'validation_failed',
      context: { issues: [{ path: [], message: 'Malformed request body' }] },
    };
  }
  return { code: 'internal_error', context: {} };
}

export const resultHandler = new ResultHandler({
  positive: (output) => output,
  negative: { schema: AppError, statusCode: [400, 404, 500] },
  handler: ({
    error, output, response, logger,
  }) => {
    if (!error) {
      response.status(200).json(output);
      return;
    }
    const appError = toAppError(error);
    // Real error stays in the server log, the body is deliberately generic
    if (appError.code === 'internal_error') logger.error('Unexpected error', error);
    response.status(statusByCode[appError.code]).json(appError);
  },
});

export const factory = new EndpointsFactory(resultHandler);
