const { Router } = require("express");
const router = Router();
const authMiddleware = require("../middlewares/auth");
const multer = require("multer");
const path = require("path");

const auth = require("../controllers/auth.Controller");

// Konfigurasi Multer untuk upload file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../uploads/profile")); // Use absolute path
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(
      null,
      file.fieldname + "-" + uniqueSuffix + path.extname(file.originalname)
    );
  },
});

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
    fileSize: 4 * 1024 * 1024, // Batas ukuran file 2MB
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

module.exports = router;
