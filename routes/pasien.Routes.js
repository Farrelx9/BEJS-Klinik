const express = require("express");
const router = express.Router();
const authMiddleware = require("../middlewares/auth");

const pasienController = require("../controllers/pasien.Controller");

router.get("/pasien", authMiddleware, pasienController.getAllPasien);
router.post("/buat", authMiddleware, pasienController.createPasien);
router.put("/update/:id_pasien", pasienController.updatePasien);
router.delete("/hapus/:id_pasien", pasienController.deletePasien);

module.exports = router;
