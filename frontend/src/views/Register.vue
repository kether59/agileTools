<template>
  <div class="register-container">
    <Card class="register-card">
      <template #title>
        Create an Account
      </template>
      <template #content>
        <form @submit.prevent="handleSubmit" class="register-form">
          <div class="form-field">
            <label for="username">Username</label>
            <InputText 
              id="username" 
              v-model="username" 
              :class="{ 'p-invalid': v$.username.$invalid && v$.username.$dirty }"
              aria-describedby="username-error"
            />
            <small id="username-error" class="p-error" v-if="v$.username.$error">
              {{ v$.username.$errors[0].$message }}
            </small>
          </div>

          <div class="form-field">
            <label for="email">Email</label>
            <InputText 
              id="email" 
              v-model="email" 
              type="email"
              :class="{ 'p-invalid': v$.email.$invalid && v$.email.$dirty }"
              aria-describedby="email-error"
            />
            <small id="email-error" class="p-error" v-if="v$.email.$error">
              {{ v$.email.$errors[0].$message }}
            </small>
          </div>

          <div class="form-field">
            <label for="password">Password</label>
            <Password 
              id="password" 
              v-model="password"
              :class="{ 'p-invalid': v$.password.$invalid && v$.password.$dirty }"
              :feedback="true"
              toggleMask
            />
            <small class="p-error" v-if="v$.password.$error">
              {{ v$.password.$errors[0].$message }}
            </small>
          </div>

          <div class="form-field">
            <label for="confirmPassword">Confirm Password</label>
            <Password 
              id="confirmPassword" 
              v-model="confirmPassword"
              :class="{ 'p-invalid': v$.confirmPassword.$invalid && v$.confirmPassword.$dirty }"
              :feedback="false"
              toggleMask
            />
            <small class="p-error" v-if="v$.confirmPassword.$error">
              {{ v$.confirmPassword.$errors[0].$message }}
            </small>
          </div>

          <div class="form-actions">
            <Button 
              type="submit" 
              label="Register" 
              :loading="loading"
            />
            <router-link to="/login" class="login-link">
              Already have an account? Login here
            </router-link>
          </div>
        </form>
      </template>
    </Card>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useVuelidate } from '@vuelidate/core';
import { required, email, minLength, sameAs } from '@vuelidate/validators';
import { useAuthStore } from '../stores/auth';
import { useToast } from 'primevue/usetoast';

const router = useRouter();
const authStore = useAuthStore();
const toast = useToast();

const username = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');
const loading = ref(false);

const rules = {
  username: { required, minLength: minLength(3) },
  email: { required, email },
  password: { required, minLength: minLength(6) },
  confirmPassword: { required, sameAs: sameAs(password) }
};

const v$ = useVuelidate(rules, { username, email, password, confirmPassword });

async function handleSubmit() {
  loading.value = true;
  
  try {
    const isValid = await v$.value.$validate();
    if (!isValid) return;

    await authStore.register(username.value, email.value, password.value);
    router.push('/dashboard');
    
    toast.add({
      severity: 'success',
      summary: 'Success',
      detail: 'Account created successfully!',
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
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 2rem;
  background: var(--surface-ground);
}

.register-card {
  width: 100%;
  max-width: 450px;
}

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-field :deep(.p-password),
.form-field :deep(.p-inputtext) {
  width: 100%;
}

.form-actions {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: center;
  margin-top: 1rem;
}

.login-link {
  color: var(--primary-color);
  text-decoration: none;
  font-size: 0.9rem;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
