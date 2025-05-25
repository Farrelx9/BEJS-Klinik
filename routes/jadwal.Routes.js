const { Router } = require("express");
const router = Router();
const jadwal = require("../controllers/jadwal.Controller");
const authMiddleware = require("../middlewares/auth");

router.get("/", authMiddleware, jadwalController.getAllJadwal);
router.post("/buat", authMiddleware, jadwalController.createJadwal);
router.put("/:id", authMiddleware, jadwalController.updateJadwal);
router.delete("/delete/:id", authMiddleware, jadwalController.deleteJadwal);

module.exports = router;
