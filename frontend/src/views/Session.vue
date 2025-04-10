<template>
  <div class="session-container">
    <div class="session-header">
      <div class="header-content">
        <Button 
          icon="pi pi-arrow-left" 
          text 
          @click="goBack"
          class="back-button"
        />
        <h1>{{ room?.name }}</h1>
      </div>
      <div class="session-controls">
        <Button 
          v-if="isOwner"
          :label="revealed ? 'Start New Round' : 'Reveal Cards'"
          :icon="revealed ? 'pi pi-refresh' : 'pi pi-eye'"
          @click="revealed ? resetVotes() : revealVotes()"
          :disabled="!hasAnyVotes"
        />
        <Button 
          label="Leave Room" 
          icon="pi pi-sign-out"
          severity="secondary"
          @click="leaveRoom"
        />
      </div>
    </div>

    <div class="voting-area">
      <div class="voting-cards" :class="{ 'revealed': revealed }">
        <Button
          v-for="value in room?.votingScale.split(',')"
          :key="value"
          :label="value"
          :class="{ 'selected': myVote === value }"
          @click="submitVote(value)"
          :disabled="revealed"
        />
      </div>

      <div class="results" v-if="revealed">
        <h3>Voting Results</h3>
        <div class="votes-grid">
          <div v-for="[username, vote] in votes" :key="username" class="vote-card">
            <div class="vote-value">{{ vote }}</div>
            <div class="voter-name">{{ username }}</div>
          </div>
        </div>
      </div>
    </div>

    <div class="participants-section">
      <h3>Participants</h3>
      <div class="participants-list">
        <div 
          v-for="participant in room?.participants" 
          :key="participant"
          class="participant-item"
        >
          <i class="pi pi-user"></i>
          <span class="name">{{ participant }}</span>
          <i 
            v-if="hasVoted(participant)" 
            class="pi pi-check status voted"
          ></i>
          <i 
            v-else 
            class="pi pi-clock status waiting"
          ></i>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import { socketService } from '../services/socket';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const toast = useToast();

const room = ref(null);
const votes = ref(new Map());
const revealed = ref(false);
const myVote = ref(null);

const isOwner = computed(() => room.value?.owner === authStore.username);
const hasAnyVotes = computed(() => votes.value.size > 0);

function hasVoted(username) {
  return votes.value.has(username);
}

function goBack() {
  leaveRoom();
}

async function submitVote(value) {
  try {
    await socketService.submitVote(route.params.id, value);
    myVote.value = value;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to submit vote',
      life: 5000
    });
  }
}

async function revealVotes() {
  try {
    await socketService.revealVotes(route.params.id);
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to reveal votes',
      life: 5000
    });
  }
}

async function resetVotes() {
  try {
    await socketService.resetVotes(route.params.id);
    votes.value.clear();
    revealed.value = false;
    myVote.value = null;
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to reset votes',
      life: 5000
    });
  }
}

async function leaveRoom() {
  try {
    await socketService.leaveRoom(route.params.id);
    authStore.clearCurrentRoom();
    router.push('/dashboard');
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to leave room',
      life: 5000
    });
  }
}

function setupSocketListeners(socket) {
  socket.on('room:updated', (updatedRoom) => {
    if (updatedRoom.id === route.params.id) {
      room.value = updatedRoom;
    }
  });

  socket.on('room:vote', ({ username, hasVoted }) => {
    if (hasVoted && !votes.value.has(username)) {
      votes.value.set(username, '?');
    }
  });

  socket.on('room:votes', ({ votes: votesList, revealed: isRevealed }) => {
    votes.value = new Map(votesList);
    revealed.value = isRevealed;
  });
}

onMounted(async () => {
  const socket = socketService.connect(authStore.username);
  setupSocketListeners(socket);

  try {
    const response = await socketService.joinRoom(route.params.id);
    if (response.success) {
      room.value = response.room;
    }
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to join room',
      life: 5000
    });
    router.push('/dashboard');
  }
});

onBeforeUnmount(() => {
  leaveRoom();
});
</script>

<style scoped>
.session-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-content h1 {
  margin: 0;
  color: var(--text-color);
}

.session-controls {
  display: flex;
  gap: 1rem;
}

.voting-area {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 2rem;
  margin-bottom: 2rem;
}

.voting-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 2rem;
}

.voting-cards .p-button {
  min-width: 60px;
  height: 80px;
}

.voting-cards .p-button.selected {
  background: var(--primary-color);
  border-color: var(--primary-color);
}

.votes-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

.vote-card {
  background: var(--surface-ground);
  border-radius: var(--border-radius);
  padding: 1rem;
  text-align: center;
}

.vote-value {
  font-size: 1.5rem;
  font-weight: bold;
  margin-bottom: 0.5rem;
  color: var(--primary-color);
}

.voter-name {
  color: var(--text-color-secondary);
  font-size: 0.9rem;
}

.participants-section {
  background: var(--surface-card);
  border-radius: var(--border-radius);
  padding: 2rem;
}

.participants-section h3 {
  margin-top: 0;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.participants-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1rem;
}

.participant-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem;
  background: var(--surface-ground);
  border-radius: var(--border-radius);
}

.participant-item .name {
  flex: 1;
  color: var(--text-color);
}

.participant-item .status {
  font-size: 1rem;
}

.participant-item .status.voted {
  color: var(--green-500);
}

.participant-item .status.waiting {
  color: var(--yellow-500);
}

@media (max-width: 768px) {
  .session-container {
    padding: 1rem;
  }

  .session-header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .header-content {
    flex-direction: column;
  }

  .voting-cards {
    justify-content: center;
  }

  .votes-grid {
    grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  }
}
</style>
