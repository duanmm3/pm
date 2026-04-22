<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

const showDropdown = ref(false);
const showPasswordModal = ref(false);

const currentUser = computed(() => authStore.currentUser);
const userInitial = computed(() => currentUser.value?.realName?.[0] || 'U');

const navItems = [
  { name: '首页', path: '/' },
  { name: '项目', path: '/department' },
  { name: '用户', path: '/users' },
];

const isActive = (path: string) => {
  if (path === '/') return route.path === '/';
  return route.path.startsWith(path);
};

function handleLogout() {
  authStore.logout();
  router.push('/login');
}

function toggleDropdown() {
  showDropdown.value = !showDropdown.value;
}

function closeDropdown(e: MouseEvent) {
  const target = e.target as HTMLElement;
  if (!target.closest('.user-dropdown')) {
    showDropdown.value = false;
  }
}
</script>

<template>
  <nav class="navbar" @click="closeDropdown">
    <div class="nav-left">
      <router-link to="/" class="nav-logo">项目管理系统</router-link>
      <div class="nav-links">
        <router-link
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="nav-link"
          :class="{ active: isActive(item.path) }"
        >
          {{ item.name }}
        </router-link>
      </div>
    </div>

    <div class="nav-right">
      <div class="user-dropdown" @click.stop="toggleDropdown">
        <div class="user-avatar">{{ userInitial }}</div>
        <span class="user-name">{{ currentUser?.realName }}</span>
        <span class="dropdown-arrow">▼</span>
        
        <div v-if="showDropdown" class="dropdown-menu">
          <div class="dropdown-user-info">
            {{ currentUser?.realName }}（{{ currentUser?.department }}）
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="showPasswordModal = true">
            修改密码
          </div>
          <div class="dropdown-divider"></div>
          <div class="dropdown-item" @click="handleLogout">
            退出登录
          </div>
        </div>
      </div>
    </div>

    <ChangePasswordModal v-if="showPasswordModal" @close="showPasswordModal = false" />
  </nav>
</template>

<style scoped>
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 56px;
  background: var(--pure-white);
  border-bottom: 1px solid var(--cloud-gray);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  z-index: 100;
  backdrop-filter: blur(8px);
}

.nav-left {
  display: flex;
  align-items: center;
  gap: 32px;
}

.nav-logo {
  font-size: 17px;
  font-weight: 500;
  color: var(--carbon-dark);
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 8px;
}

.nav-link {
  height: 32px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  color: var(--graphite);
  text-decoration: none;
  border-radius: 4px;
  font-size: 14px;
  font-weight: 500;
  transition: background 0.2s;
}

.nav-link:hover {
  background: var(--light-ash);
}

.nav-link.active {
  color: var(--electric-blue);
}

.nav-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.user-dropdown {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 4px;
}

.user-dropdown:hover {
  background: var(--light-ash);
}

.user-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--light-ash);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  color: var(--pewter);
}

.user-name {
  font-size: 14px;
  color: var(--graphite);
}

.dropdown-arrow {
  font-size: 10px;
  color: var(--pewter);
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  right: 0;
  margin-top: 4px;
  background: var(--pure-white);
  border: 1px solid var(--cloud-gray);
  border-radius: 4px;
  min-width: 180px;
  z-index: 200;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.dropdown-user-info {
  padding: 12px 16px;
  color: var(--pewter);
  font-size: 12px;
}

.dropdown-divider {
  height: 1px;
  background: var(--cloud-gray);
}

.dropdown-item {
  padding: 10px 16px;
  cursor: pointer;
  font-size: 14px;
  color: var(--graphite);
}

.dropdown-item:hover {
  background: var(--light-ash);
}
</style>