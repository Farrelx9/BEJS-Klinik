require("dotenv").config();

const express = require("express");
const path = require("path");
const logger = require("morgan");
const cors = require("cors");
const http = require("http");

const routes = require("./routes");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.set("views", __dirname + "/views");

// Initialize Socket.IO
const { initializeSocket } = require("./utils/socket");
const io = initializeSocket(server);

// Make io available globally for controllers
global.io = io;

// Serve static files from uploads directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Cron Jobs (tambahkan di sini)
require("./cronjobs/generateJanjiTemu.cron");
require("./cronjobs/generateJadwalChat");

app.use(routes);

app.get("/", (req, res) => {
  res.send(`<h1 align="center">Welcome To Klinik drg.Irna</h1>`);
});

// 404 error handler
app.use((req, res, next) => {
  res.status(404).json({
    status: false,
    message: `are you lost? ${req.method} ${req.url} is not registered!`,
    data: null,
  });
});

// 500 error handler
app.use((err, req, res, next) => {
  console.log(err);
  res.status(500).json({
    status: false,
    message: err.message,
    data: null,
  });
});

server.listen(PORT, () => console.log("Listening on port :", PORT));

module.exports = app;
