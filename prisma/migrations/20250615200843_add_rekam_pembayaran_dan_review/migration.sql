-- CreateTable
CREATE TABLE "Review" (
    "id" TEXT NOT NULL,
    "id_pasien" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "komentar" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RekapPembayaran" (
    "id_rekap" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "total_pembayaran" INTEGER NOT NULL,
    "jumlah_transaksi" INTEGER NOT NULL,
    "tipe" TEXT NOT NULL,
    "id_pasien" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RekapPembayaran_pkey" PRIMARY KEY ("id_rekap")
);

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RekapPembayaran" ADD CONSTRAINT "RekapPembayaran_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;
