import { createApp } from 'vue';
import { createPinia } from 'pinia';
import PrimeVue from 'primevue/config';
import ToastService from 'primevue/toastservice';
import Button from 'primevue/button';
import Card from 'primevue/card';
import InputText from 'primevue/inputtext';
import Dialog from 'primevue/dialog';
import Password from 'primevue/password';
import App from './App.vue';
import router from './router';

// PrimeVue styles
import 'primevue/resources/themes/lara-light-blue/theme.css';
import 'primevue/resources/primevue.min.css';
import 'primeicons/primeicons.css';
import './assets/main.css';

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.use(router);
app.use(PrimeVue, {
  ripple: true,
  inputStyle: 'filled'
});
app.use(ToastService);

// Register PrimeVue components
app.component('Button', Button);
app.component('Card', Card);
app.component('InputText', InputText);
app.component('Password', Password);
app.component('Dialog', Dialog);

app.mount('#app');
