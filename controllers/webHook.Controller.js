const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.handleWebhook = async (req, res) => {
  const { transaction_status, order_id } = req.body;

  if (!transaction_status || !order_id) {
    return res.status(400).send("Data transaksi tidak lengkap");
  }

  try {
    let status;
    switch (transaction_status) {
      case "settlement":
      case "capture":
        status = "sukses";
        break;
      case "pending":
        status = "pending";
        break;
      default:
        status = "gagal";
    }

    // Update pembayaran
    const updatedPayment = await prisma.pembayaran.update({
      where: { id_konsultasi: order_id },
      data: {
        status,
        tanggal_bayar: status === "sukses" ? new Date() : undefined,
      },
    });

    if (!updatedPayment) {
      throw new Error("Gagal update pembayaran");
    }

    // Update konsultasi chat jika sukses
    if (status === "sukses") {
      const chatExists = await prisma.konsultasi_Chat.findUnique({
        where: { id_chat: order_id },
      });

      if (!chatExists) {
        console.error(`Chat dengan id_chat ${order_id} tidak ditemukan.`);
        return res
          .status(404)
          .json({ success: false, message: "Chat tidak ditemukan." });
      }

      await prisma.konsultasi_Chat.update({
        where: { id_chat: order_id },
        data: { status: "dibayar" },
      });
    }

    return res.status(200).send("OK");
  } catch (error) {
    console.error("Error handling webhook:", error.message);
    return res.status(500).send("Internal Server Error");
  }
};
