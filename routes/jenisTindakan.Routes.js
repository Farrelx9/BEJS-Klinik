const express = require("express");
const router = express.Router();

const tindakan = require("../controllers/jenisTindakan.controller");
const authMidlleware = require("../middlewares/auth");

router.post("/buat", authMidlleware, tindakan.createJenisTindakan);
router.get("/getAll", authMidlleware, tindakan.getAllJenisTindakan);
router.get("/get/:id", authMidlleware, tindakan.getJenisTindakanById);
router.put("/update/:id", authMidlleware, tindakan.updateJenisTindakan);
router.delete("/delete/:id", authMidlleware, tindakan.deleteJenisTindakan);
router.get("/all", authMidlleware, tindakan.getAllJenisTindakanNoPagination);

module.exports = router;
