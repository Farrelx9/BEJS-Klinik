-- CreateTable
CREATE TABLE "Pesan_Chat" (
    "id_pesan" TEXT NOT NULL,
    "isi" TEXT NOT NULL,
    "pengirim" TEXT NOT NULL,
    "waktu_kirim" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "id_chat" TEXT NOT NULL,

    CONSTRAINT "Pesan_Chat_pkey" PRIMARY KEY ("id_pesan")
);

-- AddForeignKey
ALTER TABLE "Pesan_Chat" ADD CONSTRAINT "Pesan_Chat_id_chat_fkey" FOREIGN KEY ("id_chat") REFERENCES "Konsultasi_Chat"("id_chat") ON DELETE RESTRICT ON UPDATE CASCADE;
