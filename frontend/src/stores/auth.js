import { defineStore } from 'pinia';
import { ref } from 'vue';
import Cookies from 'js-cookie';

export const useAuthStore = defineStore('auth', () => {
  const username = ref(Cookies.get('username') || '');
  const isAuthenticated = ref(!!username.value);
  const currentRoom = ref(Cookies.get('currentRoom') || null);

  function login(name) {
    username.value = name;
    Cookies.set('username', name, { expires: 7 });
    isAuthenticated.value = true;
  }

  function logout() {
    username.value = '';
    currentRoom.value = null;
    Cookies.remove('username');
    Cookies.remove('currentRoom');
    isAuthenticated.value = false;
  }

  function setCurrentRoom(roomId) {
    currentRoom.value = roomId;
    Cookies.set('currentRoom', roomId, { expires: 7 });
  }

  function clearCurrentRoom() {
    currentRoom.value = null;
    Cookies.remove('currentRoom');
  }

  return {
    username,
    isAuthenticated,
    currentRoom,
    login,
    logout,
    setCurrentRoom,
    clearCurrentRoom
  };
});
