const ErrorHandler = require("../utilities/errorHandler");
const catchAsyncError = require("./catchAsyncError");
const User = require("../models/user.model");
const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = catchAsyncError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return next(new ErrorHandler("please Login", 401));
  }

  const decodedData = jwt.verify(token, process.env.JWT_SEC);

  req.user = await User.findById(decodedData.id);

  if (!req.user) {
    return next(
      new ErrorHandler(`user does not exist with Id: ${decodedData.id}`, 400)
    );
  }

  next();
});

exports.authorizeRoles = (...roles) => {
  // ...roles as array
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(
        new ErrorHandler(
          `Role: ${req.user.role} is not allowed to access this resourse`,
          403
        )
      );
    }

    next();
  };
};
