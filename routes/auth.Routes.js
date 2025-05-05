const { Router } = require("express");
const router = Router();
const authMiddleware = require("../middlewares/auth");

const auth = require("../controllers/auth.Controller");

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/sendOtp", auth.sendOtp);
router.post("/verifyOtp", auth.verifyOtp);
router.post("/forgotPassword", auth.forgotPassword);
router.post("/resetPassword", auth.resetPassword);
router.post("/changePassword", authMiddleware, auth.changePassword);
router.post(
  "/requestChangePasswordOtp",
  authMiddleware,
  auth.requestChangePasswordOtp
);
router.get("/profile", authMiddleware, auth.getProfile);

module.exports = router;
