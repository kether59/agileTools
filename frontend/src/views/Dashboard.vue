<template>
  <div class="dashboard">
    <div class="header">
      <h1>Welcome, {{ authStore.username }}!</h1>
      <Button 
        label="Create Room" 
        icon="pi pi-plus"
        @click="showCreateRoomDialog = true"
      />
    </div>

    <div class="rooms-container">
      <h2>Active Rooms</h2>
      <div class="rooms-grid" v-if="rooms.length > 0">
        <Card v-for="room in rooms" :key="room.id" class="room-card">
          <template #title>
            {{ room.name }}
          </template>
          <template #content>
            <p class="room-info">
              <span><i class="pi pi-users"></i> {{ room.participants.length }} participants</span>
              <span><i class="pi pi-user"></i> Created by {{ room.owner }}</span>
            </p>
          </template>
          <template #footer>
            <Button 
              label="Join Room" 
              icon="pi pi-sign-in"
              @click="joinRoom(room.id)"
            />
          </template>
        </Card>
      </div>
      <div v-else class="no-rooms">
        <i class="pi pi-info-circle"></i>
        <p>No active rooms found. Create one to get started!</p>
      </div>
    </div>

    <Dialog 
      v-model:visible="showCreateRoomDialog" 
      modal 
      header="Create New Room"
      :style="{ width: '90%', maxWidth: '400px' }"
    >
      <form @submit.prevent="createRoom" class="create-room-form">
        <div class="form-field">
          <label for="roomName">Room Name</label>
          <InputText 
            id="roomName" 
            v-model="newRoomName" 
            :class="{ 'p-invalid': submitted && !newRoomName }"
            placeholder="Enter room name"
          />
          <small class="p-error" v-if="submitted && !newRoomName">
            Room name is required
          </small>
        </div>

        <div class="form-field">
          <label>Voting Scale</label>
          <div class="voting-scale-options">
            <Button 
              v-for="scale in votingScales" 
              :key="scale.name"
              :label="scale.name"
              :class="{ 'p-button-outlined': selectedScale !== scale.values }"
              @click="selectedScale = scale.values"
              type="button"
            />
          </div>
        </div>
      </form>
      <template #footer>
        <Button label="Cancel" @click="showCreateRoomDialog = false" class="p-button-text" />
        <Button label="Create" icon="pi pi-plus" @click="createRoom" autofocus />
      </template>
    </Dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';
import { socketService } from '../services/socket';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const rooms = ref([]);
const showCreateRoomDialog = ref(false);
const newRoomName = ref('');
const selectedScale = ref('0,1,2,3,5,8,13,21,?');
const submitted = ref(false);

const votingScales = [
  { name: 'Standard', values: '0,1,2,3,5,8,13,21,?' },
  { name: 'Fibonacci', values: '0,1,2,3,5,8,13,21,34,?' },
  { name: 'T-Shirt', values: 'XS,S,M,L,XL,XXL,?' }
];

function setupSocketListeners(socket) {
  socket.on('connect', () => {
    console.log('Dashboard: Socket connected');
  });

  socket.on('disconnect', () => {
    console.log('Dashboard: Socket disconnected');
  });

  socket.on('connect_error', (error) => {
    console.error('Dashboard: Socket connection error:', error);
    toast.add({
      severity: 'error',
      summary: 'Connection Error',
      detail: 'Failed to connect to server',
      life: 5000
    });
  });

  socket.on('rooms:update', (updatedRooms) => {
    console.log('Dashboard: Rooms updated:', updatedRooms);
    rooms.value = updatedRooms;
  });

  socket.on('room:joined', (roomData) => {
    console.log('Dashboard: Room joined:', roomData);
    authStore.setCurrentRoom(roomData.id);
    router.push(`/session/${roomData.id}`);
  });

  socket.on('error', (error) => {
    console.error('Dashboard: Socket error:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 5000
    });
  });
}

async function createRoom() {
  submitted.value = true;
  if (!newRoomName.value) return;

  try {
    console.log('Dashboard: Creating room:', newRoomName.value);
    const response = await socketService.createRoom({
      name: newRoomName.value,
      votingScale: selectedScale.value
    });
    console.log('Dashboard: Room created:', response);

    if (response.success && response.room) {
      showCreateRoomDialog.value = false;
      newRoomName.value = '';
      submitted.value = false;

      // Join the room immediately after creating it
      await joinRoom(response.room.id);
    }
  } catch (error) {
    console.error('Dashboard: Error creating room:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to create room',
      life: 5000
    });
  }
}

async function joinRoom(roomId) {
  try {
    console.log('Dashboard: Joining room:', roomId);
    const response = await socketService.joinRoom(roomId);
    console.log('Dashboard: Join room response:', response);

    if (response.success && response.room) {
      authStore.setCurrentRoom(response.room.id);
      router.push(`/session/${response.room.id}`);
      
      toast.add({
        severity: 'success',
        summary: 'Joined Room',
        detail: `You've joined ${response.room.name}`,
        life: 3000
      });
    }
  } catch (error) {
    console.error('Dashboard: Error joining room:', error);
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error.message || 'Failed to join room',
      life: 5000
    });
  }
}

onMounted(() => {
  console.log('Dashboard: Mounting component');
  const socket = socketService.connect(authStore.username);
  console.log('Dashboard: Socket connection initialized');
  setupSocketListeners(socket);
});

onBeforeUnmount(() => {
  console.log('Dashboard: Unmounting component');
  socketService.disconnect();
});
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.header h1 {
  margin: 0;
  color: var(--text-color);
}

.rooms-container h2 {
  margin-bottom: 1.5rem;
  color: var(--text-color);
}

.rooms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.room-card {
  background: var(--surface-card);
}

.room-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  color: var(--text-color-secondary);
}

.room-info span {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.no-rooms {
  text-align: center;
  padding: 3rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  color: var(--text-color-secondary);
}

.no-rooms i {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.create-room-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.voting-scale-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

@media (max-width: 768px) {
  .dashboard {
    padding: 1rem;
  }

  .header {
    flex-direction: column;
    gap: 1rem;
    text-align: center;
  }

  .rooms-grid {
    grid-template-columns: 1fr;
  }
}
</style>
