const { Router } = require("express");
const router = Router();

/* GET home page. */
const authRouter = require("./auth.Routes");
const janjiTemuRouter = require("./janjiTemu.Routes");
const notifikasiRouter = require("./notifikasi.Routes");
const pasienRouter = require("./pasien.Routes");
const rekamMedisRouter = require("./rekamMedis.Routes");
const jenisTindakanRouter = require("./jenisTindakan.Routes");
const konsultasiRouter = require("./konsultasi.Routes");
const pembayaranRoutes = require("./pembayaran.Routes");
const jadwalRoutes = require("./jadwal.Routes");
const rekapPembayaranRoutes = require("./rekapPembayaran.Routes");
const errorHandler = require("../middlewares/errorHandler");

router.use("/api/auth", authRouter);
router.use("/api/janjiTemu", janjiTemuRouter);
router.use("/api/notifikasi", notifikasiRouter);
router.use("/api/rekamMedis", rekamMedisRouter);
router.use("/api/jenisTindakan", jenisTindakanRouter);
router.use("/api/pasienAdmin", pasienRouter);
router.use("/api/konsultasi", konsultasiRouter);
router.use("/api/pembayaran", pembayaranRoutes);
router.use("/api/jadwal", jadwalRoutes);
router.use("/api/rekapPembayaran", rekapPembayaranRoutes);
router.use(errorHandler);

module.exports = router;
