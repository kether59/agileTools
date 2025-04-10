import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useSocketStore = defineStore('socket', () => {
  const connectedUsers = ref([]);

  function addUser(username) {
    if (!connectedUsers.value.includes(username)) {
      connectedUsers.value.push(username);
    }
  }

  function removeUser(username) {
    const index = connectedUsers.value.indexOf(username);
    if (index > -1) {
      connectedUsers.value.splice(index, 1);
    }
  }

  function setUsers(users) {
    connectedUsers.value = users;
  }

  return {
    connectedUsers,
    addUser,
    removeUser,
    setUsers
  };
});
