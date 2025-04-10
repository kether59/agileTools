import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import { sequelize } from './models/index.js';
import { userRoutes } from './routes/users.js';
import { sessionRoutes } from './routes/sessions.js';
import { setupWebSocket } from './websocket/index.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
    methods: ["GET", "POST"],
    credentials: true
  },
  transports: ['websocket', 'polling']
});

// Middleware
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:3001", "http://localhost:3002", "http://localhost:3003"],
  credentials: true
}));
app.use(express.json());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/sessions', sessionRoutes);

// WebSocket setup
const rooms = new Map();
const userSockets = new Map();
const disconnectTimers = new Map();
const connectedUsers = new Set();

function logRooms(context) {
  console.log(`[${context}] Current rooms:`, {
    count: rooms.size,
    rooms: Array.from(rooms.entries()).map(([id, room]) => ({
      id,
      name: room.name,
      owner: room.owner,
      participants: room.participants,
      votesCount: room.votes.size
    }))
  });
}

function broadcastConnectedUsers() {
  io.emit('users:update', Array.from(connectedUsers));
}

function clearDisconnectTimer(username) {
  const timer = disconnectTimers.get(username);
  if (timer) {
    clearTimeout(timer);
    disconnectTimers.delete(username);
    console.log('Cleared disconnect timer for:', username);
  }
}

io.on('connection', (socket) => {
  const username = socket.handshake.auth.username;
  console.log('Client connected:', { username, socketId: socket.id });
  
  // Clear any existing disconnect timer for this user
  clearDisconnectTimer(username);
  
  // Add user to connected users and broadcast update
  connectedUsers.add(username);
  broadcastConnectedUsers();
  
  // Store socket reference
  userSockets.set(username, socket);

  // Send current rooms and users to the connected user
  logRooms('Initial rooms state');
  const roomList = Array.from(rooms.values()).map(room => ({
    ...room,
    votes: Array.from(room.votes.entries())
  }));
  socket.emit('rooms:update', roomList);
  socket.emit('users:update', Array.from(connectedUsers));

  // Rejoin rooms if user was in any
  rooms.forEach((room, roomId) => {
    if (room.participants.includes(username)) {
      socket.join(roomId);
      console.log('Rejoined room:', { username, roomId });
    }
  });

  // Create room
  socket.on('room:create', (roomData, callback) => {
    try {
      console.log('Creating room:', { username, roomData });
      const roomId = Math.random().toString(36).substr(2, 9);
      const room = {
        id: roomId,
        name: roomData.name,
        owner: username,
        participants: [username],
        votingScale: roomData.votingScale,
        votes: new Map(),
        revealed: false
      };

      rooms.set(roomId, room);
      socket.join(roomId);
      
      console.log('Room created successfully:', {
        roomId,
        name: room.name,
        owner: room.owner,
        participants: room.participants
      });
      
      // Notify all clients about the new room
      const updatedRoomList = Array.from(rooms.values()).map(room => ({
        ...room,
        votes: Array.from(room.votes.entries())
      }));
      io.emit('rooms:update', updatedRoomList);
      
      logRooms('After room creation');
      callback({ success: true, room });
    } catch (error) {
      console.error('Error creating room:', error);
      callback({ error: error.message });
    }
  });

  // Join room
  socket.on('room:join', ({ roomId }, callback) => {
    try {
      console.log('Attempting to join room:', { username, roomId });
      logRooms('Before joining room');
      
      const room = rooms.get(roomId);
      console.log('Found room:', room ? {
        id: room.id,
        name: room.name,
        owner: room.owner,
        participants: room.participants
      } : null);
      
      if (!room) {
        throw new Error('Room not found');
      }

      if (!room.participants.includes(username)) {
        room.participants.push(username);
        console.log('Added participant to room:', {
          roomId,
          username,
          participants: room.participants
        });
      }

      socket.join(roomId);
      console.log('Socket joined room:', { socketId: socket.id, roomId });
      
      // Notify room members about the new participant
      const updatedRoom = {
        ...room,
        votes: Array.from(room.votes.entries())
      };
      io.to(roomId).emit('room:updated', updatedRoom);

      // Update room list for all clients
      const updatedRoomList = Array.from(rooms.values()).map(room => ({
        ...room,
        votes: Array.from(room.votes.entries())
      }));
      io.emit('rooms:update', updatedRoomList);
      
      logRooms('After joining room');
      callback({ success: true, room: updatedRoom });
    } catch (error) {
      console.error('Error joining room:', error);
      callback({ error: error.message });
    }
  });

  // Leave room
  socket.on('room:leave', ({ roomId }, callback) => {
    try {
      console.log('Leaving room:', { username, roomId });
      logRooms('Before leaving room');
      
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      room.participants = room.participants.filter(p => p !== username);
      room.votes.delete(username);

      socket.leave(roomId);
      console.log('Socket left room:', { socketId: socket.id, roomId });

      // If room is empty, delete it
      if (room.participants.length === 0) {
        console.log('Deleting empty room:', roomId);
        rooms.delete(roomId);
      } else {
        // Notify remaining room members about the participant leaving
        const updatedRoom = {
          ...room,
          votes: Array.from(room.votes.entries())
        };
        io.to(roomId).emit('room:updated', updatedRoom);
      }

      // Update room list for all clients
      const updatedRoomList = Array.from(rooms.values()).map(room => ({
        ...room,
        votes: Array.from(room.votes.entries())
      }));
      io.emit('rooms:update', updatedRoomList);
      
      logRooms('After leaving room');
      callback({ success: true });
    } catch (error) {
      console.error('Error leaving room:', error);
      callback({ error: error.message });
    }
  });

  // Submit vote
  socket.on('vote:submit', ({ roomId, value }, callback) => {
    try {
      console.log('Submitting vote:', { username, roomId, value });
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      room.votes.set(username, value);
      
      // Notify room about the vote (without revealing value)
      io.to(roomId).emit('room:vote', {
        username,
        hasVoted: true
      });
      
      console.log('Vote submitted:', { username, roomId });
      callback({ success: true });
    } catch (error) {
      console.error('Error submitting vote:', error);
      callback({ error: error.message });
    }
  });

  // Reveal votes
  socket.on('vote:reveal', ({ roomId }, callback) => {
    try {
      console.log('Revealing votes:', { username, roomId });
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      if (room.owner !== username) {
        throw new Error('Only room owner can reveal votes');
      }

      room.revealed = true;
      
      // Send votes to all room participants
      io.to(roomId).emit('room:votes', {
        votes: Array.from(room.votes.entries()),
        revealed: true
      });
      
      console.log('Votes revealed:', { roomId });
      callback({ success: true });
    } catch (error) {
      console.error('Error revealing votes:', error);
      callback({ error: error.message });
    }
  });

  // Reset votes
  socket.on('vote:reset', ({ roomId }, callback) => {
    try {
      console.log('Resetting votes:', { username, roomId });
      const room = rooms.get(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      if (room.owner !== username) {
        throw new Error('Only room owner can reset votes');
      }

      room.votes.clear();
      room.revealed = false;
      
      // Notify room about vote reset
      io.to(roomId).emit('room:votes', {
        votes: [],
        revealed: false
      });
      
      console.log('Votes reset:', { roomId });
      callback({ success: true });
    } catch (error) {
      console.error('Error resetting votes:', error);
      callback({ error: error.message });
    }
  });

  socket.on('error', (error) => {
    console.error('Socket error:', { username, error });
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', { username, socketId: socket.id });
    userSockets.delete(username);
    
    // Set a timer to remove the user from rooms and connected users after a delay
    const disconnectTimer = setTimeout(() => {
      console.log('Disconnect timer expired for:', username);
      
      // Remove user from connected users and broadcast update
      connectedUsers.delete(username);
      broadcastConnectedUsers();
      
      // Remove user from all rooms they were in
      rooms.forEach((room, roomId) => {
        if (room.participants.includes(username)) {
          room.participants = room.participants.filter(p => p !== username);
          room.votes.delete(username);

          // If room is empty, delete it
          if (room.participants.length === 0) {
            console.log('Deleting empty room:', roomId);
            rooms.delete(roomId);
          } else {
            // Notify remaining room members about the participant leaving
            const updatedRoom = {
              ...room,
              votes: Array.from(room.votes.entries())
            };
            io.to(roomId).emit('room:updated', updatedRoom);
          }
        }
      });

      logRooms('After disconnect timer');

      // Update room list for all clients
      const updatedRoomList = Array.from(rooms.values()).map(room => ({
        ...room,
        votes: Array.from(room.votes.entries())
      }));
      io.emit('rooms:update', updatedRoomList);
      
      disconnectTimers.delete(username);
    }, 5000); // 5 second grace period for reconnection
    
    disconnectTimers.set(username, disconnectTimer);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Database initialization and server start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.sync();
    console.log('Database synchronized');
    
    httpServer.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
