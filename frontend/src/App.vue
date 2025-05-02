<template>
  <div class="app-container">
    <header class="app-header" v-if="isAuthenticated">
      <div class="header-content">
        <h1>Planning Poker</h1>
        <div class="header-actions">
          <Button icon="pi pi-cog" @click="showWheel" class="p-button-rounded p-button-text" tooltip="Wheel of Decision" />
        </div>
      </div>
    </header>
    <nav class="navbar" v-if="isAuthenticated">
      <div class="nav-brand">Planning Poker</div>
      <div class="nav-items">
        <span class="username">{{ username }}</span>
        <Button @click="logout" icon="pi pi-sign-out" text />
      </div>
    </nav>

    <main class="main-content">
      <router-view></router-view>
    </main>

    <Toast />
    <WheelOfDecision ref="wheelRef" />

  </div>

</template>

<script setup>
import { useAuthStore } from './stores/auth';
import Button from 'primevue/button';
import Toast from 'primevue/toast';
import { storeToRefs } from 'pinia';
import { useRouter } from 'vue-router';
import { ref, computed } from 'vue';
import WheelOfDecision from './components/WheelOfDecision.vue';

const router = useRouter();
const authStore = useAuthStore();
const wheelRef = ref(null);
const { isAuthenticated, username } = storeToRefs(authStore);

const logout = () => {
  authStore.logout();
  router.push('/login');
};

function showWheel() {
  wheelRef.value?.show();
}
</script>

<style>
:root {
  --primary-color: #2196F3;
  --surface-ground: #f8f9fa;
  --surface-card: #ffffff;
  --text-color: #495057;
  --text-color-secondary: #6c757d;
  --border-radius: 6px;
}

body {
  margin: 0;
  font-family: var(--font-family);
  background: var(--surface-ground);
  color: var(--text-color);
}

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background-color: var(--surface-0);
  border-bottom: 1px solid var(--surface-border);
  padding: 1rem;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-content h1 {
  margin: 0;
  font-size: 1.5rem;
  color: var(--text-color);
}

.header-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.navbar {
  background: var(--primary-color);
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  color: white;
}

.nav-brand {
  font-size: 1.5rem;
  font-weight: bold;
}

.nav-items {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.username {
  font-weight: 500;
}

.main-content {
  flex: 1;
}

.app-main {
  flex: 1;
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

@media (max-width: 768px) {
  .navbar {
    padding: 1rem;
  }
}
</style>
