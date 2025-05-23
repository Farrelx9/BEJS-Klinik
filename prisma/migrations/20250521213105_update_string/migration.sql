-- DropForeignKey
ALTER TABLE "Konsultasi_Chat" DROP CONSTRAINT "Konsultasi_Chat_id_pasien_fkey";

-- AlterTable
ALTER TABLE "Konsultasi_Chat" ALTER COLUMN "id_pasien" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Konsultasi_Chat" ADD CONSTRAINT "Konsultasi_Chat_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE SET NULL ON UPDATE CASCADE;
