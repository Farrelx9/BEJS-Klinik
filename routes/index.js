const { Router } = require("express");
const router = Router();

/* GET home page. */
const authRouter = require("./auth.Routes");
const janjiTemuRouter = require("./janjiTemu.Routes");
const errorHandler = require("../middlewares/errorHandler");

router.use("/api/auth", authRouter);
router.use("/api/janjiTemu", janjiTemuRouter);
router.use(errorHandler);

module.exports = router;
