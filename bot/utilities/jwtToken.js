// Create Token And Save in Cookie
const sendToken = async (user, statusCode, res) => {
  const token = user.getJWTToken();

  let TokenDate = new Date(
    Date.now() + 1000 * 60 * 60 * 24 * process.env.COOKIE_EXPIRE
  );

  // Option for cookie
  const options1 = {
    expires: TokenDate,
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  };

  const { password, verified, updatedAt, refreshToken, __v, ...others } =
    user._doc;

  user = others;

  res.cookie("token", token, options1).status(statusCode).json({
    user,
  });
};

module.exports = sendToken;
