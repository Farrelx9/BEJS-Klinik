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

    // Ekstrak id_chat dari order_id
    const match = order_id.match(/^ORDER-(.+?)-\d+-\d+/);
    const id_chat = match ? match[1] : null;

    if (!id_chat) {
      return res.status(400).json({ error: "Order ID tidak valid" });
    }

    // Validasi apakah jadwal chat ada di database
    const konsultasi = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
    });

    if (!konsultasi) {
      return res
        .status(404)
        .json({ success: false, message: "Jadwal chat tidak ditemukan." });
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

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};
