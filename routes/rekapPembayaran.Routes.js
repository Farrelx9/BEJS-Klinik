const express = require("express");
const router = express.Router();

const rekapPembayaranController = require("../controllers/rekapPembayaran.Controller");
const authMiddleware = require("../middlewares/auth");

// Tambah rekap pembayaran
router.post(
  "/",
  authMiddleware,
  rekapPembayaranController.createRekapPembayaran
);

// Ambil semua rekap pembayaran
router.get(
  "/",
  authMiddleware,
  rekapPembayaranController.getAllRekapPembayaran
);

// Ambil rekap berdasarkan ID
router.get("/:id", authMiddleware, rekapPembayaranController.getRekapById);

// Ambil rekap berdasarkan id_pasien
router.get(
  "/pasien/:id_pasien",
  authMiddleware,
  rekapPembayaranController.getRekapByPasien
);

// Hapus rekap berdasarkan ID
router.delete(
  "/:id",
  authMiddleware,
  rekapPembayaranController.deleteRekapPembayaran
);

module.exports = router;
