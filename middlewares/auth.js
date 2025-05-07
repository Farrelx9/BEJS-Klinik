const jwt = require("jsonwebtoken");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async (req, res, next) => {
  // Ambil token dari header
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Token tidak ditemukan" });
  }

  // Ekstrak token
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Format token tidak valid" });
  }

  try {
    // Verifikasi token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret");

    // Verifikasi user ada di database (opsional tapi recommended)
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        role: true,
        is_verified: true,
      },
    });

    if (!user) {
      return res.status(401).json({ message: "User tidak ditemukan" });
    }

    // Tambahkan data user ke request
    req.user = {
      ...decoded,
      ...user,
    };

    next();
  } catch (err) {
    // Handle berbagai jenis error JWT
    const message =
      err.name === "TokenExpiredError"
        ? "Token telah kadaluarsa"
        : "Token tidak valid";
    return res.status(401).json({ message });
  }
};
