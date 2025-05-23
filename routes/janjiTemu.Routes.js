const { Router } = require("express");
const router = Router();
const janjiTemu = require("../controllers/janjiTemu.controller");
const authMiddleware = require("../middlewares/auth");

router.get("/available", authMiddleware, janjiTemu.getAvailableJanjiTemu);
router.patch("/:id/book", authMiddleware, janjiTemu.bookJanjiTemu);

//admin
router.get("/booked", authMiddleware, janjiTemu.getBookedJanjiTemu); // Hanya yang dipesan
// Riwayat pasien
router.get(
  "/booked/:id_pasien",
  authMiddleware,
  janjiTemu.getBookedJanjiTemuByPasien
);

router.put("/confirm/:id", authMiddleware, janjiTemu.confirmJanjiTemu); // Konfirmasi/tolak
router.put("/updatePayment/:id", authMiddleware, janjiTemu.updatePayment);

module.exports = router;
