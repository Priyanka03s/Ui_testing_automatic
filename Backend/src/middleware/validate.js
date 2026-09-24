import { sendError } from '../utils/apiResponse.js';

export const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    try {
      const parsed = schema.parse(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err.errors) {
        const errorMessages = err.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return sendError(res, 'Validation error', 400, 'VALIDATION_FAILED', errorMessages);
      }
      return sendError(res, 'Invalid request data', 400, 'VALIDATION_ERROR', err.message);
    }
  };
};
