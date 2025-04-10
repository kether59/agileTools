import { io } from 'socket.io-client';
import { useSocketStore } from '../stores/socket';

const SOCKET_URL = import.meta.env.VITE_API_URL;

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.username = null;
  }

  connect(username) {
    if (this.socket && this.connected) {
      return this.socket;
    }

    this.username = username;
    this.socket = io(SOCKET_URL, {
      auth: { username },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('Connected to WebSocket');
      this.connected = true;
    });

    this.socket.on('connect_error', (error) => {
      console.error('Connection error:', error);
      this.connected = false;
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket');
      this.connected = false;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    this.socket.on('users:update', (users) => {
      console.log('Users updated:', users);
      const socketStore = useSocketStore();
      socketStore.setUsers(users);
    });

    return this.socket;
  }

  ensureConnection() {
    if (!this.socket || !this.connected) {
      if (this.username) {
        this.connect(this.username);
      } else {
        throw new Error('Not connected and no username available');
      }
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.username = null;
    }
  }

  // Room events
  createRoom(roomData) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('room:create', roomData, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  joinRoom(roomId) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('room:join', { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  leaveRoom(roomId) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('room:leave', { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  // Voting events
  submitVote(roomId, value) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('vote:submit', { roomId, value }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  revealVotes(roomId) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('vote:reveal', { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  resetVotes(roomId) {
    return new Promise((resolve, reject) => {
      try {
        this.ensureConnection();
        this.socket.emit('vote:reset', { roomId }, (response) => {
          if (response.error) {
            reject(new Error(response.error));
          } else {
            resolve(response);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}

export const socketService = new SocketService();
