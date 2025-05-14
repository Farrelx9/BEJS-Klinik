-- AlterTable
ALTER TABLE "Pasien" ALTER COLUMN "nama" DROP NOT NULL,
ALTER COLUMN "noTelp" DROP NOT NULL,
ALTER COLUMN "alamat" DROP NOT NULL;

-- RenameIndex
ALTER INDEX "Pasien_user_id_key" RENAME TO "Unique_Pasien_User";
