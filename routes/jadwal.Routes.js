const { Router } = require("express");
const router = Router();
const jadwal = require("../controllers/jadwal.Controller");
const authMiddleware = require("../middlewares/auth");

router.get("/", authMiddleware, jadwal.getAllJadwal);
router.post("/buat", authMiddleware, jadwal.createJadwal);
router.put("/:id", authMiddleware, jadwal.updateJadwal);
router.delete("/delete/:id", authMiddleware, jadwal.deleteJadwal);

module.exports = router;
