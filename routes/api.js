const { authRoutes } = require(".");

module.exports = function (app) {
  app.use("/api/auth", authRoutes);
};
