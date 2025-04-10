<template>
  <div class="home">
    <div class="hero">
      <h1>Planning Poker</h1>
      <p class="subtitle">Simple, real-time planning poker for agile teams</p>
      
      <Button 
        label="Join Session" 
        icon="pi pi-users" 
        @click="$router.push('/login')" 
        class="p-button-lg"
      />
    </div>

    <div class="features">
      <div class="feature-card">
        <i class="pi pi-users feature-icon"></i>
        <h3>No Registration Required</h3>
        <p>Just enter your name and start estimating with your team instantly.</p>
      </div>

      <div class="feature-card">
        <i class="pi pi-clock feature-icon"></i>
        <h3>Real-time Updates</h3>
        <p>See votes and results in real-time as team members participate.</p>
      </div>

      <div class="feature-card">
        <i class="pi pi-check-circle feature-icon"></i>
        <h3>Multiple Scales</h3>
        <p>Choose from story points, Fibonacci, or T-shirt sizes for voting.</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { useAuthStore } from '../stores/auth';
import { storeToRefs } from 'pinia';

const authStore = useAuthStore();
const { isAuthenticated } = storeToRefs(authStore);
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}

.hero {
  text-align: center;
  padding: 4rem 2rem;
  background: var(--surface-card);
  border-radius: var(--border-radius);
  margin-bottom: 3rem;
}

.hero h1 {
  font-size: 3rem;
  margin-bottom: 1rem;
  color: var(--primary-color);
}

.subtitle {
  font-size: 1.2rem;
  color: var(--text-color-secondary);
  margin-bottom: 2rem;
}

.features {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-top: 3rem;
}

.feature-card {
  background: var(--surface-card);
  padding: 2rem;
  border-radius: var(--border-radius);
  text-align: center;
}

.feature-icon {
  font-size: 2rem;
  color: var(--primary-color);
  margin-bottom: 1rem;
}

.feature-card h3 {
  margin-bottom: 1rem;
  color: var(--text-color);
}

.feature-card p {
  color: var(--text-color-secondary);
  line-height: 1.5;
}

@media (max-width: 768px) {
  .home {
    padding: 1rem;
  }

  .hero {
    padding: 2rem 1rem;
  }

  .hero h1 {
    font-size: 2rem;
  }

  .features {
    grid-template-columns: 1fr;
  }
}
</style>
