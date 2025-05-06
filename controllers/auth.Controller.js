const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const sendEmail = require("../utils/sendEmail");
const getRenderedHtml = require("../utils/getRenderedHtml");
const path = require("path");
const fs = require("fs");

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
        profilePicture: true,
      },
    });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Transform the response to include full URL for profile picture only if it exists
    const transformedUser = {
      ...user,
      profilePicture: user.profilePicture
        ? `http://localhost:3000/uploads/profile/${user.profilePicture}`
        : undefined,
    };

    res.json({ user: transformedUser });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Change Password (user sudah login)
exports.changePassword = async (req, res) => {
  const userId = req.user.userId; // dari JWT middleware
  const { oldPassword, newPassword, kode_otp } = req.body;

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

    // Verifikasi OTP
    const otp = await prisma.otp.findFirst({
      where: {
        id_user: userId,
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

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Update OTP menjadi used
    await prisma.otp.update({
      where: { id_otp: otp.id_otp },
      data: { is_used: true },
    });

    // Kirim email notifikasi perubahan password
    try {
      const html = getRenderedHtml(`password-changed`, {
        nama: user.nama,
        email: user.email,
      });

      await sendEmail({
        to: user.email,
        subject: "Password Berhasil Diubah",
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Request OTP untuk perubahan password
exports.requestChangePasswordOtp = async (req, res) => {
  const userId = req.user.userId;
  const { oldPassword } = req.body;

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

    // Generate kode OTP
    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Simpan OTP ke database
    await prisma.otp.create({
      data: {
        id_user: userId,
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

      await sendEmail({
        to: user.email,
        subject: "Kode OTP untuk Perubahan Password",
        html,
      });
    } catch (error) {
      console.error("Failed to send email:", error);
    }

    res.json({ message: "OTP telah dikirim ke email Anda" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Update Profile
exports.updateProfile = async (req, res) => {
  const userId = req.user.userId;
  const { username, nama, noTelp, alamat } = req.body;
  const profilePicture = req.file; // dari multer middleware

  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Cek username sudah digunakan atau belum (jika username diubah)
    if (username && username !== user.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });
      if (existingUser) {
        return res.status(400).json({ message: "Username sudah digunakan" });
      }
    }

    // Update data user
    const updateData = {
      ...(username && { username }),
      ...(nama && { nama }),
      ...(noTelp && { noTelp }),
      ...(alamat && { alamat }),
    };

    // Handle profile picture update
    if (profilePicture) {
      // Delete old profile picture if exists
      if (user.profilePicture) {
        const oldPicturePath = path.join(
          __dirname,
          "../uploads/profile",
          user.profilePicture
        );
        try {
          await fs.promises.unlink(oldPicturePath);
        } catch (error) {
          console.error("Error deleting old profile picture:", error);
        }
      }
      updateData.profilePicture = profilePicture.filename;
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        username: true,
        nama: true,
        email: true,
        noTelp: true,
        alamat: true,
        role: true,
        is_verified: true,
        profilePicture: true,
      },
    });

    // Transform the response to include full URL for profile picture only if it exists
    const transformedUser = {
      ...updatedUser,
      profilePicture: updatedUser.profilePicture
        ? `http://localhost:3000/uploads/profile/${updatedUser.profilePicture}`
        : undefined,
    };

    res.json({
      message: "Profile berhasil diupdate",
      user: transformedUser,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};
