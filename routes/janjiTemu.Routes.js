const { Router } = require("express");
const router = Router();
const janjiTemuController = require("../controllers/janjiTemu.controller");
const authMiddleware = require("../middlewares/auth");
const prisma = require("../prisma/client");
const { checkRole } = require("../middlewares/role");

// Semua endpoint memerlukan authMiddleware

// 1. Buat Janji Temu Baru (Hanya pasien)
router.post(
  "/",
  authMiddleware,
  checkRole(["pasien"]),
  janjiTemuController.createJanjiTemu
);

// 2. Lihat Janji Temu Berdasarkan ID Pasien (Hanya pasien itu sendiri atau admin)
router.get(
  "/pasien/:id_pasien",
  authMiddleware,
  (req, res, next) => {
    // Jika user adalah pasien, hanya boleh lihat data dirinya sendiri
    if (req.user.role === "pasien" && req.user.id !== req.params.id_pasien) {
      return res.status(403).json({ message: "Akses ditolak" });
    }
    // Kalau admin, lanjut
    next();
  },
  janjiTemuController.getJanjiTemuByPasien
);

// 3. Batalkan Janji Temu (Hanya pasien yang bisa batalkan janjinya sendiri)
router.patch(
  "/:id/cancel",
  authMiddleware,
  async (req, res, next) => {
    try {
      const janjiTemu = await prisma.janjiTemu.findUnique({
        where: { id_janji: req.params.id },
        select: { id_pasien: true },
      });

      if (!janjiTemu) {
        return res.status(404).json({ message: "Janji temu tidak ditemukan" });
      }

      if (req.user.role === "pasien" && req.user.id !== janjiTemu.id_pasien) {
        return res.status(403).json({ message: "Akses ditolak" });
      }

      next();
    } catch (error) {
      res
        .status(500)
        .json({ message: "Gagal memvalidasi akses", error: error.message });
    }
  },
  janjiTemuController.cancelJanjiTemu
);

// 4. Admin & Dokter - Lihat Semua Janji Temu
router.get(
  "/",
  authMiddleware,
  checkRole(["admin", "dokter"]),
  janjiTemuController.getAllJanjiTemu
);

// 5. Admin & Dokter - Lihat Detail Janji Temu
router.get(
  "/:id",
  authMiddleware,
  checkRole(["admin", "dokter"]),
  janjiTemuController.getJanjiTemuById
);

// 6. Admin & Dokter - Update Status Janji Temu
router.patch(
  "/:id/status",
  authMiddleware,
  checkRole(["admin", "dokter"]),
  janjiTemuController.updateStatusJanjiTemu
);

module.exports = router;
