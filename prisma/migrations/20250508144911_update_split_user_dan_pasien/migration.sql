/*
  Warnings:

  - You are about to drop the column `user_id` on the `Notifikasi` table. All the data in the column will be lost.
  - You are about to drop the column `alamat` on the `Rekam_Medis` table. All the data in the column will be lost.
  - You are about to drop the column `nama_pasien` on the `Rekam_Medis` table. All the data in the column will be lost.
  - You are about to drop the column `no_telp` on the `Rekam_Medis` table. All the data in the column will be lost.
  - You are about to drop the column `user_id` on the `Riwayat` table. All the data in the column will be lost.
  - You are about to drop the column `alamat` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `nama` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `noTelp` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `profilePicture` on the `User` table. All the data in the column will be lost.
  - Added the required column `id_pasien` to the `Notifikasi` table without a default value. This is not possible if the table is not empty.
  - Added the required column `id_pasien` to the `Riwayat` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "JanjiTemu" DROP CONSTRAINT "JanjiTemu_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Konsultasi_Chat" DROP CONSTRAINT "Konsultasi_Chat_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Notifikasi" DROP CONSTRAINT "Notifikasi_user_id_fkey";

-- DropForeignKey
ALTER TABLE "Rekam_Medis" DROP CONSTRAINT "Rekam_Medis_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Riwayat" DROP CONSTRAINT "Riwayat_user_id_fkey";

-- AlterTable
ALTER TABLE "Notifikasi" DROP COLUMN "user_id",
ADD COLUMN     "id_pasien" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Pembayaran" ADD COLUMN     "id_pasien" TEXT;

-- AlterTable
ALTER TABLE "Rekam_Medis" DROP COLUMN "alamat",
DROP COLUMN "nama_pasien",
DROP COLUMN "no_telp";

-- AlterTable
ALTER TABLE "Riwayat" DROP COLUMN "user_id",
ADD COLUMN     "id_pasien" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "alamat",
DROP COLUMN "nama",
DROP COLUMN "noTelp",
DROP COLUMN "profilePicture";

-- CreateTable
CREATE TABLE "Pasien" (
    "id_pasien" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "tanggal_lahir" TIMESTAMP(3),
    "jenis_kelamin" TEXT,
    "profilePicture" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Pasien_pkey" PRIMARY KEY ("id_pasien")
);

-- CreateIndex
CREATE UNIQUE INDEX "Pasien_user_id_key" ON "Pasien"("user_id");

-- AddForeignKey
ALTER TABLE "Pasien" ADD CONSTRAINT "Pasien_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Riwayat" ADD CONSTRAINT "Riwayat_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "JanjiTemu" ADD CONSTRAINT "JanjiTemu_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Konsultasi_Chat" ADD CONSTRAINT "Konsultasi_Chat_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rekam_Medis" ADD CONSTRAINT "Rekam_Medis_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;
