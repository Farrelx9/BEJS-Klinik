const express = require("express");
const router = express.Router();
const pembayaranController = require("../controllers/pembayaran.controller");
const webhookController = require("../controllers/webHook.Controller");

const authMiddleware = require("../middlewares/auth");
// Untuk frontend
router.post("/chat/bayar", authMiddleware, pembayaranController.buatTransaksi);

// Midtrans webhook/callback
router.post(
  "/midtrans/webhook",
  express.raw({ type: "application/json" }),
  webhookController.handleWebhook
);

// Opsi: cek status manual
router.get(
  "/chat/status/:id_konsultasi",
  authMiddleware,
  pembayaranController.cekStatusPembayaran
);

router.post("/webhook/simulasi", pembayaranController.simulasiWebhook);

module.exports = router;
