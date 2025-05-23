// utils/midtrans.js
const snap = require("midtrans-client");

const snapClient = new snap.Snap({
  isProduction: false, // Ubah ke true jika production
  serverKey:
    process.env.MIDTRANS_SERVER_KEY || "SB-Mid-server-huTTlaxK0fof7Fl_ls-Ku6IY",
  clientKey:
    process.env.MIDTRANS_CLIENT_KEY || "SB-Mid-client-A7K4_CtHMTqXlSBa",
});

module.exports = snapClient;
