const express = require("express");
const router = express.Router();

const rekapPembayaranController = require("../controllers/rekapPembayaran.Controller");

// Tambah rekap pembayaran
router.post("/", rekapPembayaranController.createRekapPembayaran);

// Ambil semua rekap pembayaran
router.get("/", rekapPembayaranController.getAllRekapPembayaran);

// Ambil rekap berdasarkan ID
router.get("/:id", rekapPembayaranController.getRekapById);

// Ambil rekap berdasarkan id_pasien
router.get("/pasien/:id_pasien", rekapPembayaranController.getRekapByPasien);

// Hapus rekap berdasarkan ID
router.delete("/:id", rekapPembayaranController.deleteRekapPembayaran);

module.exports = router;
