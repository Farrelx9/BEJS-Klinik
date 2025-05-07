/*
  Warnings:

  - You are about to drop the column `created_at` on the `JanjiTemu` table. All the data in the column will be lost.
  - You are about to drop the column `id_janji` on the `Pembayaran` table. All the data in the column will be lost.
  - The primary key for the `Rekam_Medis` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id_konsultasi]` on the table `Pembayaran` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `id_konsultasi` to the `Pembayaran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `jumlah` to the `Pembayaran` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dokter` to the `Rekam_Medis` table without a default value. This is not possible if the table is not empty.
  - The required column `id_rekam_medis` was added to the `Rekam_Medis` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `keluhan` to the `Rekam_Medis` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Pembayaran" DROP CONSTRAINT "Pembayaran_id_janji_fkey";

-- DropIndex
DROP INDEX "Pembayaran_id_janji_key";

-- AlterTable
ALTER TABLE "JanjiTemu" DROP COLUMN "created_at",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Jenis_Tindakan" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "deskripsi" TEXT;

-- AlterTable
ALTER TABLE "Konsultasi_Chat" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "pesan" TEXT;

-- AlterTable
ALTER TABLE "Notifikasi" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Otp" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Pembayaran" DROP COLUMN "id_janji",
ADD COLUMN     "bukti_pembayaran" TEXT,
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "id_konsultasi" TEXT NOT NULL,
ADD COLUMN     "jumlah" INTEGER NOT NULL,
ALTER COLUMN "tanggal_bayar" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Rekam_Medis" DROP CONSTRAINT "Rekam_Medis_pkey",
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "diagnosa" TEXT,
ADD COLUMN     "dokter" TEXT NOT NULL,
ADD COLUMN     "id_rekam_medis" TEXT NOT NULL,
ADD COLUMN     "keluhan" TEXT NOT NULL,
ADD COLUMN     "resep_obat" TEXT,
ADD COLUMN     "tanggal" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "tindakan" TEXT,
ADD COLUMN     "tindakan_id" TEXT,
ADD CONSTRAINT "Rekam_Medis_pkey" PRIMARY KEY ("id_rekam_medis");

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Riwayat" (
    "id_riwayat" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Riwayat_pkey" PRIMARY KEY ("id_riwayat")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_id_konsultasi_key" ON "Pembayaran"("id_konsultasi");

-- AddForeignKey
ALTER TABLE "Konsultasi_Chat" ADD CONSTRAINT "Konsultasi_Chat_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_id_konsultasi_fkey" FOREIGN KEY ("id_konsultasi") REFERENCES "Konsultasi_Chat"("id_chat") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rekam_Medis" ADD CONSTRAINT "Rekam_Medis_tindakan_id_fkey" FOREIGN KEY ("tindakan_id") REFERENCES "Jenis_Tindakan"("id_tindakan") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rekam_Medis" ADD CONSTRAINT "Rekam_Medis_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat" ADD CONSTRAINT "Riwayat_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
