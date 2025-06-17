const { Router } = require("express");
const router = Router();

// Controller
const konsultasi = require("../controllers/konsultasi.Controller");

// Middleware
const authMidlleware = require("../middlewares/auth");

// 1. Mulai sesi chat setelah pilih jadwal
router.post("/chat/mulai", authMidlleware, konsultasi.mulaiSesiChat); // POST - Mulai sesi

// 2. Kirim pesan ke chat
router.post("/chat/kirim", authMidlleware, konsultasi.kirimPesan); // POST - Kirim pesan

// 3. Ambil riwayat chat
router.get("/chat/riwayat/:id_chat", authMidlleware, konsultasi.getRiwayatChat); // GET - Ambil riwayat

// 4. Selesaikan sesi chat
router.put(
  "/chat/selesaikan/:id_chat",
  authMidlleware,
  konsultasi.selesaikanSesi
); // PUT - Akhiri sesi

// 5. Cek apakah pasien punya sesi aktif
router.get(
  "/chat/aktif/:id_pasien",
  authMidlleware,
  konsultasi.getSesiAktifByPasien
); // GET - Cek sesi aktif

// 6. [Baru] Ambil semua jadwal chat yang tersedia
router.get(
  "/chat/jadwal",
  authMidlleware,
  konsultasi.getAvailableChatSchedules
); // GET - Lihat jadwal tersedia

// 7. [Baru] Pasien memilih jadwal chat
router.post("/chat/pilih-jadwal", authMidlleware, konsultasi.pilihJadwal); // POST - Booking jadwal

module.exports = router;

//8
router.get(
  "/chat/admin/daftar",
  authMidlleware,
  konsultasi.getAllChatsForAdmin
);
//9
router.patch(
  "/admin/aktifkan/:id_chat",
  authMidlleware,
  konsultasi.aktifkanSesiChat
);

//10
router.get("/chat/admin/detail/:id_chat", konsultasi.getChatDetail);

// 11
router.get("/chat/pasien/:id_pasien", konsultasi.getChatListForPasien);

//  [TAMBAHAN] Ambil jumlah pesan belum dibaca untuk admin
router.get(
  "/admin/unread",
  authMidlleware,
  chatController.getUnreadChatsForAdmin
);

//  [TAMBAHAN] Ambil jumlah pesan belum dibaca untuk sesi tertentu (pasien)
router.get(
  "/:id_chat/unread",
  authMidlleware,
  chatController.getUnreadMessagesBySesi
);
