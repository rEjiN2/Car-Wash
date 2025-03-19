const { googleSignIn } = require("../services/oauth-service");

const googleAuth = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) {
    return res.status(400).json({
      status: false,
      message: "Firebase ID token is required",
    });
  }

  try {
    const result = await googleSignIn(idToken);

    if (result.status) {
      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Don't expose refresh token in response
      const { refreshToken, ...responseData } = result.data;

      return res.status(200).json({
        status: true,
        message: result.message,
        data: responseData,
      });
    }

    return res.status(400).json({
      status: false,
      message: result.message,
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  googleAuth,
};
