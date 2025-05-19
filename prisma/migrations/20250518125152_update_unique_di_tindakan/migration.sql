/*
  Warnings:

  - A unique constraint covering the columns `[nama_tindakan]` on the table `Jenis_Tindakan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Jenis_Tindakan_nama_tindakan_key" ON "Jenis_Tindakan"("nama_tindakan");
