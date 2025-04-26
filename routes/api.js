const { authRoutes, userRoutes } = require(".");

module.exports = function (app) {
  app.use("/api/auth", authRoutes);
  app.use("/api/user", userRoutes);
};
