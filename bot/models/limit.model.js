const mongoose = require("mongoose");

const LimitSchema = new mongoose.Schema(
  {
    upperRiskFactor: {
      type: Number,
      default: 0,
    },
    lowerRiskFactor: {
      type: Number,
      default: 0,
    },
    numOfDays: {
      type: Number,
      default: 30,
    },
    range1: {
      type: String,
      default: "Highest",
    },
    range2: {
      type: String,
      default: "Highest",
    },
    period1: {
      type: String,
      default: "Open",
    },
    period2: {
      type: String,
      default: "Open",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Limit", LimitSchema);
