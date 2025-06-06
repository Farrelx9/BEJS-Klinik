const { Router } = require("express");
const router = Router();
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");

const auth = require("../controllers/auth.Controller");

// Konfigurasi Multer untuk memory storage
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  fileFilter: function (req, file, cb) {
    // Regex case-insensitive dan tambah format HEIC
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif|heic)$/i)) {
      return cb(
        new Error(
          "Hanya file gambar (JPG, JPEG, PNG, GIF, HEIC) yang diperbolehkan!"
        ),
        false
      );
    }
    cb(null, true);
  },
  limits: {
    fileSize: 6 * 1024 * 1024, // Batas ukuran file 6MB
  },
});

router.post("/register", auth.register);
router.post("/login", auth.login);
router.post("/sendOtp", auth.sendOtp);
router.post("/verifyOtp", auth.verifyOtp);
router.post("/forgotPassword", auth.forgotPassword);
router.post("/resetPassword", auth.resetPassword);
router.post("/updatePassword", auth.updatePassword);
router.post("/changePassword", authMiddleware, auth.changePassword);
router.post(
  "/requestChangePasswordOtp",
  authMiddleware,
  auth.requestChangePasswordOtp
);
router.get("/profile", authMiddleware, auth.getProfile);
router.put(
  "/profile",
  authMiddleware,
  upload.single("profilePicture"),
  auth.updateProfile
);

// Login Khusus Role
router.post("/login/role", auth.loginRole);
module.exports = router;
