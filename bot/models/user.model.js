const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, "Please Enter Your Name"],
      minlength: [4, "Username should have more than 4 characaters"],
      unique: [true, "Please Enter Unique Username"],
    },
    password: {
      type: String,
      required: [true, "Please Enter Your Password"],
      minlength: [6, "Password should be greater than 8 characters"],
      select: false,
    },
    role: {
      type: String,
      enum: ["admin", "user"],
      default: "user",
    },
    myBalance: {
      tLUNC: {
        type: Number,
        default: 0,
      },
      tCust: {
        type: Number,
        default: 0,
      },
    },
    isSwap: {
      type: Boolean,
      default: true,
    },
    checkbox: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// JWT TOKEN
UserSchema.methods.getJWTToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SEC, {
    expiresIn: process.env.JWT_EXPIRE,
  });
};

module.exports = mongoose.model("User", UserSchema);
