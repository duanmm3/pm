<script setup lang="ts">
import { ref, computed, reactive, watch } from 'vue';
import Navbar from '../components/Navbar.vue';
import { useAuthStore } from '../stores/auth';
import type { User, UserFormData } from '../types';

const authStore = useAuthStore();

const search = ref('');
const page = ref(1);
const pageSize = 10;

const showAddModal = ref(false);
const showEditModal = ref(false);
const showDetailModal = ref(false);
const showDeleteConfirm = ref(false);

const editingUser = ref<User | null>(null);
const deletingUserId = ref<number | null>(null);

const form = reactive<UserFormData>({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  department: '',
  phone: '',
  email: '',
  status: '启用',
});

const errors = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  realName: '',
  department: '',
});

const showPassword = ref(false);
const showConfirmPassword = ref(false);

let searchTimeout: number | null = null;
watch(search, () => {
  if (searchTimeout) clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    page.value = 1;
  }, 300);
});

const filteredUsers = computed(() => {
  let list = authStore.users;
  if (search.value.trim()) {
    const s = search.value.toLowerCase();
    list = list.filter(u => 
      u.username.toLowerCase().includes(s) || 
      u.realName.toLowerCase().includes(s)
    );
  }
  return list;
});

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * pageSize;
  return filteredUsers.value.slice(start, start + pageSize);
});

const totalItems = computed(() => filteredUsers.value.length);
const totalPages = computed(() => Math.ceil(totalItems.value / pageSize));

function maskPhone(phone?: string): string {
  if (!phone) return '-';
  return phone.slice(0, 3) + '****' + phone.slice(7);
}

function validate(isEdit: boolean = false): boolean {
  errors.username = '';
  errors.password = '';
  errors.confirmPassword = '';
  errors.realName = '';
  errors.department = '';
  
  let valid = true;
  
  if (!form.username.trim()) {
    errors.username = '请输入登录账号';
    valid = false;
  } else if (!isEdit && authStore.users.some(u => u.username === form.username)) {
    errors.username = '登录账号已存在';
    valid = false;
  }
  
  if (!isEdit && !form.password) {
    errors.password = '请输入密码';
    valid = false;
  }
  
  if (form.password && !isEdit) {
    if (form.password.length < 6) {
      errors.password = '密码至少6位';
      valid = false;
    }
  }
  
  if (form.password || form.confirmPassword) {
    if (form.confirmPassword !== form.password) {
      errors.confirmPassword = '两次密码输入不一致';
      valid = false;
    }
  }
  
  if (!form.realName.trim()) {
    errors.realName = '请输入真实姓名';
    valid = false;
  }
  
  if (!form.department.trim()) {
    errors.department = '请输入所属部门';
    valid = false;
  }
  
  return valid;
}

function handleAdd() {
  form.username = '';
  form.password = '';
  form.confirmPassword = '';
  form.realName = '';
  form.department = '';
  form.phone = '';
  form.email = '';
  form.status = '启用';
  showAddModal.value = true;
}

function handleEdit(user: User) {
  editingUser.value = user;
  form.username = user.username;
  form.password = '';
  form.confirmPassword = '';
  form.realName = user.realName;
  form.department = user.department;
  form.phone = user.phone || '';
  form.email = user.email || '';
  form.status = user.status;
  showEditModal.value = true;
}

function handleDetail(user: User) {
  editingUser.value = user;
  showDetailModal.value = true;
}

function handleDelete(id: number) {
  const user = authStore.users.find(u => u.id === id);
  if (user?.username === 'admin') {
    alert('系统管理员账号不允许删除');
    return;
  }
  deletingUserId.value = id;
  showDeleteConfirm.value = true;
}

function submitAdd() {
  if (!validate(false)) return;
  
  authStore.addUser({
    username: form.username,
    password: form.password || '',
    realName: form.realName,
    department: form.department,
    phone: form.phone || undefined,
    email: form.email || undefined,
    status: form.status,
  });
  
  showAddModal.value = false;
  page.value = 1;
}

function submitEdit() {
  if (!editingUser.value) return;
  
  const updateData: Partial<User> = {
    realName: form.realName,
    department: form.department,
    phone: form.phone || undefined,
    email: form.email || undefined,
    status: form.status,
  };
  
  if (form.password) {
    (updateData as any).password = form.password;
  }
  
  authStore.updateUser(editingUser.value.id, updateData);
  showEditModal.value = false;
}

function confirmDelete() {
  if (deletingUserId.value) {
    authStore.deleteUser(deletingUserId.value);
  }
  showDeleteConfirm.value = false;
  deletingUserId.value = null;
}
</script>

<template>
  <div class="users-page">
    <Navbar />
    
    <main class="main-content">
      <div class="page-header">
        <h2 class="page-title">用户管理</h2>
        <div class="header-actions">
          <input
            v-model="search"
            type="text"
            class="input search-input"
            placeholder="请输入账号或姓名搜索..."
          />
          <button class="btn btn-primary" @click="handleAdd" style="min-width: 70px; white-space: nowrap;">+新增</button>
        </div>
      </div>

      <div class="card">
        <table class="table">
          <thead>
            <tr>
              <th>序号</th>
              <th>登录账号</th>
              <th>真实姓名</th>
              <th>部门</th>
              <th>手机号</th>
              <th>状态</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(user, idx) in paginatedUsers" :key="user.id">
              <td>{{ (page - 1) * pageSize + idx + 1 }}</td>
              <td>{{ user.username }}</td>
              <td>{{ user.realName }}</td>
              <td>{{ user.department }}</td>
              <td>{{ maskPhone(user.phone) }}</td>
              <td>
                <span
                  class="status-tag"
                  :class="user.status === '启用' ? 'status-tag-success' : 'status-tag-error'"
                >
                  {{ user.status }}
                </span>
              </td>
              <td>
                <button class="btn-icon" title="查看" @click="handleDetail(user)">👁</button>
                <button class="btn-icon" title="编辑" @click="handleEdit(user)">✏</button>
                <button 
                  class="btn-icon" 
                  title="删除" 
                  @click="handleDelete(user.id)"
                  :disabled="user.username === 'admin'"
                >🗑</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div class="pagination">
          <div class="pagination-info">
            显示 {{ (page - 1) * pageSize + 1 }}-{{ Math.min(page * pageSize, totalItems) }} / 共 {{ totalItems }} 条
          </div>
          <div class="pagination-buttons">
            <button
              class="page-btn"
              :disabled="page === 1"
              @click="page--"
            >
              &lt;
            </button>
            <button
              v-for="p in totalPages"
              :key="p"
              class="page-btn"
              :class="{ active: page === p }"
              @click="page = p"
            >
              {{ p }}
            </button>
            <button
              class="page-btn"
              :disabled="page >= totalPages"
              @click="page++"
            >
              &gt;
            </button>
          </div>
        </div>
      </div>

      <!-- 新增用户模态框 -->
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">新增</h3>
            <button class="btn-icon" @click="showAddModal = false">✕</button>
          </div>
          
          <form @submit.prevent="submitAdd">
            <div class="input-group">
              <label class="input-label">登录账号 *</label>
              <input
                v-model="form.username"
                class="input"
                :class="{ 'input-error': errors.username }"
                placeholder="请输入登录账号"
              />
              <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">登录密码 *</label>
              <div class="password-input-wrap">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input"
                  :class="{ 'input-error': errors.password }"
                  placeholder="请输入密码"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
              <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">确认密码 *</label>
              <div class="password-input-wrap">
                <input
                  v-model="form.confirmPassword"
                  :type="showConfirmPassword ? 'text' : 'password'"
                  class="input"
                  :class="{ 'input-error': errors.confirmPassword }"
                  placeholder="请再次输入密码"
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

            <div class="input-group mt-4">
              <label class="input-label">真实姓名 *</label>
              <input
                v-model="form.realName"
                class="input"
                :class="{ 'input-error': errors.realName }"
                placeholder="请输入真实姓名"
              />
              <span v-if="errors.realName" class="error-text">{{ errors.realName }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">所属部门 *</label>
              <input
                v-model="form.department"
                class="input"
                :class="{ 'input-error': errors.department }"
                placeholder="请输入所属部门"
              />
              <span v-if="errors.department" class="error-text">{{ errors.department }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">手机号</label>
              <input
                v-model="form.phone"
                class="input"
                placeholder="请输入手机号"
              />
            </div>

            <div class="input-group mt-4">
              <label class="input-label">邮箱</label>
              <input
                v-model="form.email"
                type="email"
                class="input"
                placeholder="请输入邮箱"
              />
            </div>

            <div class="input-group mt-4">
              <label class="input-label">账号状态</label>
              <div class="status-radio">
                <label class="radio-item">
                  <input type="radio" v-model="form.status" value="启用" />
                  <span>启用</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="form.status" value="禁用" />
                  <span>禁用</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary mt-4" style="width: 100%">
              新增用户
            </button>
          </form>
        </div>
      </div>

      <!-- 编辑用户模态框 -->
      <div v-if="showEditModal" class="modal-overlay" @click.self="showEditModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">编辑用户</h3>
            <button class="btn-icon" @click="showEditModal = false">✕</button>
          </div>
          
          <form @submit.prevent="submitEdit">
            <div class="input-group">
              <label class="input-label">登录账号</label>
              <input
                :value="form.username"
                class="input"
                disabled
              />
            </div>

            <div class="input-group mt-4">
              <label class="input-label">登录密码 <span class="hint">(不修改请留空)</span></label>
              <div class="password-input-wrap">
                <input
                  v-model="form.password"
                  :type="showPassword ? 'text' : 'password'"
                  class="input"
                  placeholder="不修改请留空"
                />
                <button
                  type="button"
                  class="password-toggle"
                  @click="showPassword = !showPassword"
                >
                  {{ showPassword ? '🙈' : '👁' }}
                </button>
              </div>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">真实姓名 *</label>
              <input
                v-model="form.realName"
                class="input"
                :class="{ 'input-error': errors.realName }"
                placeholder="请输入真实姓名"
              />
              <span v-if="errors.realName" class="error-text">{{ errors.realName }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">所属部门 *</label>
              <input
                v-model="form.department"
                class="input"
                :class="{ 'input-error': errors.department }"
                placeholder="请输入所属部门"
              />
              <span v-if="errors.department" class="error-text">{{ errors.department }}</span>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">手机号</label>
              <input
                v-model="form.phone"
                class="input"
                placeholder="请输入手机号"
              />
            </div>

            <div class="input-group mt-4">
              <label class="input-label">邮箱</label>
              <input
                v-model="form.email"
                type="email"
                class="input"
                placeholder="请输入邮箱"
              />
            </div>

            <div class="input-group mt-4">
              <label class="input-label">账号状态</label>
              <div class="status-radio">
                <label class="radio-item">
                  <input type="radio" v-model="form.status" value="启用" />
                  <span>启用</span>
                </label>
                <label class="radio-item">
                  <input type="radio" v-model="form.status" value="禁用" />
                  <span>禁用</span>
                </label>
              </div>
            </div>

            <button type="submit" class="btn btn-primary mt-4" style="width: 100%">
              保存修改
            </button>
          </form>
        </div>
      </div>

      <!-- 查看用户���情���态框 -->
      <div v-if="showDetailModal" class="modal-overlay" @click.self="showDetailModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">用户详情</h3>
            <button class="btn-icon" @click="showDetailModal = false">✕</button>
          </div>
          
          <div v-if="editingUser" class="detail-info">
            <div class="detail-item">
              <span class="detail-label">登录账号</span>
              <span class="detail-value">{{ editingUser.username }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">登录密码</span>
              <span class="detail-value">******</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">真实姓名</span>
              <span class="detail-value">{{ editingUser.realName }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">所属部门</span>
              <span class="detail-value">{{ editingUser.department }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">手机号</span>
              <span class="detail-value">{{ editingUser.phone || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">邮箱</span>
              <span class="detail-value">{{ editingUser.email || '-' }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">账号状态</span>
              <span
                class="status-tag"
                :class="editingUser.status === '启用' ? 'status-tag-success' : 'status-tag-error'"
              >
                {{ editingUser.status }}
              </span>
            </div>
          </div>
          
          <button class="btn btn-secondary mt-4" style="width: 100%" @click="showDetailModal = false">
            关闭
          </button>
        </div>
      </div>

      <!-- 删除确认对话框 -->
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content confirm-modal">
          <div class="modal-header">
            <h3 class="modal-title">确认删除</h3>
          </div>
          <p class="confirm-text">确定要删除此用户吗？此操作无法撤销。</p>
          <div class="confirm-actions">
            <button class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
            <button class="btn btn-primary" @click="confirmDelete">确认删除</button>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.users-page {
  min-height: 100vh;
  background: var(--light-ash);
}

.main-content {
  padding: 80px 24px 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: nowrap;
  gap: 16px;
}

.page-title {
  font-size: 28px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
  align-items: center;
}

.search-input {
  width: 240px;
  flex-shrink: 0;
}

.card {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
}

.table {
  width: 100%;
  border-collapse: collapse;
}

.table th,
.table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid var(--cloud-gray);
}

.table th {
  font-weight: 500;
  color: var(--pewter);
  font-size: 12px;
}

.table tr:hover {
  background: var(--light-ash);
}

.status-tag {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag-success {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.status-tag-error {
  background: rgba(231, 76, 60, 0.15);
  color: var(--error);
}

.btn-icon {
  width: 32px;
  height: 32px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
}

.btn-icon:hover:not(:disabled) {
  background: var(--light-ash);
}

.btn-icon:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
}

.pagination-info {
  color: var(--pewter);
  font-size: 12px;
}

.pagination-buttons {
  display: flex;
  gap: 4px;
}

.page-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--cloud-gray);
  background: var(--pure-white);
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
}

.page-btn.active {
  background: var(--electric-blue);
  color: var(--pure-white);
  border-color: var(--electric-blue);
}

.page-btn:hover:not(.active):not(:disabled) {
  background: var(--light-ash);
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.input-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.input-label {
  font-size: 12px;
  color: var(--pewter);
}

.input-label .hint {
  color: var(--silver-fog);
  font-size: 11px;
}

.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--pale-silver);
  border-radius: 4px;
  font-size: 14px;
  outline: none;
}

.input:focus {
  border-color: var(--electric-blue);
}

.input:disabled {
  background: var(--light-ash);
  color: var(--pewter);
}

.input-error {
  border-color: var(--error);
}

.error-text {
  color: var(--error);
  font-size: 12px;
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

.status-radio {
  display: flex;
  gap: 16px;
}

.radio-item {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
}

.detail-info {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  padding: 8px 0;
  border-bottom: 1px solid var(--cloud-gray);
}

.detail-label {
  font-size: 14px;
  color: var(--pewter);
}

.detail-value {
  font-size: 14px;
  color: var(--graphite);
}

.confirm-modal {
  width: 350px;
  text-align: center;
}

.confirm-text {
  font-size: 14px;
  color: var(--graphite);
  margin-bottom: 20px;
}

.confirm-actions {
  display: flex;
  gap: 12px;
}

.confirm-actions .btn {
  flex: 1;
}

.mt-4 {
  margin-top: 16px;
}
</style>