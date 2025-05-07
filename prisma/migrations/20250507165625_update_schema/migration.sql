/*
  Warnings:

  - The `role` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the `Pasien` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "Role" AS ENUM ('admin', 'dokter', 'pasien');

-- DropForeignKey
ALTER TABLE "JanjiTemu" DROP CONSTRAINT "JanjiTemu_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Konsultasi_Chat" DROP CONSTRAINT "Konsultasi_Chat_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Pasien" DROP CONSTRAINT "Pasien_id_pasien_fkey";

-- DropForeignKey
ALTER TABLE "Rekam_Medis" DROP CONSTRAINT "Rekam_Medis_id_pasien_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "role",
ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'pasien';

-- DropTable
DROP TABLE "Pasien";

-- AddForeignKey
ALTER TABLE "JanjiTemu" ADD CONSTRAINT "JanjiTemu_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
