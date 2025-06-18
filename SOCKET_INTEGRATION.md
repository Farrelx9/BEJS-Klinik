# Socket.IO Integration Guide - Unread Message Notifications

## Backend Implementation Status ✅

Implementasi socket di backend sudah diperbaiki dan fokus pada **push notification unread messages** saja.

### Fitur yang Tersedia:

1. **Unread Message Notifications**

   - Notifikasi real-time saat ada pesan baru
   - Update jumlah unread messages
   - User-specific notifications

2. **User-based Notification Rooms**
   - Setiap user memiliki room notifikasi sendiri
   - Notifikasi hanya dikirim ke user yang relevan

## Frontend Integration

### 1. Install Socket.IO Client

```bash
npm install socket.io-client
```

### 2. Basic Connection Setup

```javascript
import { io } from "socket.io-client";

const socket = io("https://your-backend-url.com", {
  transports: ["websocket", "polling"],
  withCredentials: true,
});

// Connection events
socket.on("connect", () => {
  console.log("Connected to server");
});

socket.on("disconnect", () => {
  console.log("Disconnected from server");
});
```

### 3. Join User Notification Room

```javascript
// Join user's notification room (call this after user login)
const joinNotificationRoom = (userId) => {
  socket.emit("join-notifications", userId);
  console.log("Joined notification room for user:", userId);
};

// Example usage after login
const user = getCurrentUser(); // Get current logged in user
if (user && user.id_user) {
  joinNotificationRoom(user.id_user);
}
```

### 4. Listen for Unread Message Notifications

```javascript
// Listen for new unread message notifications
socket.on("unread-message-notification", (data) => {
  console.log("New unread message notification:", data);

  // Show notification to user
  showNotification(data.message);

  // Update unread count in UI
  updateUnreadCount(data.chatId);
});

// Listen for unread count updates
socket.on("unread-count-update", (data) => {
  console.log("Unread count updated:", data);

  // Update unread count in UI
  updateUnreadCountDisplay(data.chatId, data.unreadCount);
});
```

### 5. Send Messages (via API)

```javascript
// Send message to backend API
const sendMessage = async (message, chatId) => {
  try {
    const response = await fetch("/api/konsultasi/kirim-pesan", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        isi: message,
        pengirim: userRole, // 'dokter' atau 'pasien'
        id_chat: chatId,
      }),
    });

    const result = await response.json();
    if (result.success) {
      // Notification will be automatically sent via socket
      console.log("Message sent successfully");
    }
  } catch (error) {
    console.error("Error sending message:", error);
  }
};
```

### 6. Mark Messages as Read

```javascript
// Mark all messages as read for a chat
const markMessagesAsRead = async (chatId) => {
  try {
    const response = await fetch(`/api/konsultasi/${chatId}/mark-read`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const result = await response.json();
    if (result.success) {
      // Unread count will be automatically updated via socket
      console.log("Messages marked as read");
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
};
```

### 7. Leave Notification Room

```javascript
// When user logs out or leaves
const leaveNotificationRoom = (userId) => {
  socket.emit("leave-notifications", userId);
  console.log("Left notification room for user:", userId);
};
```

## Production Deployment Checklist ✅

### Backend (Vercel/Heroku/etc.)

1. **Environment Variables**

   ```env
   NODE_ENV=production
   PORT=3000
   ```

2. **CORS Configuration** ✅

   - Production URLs sudah dikonfigurasi
   - Development URLs untuk testing lokal

3. **Socket.IO Configuration** ✅

   - WebSocket dan polling transport
   - User-based notification rooms
   - Proper error handling

4. **Security** ✅
   - CORS origin validation
   - Input validation di controller
   - Authentication middleware

### Frontend Deployment

1. **Environment Variables**

   ```env
   VITE_SOCKET_URL=https://your-backend-url.com
   VITE_API_URL=https://your-backend-url.com/api
   ```

2. **Socket Connection**
   ```javascript
   const socket = io(import.meta.env.VITE_SOCKET_URL, {
     transports: ["websocket", "polling"],
     withCredentials: true,
   });
   ```

## Testing Checklist

### Backend Testing ✅

- [x] Socket connection established
- [x] User notification rooms work
- [x] Unread message notifications work
- [x] Unread count updates work
- [x] Error handling implemented

### Frontend Testing (To Do)

- [ ] Socket connection from frontend
- [ ] Join/leave notification rooms
- [ ] Receive unread message notifications
- [ ] Update unread count display
- [ ] Error handling and reconnection
- [ ] Mobile responsiveness

## Notification Flow

### 1. New Message Flow

```
User A sends message → API → Database → Socket notification → User B receives notification
```

### 2. Mark as Read Flow

```
User marks messages as read → API → Database → Socket update → Other user's count updated
```

### 3. Unread Count Flow

```
User requests unread count → API → Database → Return count → Update UI
```

## Common Issues & Solutions

### 1. CORS Errors

**Solution**: Backend CORS sudah dikonfigurasi untuk production dan development

### 2. Socket Connection Fails

**Solution**:

- Check if backend is running
- Verify CORS origins
- Check network connectivity

### 3. Notifications Not Received

**Solution**:

- Ensure user has joined notification room
- Check if user ID is correct
- Verify socket connection is established

### 4. Production Deployment Issues

**Solution**:

- Use environment variables for URLs
- Ensure SSL/HTTPS for production
- Check server logs for errors

## Next Steps

1. **Frontend Integration**: Implement socket client di frontend
2. **Testing**: Test notification features end-to-end
3. **Deployment**: Deploy to production environment
4. **Monitoring**: Add socket connection monitoring
5. **Performance**: Optimize for high concurrent users

## Support

Jika ada masalah dengan implementasi socket, cek:

1. Browser console untuk error frontend
2. Server logs untuk error backend
3. Network tab untuk connection issues
4. Socket.IO documentation untuk troubleshooting
