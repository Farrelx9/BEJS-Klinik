const { Router } = require("express");
const router = Router();

/* GET home page. */
const authRouter = require("./auth.Routes");
router.use("/api/auth", authRouter);

module.exports = router;
