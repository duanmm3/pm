<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useAuthStore } from '../stores/auth';
import { useRouter } from 'vue-router';

const emit = defineEmits(['close']);
const router = useRouter();
const authStore = useAuthStore();

const form = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const errors = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
});

const showOldPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const successMsg = ref('');

function validate(): boolean {
  let valid = true;
  errors.oldPassword = '';
  errors.newPassword = '';
  errors.confirmPassword = '';

  if (!form.oldPassword) {
    errors.oldPassword = '请输入旧密码';
    valid = false;
  }
  if (!form.newPassword) {
    errors.newPassword = '请输入新密码';
    valid = false;
  } else if (form.newPassword.length < 6) {
    errors.newPassword = '新密码至少6位';
    valid = false;
  }
  if (!form.confirmPassword) {
    errors.confirmPassword = '请确认新密码';
    valid = false;
  } else if (form.confirmPassword !== form.newPassword) {
    errors.confirmPassword = '两次密码输入不一致';
    valid = false;
  }
  return valid;
}

async function handleSubmit() {
  if (!validate()) return;

  loading.value = true;
  const success = authStore.changePassword(form.oldPassword, form.newPassword);
  loading.value = false;

  if (success) {
    successMsg.value = '密码修改成功';
    setTimeout(() => {
      authStore.logout();
      router.push('/login');
    }, 1500);
  } else {
    errors.oldPassword = '旧密码错误';
  }
}
</script>

<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal-content">
      <div class="modal-header">
        <h3 class="modal-title">修改密码</h3>
        <button class="btn-icon" @click="$emit('close')">✕</button>
      </div>

      <div v-if="successMsg" class="success-banner">
        {{ successMsg }}
      </div>

      <form @submit.prevent="handleSubmit">
        <div class="input-group">
          <label class="input-label">旧密码</label>
          <div class="password-input-wrap">
            <input
              v-model="form.oldPassword"
              :type="showOldPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input-error': errors.oldPassword }"
              placeholder="请输入旧密码"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showOldPassword = !showOldPassword"
            >
              {{ showOldPassword ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="errors.oldPassword" class="error-text">{{ errors.oldPassword }}</span>
        </div>

        <div class="input-group mt-4">
          <label class="input-label">新密码</label>
          <div class="password-input-wrap">
            <input
              v-model="form.newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input-error': errors.newPassword }"
              placeholder="至少6位"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showNewPassword = !showNewPassword"
            >
              {{ showNewPassword ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</span>
        </div>

        <div class="input-group mt-4">
          <label class="input-label">确认新密码</label>
          <div class="password-input-wrap">
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              class="input"
              :class="{ 'input-error': errors.confirmPassword }"
              placeholder="请再次输入新密码"
            />
            <button
              type="button"
              class="password-toggle"
              @click="showConfirmPassword = !showConfirmPassword"
            >
              {{ showConfirmPassword ? '🙈' : '👁' }}
            </button>
          </div>
          <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
        </div>

        <button type="submit" class="btn btn-primary mt-4" style="width: 100%" :disabled="loading">
          {{ loading ? '提交中...' : '确认修改' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(128, 128, 128, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-content {
  background: var(--pure-white);
  border-radius: 4px;
  padding: 24px;
  width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0;
}

.success-banner {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
  padding: 12px;
  border-radius: 4px;
  margin-bottom: 16px;
  text-align: center;
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

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--pewter);
}
</style>