/*
  Warnings:

  - A unique constraint covering the columns `[id_pasien,id_janji]` on the table `Review` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id_pasien,id_konsultasi]` on the table `Review` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Review_id_pasien_id_janji_key" ON "Review"("id_pasien", "id_janji");

-- CreateIndex
CREATE UNIQUE INDEX "Review_id_pasien_id_konsultasi_key" ON "Review"("id_pasien", "id_konsultasi");
