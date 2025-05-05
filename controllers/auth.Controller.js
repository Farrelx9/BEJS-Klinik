const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const getRenderedHtml = require("../utils/getRenderedHtml");

const prisma = new PrismaClient();

// Register
exports.register = async (req, res) => {
  const { username, nama, email, password, noTelp, alamat } = req.body;
  try {
    // Cek email sudah terdaftar
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Simpan user baru
    const user = await prisma.user.create({
      data: {
        username,
        nama,
        email,
        password: hashedPassword,
        noTelp,
        alamat,
        role: "user",
        is_verified: false,
      },
    });

    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
      },
    });

    // Kirim OTP ke email user
    try {
      const html = getRenderedHtml(`email-verification`, {
        nama: user.nama,
        otp: kode_otp,
      });

      await sendEmail({ to: email, subject: "Your OTP Code", html });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    res.status(201).json({
      message: "Registrasi berhasil, silakan cek email untuk verifikasi OTP",
      user: { id: user.id, email: user.email, nama: user.nama },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Cek verifikasi jika diperlukan
    // if (!user.is_verified) {
    //   return res.status(400).json({ message: "Akun belum diverifikasi" });
    // }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({ message: "Login berhasil", token });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Generate & Send OTP
exports.sendOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Generate kode OTP 6 digit
    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Simpan OTP ke database
    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
      },
    });

    // Kirim OTP ke email user dengan template EJS
    try {
      const html = getRenderedHtml(`email-verification`, {
        nama: user.nama,
        otp: kode_otp,
      });

      await sendEmail({ to: email, subject: "Your OTP Code", html });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    res.json({ message: "OTP berhasil dikirim" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Verifikasi OTP
exports.verifyOtp = async (req, res) => {
  const { email, kode_otp } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const otp = await prisma.otp.findFirst({
      where: {
        id_user: user.id,
        kode_otp,
        is_used: false,
        expiry_time: { gte: new Date() },
      },
    });

    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP tidak valid atau sudah kadaluarsa" });
    }

    await prisma.otp.update({
      where: { id_otp: otp.id_otp },
      data: { is_used: true },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { is_verified: true },
    });

    res.json({ message: "OTP valid, akun terverifikasi" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Reset Password (Verifikasi OTP & Ganti Password)
exports.resetPassword = async (req, res) => {
  const { email, kode_otp, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const otp = await prisma.otp.findFirst({
      where: {
        id_user: user.id,
        kode_otp,
        is_used: false,
        expiry_time: { gte: new Date() },
      },
    });

    if (!otp) {
      return res
        .status(400)
        .json({ message: "OTP tidak valid atau sudah kadaluarsa" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    await prisma.otp.update({
      where: { id_otp: otp.id_otp },
      data: { is_used: true },
    });

    res.json({ message: "Password berhasil direset" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000);

    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
      },
    });

    // Kirim OTP ke email user dengan template EJS
    try {
      const html = getRenderedHtml(`email-verification`, {
        nama: user.nama,
        otp: kode_otp,
      });

      await sendEmail({
        to: email,
        subject: "Reset Password - Kode OTP",
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    res.json({ message: "OTP reset password berhasil dikirim ke email" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId; // dari JWT middleware
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        nama: true,
        email: true,
        noTelp: true,
        alamat: true,
        role: true,
        is_verified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }
    res.json({ user });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Change Password (user sudah login)
exports.changePassword = async (req, res) => {
  const userId = req.user.userId; // dari JWT middleware
  const { oldPassword, newPassword } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Cek password lama
    const isMatch = await bcrypt.compare(oldPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Password lama salah" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};
