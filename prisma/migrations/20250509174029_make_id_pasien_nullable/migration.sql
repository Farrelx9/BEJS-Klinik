-- DropForeignKey
ALTER TABLE "JanjiTemu" DROP CONSTRAINT "JanjiTemu_id_pasien_fkey";

-- AlterTable
ALTER TABLE "JanjiTemu" ALTER COLUMN "id_pasien" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "JanjiTemu" ADD CONSTRAINT "JanjiTemu_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE SET NULL ON UPDATE CASCADE;
