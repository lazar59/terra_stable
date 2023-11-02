const router = require("express").Router();
const {
  registerUser,
  loginUser,
  logout,
  me,
} = require("../controllers/authentication.controller");
const { isAuthenticatedUser } = require("../middlewares/auth");

router.route("/register").post(registerUser);
router.route("/login").post(loginUser);
router.route("/logout").get(logout);
router.route("/me").get(isAuthenticatedUser, me);

module.exports = router;
