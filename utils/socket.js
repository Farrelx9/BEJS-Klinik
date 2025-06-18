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

    // ===== PATIENT SIDE EVENTS =====

    // Join user's notification room (based on user ID)
    socket.on("join-notifications", (userId) => {
      socket.join(`user-${userId}`);
      console.log(`User ${socket.id} joined notification room: user-${userId}`);
    });

    // Join patient chat room
    socket.on("join-chat-room", (userId) => {
      socket.join(`patient-${userId}`);
      console.log(`Patient ${socket.id} joined chat room: patient-${userId}`);
    });

    // Leave notification room
    socket.on("leave-notifications", (userId) => {
      socket.leave(`user-${userId}`);
      console.log(`User ${socket.id} left notification room: user-${userId}`);
    });

    // Leave patient chat room
    socket.on("leave-chat-room", (userId) => {
      socket.leave(`patient-${userId}`);
      console.log(`Patient ${socket.id} left chat room: patient-${userId}`);
    });

    // ===== ADMIN SIDE EVENTS =====

    // Join admin notification room
    socket.on("join-admin-notifications", (userId) => {
      socket.join(`admin-notifications-${userId}`);
      console.log(
        `Admin ${socket.id} joined admin notification room: admin-notifications-${userId}`
      );
    });

    // Join admin chat room
    socket.on("join-admin-chat-room", (userId) => {
      socket.join(`admin-${userId}`);
      console.log(`Admin ${socket.id} joined admin chat room: admin-${userId}`);
    });

    // Leave admin notification room
    socket.on("leave-admin-notifications", (userId) => {
      socket.leave(`admin-notifications-${userId}`);
      console.log(
        `Admin ${socket.id} left admin notification room: admin-notifications-${userId}`
      );
    });

    // Leave admin chat room
    socket.on("leave-admin-chat-room", (userId) => {
      socket.leave(`admin-${userId}`);
      console.log(`Admin ${socket.id} left admin chat room: admin-${userId}`);
    });

    // ===== DEBUG EVENTS =====

    // Debug: Get socket info
    socket.on("debug-socket-info", () => {
      console.log("Socket Info:", {
        id: socket.id,
        rooms: Array.from(socket.rooms),
        connected: socket.connected,
      });
      socket.emit("debug-socket-info-response", {
        id: socket.id,
        rooms: Array.from(socket.rooms),
        connected: socket.connected,
      });
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });

  return io;
};

// ===== PATIENT SIDE FUNCTIONS =====

// Function to send unread message notification to specific user
const sendUnreadNotification = (userId, data) => {
  if (io) {
    io.to(`user-${userId}`).emit("unread-message-notification", data);
    console.log(`Sent unread notification to user-${userId}:`, data);
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
    console.log(`Sent unread count update to user-${userId}:`, {
      chatId,
      unreadCount,
    });
  }
};

// Function to send new message notification to patient (from doctor)
const sendNewMessageToPatient = (patientId, data) => {
  if (io) {
    io.to(`patient-${patientId}`).emit("new-message", {
      chatId: data.chatId,
      message: data.message,
      sender: "dokter",
      timestamp: new Date(),
    });
    console.log(`Sent new message to patient-${patientId}:`, data);
  }
};

// Function to send chat update to patient
const sendChatUpdateToPatient = (patientId, chatId) => {
  if (io) {
    io.to(`patient-${patientId}`).emit("chat-updated", {
      chatId,
      timestamp: new Date(),
    });
    console.log(`Sent chat update to patient-${patientId}:`, { chatId });
  }
};

// ===== ADMIN SIDE FUNCTIONS =====

// Function to send new patient message notification to admin
const sendNewPatientMessageToAdmin = (adminId, data) => {
  if (io) {
    io.to(`admin-${adminId}`).emit("new-patient-message", {
      chatId: data.chatId,
      message: data.message,
      sender: "pasien",
      timestamp: new Date(),
    });
    console.log(`Sent new patient message to admin-${adminId}:`, data);
  }
};

// Function to send chat update to admin
const sendChatUpdateToAdmin = (adminId, chatId) => {
  if (io) {
    io.to(`admin-${adminId}`).emit("chat-updated-admin", {
      chatId,
      timestamp: new Date(),
    });
    console.log(`Sent chat update to admin-${adminId}:`, { chatId });
  }
};

// Function to send unread count update to admin
const sendUnreadCountUpdateToAdmin = (adminId, chatId, unreadCount) => {
  if (io) {
    io.to(`admin-${adminId}`).emit("unread-count-update", {
      chatId,
      unreadCount,
      timestamp: new Date(),
    });
    console.log(`Sent unread count update to admin-${adminId}:`, {
      chatId,
      unreadCount,
    });
  }
};

// ===== GENERAL FUNCTIONS =====

// Function to emit to all connected clients (for admin notifications)
const emitToAll = (event, data) => {
  if (io) {
    io.emit(event, data);
    console.log(`Emitted ${event} to all clients:`, data);
  }
};

// Function to get connected clients count
const getConnectedClientsCount = () => {
  if (io) {
    return io.engine.clientsCount;
  }
  return 0;
};

// Function to get all connected socket IDs
const getAllConnectedSockets = () => {
  if (io) {
    return Array.from(io.sockets.sockets.keys());
  }
  return [];
};

// Function to get rooms info
const getRoomsInfo = () => {
  if (io) {
    const rooms = io.sockets.adapter.rooms;
    const roomsInfo = {};

    for (const [roomId, sockets] of rooms) {
      roomsInfo[roomId] = Array.from(sockets);
    }

    return roomsInfo;
  }
  return {};
};

module.exports = {
  initializeSocket,

  // Patient side functions
  sendUnreadNotification,
  sendUnreadCountUpdate,
  sendNewMessageToPatient,
  sendChatUpdateToPatient,

  // Admin side functions
  sendNewPatientMessageToAdmin,
  sendChatUpdateToAdmin,
  sendUnreadCountUpdateToAdmin,

  // General functions
  emitToAll,
  getConnectedClientsCount,
  getAllConnectedSockets,
  getRoomsInfo,
};
