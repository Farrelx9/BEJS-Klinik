-- AddForeignKey
ALTER TABLE "Pasien" ADD CONSTRAINT "Pasien_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
