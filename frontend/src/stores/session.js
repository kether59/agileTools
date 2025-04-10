import { defineStore } from 'pinia';
import { io } from 'socket.io-client';
import axios from 'axios';
import { useAuthStore } from './auth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const useSessionStore = defineStore('session', {
  state: () => ({
    currentSession: null,
    socket: null,
    participants: new Map(),
    votes: new Map(),
    revealed: false
  }),

  getters: {
    isOwner: (state) => {
      const authStore = useAuthStore();
      return state.currentSession?.ownerId === authStore.user?.id;
    },
    hasEveryoneVoted: (state) => {
      return Array.from(state.participants.values())
        .every(participant => state.votes.has(participant.id));
    }
  },

  actions: {
    async createSession(name, votingScale) {
      try {
        const authStore = useAuthStore();
        const response = await axios.post(
          `${API_URL}/sessions`,
          { name, votingScale },
          {
            headers: { Authorization: `Bearer ${authStore.token}` }
          }
        );
        return response.data;
      } catch (error) {
        throw error.response?.data?.error || 'Failed to create session';
      }
    },

    async joinSession(sessionId) {
      const authStore = useAuthStore();
      
      // Initialize socket connection
      this.socket = io(API_URL.replace('/api', ''), {
        auth: { token: authStore.token }
      });

      // Setup socket event handlers
      this.socket.on('connect', () => {
        this.socket.emit('join-session', sessionId);
      });

      this.socket.on('session-joined', (session) => {
        this.currentSession = session;
      });

      this.socket.on('user-joined', (user) => {
        this.participants.set(user.id, user);
      });

      this.socket.on('vote-submitted', (data) => {
        this.votes.set(data.userId, { pending: true });
      });

      this.socket.on('votes-revealed', (votes) => {
        this.revealed = true;
        votes.forEach(vote => {
          this.votes.set(vote.UserId, {
            value: vote.value,
            username: vote.User.username
          });
        });
      });

      // Fetch initial session data
      const response = await axios.get(
        `${API_URL}/sessions/${sessionId}`,
        {
          headers: { Authorization: `Bearer ${authStore.token}` }
        }
      );
      this.currentSession = response.data;
    },

    submitVote(value) {
      if (!this.socket || !this.currentSession) return;
      
      this.socket.emit('submit-vote', {
        sessionId: this.currentSession.id,
        value,
        story: this.currentSession.currentStory
      });
    },

    revealVotes() {
      if (!this.socket || !this.currentSession || !this.isOwner) return;
      
      this.socket.emit('reveal-votes', this.currentSession.id);
    },

    leaveSession() {
      if (this.socket) {
        this.socket.disconnect();
        this.socket = null;
      }
      this.currentSession = null;
      this.participants.clear();
      this.votes.clear();
      this.revealed = false;
    }
  }
});
