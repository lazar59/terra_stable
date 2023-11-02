const userModel = require("../models/user.model");
const catchAsyncErrors = require("../middlewares/catchAsyncError");
const ErrorHandler = require("../utilities/errorHandler");
const logModel = require("../models/log.model");
const limitModel = require("../models/limit.model");
const configModel = require("../models/configs.model");
const axios = require("axios");

// Change tCUST Supply
exports.changeTCUSTSupply = catchAsyncErrors(async (req, res, next) => {
  const config = await configModel.findOne();

  config.total_tCUST_supply = req.body.tluncPrice;

  config.save();

  res.status(200).json({
    message: "Changed Successfully",
  });
});

// Change live Supply
exports.changePrice = catchAsyncErrors(async (req, res, next) => {
  const config = await configModel.findOne();

  if (config !== null) {
    let temp = config.lunccurrent;
    let currentDate = new Date();

    let temp2 = temp[temp.length - 1].date;

    if (
      String(temp2).split(" ")[4].split(":")[0] ===
        String(currentDate).split(" ")[4].split(":")[0] ||
      req.body.price === null
    ) {
      return res.status(200).json({
        message: "Already",
        Success: false,
      });
    }

    if (temp.length > 1 && temp[0].val === 0) {
      temp.shift();
      temp.push({ val: req.body.price, date: new Date() });
    } else {
      temp.push({ val: req.body.price, date: new Date() });
    }

    await configModel.findByIdAndUpdate(
      config._id,
      {
        lunccurrent: temp,
      },
      { new: true }
    );
  }

  res.status(200).json({
    message: "Changed Successfully",
    Success: true,
  });
});

// Swapping
exports.swapping = catchAsyncErrors(async (req, res, next) => {
  const { input, select1, select2, currentTLUNCPrice } = req.body;

  const config = await configModel.findOne();

  if (config?.total_tLUNC_supply < input) {
    return next(
      new ErrorHandler("You Don't Have Enough Balance in Supply", 400)
    );
  }

  let convertedValue = 0;
  const poolBalance = input * (config.tax / 100);

  const currentTCUSTPrice =
    (config?.total_tLUNC_in_vault * currentTLUNCPrice) /
    config?.total_tCUST_supply;

  const poolBalance2 =
    ((input * currentTCUSTPrice) / currentTLUNCPrice) * (config?.tax / 100);

  if (select1 === "tLUNC" && select2 === "tCUST") {
    if (req.user.myBalance.tLUNC < input) {
      return next(new ErrorHandler("You Don't Have Enough Balance", 400));
    }

    convertedValue =
      (input - (config.tax / 100) * input) *
      (currentTLUNCPrice / currentTCUSTPrice);

    req.user.myBalance.tLUNC = req.user.myBalance.tLUNC - input;
    req.user.myBalance.tCust = req.user.myBalance.tCust + convertedValue;

    config.total_tCUST_supply = config.total_tCUST_supply + convertedValue;
    config.total_tLUNC_in_vault =
      config.total_tLUNC_in_vault + (input - (config.tax / 100) * input);
  } else if (select1 === "tCUST" && select2 === "tLUNC") {
    if (req.user.myBalance.tCust < input) {
      return next(new ErrorHandler("You Don't Have Enough Balance", 400));
    }

    convertedValue =
      ((input * currentTCUSTPrice) / currentTLUNCPrice) *
      ((100 - config.tax) / 100);

    req.user.myBalance.tLUNC = req.user.myBalance.tLUNC + convertedValue;
    req.user.myBalance.tCust = req.user.myBalance.tCust - input;

    config.total_tCUST_supply = config.total_tCUST_supply - input;
    config.total_tLUNC_in_vault =
      config.total_tLUNC_in_vault -
      (input * currentTCUSTPrice) / currentTLUNCPrice;
  }

  if (select1 === "tLUNC") {
    const temp = poolBalance * 0.375;
    config.vcf = config.vcf + temp;
  } else {
    const temp = poolBalance2 * 0.375;
    config.vcf = config.vcf + temp;
  }

  if (currentTCUSTPrice > 1) {
    const temp =
      ((currentTCUSTPrice - 1) * config.total_tCUST_supply) / currentTLUNCPrice;
    config.vcf = config.vcf + temp;
    config.total_tLUNC_in_vault = config.total_tLUNC_in_vault - temp;

    config.CFToVCF.push({ val: temp, date: new Date() });
    config.VCFToCF.push({ val: 0, date: new Date() });
  } else if (currentTCUSTPrice < 1) {
    const temp =
      ((1 - currentTCUSTPrice) * config.total_tCUST_supply) / currentTLUNCPrice;

    if (temp >= config.vcf) {
      config.total_tLUNC_in_vault = config.total_tLUNC_in_vault + config.vcf;
      config.vcf = 0;

      config.VCFToCF.push({ val: config.vcf, date: new Date() });
      config.CFToVCF.push({ val: 0, date: new Date() });
    } else if (temp < config.vcf) {
      config.total_tLUNC_in_vault = config.total_tLUNC_in_vault + temp;
      config.vcf = config.vcf - temp;

      config.VCFToCF.push({ val: temp, date: new Date() });
      config.CFToVCF.push({ val: 0, date: new Date() });
    }
  }

  if (
    config.tLUNC_in_vault_array.length > 1 &&
    config.tLUNC_in_vault_array[0].val === 0
  ) {
    config.tLUNC_in_vault_array.shift();
    config.vcf_array.shift();

    config.tLUNC_in_vault_array.push({
      val: config.total_tLUNC_in_vault,
      date: new Date(),
    });
    config.vcf_array.push({ val: config?.vcf, date: new Date() });
  } else {
    config.tLUNC_in_vault_array.push({
      val: config.total_tLUNC_in_vault,
      date: new Date(),
    });
    config.vcf_array.push({ val: config?.vcf, date: new Date() });
  }

  await logModel.create({
    username: req.user.username,
    swap: select1 + " -> " + select2,
    amount: input,
    tLUNCPrice: currentTLUNCPrice,
    tCUSTPrice: currentTCUSTPrice,
    burnTax: select1 === "tLUNC" ? poolBalance * 0.5 : poolBalance2 * 0.5,
    communityPool:
      select1 === "tLUNC" ? poolBalance * 0.025 : poolBalance2 * 0.025,
    oraclePool: select1 === "tLUNC" ? poolBalance * 0.05 : poolBalance2 * 0.05,
    terrapexcTeam:
      select1 === "tLUNC" ? poolBalance * 0.02 : poolBalance2 * 0.02,
    backupFunds:
      select1 === "tLUNC" ? poolBalance * 0.025 : poolBalance2 * 0.025,
    vcf: select1 === "tLUNC" ? poolBalance * 0.375 : poolBalance2 * 0.375,
    srf: select1 === "tLUNC" ? poolBalance * 0.005 : poolBalance2 * 0.005,
  });

  req.user.save();
  config.save();

  res.status(200).json({
    message: "Swapped Successfully",
  });
});

// Send
exports.send = catchAsyncErrors(async (req, res, next) => {
  const { username, price } = req.body;

  if (username === req.user.username) {
    return next(new ErrorHandler("You Can't Send Money To YourSelf", 400));
  }

  const user = await userModel.findOne({ username });

  if (!user) {
    return next(new ErrorHandler("Please Enter Valid Username", 400));
  }

  req.user.myBalance.tLUNC = Number(req.user.myBalance.tLUNC) - Number(price);
  user.myBalance.tLUNC = Number(user.myBalance.tLUNC) + Number(price);

  req.user.save();
  user.save();

  res.status(200).json({
    message: "send Successfully",
  });
});

// Get Log
exports.getLog = catchAsyncErrors(async (req, res, next) => {
  const data = await logModel.find();

  res.status(200).json({
    message: "send Successfully",
    data,
  });
});

// Change Is Swap
exports.changeIsSwap = catchAsyncErrors(async (req, res, next) => {
  const { val } = req.body;

  const users = await userModel.find();

  users.forEach((user) => {
    user.isSwap = val;
    user.save();
  });

  res.status(200).json({
    message: "Changed Successfully",
  });
});

// Change Is Swap Checkbox
exports.changeIsSwapCheckbox = catchAsyncErrors(async (req, res, next) => {
  const { val } = req.body;

  const users = await userModel.find();

  users.forEach((user) => {
    user.checkbox = val;
    user.save();
  });

  res.status(200).json({
    message: "Changed Successfully",
  });
});

// Coin Market Cap
exports.coinMarketCap = catchAsyncErrors((req, res, next) => {
  const { numberOfDays, range1, range2, period1, period2 } = req.query;

  const to = Math.floor(
    new Date(new Date().toISOString().split("T")[0]).getTime() / 1000
  );

  var date = new Date();
  date.setDate(date.getDate() - numberOfDays);
  var dateString = date.toISOString().split("T")[0];
  const from = Math.floor(new Date(dateString).getTime() / 1000);

  new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id=4172&convertId=2781&timeStart=${from}&timeEnd=${to}`,
        {
          headers: {
            Accepts: "application/json",
            "X-CMC_PRO_API_KEY": process.env.COIN_MARKET,
          },
        }
      );

      const datas = response.data.data.quotes;

      let val1 = 0;
      let val2 = 0;

      if (datas.length === 0) {
        return res.status(200).json({
          message: "success",
        });
      }

      const closeValue = datas[0].quote.close;

      if (period1 === "Open") {
        val1 = datas[0].quote.open;
      } else if (period1 === "Close") {
        val1 = datas[0].quote.close;
      } else if (period1 === "High") {
        val1 = datas[0].quote.high;
      } else if (period1 === "Low") {
        val1 = datas[0].quote.low;
      }

      if (period2 === "Open") {
        val2 = datas[0].quote.open;
      } else if (period2 === "Close") {
        val2 = datas[0].quote.close;
      } else if (period2 === "High") {
        val2 = datas[0].quote.high;
      } else if (period2 === "Low") {
        val2 = datas[0].quote.low;
      }

      datas.forEach((item) => {
        if (range1 === "Highest") {
          if (period1 === "Open") {
            val1 < item.quote.open ? (val1 = item.quote.open) : (val1 = val1);
          } else if (period1 === "Close") {
            val1 < item.quote.close ? (val1 = item.quote.close) : (val1 = val1);
          } else if (period1 === "High") {
            val1 < item.quote.high ? (val1 = item.quote.high) : (val1 = val1);
          } else if (period1 === "Low") {
            val1 < item.quote.low ? (val1 = item.quote.low) : (val1 = val1);
          }
        } else if (range1 === "Lowest") {
          if (period1 === "Open") {
            val1 > item.quote.open ? (val1 = item.quote.open) : (val1 = val1);
          } else if (period1 === "Close") {
            val1 > item.quote.close ? (val1 = item.quote.close) : (val1 = val1);
          } else if (period1 === "High") {
            val1 > item.quote.high ? (val1 = item.quote.high) : (val1 = val1);
          } else if (period1 === "Low") {
            val1 > item.quote.low ? (val1 = item.quote.low) : (val1 = val1);
          }
        }

        if (range2 === "Highest") {
          if (period2 === "Open") {
            val2 < item.quote.open ? (val2 = item.quote.open) : (val2 = val2);
          } else if (period2 === "Close") {
            val2 < item.quote.close ? (val2 = item.quote.close) : (val2 = val2);
          } else if (period2 === "High") {
            val2 < item.quote.high ? (val2 = item.quote.high) : (val2 = val2);
          } else if (period2 === "Low") {
            val2 < item.quote.low ? (val2 = item.quote.low) : (val2 = val2);
          }
        } else if (range2 === "Lowest") {
          if (period2 === "Open") {
            val2 > item.quote.open ? (val2 = item.quote.open) : (val2 = val2);
          } else if (period2 === "Close") {
            val2 > item.quote.close ? (val2 = item.quote.close) : (val2 = val2);
          } else if (period2 === "High") {
            val2 > item.quote.high ? (val2 = item.quote.high) : (val2 = val2);
          } else if (period2 === "Low") {
            val2 > item.quote.low ? (val2 = item.quote.low) : (val2 = val2);
          }
        }
      });

      const upperVCRF = closeValue / val1;
      const lowerVCRF = closeValue / val2;

      resolve(response.data);

      const riskFactor = await limitModel.findOne();

      riskFactor.numOfDays = numberOfDays;
      riskFactor.range1 = range1;
      riskFactor.range2 = range2;
      riskFactor.period1 = period1;
      riskFactor.period2 = period2;

      riskFactor.save();

      res.status(200).json({
        message: "Get Successfully",
        another: {
          val1: val1,
          val2: val2,
          upperVCRF: upperVCRF,
          lowerVCRF: lowerVCRF,
          numOfDays: riskFactor.numOfDays,
          range1: riskFactor.range1,
          range2: riskFactor.range2,
          period1: riskFactor.period1,
          period2: riskFactor.period2,
          upperRiskFactor: (riskFactor && riskFactor.upperRiskFactor) || 0,
          lowerRiskFactor: (riskFactor && riskFactor.lowerRiskFactor) || 0,
        },
      });
    } catch (error) {
      reject(error);
      return next(new ErrorHandler("Something Went Wrong", 400));
    }
  });
});

// get Ver
exports.getVer = catchAsyncErrors((req, res, next) => {
  const to = Math.floor(
    new Date(new Date().toISOString().split("T")[0]).getTime() / 1000
  );

  var date = new Date();
  date.setDate(date.getDate() - 30);
  var dateString = date.toISOString().split("T")[0];
  const from = Math.floor(new Date(dateString).getTime() / 1000);

  new Promise(async (resolve, reject) => {
    try {
      const response = await axios.get(
        `https://api.coinmarketcap.com/data-api/v3/cryptocurrency/historical?id=4172&convertId=2781&timeStart=${from}&timeEnd=${to}`,
        {
          headers: {
            Accepts: "application/json",
            "X-CMC_PRO_API_KEY": process.env.COIN_MARKET,
          },
        }
      );

      const datas = response.data.data.quotes;

      if (datas.length === 0) {
        return res.status(200).json({
          message: "success",
        });
      }

      res.status(200).json({
        message: "Get Successfully",
        data: datas,
      });
    } catch (error) {
      reject(error);
      return next(new ErrorHandler("Something Went Wrong", 400));
    }
  });
});

exports.riskLimit = catchAsyncErrors(async (req, res, next) => {
  const { upperRiskFactor, lowerRiskFactor } = req.body;

  const data = await limitModel.findOne();

  if (data === null) {
    await limitModel.create({
      upperRiskFactor: upperRiskFactor,
      lowerRiskFactor: lowerRiskFactor,
    });
  } else {
    data.upperRiskFactor = upperRiskFactor;
    data.lowerRiskFactor = lowerRiskFactor;
    data.save();
  }

  res.status(200).json({
    message: "Successfully",
  });
});

exports.getConfig = catchAsyncErrors(async (req, res, next) => {
  const config = await configModel.findOne();
  const riskFactor = await limitModel.findOne();

  res.status(200).json({
    message: "Successfully",
    config: {
      tax: config.tax,
      total_tCUST_supply: config.total_tCUST_supply,
      total_tLUNC_in_vault: config.total_tLUNC_in_vault,
      total_tLUNC_supply: config.total_tLUNC_supply,
      tLUNC_in_vault_array: config.tLUNC_in_vault_array,
      vcf_array: config.vcf_array,
      CFToVCF: config.CFToVCF,
      VCFToCF: config.VCFToCF,
      vcf: config.vcf,
      lunccurrent: config.lunccurrent,
      numOfDays: riskFactor.numOfDays,
      range1: riskFactor.range1,
      range2: riskFactor.range2,
      period1: riskFactor.period1,
      period2: riskFactor.period2,
    },
  });
});

exports.changeTax = catchAsyncErrors(async (req, res, next) => {
  const { tax } = req.body;

  const config = await configModel.findOne();
  config.tax = tax;
  config.save();

  res.status(200).json({
    message: "Successfully",
  });
});
