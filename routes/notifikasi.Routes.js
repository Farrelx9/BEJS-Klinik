const express = require("express");
const router = express.Router();
const {
  getNotificationsByPasienId,
  markAllNotificationsAsRead,
} = require("../controllers/notifikasi.controller");
const authMiddleware = require("../middlewares/auth");

router.get("/:id_pasien", authMiddleware, getNotificationsByPasienId);
router.patch(
  "/:id_notifikasi/mark-all-read",
  authMiddleware,
  markAllNotificationsAsRead
);

module.exports = router;
