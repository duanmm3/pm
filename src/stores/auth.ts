import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { User, LoginForm } from '../types';
import { mockUsers } from '../utils/mockData';

export const useAuthStore = defineStore('auth', () => {
  const currentUser = ref<User | null>(null);
  const users = ref<User[]>([...mockUsers]);

  const isLoggedIn = computed(() => !!currentUser.value);

  function login(form: LoginForm): boolean {
    const user = users.value.find(
      u => u.username === form.username && u.password === form.password
    );
    if (!user) return false;
    if (user.status === '禁用') return false;
    currentUser.value = { ...user };
    if (form.rememberMe) {
      localStorage.setItem('rememberMe', user.username);
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    return true;
  }

  function logout() {
    currentUser.value = null;
    localStorage.removeItem('currentUser');
  }

  function checkAuth() {
    const saved = localStorage.getItem('currentUser');
    if (saved) {
      currentUser.value = JSON.parse(saved);
    }
  }

  function changePassword(oldPwd: string, newPwd: string): boolean {
    if (!currentUser.value) return false;
    if (currentUser.value.password !== oldPwd) return false;
    const idx = users.value.findIndex(u => u.id === currentUser.value!.id);
    if (idx === -1) return false;
    users.value[idx].password = newPwd;
    currentUser.value.password = newPwd;
    localStorage.setItem('currentUser', JSON.stringify(currentUser.value));
    return true;
  }

  function addUser(user: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) {
    const newUser: User = {
      ...user,
      id: Date.now(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    users.value.unshift(newUser);
    return newUser;
  }

  function updateUser(id: number, data: Partial<User>) {
    const idx = users.value.findIndex(u => u.id === id);
    if (idx !== -1) {
      users.value[idx] = { ...users.value[idx], ...data, updatedAt: new Date() };
      return users.value[idx];
    }
    return null;
  }

  function deleteUser(id: number): boolean {
    const idx = users.value.findIndex(u => u.id === id);
    if (idx !== -1) {
      users.value.splice(idx, 1);
      return true;
    }
    return false;
  }

  return {
    currentUser,
    users,
    isLoggedIn,
    login,
    logout,
    checkAuth,
    changePassword,
    addUser,
    updateUser,
    deleteUser,
  };
});