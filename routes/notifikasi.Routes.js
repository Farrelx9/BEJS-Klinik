const express = require("express");
const router = express.Router();
const {
  getNotificationsByPasienId,
  markAllNotificationsAsRead,
} = require("../controllers/notifikasi.controller");

router.get("/:id_pasien", getNotificationsByPasienId);
router.patch("/:id_notifikasi/mark-all-read", markAllNotificationsAsRead);

module.exports = router;
