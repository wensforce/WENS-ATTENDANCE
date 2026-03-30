/**
 * Standard API Response Format
 */

export const success = (res, statusCode, message, data = null) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  });
};

export const error = (res, statusCode, message, errors = null) => {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
    timestamp: new Date().toISOString(),
  });
};

export const responses = {
  // Success Responses
  loginSuccess: (res, data) => success(res, 200, "Login successful", data),
  created: (res, data) => success(res, 201, "Resource created successfully", data),
  updated: (res, data) => success(res, 200, "Resource updated successfully", data),
  deleted: (res) => success(res, 200, "Resource deleted successfully"),
  logoutSuccess: (res) => success(res, 200, "Logout successful"),
  
  // Error Responses
  badRequest: (res, message = "Invalid request", errors = null) => 
    error(res, 400, message, errors),
  unauthorized: (res, message = "Unauthorized access") => 
    error(res, 401, message),
  forbidden: (res, message = "Forbidden") => 
    error(res, 403, message),
  notFound: (res, message = "Resource not found") => 
    error(res, 404, message),
  conflict: (res, message = "Resource already exists") => 
    error(res, 409, message),
  serverError: (res, message = "Internal server error") => 
    error(res, 500, message),
};
