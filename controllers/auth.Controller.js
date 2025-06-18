const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const {
  handleUserRegistration,
  handleProfileUpdate,
  handleChangePassword,
} = require("./notifikasi.controller");
const sendEmail = require("../utils/sendEmail");
const getRenderedHtml = require("../utils/getRenderedHtml");
const imagekit = require("../utils/imagekit");
// const path = require("path");
// const fs = require("fs");

const prisma = new PrismaClient();

// Register - hanya email & password diperlukan
exports.register = async (req, res) => {
  const { email, password } = req.body;

  try {
    // Cek apakah email sudah digunakan
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email sudah terdaftar" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Buat user baru
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "pasien",
        is_verified: false,
        createdAt: new Date(),
      },
    });

    // Buat entri Pasien (kosong dulu, nanti diisi di profile)
    await prisma.pasien.create({
      data: {
        user: {
          connect: { id: user.id },
        },
        nama: "",
        noTelp: "",
        alamat: "",
      },
    });

    // Generate OTP
    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000);
    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
        createdAt: new Date(),
      },
    });

    // Kirim OTP via email
    try {
      const html = getRenderedHtml(`email-verification`, {
        nama: email.split("@")[0],
        otp: kode_otp,
      });
      await sendEmail({ to: email, subject: "Your OTP Code", html });
    } catch (error) {
      console.error("Gagal mengirim email:", error);
    }

    // Jika fungsi ini bergantung pada pasien, pastikan aman
    try {
      await handleUserRegistration(user.id);
    } catch (err) {
      console.warn("handleUserRegistration gagal, lanjutkan proses...");
    }

    // Respon sukses
    res.status(201).json({
      message: "Registrasi berhasil, silakan cek email untuk verifikasi OTP",
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    console.error("Error registrasi:", error.message);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Cari user berdasarkan email dengan include pasien dan janji temu pending
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        pasien: {
          include: {
            janjiTemu: {
              where: { status: "pending" },
              orderBy: { tanggal_waktu: "asc" },
            },
            konsultasiChat: {
              where: { status: "pending" },
              orderBy: { waktu_mulai: "desc" },
            },
          },
        },
      },
    });

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

    // Format response data
    const responseData = {
      message: "Login berhasil",
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        is_verified: user.is_verified,
        pasien: user.pasien
          ? {
              id_pasien: user.pasien.id_pasien,
              nama: user.pasien.nama,
              noTelp: user.pasien.noTelp,
              alamat: user.pasien.alamat,
              tanggal_lahir: user.pasien.tanggal_lahir,
              jenis_kelamin: user.pasien.jenis_kelamin,
              profilePicture: user.pasien.profilePicture,
              janjiTemu: user.pasien.janjiTemu || [],
              konsultasiChat: user.pasien.konsultasiChat || [],
            }
          : null,
      },
    };

    res.json(responseData);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Generate & Send OTP
exports.sendOtp = async (req, res) => {
  const { email, purpose } = req.body; // tambahkan 'purpose'
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Generate kode OTP 6 digit
    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Simpan OTP ke database dengan tambahan informasi purpose
    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
        purpose: purpose || "register", // bisa "register" atau "forgot_password"
        createdAt: new Date(),
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

// Forgot Password - Kirim OTP ke email
exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Generate OTP
    const kode_otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry_time = new Date(Date.now() + 10 * 60 * 1000); // 10 menit

    // Simpan OTP ke database
    await prisma.otp.create({
      data: {
        id_user: user.id,
        kode_otp,
        expiry_time,
        is_used: false,
        createdAt: new Date(),
      },
    });

    // Kirim OTP ke email
    try {
      const html = getRenderedHtml(`email-verification`, {
        nama: user.pasien?.nama || email.split("@")[0],
        otp: kode_otp,
      });
      await sendEmail({
        to: email,
        subject: "Reset Password - Kode OTP",
        html,
      });
    } catch (error) {
      console.error("Gagal mengirim email:", error);
    }

    res.json({ message: "OTP reset password berhasil dikirim ke email" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Reset Password - Verifikasi OTP
exports.resetPassword = async (req, res) => {
  const { email, kode_otp } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Verifikasi OTP
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
        .json({ message: "OTP tidak valid atau kadaluarsa" });
    }

    // Update OTP menjadi used
    await prisma.otp.update({
      where: { id_otp: otp.id_otp },
      data: { is_used: true },
    });

    res.json({
      message: "OTP valid, silakan masukkan password baru",
      email: user.email,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Update Password - Setelah OTP terverifikasi
exports.updatePassword = async (req, res) => {
  const { email, newPassword } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Hash password baru
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    // Kirim email notifikasi perubahan password
    try {
      const html = getRenderedHtml(`password-changed`, {
        nama: user.pasien?.nama || email.split("@")[0],
        email: user.email,
      });
      await sendEmail({
        to: user.email,
        subject: "Password Berhasil Diubah",
        html,
      });
    } catch (error) {
      console.error("Gagal mengirim email:", error);
    }

    res.json({ message: "Password berhasil diubah" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Get Profile
exports.getProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        pasien: {
          include: {
            janjiTemu: {
              where: { status: "pending" },
              orderBy: { tanggal_waktu: "asc" },
            },
            konsultasiChat: {
              where: { status: "pending" },
              orderBy: { waktu_mulai: "desc" },
            },
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    // Pastikan tidak error jika pasien null
    const transformedUser = {
      id: user.id,
      email: user.email,
      role: user.role,
      is_verified: user.is_verified,
      pasien: user.pasien
        ? {
            id_pasien: user.pasien.id_pasien,
            nama: user.pasien.nama || null,
            noTelp: user.pasien.noTelp || null,
            alamat: user.pasien.alamat || null,
            tanggal_lahir: user.pasien.tanggal_lahir || null,
            jenis_kelamin: user.pasien.jenis_kelamin || null,
            profilePicture: user.pasien.profilePicture || null,
            janjiTemu: user.pasien.janjiTemu || [],
            konsultasiChat: user.pasien.konsultasiChat || [],
          }
        : null,
      createdAt: user.createdAt,
    };

    res.json({ user: transformedUser });
  } catch (error) {
    console.error("Error fetching profile:", error.message);
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
    await handleChangePassword(userId);

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
  const { nama, noTelp, alamat, tanggal_lahir, jenis_kelamin } = req.body;
  const profilePicture = req.file; // dari multer middleware

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { pasien: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User tidak ditemukan" });
    }

    let updateData = {};
    if (nama) updateData.nama = nama;
    if (noTelp) updateData.noTelp = noTelp;
    if (alamat) updateData.alamat = alamat;
    if (tanggal_lahir) updateData.tanggal_lahir = new Date(tanggal_lahir);
    if (jenis_kelamin) updateData.jenis_kelamin = jenis_kelamin;

    // Upload ke ImageKit jika ada file
    if (profilePicture) {
      try {
        const uploadResponse = await imagekit.upload({
          file: profilePicture.buffer,
          fileName: `${Date.now()}-${profilePicture.originalname}`,
          folder: "/profile-pictures",
        });

        updateData.profilePicture = uploadResponse.url;
      } catch (error) {
        console.error("Error uploading to ImageKit:", error);
        return res.status(500).json({ message: "Gagal mengupload gambar" });
      }
    }

    // Jika pasien belum ada, buat baru
    if (!user.pasien) {
      await prisma.pasien.create({
        data: {
          user_id: userId,
          ...updateData,
        },
      });
    } else {
      await prisma.pasien.update({
        where: { id_pasien: user.pasien.id_pasien },
        data: updateData,
      });
    }

    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { pasien: true },
    });
    await handleProfileUpdate(user.id);
    res.json({
      message: "Profil berhasil diperbarui",
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        role: updatedUser.role,
        pasien: updatedUser.pasien
          ? {
              id_pasien: updatedUser.pasien.id_pasien,
              nama: updatedUser.pasien.nama,
              noTelp: updatedUser.pasien.noTelp,
              alamat: updatedUser.pasien.alamat,
              tanggal_lahir: updatedUser.pasien.tanggal_lahir,
              jenis_kelamin: updatedUser.pasien.jenis_kelamin,
              profilePicture: updatedUser.pasien.profilePicture || null,
              janjiTemu: updatedUser.pasien.janjiTemu || [],
              konsultasiChat: updatedUser.pasien.konsultasiChat || [],
            }
          : null,
      },
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};

// Login Khusus untuk Admin dan Dokter
exports.loginRole = async (req, res) => {
  const { email, password } = req.body;
  try {
    // Cari user berdasarkan email
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Validasi role: hanya admin atau dokter yang boleh login di sini
    if (user.role !== "admin" && user.role !== "dokter") {
      return res.status(403).json({
        message: "Akses ditolak: hanya admin atau dokter yang bisa login",
      });
    }

    // Cek password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Email atau password salah" });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET || "secret",
      { expiresIn: "1d" }
    );

    res.json({
      message: `Login sebagai ${user.role} berhasil`,
      token,
      role: user.role,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Terjadi kesalahan", error: error.message });
  }
};
