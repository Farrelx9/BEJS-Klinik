-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "id_janji" TEXT,
ADD COLUMN     "id_konsultasi" TEXT;

-- CreateIndex
CREATE INDEX "Review_id_pasien_id_janji_idx" ON "Review"("id_pasien", "id_janji");

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_id_janji_fkey" FOREIGN KEY ("id_janji") REFERENCES "JanjiTemu"("id_janji") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Review" ADD CONSTRAINT "Review_id_konsultasi_fkey" FOREIGN KEY ("id_konsultasi") REFERENCES "Konsultasi_Chat"("id_chat") ON DELETE SET NULL ON UPDATE CASCADE;
