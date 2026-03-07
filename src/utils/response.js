import multer from "multer";

export const asyncHandler = (fn) => {
  return async (req, res, next) => {
    await fn(req, res, next).catch((error) => {
      if (!error.cause) error.cause = 500;
      return next(error);
    });
  };
};

export const globalErrorHandling = (err, req, res, next) => {
  // Handle Multer errors (file upload errors)
  if (err instanceof multer.MulterError) {
    const multerMessages = {
      LIMIT_UNEXPECTED_FILE: `Too many files uploaded for field: ${err.field}`,
      LIMIT_FILE_SIZE: "File size is too large",
      LIMIT_FILE_COUNT: "Too many files uploaded",
      LIMIT_FIELD_KEY: "Field name is too long",
      LIMIT_FIELD_VALUE: "Field value is too long",
      LIMIT_FIELD_COUNT: "Too many fields",
      LIMIT_PART_COUNT: "Too many parts",
    };
    return res.status(400).json({
      message: "File Upload Error",
      error: multerMessages[err.code] || err.message,
    });
  }

  let status = err.cause;
  if (!status || typeof status !== "number" || status < 100 || status > 599) {
    status = err.status || err.statusCode || 500;
  }
  return res.status(status).json({
    message: "error",
    status: status,
    error: err.message,
    ...(typeof err.cause === "object" ? { details: err.cause } : {}),
    stack: err.stack,
  });
};

export const successResponse = ({ res, status = 200, data, message = "success" }) => {
  return res.status(status).json({
    message,
    status,
    data,
  });
};
