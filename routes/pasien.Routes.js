const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const pasienController = require("../controllers/pasien.Controller");

router.get("/pasien", authMiddleware, pasienController.getAllPasien);

module.exports = router;
