import jwt from 'jsonwebtoken';
import { Session, User, Vote } from '../models/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

const rooms = new Map();

export const setupWebSocket = (io) => {
  io.use((socket, next) => {
    const username = socket.handshake.auth.username;
    if (!username) {
      return next(new Error('Username required'));
    }
    socket.username = username;
    next();
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.username}`);

    // Send current rooms to the connected user
    socket.emit('rooms:update', Array.from(rooms.values()));

    // Create room
    socket.on('room:create', (roomData, callback) => {
      try {
        const roomId = Math.random().toString(36).substr(2, 9);
        const room = {
          id: roomId,
          name: roomData.name,
          owner: socket.username,
          participants: [socket.username],
          votingScale: roomData.votingScale,
          votes: new Map(),
          revealed: false
        };

        rooms.set(roomId, room);
        socket.join(roomId);
        
        // Notify all clients about the new room
        io.emit('rooms:update', Array.from(rooms.values()));
        
        callback({ success: true, room });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Join room
    socket.on('room:join', ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (!room.participants.includes(socket.username)) {
          room.participants.push(socket.username);
        }

        socket.join(roomId);
        
        // Notify room members about the new participant
        io.to(roomId).emit('room:updated', room);
        // Update room list for all clients
        io.emit('rooms:update', Array.from(rooms.values()));
        
        callback({ success: true, room });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Leave room
    socket.on('room:leave', ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        room.participants = room.participants.filter(p => p !== socket.username);
        room.votes.delete(socket.username);

        socket.leave(roomId);

        // If room is empty, delete it
        if (room.participants.length === 0) {
          rooms.delete(roomId);
        }

        // Notify all clients about the updated room list
        io.emit('rooms:update', Array.from(rooms.values()));
        
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Submit vote
    socket.on('vote:submit', ({ roomId, value }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        room.votes.set(socket.username, value);
        
        // Notify room about the vote (without revealing value)
        io.to(roomId).emit('room:vote', {
          username: socket.username,
          hasVoted: true
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Reveal votes
    socket.on('vote:reveal', ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (room.owner !== socket.username) {
          throw new Error('Only room owner can reveal votes');
        }

        room.revealed = true;
        
        // Send votes to all room participants
        io.to(roomId).emit('room:votes', {
          votes: Array.from(room.votes.entries()),
          revealed: true
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Reset votes
    socket.on('vote:reset', ({ roomId }, callback) => {
      try {
        const room = rooms.get(roomId);
        if (!room) {
          throw new Error('Room not found');
        }

        if (room.owner !== socket.username) {
          throw new Error('Only room owner can reset votes');
        }

        room.votes.clear();
        room.revealed = false;
        
        // Notify room about vote reset
        io.to(roomId).emit('room:votes', {
          votes: [],
          revealed: false
        });
        
        callback({ success: true });
      } catch (error) {
        callback({ error: error.message });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.username}`);
      
      // Remove user from all rooms they were in
      rooms.forEach((room, roomId) => {
        if (room.participants.includes(socket.username)) {
          room.participants = room.participants.filter(p => p !== socket.username);
          room.votes.delete(socket.username);

          // If room is empty, delete it
          if (room.participants.length === 0) {
            rooms.delete(roomId);
          }
        }
      });

      // Update room list for all clients
      io.emit('rooms:update', Array.from(rooms.values()));
    });
  });
};
