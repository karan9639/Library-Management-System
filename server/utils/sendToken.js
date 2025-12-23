export const sendToken = (user, statusCode, message, res) => {
  const token = user.generateToken();

  const cookieDays = Number(process.env.COOKIE_EXPIRE || 7);

  return res
    .status(statusCode)
    .cookie("token", token, {
      expires: new Date(Date.now() + cookieDays * 24 * 60 * 60 * 1000),
      httpOnly: true,
      // secure: process.env.NODE_ENV === "production",
      // sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    })
    .json({
      success: true,
      user,
      message,
      token,
    });
};
