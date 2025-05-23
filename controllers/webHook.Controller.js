const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// controllers/webHook.Controller.js
exports.handleWebhook = async (req, res) => {
  const { transaction_status, order_id } = req.body;

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
    await prisma.pembayaran.update({
      where: { id_konsultasi: order_id },
      data: {
        status,
        tanggal_bayar: status === "sukses" ? new Date() : undefined,
      },
    });

    // Update konsultasi chat jika sukses
    if (status === "sukses") {
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
