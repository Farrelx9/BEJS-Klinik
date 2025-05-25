const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

class JadwalController {
  // Ambil semua jadwal
  async getAllJadwal(req, res) {
    try {
      const { date } = req.query; // ambil dari query string
      let whereClause = {};

      if (date) {
        const startDate = new Date(date);
        const endDate = new Date(date);
        endDate.setDate(startDate.getDate() + 1); // batas sampai besok

        whereClause = {
          waktu: {
            gte: startDate,
            lt: endDate,
          },
        };
      }

      const jadwalList = await prisma.jadwal.findMany({
        where: whereClause,
        orderBy: { waktu: "asc" },
      });

      return res.status(200).json(jadwalList);
    } catch (error) {
      console.error("Error fetching jadwal:", error);
      return res.status(500).json({ error: "Gagal mengambil data jadwal." });
    }
  }

  // Tambah jadwal baru
  async createJadwal(req, res) {
    const { waktu, deskripsi, pasien } = req.body;

    try {
      const newJadwal = await prisma.jadwal.create({
        data: {
          waktu,
          deskripsi,
          pasien,
        },
      });

      return res.status(201).json(newJadwal);
    } catch (error) {
      console.error("Error creating jadwal:", error);
      return res.status(400).json({ error: "Gagal menambahkan jadwal baru." });
    }
  }

  // Hapus jadwal berdasarkan ID
  async deleteJadwal(req, res) {
    const { id } = req.params;

    try {
      await prisma.jadwal.delete({
        where: { id },
      });

      return res.status(200).json({ message: "Jadwal berhasil dihapus" });
    } catch (error) {
      console.error("Error deleting jadwal:", error);
      return res.status(404).json({ error: "Jadwal tidak ditemukan." });
    }
  }

  // Update jadwal berdasarkan ID
  async updateJadwal(req, res) {
    const { id } = req.params;
    const { waktu, deskripsi, pasien } = req.body;

    try {
      const updatedJadwal = await prisma.jadwal.update({
        where: { id },
        data: {
          waktu,
          deskripsi,
          pasien,
        },
      });

      return res.status(200).json(updatedJadwal);
    } catch (error) {
      console.error("Error updating jadwal:", error);
      return res.status(400).json({ error: "Gagal memperbarui jadwal." });
    }
  }
}

module.exports = new JadwalController();
