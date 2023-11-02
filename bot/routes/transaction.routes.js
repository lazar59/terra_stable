const router = require("express").Router();
const {
  changeTCUSTSupply,
  changeIsSwap,
  swapping,
  send,
  getLog,
  changeIsSwapCheckbox,
  coinMarketCap,
  riskLimit,
  getConfig,
  changeTax,
  changePrice,
  getVer,
} = require("../controllers/transaction.controller");
const { isAuthenticatedUser, authorizeRoles } = require("../middlewares/auth");

router
  .route("/change-tcust-supply")
  .patch(isAuthenticatedUser, changeTCUSTSupply);
router.route("/get-log").get(isAuthenticatedUser, getLog);
router.route("/send").put(isAuthenticatedUser, authorizeRoles("admin"), send);
router.route("/swapping").put(isAuthenticatedUser, swapping);
router.route("/changeIsSwap").patch(isAuthenticatedUser, changeIsSwap);
router
  .route("/changeIsSwapCheckbox")
  .patch(isAuthenticatedUser, changeIsSwapCheckbox);
router.route("/coin-market-cap").get(isAuthenticatedUser, coinMarketCap);
router.route("/risk-limit").put(isAuthenticatedUser, riskLimit);
router.route("/get-config").get(isAuthenticatedUser, getConfig);
router.route("/change-tax").put(isAuthenticatedUser, changeTax);
router.route("/change-price").patch(isAuthenticatedUser, changePrice);
router.route("/get-ver").get(isAuthenticatedUser, getVer);

module.exports = router;
