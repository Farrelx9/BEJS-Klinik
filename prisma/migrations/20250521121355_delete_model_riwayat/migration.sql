/*
  Warnings:

  - You are about to drop the `Riwayat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Riwayat" DROP CONSTRAINT "Riwayat_id_pasien_fkey";

-- DropTable
DROP TABLE "Riwayat";
