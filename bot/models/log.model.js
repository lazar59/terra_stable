const mongoose = require("mongoose");

const LogSchema = new mongoose.Schema(
  {
    username: {
      type: String,
    },
    swap: {
      type: String,
    },
    amount: {
      type: Number,
    },
    tLUNCPrice: {
      type: Number,
    },
    tCUSTPrice: {
      type: Number,
    },
    burnTax: {
      type: Number,
    },
    communityPool: {
      type: Number,
    },
    oraclePool: {
      type: Number,
    },
    terrapexcTeam: {
      type: Number,
    },
    backupFunds: {
      type: Number,
    },
    vcf: {
      type: Number,
    },
    srf: {
      type: Number,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Log", LogSchema);
