const express = require("express");
const router = express.Router();

const rekamMedis = require("../controllers/rekamMedis.Controller");
const authMiddleware = require("../middlewares/auth");

router.post("/buat", authMiddleware, rekamMedis.createRekamMedis);
router.get("/getAll", authMiddleware, rekamMedis.getAllRekamMedis);
router.get("/:id_pasien", authMiddleware, rekamMedis.getRekamMedisByPasien);
router.put("/update/:id", authMiddleware, rekamMedis.updateRekamMedis);
router.delete("/hapus/:id", authMiddleware, rekamMedis.deleteRekamMedis);

module.exports = router;
