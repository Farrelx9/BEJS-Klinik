const socketIO = require("socket.io");

let io;

const initializeSocket = (server) => {
  io = socketIO(server, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? ["https://klinikdrgirna.my.id", "https://www.klinikdrgirna.my.id"]
          : [
              "http://localhost:3000",
              "http://localhost:3001",
              "http://localhost:5173",
              "http://localhost:8080",
            ],
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join user's notification room (based on user ID)
    socket.on("join-notifications", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${socket.id} joined notification room: user-${userId}`);
    });

    // Leave notification room
    socket.on("leave-notifications", (userId) => {
      socket.leave(`user-${userId}`);
      console.log(`User ${socket.id} left notification room: user-${userId}`);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

// Function to send unread message notification to specific user
const sendUnreadNotification = (userId, data) => {
  if (io) {
    io.to(`user-${userId}`).emit("unread-message-notification", data);
  }
};

// Function to send unread count update to specific user
const sendUnreadCountUpdate = (userId, chatId, unreadCount) => {
  if (io) {
    io.to(`user-${userId}`).emit("unread-count-update", {
      chatId,
      unreadCount,
      timestamp: new Date(),
    });
  }
};

// Function to emit to all connected clients (for admin notifications)
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
  }
};

module.exports = {
  initializeSocket,
  sendUnreadNotification,
  sendUnreadCountUpdate,
  emitToAll,
};
