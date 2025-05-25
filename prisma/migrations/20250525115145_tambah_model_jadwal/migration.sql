-- CreateTable
CREATE TABLE "Jadwal" (
    "id" TEXT NOT NULL,
    "waktu" TIMESTAMP(3) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "pasien" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Jadwal_pkey" PRIMARY KEY ("id")
);
