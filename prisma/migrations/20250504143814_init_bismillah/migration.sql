/*
  Warnings:

  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "users";

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "noTelp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "is_verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pasien" (
    "id_pasien" TEXT NOT NULL,
    "nama_pasien" TEXT NOT NULL,
    "no_telp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,

    CONSTRAINT "Pasien_pkey" PRIMARY KEY ("id_pasien")
);

-- CreateTable
CREATE TABLE "JanjiTemu" (
    "id_janji" TEXT NOT NULL,
    "id_pasien" TEXT NOT NULL,
    "tanggal_waktu" TIMESTAMP(3) NOT NULL,
    "keluhan" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "dokter" TEXT NOT NULL DEFAULT 'drg.Irma',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "JanjiTemu_pkey" PRIMARY KEY ("id_janji")
);

-- CreateTable
CREATE TABLE "Konsultasi_Chat" (
    "id_chat" TEXT NOT NULL,
    "id_pasien" TEXT NOT NULL,
    "waktu_mulai" TIMESTAMP(3) NOT NULL,
    "waktu_selesai" TIMESTAMP(3),
    "status" TEXT NOT NULL,

    CONSTRAINT "Konsultasi_Chat_pkey" PRIMARY KEY ("id_chat")
);

-- CreateTable
CREATE TABLE "Rekam_Medis" (
    "id_pasien" TEXT NOT NULL,
    "nama_pasien" TEXT NOT NULL,
    "no_telp" TEXT NOT NULL,
    "alamat" TEXT NOT NULL,

    CONSTRAINT "Rekam_Medis_pkey" PRIMARY KEY ("id_pasien")
);

-- CreateTable
CREATE TABLE "Jenis_Tindakan" (
    "id_tindakan" TEXT NOT NULL,
    "nama_tindakan" TEXT NOT NULL,
    "harga" INTEGER NOT NULL,

    CONSTRAINT "Jenis_Tindakan_pkey" PRIMARY KEY ("id_tindakan")
);

-- CreateTable
CREATE TABLE "Pembayaran" (
    "id_pembayaran" TEXT NOT NULL,
    "id_janji" TEXT NOT NULL,
    "metode_pembayaran" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "tanggal_bayar" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Pembayaran_pkey" PRIMARY KEY ("id_pembayaran")
);

-- CreateTable
CREATE TABLE "Notifikasi" (
    "id_notifikasi" TEXT NOT NULL,
    "judul" TEXT NOT NULL,
    "pesan" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "Notifikasi_pkey" PRIMARY KEY ("id_notifikasi")
);

-- CreateTable
CREATE TABLE "Otp" (
    "id_otp" TEXT NOT NULL,
    "id_user" TEXT NOT NULL,
    "kode_otp" TEXT NOT NULL,
    "expiry_time" TIMESTAMP(3) NOT NULL,
    "is_used" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "Otp_pkey" PRIMARY KEY ("id_otp")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Pembayaran_id_janji_key" ON "Pembayaran"("id_janji");

-- AddForeignKey
ALTER TABLE "JanjiTemu" ADD CONSTRAINT "JanjiTemu_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Konsultasi_Chat" ADD CONSTRAINT "Konsultasi_Chat_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Rekam_Medis" ADD CONSTRAINT "Rekam_Medis_id_pasien_fkey" FOREIGN KEY ("id_pasien") REFERENCES "Pasien"("id_pasien") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pembayaran" ADD CONSTRAINT "Pembayaran_id_janji_fkey" FOREIGN KEY ("id_janji") REFERENCES "JanjiTemu"("id_janji") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notifikasi" ADD CONSTRAINT "Notifikasi_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Otp" ADD CONSTRAINT "Otp_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
