<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import type { LoginForm } from '../types';

const router = useRouter();
const authStore = useAuthStore();

const form = reactive<LoginForm>({
  username: '',
  password: '',
  rememberMe: false,
});

const errors = reactive({
  username: '',
  password: '',
  general: '',
});

const showPassword = ref(false);
const loading = ref(false);

onMounted(() => {
  const remembered = localStorage.getItem('rememberMe');
  if (remembered) {
    form.username = remembered;
    form.rememberMe = true;
  }
  const usernameInput = document.querySelector('#username') as HTMLInputElement;
  usernameInput?.focus();
});

function validate(): boolean {
  let valid = true;
  errors.username = '';
  errors.password = '';
  errors.general = '';

  if (!form.username.trim()) {
    errors.username = '请输入登录账号';
    valid = false;
  }
  if (!form.password) {
    errors.password = '请输入登录密码';
    valid = false;
  }
  return valid;
}

async function handleLogin() {
  if (!validate()) return;
  
  loading.value = true;
  errors.general = '';

  setTimeout(() => {
    const success = authStore.login({ ...form });
    loading.value = false;
    
    if (success) {
      router.push('/');
    } else {
      errors.general = '账号或密码错误';
    }
  }, 300);
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') {
    if (!form.username) {
      const pwdInput = document.querySelector('#password') as HTMLInputElement;
      pwdInput?.focus();
    } else if (!form.password) {
      handleLogin();
    } else {
      handleLogin();
    }
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1 class="login-title">项目管理系统</h1>
      <div class="login-divider"></div>

      <div v-if="errors.general" class="error-banner">
        {{ errors.general }}
      </div>

      <form @submit.prevent="handleLogin">
        <div class="input-group">
          <label class="input-label">登录账号</label>
          <input
            id="username"
            v-model="form.username"
            type="text"
            class="input"
            :class="{ 'input-error': errors.username }"
            placeholder="请输入登录账号"
            @keydown="handleKeydown"
          />
          <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
        </div>

        <div class="input-group mt-4">
          <label class="input-label">登录密码</label>
          <div class="password-input-wrap">
            <input
              id="password"
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input-error': errors.password }"
              placeholder="请输入登录密码"
              @keydown="handleKeydown"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showPassword = !showPassword"
            >
              {{ showPassword ? '👁' : '👁' }}
            </button>
          </div>
          <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
        </div>

        <label class="checkbox mt-4">
          <input v-model="form.rememberMe" type="checkbox" />
          <span>记住我</span>
        </label>

        <button
          type="submit"
          class="btn btn-primary login-btn"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登 录' }}
        </button>
      </form>

      <div class="login-hint">
        默认账号: admin / admin123
      </div>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--carbon-dark);
}

.login-card {
  width: 400px;
  background: var(--pure-white);
  border-radius: 12px;
  padding: 40px;
}

.login-title {
  font-size: 28px;
  font-weight: 500;
  color: var(--carbon-dark);
  text-align: center;
  margin: 0;
}

.login-divider {
  height: 1px;
  background: var(--cloud-gray);
  margin: 24px 0;
}

.error-banner {
  background: rgba(231, 76, 60, 0.15);
  color: var(--error);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  font-size: 14px;
}

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 12px;
  color: var(--pewter);
}

.input {
  width: 100%;
}

.password-input-wrap {
  position: relative;
}

.password-toggle {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
}

.error-text {
  color: var(--error);
  font-size: 12px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 14px;
  color: var(--graphite);
}

.login-btn {
  width: 100%;
  height: 40px;
  margin-top: 24px;
  font-size: 14px;
  font-weight: 500;
}

.login-hint {
  text-align: center;
  margin-top: 24px;
  font-size: 12px;
  color: var(--silver-fog);
}
</style>