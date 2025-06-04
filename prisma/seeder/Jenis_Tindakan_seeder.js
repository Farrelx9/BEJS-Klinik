async function seedJenisTindakan(prisma) {
  const baseTime = new Date(); // Waktu eksekusi awal

  const jenisTindakanList = [
    {
      nama_tindakan: "Scaling",
      deskripsi: "Pembersihan karang gigi",
      harga: 300000,
      createdAt: new Date(baseTime.getTime() + 0 * 1000),
    },
    {
      nama_tindakan: "Debridement/deep scaling 1 gigi",
      deskripsi: "Perawatan radang gusi dalam",
      harga: 200000,
      createdAt: new Date(baseTime.getTime() + 1 * 1000),
    },
    {
      nama_tindakan: "Metronidazole gel",
      deskripsi: "Obat kumur/gel untuk infeksi mulut",
      harga: 150000,
      createdAt: new Date(baseTime.getTime() + 2 * 1000),
    },
    {
      nama_tindakan: "Gingivektomi per gigi",
      deskripsi: "Pembedahan untuk memperbaiki jaringan gusi",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 3 * 1000),
    },
    {
      nama_tindakan: "Tambal gigi kecil (klas I, V kecil, III kecil)",
      deskripsi: "Penambalan pada bagian kecil gigi",
      harga: 300000,
      createdAt: new Date(baseTime.getTime() + 4 * 1000),
    },
    {
      nama_tindakan: "Tambal gigi besar (klas II, III besar, IV, V besar)",
      deskripsi: "Penambalan pada bagian besar gigi",
      harga: 400000,
      createdAt: new Date(baseTime.getTime() + 5 * 1000),
    },
    {
      nama_tindakan: "Tambal estetik/direct veneer",
      deskripsi: "Penambalan untuk tujuan estetika",
      harga: 600000,
      createdAt: new Date(baseTime.getTime() + 6 * 1000),
    },
    {
      nama_tindakan: "Pencabutan gigi standar",
      deskripsi: "Cabut gigi biasa tanpa komplikasi",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 7 * 1000),
    },
    {
      nama_tindakan: "Pencabutan gigi dengan penyulit",
      deskripsi: "Cabut gigi bungsu rahang atas/separasi",
      harga: 400000,
      createdAt: new Date(baseTime.getTime() + 8 * 1000),
    },
    {
      nama_tindakan: "Penjahitan setelah pencabutan",
      deskripsi: "Penjahitan setelah pencabutan dengan komplikasi",
      harga: 200000,
      createdAt: new Date(baseTime.getTime() + 9 * 1000),
    },
    {
      nama_tindakan: "Odontektomi",
      deskripsi: "Pencabutan gigi bungsu terpendam",
      harga: 1800000,
      createdAt: new Date(baseTime.getTime() + 10 * 1000),
    },
    {
      nama_tindakan: "Angkat jahitan",
      deskripsi: "Pengangkatan jahitan setelah operasi",
      harga: 200000,
      createdAt: new Date(baseTime.getTime() + 11 * 1000),
    },
    {
      nama_tindakan:
        "Gigi Tiruan Sebagian Lepasan bahan Akrilik (1 gigi pertama)",
      deskripsi: "Gigi tiruan lepasan bahan akrilik (1 gigi pertama)",
      harga: 1000000,
      createdAt: new Date(baseTime.getTime() + 12 * 1000),
    },
    {
      nama_tindakan: "Gigi Tiruan Sebagian Lepasan bahan Akrilik tambahan",
      deskripsi: "Tambahan gigi untuk GT lepasan bahan akrilik",
      harga: 150000,
      createdAt: new Date(baseTime.getTime() + 13 * 1000),
    },
    {
      nama_tindakan:
        "Gigi Tiruan Sebagian Lepasan bahan Valplas (1 gigi pertama)",
      deskripsi: "Gigi tiruan lepasan bahan valplas (1 gigi pertama)",
      harga: 1350000,
      createdAt: new Date(baseTime.getTime() + 14 * 1000),
    },
    {
      nama_tindakan: "Gigi Tiruan Sebagian Lepasan bahan Valplas tambahan",
      deskripsi: "Tambahan gigi untuk GT lepasan bahan valplas",
      harga: 150000,
      createdAt: new Date(baseTime.getTime() + 15 * 1000),
    },
    {
      nama_tindakan: "Gigi Tiruan Lengkap bahan Akrilik per 1 rahang",
      deskripsi: "Gigi tiruan lengkap bahan akrilik untuk satu rahang",
      harga: 3000000,
      createdAt: new Date(baseTime.getTime() + 16 * 1000),
    },
    {
      nama_tindakan: "Mock up 1 gigi",
      deskripsi: "Simulasi penambalan/penempelan sementara",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 17 * 1000),
    },
    {
      nama_tindakan: "Mock up tambahan per 1 gigi selanjutnya",
      deskripsi: "Tambah mock up per gigi",
      harga: 50000,
      createdAt: new Date(baseTime.getTime() + 18 * 1000),
    },
    {
      nama_tindakan: "Mahkota sementara 1 gigi",
      deskripsi: "Mahkota sementara untuk melindungi gigi",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 19 * 1000),
    },
    {
      nama_tindakan: "Mahkota sementara tambahan per 1 gigi selanjutnya",
      deskripsi: "Mahkota tambahan",
      harga: 50000,
      createdAt: new Date(baseTime.getTime() + 20 * 1000),
    },
    {
      nama_tindakan: "Crown PFM/bridge per gigi",
      deskripsi: "Mahkota permanen bahan PFM atau bridge",
      harga: 2000000,
      createdAt: new Date(baseTime.getTime() + 21 * 1000),
    },
    {
      nama_tindakan: "Crown Porcelain/bridge per gigi",
      deskripsi: "Mahkota permanen bahan porcelain",
      harga: 3000000,
      createdAt: new Date(baseTime.getTime() + 22 * 1000),
    },
    {
      nama_tindakan: "Perawatan Saluran Akar",
      deskripsi: "Perawatan saluran akar (root canal treatment)",
      harga: 400000,
      createdAt: new Date(baseTime.getTime() + 23 * 1000),
    },
    {
      nama_tindakan: "Rekapitulasi saluran akar",
      deskripsi: "Ulang perawatan saluran akar",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 24 * 1000),
    },
    {
      nama_tindakan: "Pengisian saluran akar",
      deskripsi: "Pengisian ulang saluran akar",
      harga: 300000,
      createdAt: new Date(baseTime.getTime() + 25 * 1000),
    },
    {
      nama_tindakan: "Insersi pasak fiber dan pembentukan crown",
      deskripsi: "Pemasangan pasak fiber dan mahkota",
      harga: 350000,
      createdAt: new Date(baseTime.getTime() + 26 * 1000),
    },
    {
      nama_tindakan: "Rewalling",
      deskripsi: "Perbaikan dinding gigi",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 27 * 1000),
    },
    {
      nama_tindakan: "Tumpat post PSA",
      deskripsi: "Tumpatan setelah perawatan saluran akar",
      harga: 600000,
      createdAt: new Date(baseTime.getTime() + 28 * 1000),
    },
    {
      nama_tindakan: "Relief of pain",
      deskripsi: "Pereda nyeri sesaat",
      harga: 200000,
      createdAt: new Date(baseTime.getTime() + 29 * 1000),
    },
    {
      nama_tindakan: "Cabut gigi anak dengan Clorethyl",
      deskripsi: "Pencabutan gigi susu menggunakan semprotan anestesi",
      harga: 200000,
      createdAt: new Date(baseTime.getTime() + 30 * 1000),
    },
    {
      nama_tindakan: "Splinting 3 gigi pertama",
      deskripsi: "Penguatan gigi goyang dengan splinting",
      harga: 400000,
      createdAt: new Date(baseTime.getTime() + 31 * 1000),
    },
    {
      nama_tindakan: "Splinting per 1 gigi selanjutnya",
      deskripsi: "Penambahan splinting per gigi",
      harga: 100000,
      createdAt: new Date(baseTime.getTime() + 32 * 1000),
    },
    {
      nama_tindakan: "Retainer plastik",
      deskripsi: "Alat retensi untuk menjaga posisi gigi",
      harga: 500000,
      createdAt: new Date(baseTime.getTime() + 33 * 1000),
    },
    {
      nama_tindakan: "Retainer akrilik",
      deskripsi: "Retainer bahan akrilik",
      harga: 750000,
      createdAt: new Date(baseTime.getTime() + 34 * 1000),
    },
    {
      nama_tindakan: "Reparasi GT akrilik",
      deskripsi: "Perbaikan gigi tiruan akrilik",
      harga: 300000,
      createdAt: new Date(baseTime.getTime() + 35 * 1000),
    },
    {
      nama_tindakan: "Rebasing GT akrilik",
      deskripsi: "Penggantian dasar GT akrilik",
      harga: 400000,
      createdAt: new Date(baseTime.getTime() + 36 * 1000),
    },
    {
      nama_tindakan: "Relining GT akrilik",
      deskripsi: "Pelapisan ulang GT akrilik",
      harga: 350000,
      createdAt: new Date(baseTime.getTime() + 37 * 1000),
    },
    {
      nama_tindakan: "Individual tray",
      deskripsi: "Tray individu untuk cetakan gigi",
      harga: 250000,
      createdAt: new Date(baseTime.getTime() + 38 * 1000),
    },
  ];

  // Hapus semua data lama agar bisa update createdAt
  await prisma.jenis_Tindakan.deleteMany({});
  console.log("🗑️ Semua data lama dihapus");

  // Masukkan data baru satu per satu
  for (const tindakan of jenisTindakanList) {
    await prisma.jenis_Tindakan.create({
      data: tindakan,
    });
  }

  console.log(`✅ ${jenisTindakanList.length} jenis tindakan berhasil di-seed`);
}

module.exports = seedJenisTindakan;
