const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.handleWebhook = async (req, res) => {
  const { transaction_status, order_id } = req.body;

  if (!transaction_status || !order_id) {
    return res.status(400).json({ error: "Data transaksi tidak lengkap" });
  }

  try {
    let paymentStatus;
    switch (transaction_status) {
      case "settlement":
      case "capture":
        paymentStatus = "sukses";
        break;
      case "pending":
        paymentStatus = "pending";
        break;
      default:
        paymentStatus = "gagal";
    }

    // ✅ Gunakan langsung order_id sebagai id_chat
    const id_chat = order_id;

    console.log("Order ID:", order_id);
    console.log("Ekstrak id_chat:", id_chat);
    console.log("Status Transaksi Midtrans:", transaction_status);
    console.log("Status Pembayaran Baru:", paymentStatus);

    // Validasi apakah pembayaran ada di database
    const existingPayment = await prisma.pembayaran.findUnique({
      where: { id_konsultasi: id_chat },
    });

    if (!existingPayment) {
      return res.status(404).json({
        success: false,
        message: "Pembayaran tidak ditemukan.",
      });
    }

    // Validasi apakah jadwal chat ada di database
    const konsultasi = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat: id_chat },
    });

    if (!konsultasi) {
      return res.status(404).json({
        success: false,
        message: "Jadwal chat tidak ditemukan.",
      });
    }

    // Update status pembayaran
    const updatedPayment = await prisma.pembayaran.update({
      where: { id_konsultasi: id_chat },
      data: {
        status: paymentStatus,
        tanggal_bayar: paymentStatus === "sukses" ? new Date() : undefined,
      },
    });

    if (!updatedPayment) {
      throw new Error("Gagal update pembayaran");
    }

    // Update status konsultasi_Chat jika pembayaran sukses
    if (paymentStatus === "sukses") {
      await prisma.konsultasi_Chat.update({
        where: { id_chat },
        data: { status: "dibayar" },
      });
    }

    return res.status(200).json({
      success: true,
      message: "Status berhasil diperbarui",
    });
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};
