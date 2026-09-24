export const sendSuccess = (res, data = {}, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

export const sendError = (
  res,
  message = 'An error occurred',
  statusCode = 500,
  code = 'ERROR',
  details = null
) => {
  const payload = {
    success: false,
    message,
    code,
  };

  if (details) {
    payload.details = details;
  }

  return res.status(statusCode).json(payload);
};
