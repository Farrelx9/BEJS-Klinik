-- DropForeignKey
ALTER TABLE "Pasien" DROP CONSTRAINT "Pasien_user_id_fkey";

-- AlterTable
ALTER TABLE "Pasien" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Pasien" ADD CONSTRAINT "Pasien_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
