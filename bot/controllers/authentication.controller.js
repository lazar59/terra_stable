const userModel = require("../models/user.model");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utilities/errorHandler");
const sendToken = require("../utilities/jwtToken");
const configsModel = require("../models/configs.model");
const limitModel = require("../models/limit.model");

// Register
exports.registerUser = catchAsyncErrors(async (req, res) => {
  await userModel.create(req.body);

  const config = await configsModel.findOne();
  const limit = await limitModel.findOne();

  if (config === null) {
    await configsModel.create({
      total_tLUNC_supply: 6000000000000,
      total_tCUST_supply: 0,
      total_tLUNC_in_vault: 1,
      tax: 0.5,
      tLUNC_in_vault_array: [
        {
          val: 0,
          date: new Date(),
        },
      ],
      vcf_array: [
        {
          val: 0,
          date: new Date(),
        },
      ],
      CFToVCF: [
        {
          val: 0,
          date: new Date(),
        },
      ],
      VCFToCF: [
        {
          val: 0,
          date: new Date(),
        },
      ],
      vcf: 0,
    });
  }

  if (limit === null) {
    await limitModel.create({
      upperRiskFactor: 0,
      lowerRiskFactor: 0,
      numOfDays: 30,
      range1: "Highest",
      range2: "Highest",
      period1: "Open",
      period2: "Open",
    });
  }

  res.status(200).json({
    message: `User Registered Successfully`,
  });
});

// Login
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return next(new ErrorHandler("Please Enter Username & Password", 400));
  }

  const user = await userModel.findOne({ username }).select("+password");

  if (!user) {
    return next(new ErrorHandler("Invalid Username Or Password", 401));
  }

  if (password !== user.password) {
    return next(new ErrorHandler("Invalid Username Or Password", 401));
  }

  sendToken(user, 200, res);
});

// Logout
exports.logout = catchAsyncErrors(async (req, res) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    message: "Logged Out",
  });
});

// Me
exports.me = catchAsyncErrors(async (req, res) => {
  sendToken(req.user, 200, res);
});
