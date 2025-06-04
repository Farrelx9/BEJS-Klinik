// controllers/pembayaranController.js
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const snap = require("../utils/midtrans");

// controllers/pembayaranController.js
exports.buatTransaksi = async (req, res) => {
  const { id_chat } = req.body; // id_chat dari frontend akan menjadi id_konsultasi

  if (!id_chat) {
    return res.status(400).json({
      success: false,
      message: "ID Chat diperlukan",
    });
  }

  try {
    // Cek apakah sudah ada pembayaran untuk jadwal ini berdasarkan id_chat (id_konsultasi)
    const existingPayment = await prisma.pembayaran.findUnique({
      where: { id_konsultasi: id_chat },
    });

    if (existingPayment) {
      // Jika pembayaran sudah ada, periksa statusnya
      if (existingPayment.status === "sukses") {
        // Jika status sudah sukses, tidak perlu membuat transaksi baru
        console.log(
          `Pembayaran untuk id_chat ${id_chat} sudah sukses, mengembalikan 400.`
        );
        return res.status(400).json({
          success: false,
          message:
            "Pembayaran untuk jadwal ini sudah ada dan sudah berhasil dibayar.",
        });
      } else {
        // Jika status bukan sukses (misal: initiated, pending, failed)
        // Kembalikan info pembayaran yang sudah ada dan berikan pesan untuk melanjutkan
        // Asumsikan frontend bisa menggunakan data ini untuk melanjutkan atau memberi opsi
        console.log(
          `Pembayaran untuk id_chat ${id_chat} ditemukan dengan status ${existingPayment.status}, mengembalikan existing.`
        );
        return res.json({
          success: true,
          message:
            "Pembayaran sedang menunggu atau gagal, silakan lanjutkan dari pembayaran sebelumnya.",
          data: {
            pembayaran: existingPayment,
            // Jika Anda menyimpan paymentUrl di DB, kembalikan juga di sini
            // paymentUrl: existingPayment.paymentUrl,
          },
        });
      }
    }

    // Jika belum ada pembayaran untuk id_chat ini, lanjutkan membuat yang baru
    console.log(
      `Pembayaran baru untuk id_chat ${id_chat} belum ada, melanjutkan pembuatan.`
    );

    // Ambil detail jadwal chat & pasien
    const konsultasi = await prisma.konsultasi_Chat.findUnique({
      where: { id_chat },
      include: {
        pasien: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!konsultasi) {
      console.error(`Jadwal chat dengan id ${id_chat} tidak ditemukan.`);
      return res.status(404).json({
        success: false,
        message: "Jadwal chat tidak ditemukan",
      });
    }

    // Buat record pembayaran awal di database lokal dengan status 'initiated'
    // Order ID untuk Midtrans akan sama dengan id_chat (id_konsultasi)
    const newPayment = await prisma.pembayaran.create({
      data: {
        id_konsultasi: id_chat, // Menggunakan id_chat sebagai order_id
        metode_pembayaran: "midtrans", // atau dari request jika bervariasi
        jumlah: 50000, // atau dari data konsultasi jika bervariasi
        status: "initiated", // Status awal sebelum panggilan Midtrans
        id_pasien: konsultasi.id_pasien,
        // Anda bisa simpan paymentUrl di sini setelah Midtrans merespons jika perlu
      },
    });
    console.log(
      `Record pembayaran lokal baru dibuat dengan ID: ${newPayment.id_pembayaran} dan status: ${newPayment.status}`
    );

    // Parameter Midtrans menggunakan id_chat sebagai order_id
    const parameter = {
      transaction_details: {
        order_id: id_chat, // Gunakan id_chat sebagai order_id
        gross_amount: newPayment.jumlah, // Gunakan jumlah dari record DB
      },
      customer_details: {
        first_name: konsultasi.pasien.nama || "Pasien",
        email: konsultasi.pasien.user.email || "pasien@example.com", // Pastikan ada email default
        phone: konsultasi.pasien.telepon || "08123456789", // Pastikan ada nomor telepon default
      },
      item_details: [
        {
          id: id_chat,
          price: newPayment.jumlah,
          quantity: 1,
          name: "Konsultasi Chat",
        },
      ],
      callback_url: "https://bejs-klinik.vercel.app/midtrans/webhook ",
    };
    console.log(
      "Memanggil Midtrans createTransaction dengan parameter:",
      JSON.stringify(parameter)
    );

    // Buat transaksi di Midtrans
    const paymentToken = await snap.createTransaction(parameter);

    console.log(
      "Midtrans createTransaction berhasil. paymentToken:",
      JSON.stringify(paymentToken)
    );

    // Update record pembayaran lokal dengan status pending dan simpan redirect_url jika perlu
    // Meskipun status akan diupdate lagi oleh webhook, ini bisa memberi indikasi awal di DB
    await prisma.pembayaran.update({
      where: { id_pembayaran: newPayment.id_pembayaran },
      data: {
        status: "pending", // Status pending setelah berhasil memanggil Midtrans API
        // paymentUrl: paymentToken.redirect_url, // Simpan URL jika perlu
      },
    });
    console.log(`Record pembayaran lokal diupdate menjadi status: pending`);

    // Jangan update status Konsultasi_Chat di sini. Ini dilakukan oleh webhook.

    return res.json({
      success: true,
      message: "Transaksi berhasil dibuat, lanjutkan ke pembayaran.",
      data: {
        paymentUrl: paymentToken.redirect_url, // Kembalikan URL ke frontend
        pembayaran: newPayment, // Kembalikan data pembayaran lokal yang baru dibuat
      },
    });
  } catch (error) {
    console.error("Error saat membuat transaksi:", error.message);
    // Tangani error dari Midtrans API atau Prisma
    // Anda bisa cek error.httpStatusCode atau error.ApiResponse jika itu error dari Midtrans client
    let errorMessage = "Gagal membuat transaksi pembayaran";
    if (error.message.includes("Midtrans API is returning API error")) {
      errorMessage = "Gagal menghubungi layanan pembayaran. Mohon coba lagi."; // Pesan lebih user-friendly
      // Optional: log detail error Midtrans API response
      if (error.ApiResponse)
        console.error(
          "Midtrans API Error Details:",
          JSON.stringify(error.ApiResponse)
        );
    } else if (error.code === "P2002") {
      errorMessage = "Pembayaran untuk jadwal ini sudah ada."; // Error unique constraint, jarang terjadi dengan logika baru, tapi bisa jika ada race condition
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
    });
  }
};

exports.cekStatusPembayaran = async (req, res) => {
  const { id_konsultasi } = req.params;

  try {
    console.log(
      `Mengecek status pembayaran untuk id_konsultasi: ${id_konsultasi}`
    );
    // Memanggil API Midtrans untuk mendapatkan status transaksi
    const result = await snap.transaction.status(id_konsultasi); // snap dari midtrans

    console.log(
      `Midtrans status check berhasil untuk ${id_konsultasi}. Hasil:`,
      JSON.stringify(result)
    );

    // Mengupdate status pembayaran di database berdasarkan hasil dari Midtrans
    const updatedPayment = await prisma.pembayaran.update({
      where: { id_konsultasi }, // Menggunakan id_konsultasi untuk mencari record
      data: {
        status: result.transaction_status,
        tanggal_bayar: result.settlement_time
          ? new Date(result.settlement_time)
          : undefined, // Handle case where settlement_time is null
      },
    });

    console.log(
      `Status pembayaran lokal untuk ${id_konsultasi} diupdate menjadi: ${updatedPayment.status}`
    );

    res.json({ success: true, data: updatedPayment });
  } catch (error) {
    console.error(
      `Gagal cek status pembayaran untuk ${id_konsultasi}:`,
      error.message
    );

    // Tangani specifically Midtrans 404 (Transaction doesn't exist)
    if (
      error.message.includes("Midtrans API is returning API error") &&
      error.httpStatusCode === 404
    ) {
      console.warn(
        `Midtrans 404 error for id_konsultasi ${id_konsultasi}: Transaction doesn't exist.`
      );
      return res.status(404).json({
        success: false,
        message: "Transaksi pembayaran tidak ditemukan di Midtrans.",
      });
    } else if (
      error.message.includes("Midtrans API is returning API error") &&
      error.ApiResponse
    ) {
      // Log other Midtrans API errors with response details
      console.error(
        "Midtrans API Error Details:",
        JSON.stringify(error.ApiResponse)
      );
      return res.status(500).json({
        success: false,
        message: "Gagal menghubungi layanan pembayaran. Mohon coba lagi nanti.",
      });
    }
    // Tangani error lain (misal: dari Prisma jika record id_konsultasi tidak ada di DB lokal)
    else if (error.code === "P2025") {
      // Prisma error code for record not found
      console.warn(
        `Prisma error P2025: Record pembayaran dengan id_konsultasi ${id_konsultasi} tidak ditemukan di DB lokal.`
      );
      return res.status(404).json({
        success: false,
        message: "Record pembayaran tidak ditemukan di database lokal.",
      });
    } else {
      // Generic internal server error for any other unexpected errors
      return res
        .status(500)
        .json({ success: false, message: "Gagal cek status pembayaran." });
    }
  }
};

exports.simulasiWebhook = async (req, res) => {
  const {
    transaction_status,
    order_id,
    gross_amount,
    payment_type,
    customer_details,
  } = req.body;

  try {
    // Validasi input
    if (
      !transaction_status ||
      !order_id ||
      !gross_amount ||
      !payment_type ||
      !customer_details
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Data transaksi tidak lengkap" });
    }

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

    // Cari pembayaran berdasarkan id_konsultasi
    const pembayaran = await prisma.pembayaran.findUnique({
      where: { id_konsultasi: order_id },
    });

    if (!pembayaran) {
      return res
        .status(404)
        .json({ success: false, message: "Pembayaran tidak ditemukan" });
    }

    // Update pembayaran
    await prisma.pembayaran.update({
      where: { id_konsultasi: order_id },
      data: {
        status,
        tanggal_bayar: status === "sukses" ? new Date() : undefined,
      },
    });

    // Jika sukses, update konsultasi chat
    if (status === "sukses") {
      await prisma.konsultasi_Chat.update({
        where: { id_chat: order_id },
        data: { status: "dibayar" },
      });
    }

    return res.json({ success: true, message: "Webhook diproses" });
  } catch (error) {
    console.error("Error simulasi webhook:", error.message);
    return res
      .status(500)
      .json({ success: false, message: "Gagal proses webhook" });
  }
};
