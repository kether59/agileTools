<template>
  <div class="login-container">
    <Card class="login-card">
      <template #title>
        Join Planning Poker
      </template>
      <template #content>
        <form @submit.prevent="handleSubmit" class="login-form">
          <div class="form-field">
            <label for="username">Your Name</label>
            <InputText 
              id="username" 
              v-model="username" 
              :class="{ 'p-invalid': submitted && !username }"
              placeholder="Enter your name to join"
              aria-describedby="username-error"
            />
            <small id="username-error" class="p-error" v-if="submitted && !username">
              Please enter your name
            </small>
          </div>

          <div class="form-actions">
            <Button 
              type="submit" 
              label="Join" 
              icon="pi pi-user"
              :loading="loading"
              class="p-button-lg"
            />
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const username = ref('');
const loading = ref(false);
const submitted = ref(false);

async function handleSubmit() {
  submitted.value = true;
  if (!username.value) return;

  loading.value = true;
  try {
    authStore.login(username.value);
    router.push('/dashboard');
    
    toast.add({
      severity: 'success',
      summary: 'Welcome!',
      detail: `You've joined as ${username.value}`,
      life: 3000
    });
  } catch (error) {
    toast.add({
      severity: 'error',
      summary: 'Error',
      detail: error,
      life: 5000
    });
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--surface-ground);
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field :deep(.p-inputtext) {
  width: 100%;
}

.form-actions {
  display: flex;
  justify-content: center;
  margin-top: 1rem;
}
</style>
