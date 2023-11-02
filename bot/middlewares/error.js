const ErrorHandler = require("../utilities/errorHandler");

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.message = err.message || "Internal Server Error";

  // Validation Error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    err = new ErrorHandler(message, 400);
  }

  // wrong MongoDB id Error
  if (err.name === "CastError") {
    const message = `Resource not found. Invalid: ${err.path}`;
    err = new ErrorHandler(message, 400);
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const message = `Duplicate ${Object.keys(err.keyValue)} Entered`;
    err = new ErrorHandler(message, 400);
  }

  // Wrong JWT error
  if (err.name === "JsonWebTokenError") {
    const message = `Json web Token is invalid, Try again`;
    err = new ErrorHandler(message, 400);
  }

  // JWT Expire error
  if (err.name === "TokenExpireError") {
    const message = `Json web Token is Expired, Try again`;
    err = new ErrorHandler(message, 400);
  }

  res.status(err.statusCode).json({
    message: err.message,
  });
};
