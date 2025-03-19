const { authService } = require("../services");

const register = async (req, res) => {
  const { body } = req;
  try {
    const signup = await authService.register(body);
    if (signup.status) {
      // Set refresh token in HTTP-only cookie for enhanced security
      res.cookie("refreshToken", signup.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production", // Use secure in production
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Don't expose refresh token in response
      const { refreshToken, ...responseData } = signup.data;

      return res.status(201).json({
        status: true,
        message: "User created successfully",
        data: responseData,
      });
    }
    return res.status(400).json({ status: false, message: signup.message });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const login = async (req, res) => {
  const { body } = req;
  try {
    const login = await authService.login(body);
    if (login.status) {
      // Set refresh token in HTTP-only cookie
      res.cookie("refreshToken", login.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      // Don't expose refresh token in response
      const { refreshToken, ...responseData } = login.data;

      return res.status(200).json({
        status: true,
        message: "User logged in successfully",
        data: responseData,
      });
    }
    return res.status(401).json({ status: false, message: login.message });
  } catch (error) {
    return res.status(500).json({ status: false, message: error.message });
  }
};

const refreshAccessToken = async (req, res) => {
  try {
    // Get refresh token from cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({
        status: false,
        message: "Refresh token required",
      });
    }

    const result = await authService.refreshToken(refreshToken);

    if (result.status) {
      // Set new refresh token in cookie
      res.cookie("refreshToken", result.data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      });

      return res.status(200).json({
        status: true,
        message: "Token refreshed",
        data: {
          accessToken: result.data.accessToken,
        },
      });
    }

    return res.status(401).json({
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

const forgotPassword = async (req, res)=>{
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        status: false,
        message: "Email is required",
      });
    }

    const result = await authService.forgotPassword(email);

    if (result.status) {
      return res.status(200).json({
        status: true,
        message: "Password reset link sent to your email",
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
}

const logout = async (req, res) => {
  try {
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      return res.status(200).json({
        status: true,
        message: "Already logged out",
      });
    }

    // Invalidate the refresh token
    await authService.logout(req.user._id, refreshToken);

    // Clear the cookie
    res.clearCookie("refreshToken");

    return res.status(200).json({
      status: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

const logoutAll = async (req, res) => {
  try {
    // Invalidate all refresh tokens for the user
    await authService.logoutAll(req.user._id);

    // Clear the cookie
    res.clearCookie("refreshToken");

    return res.status(200).json({
      status: true,
      message: "All sessions logged out successfully",
    });
  } catch (error) {
    return res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  forgotPassword,
  logout,
  logoutAll,
};
