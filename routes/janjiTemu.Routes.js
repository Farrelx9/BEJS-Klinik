const { Router } = require("express");
const router = Router();
const janjiTemu = require("../controllers/janjiTemu.controller");
const authMiddleware = require("../middlewares/auth");

router.get("/available", authMiddleware, janjiTemu.getAvailableJanjiTemu);
router.patch("/:id/book", authMiddleware, janjiTemu.bookJanjiTemu);

module.exports = router;
