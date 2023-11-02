const mongoose = require("mongoose");

const ConfigSchema = new mongoose.Schema(
  {
    total_tLUNC_supply: {
      type: Number,
      default: 6000000000000,
    },
    total_tCUST_supply: {
      type: Number,
      default: 0,
    },
    total_tLUNC_in_vault: {
      type: Number,
      default: 1,
    },
    tax: {
      type: Number,
      default: 0.5,
    },
    tLUNC_in_vault_array: {
      type: Array,
      default: [
        {
          val: 0,
          date: new Date(),
        },
      ],
    },
    vcf_array: {
      type: Array,
      default: [
        {
          val: 0,
          date: new Date(),
        },
      ],
    },
    CFToVCF: {
      type: Array,
      default: [
        {
          val: 0,
          date: new Date(),
        },
      ],
    },
    VCFToCF: {
      type: Array,
      default: [
        {
          val: 0,
          date: new Date(),
        },
      ],
    },
    vcf: {
      type: Number,
      default: 0,
    },
    lunccurrent: {
      type: Array,
      default: [
        {
          val: 0,
          date: new Date(),
        },
      ],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Config", ConfigSchema);
