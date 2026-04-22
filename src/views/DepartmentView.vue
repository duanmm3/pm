<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import { useProjectStore } from '../stores/project';
import type { ProjectFormData } from '../types';

const router = useRouter();
const projectStore = useProjectStore();

const filters = reactive({
  department: '',
  status: '',
});

const showAddModal = ref(false);
const showAddNodeModal = ref(false);
const selectedProjectId = ref<number | null>(null);

const newProject = reactive<ProjectFormData>({
  name: '',
  capacity: null,
  investmentType: '自投',
  department: '',
  manager: '',
});

const newNode = reactive({
  nodeName: '',
  plannedStart: '',
  plannedEnd: '',
  actualComplete: '',
  supportMaterial: '',
  progressStatus: '未开始' as '已完成' | '进行中' | '未开始',
  tab: '前期' as '前期' | '建设期' | '并网期',
  group: '项目端',
  responsible: '',
  progress: 10,
  fileUrl: '',
});

const errors = reactive({
  name: '',
  department: '',
  manager: '',
});

const departments = computed(() => {
  const depts = new Set(projectStore.projects.map(p => p.department));
  return ['', ...Array.from(depts)];
});

const statusOptions = ['', '正常', '暂停', '待定', '终止'];

const filteredProjects = computed(() => {
  let list = projectStore.projects;
  if (filters.department) {
    list = list.filter(p => p.department === filters.department);
  }
  if (filters.status) {
    list = list.filter(p => p.status === filters.status);
  }
  return list;
});

const sortedProjectsByProgress = computed(() => {
  return [...filteredProjects.value].sort((a, b) => b.totalProgress - a.totalProgress);
});

function formatDate(date: any): string {
  if (!date) return '/';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

function formatProgress(val: number): string {
  return (val * 100).toFixed(0) + '%';
}

function goToProject(id: number) {
  router.push(`/project/${id}`);
}

function handleDelete(id: number) {
  if (confirm('确定要删除此项目吗？')) {
    projectStore.deleteProject(id);
  }
}

function validateProject(): boolean {
  errors.name = '';
  errors.department = '';
  errors.manager = '';
  let valid = true;
  
  if (!newProject.name.trim()) {
    errors.name = '请输入项目名称';
    valid = false;
  }
  if (!newProject.department.trim()) {
    errors.department = '请输入负责部门';
    valid = false;
  }
  if (!newProject.manager.trim()) {
    errors.manager = '请输入负责人';
    valid = false;
  }
  return valid;
}

function handleAddProject() {
  if (!validateProject()) return;
  
  projectStore.addProject({ ...newProject });
  showAddModal.value = false;
  resetProjectForm();
}

function resetProjectForm() {
  newProject.name = '';
  newProject.capacity = null;
  newProject.investmentType = '自投';
  newProject.department = '';
  newProject.manager = '';
}

function openAddNodeModal(projectId: number) {
  selectedProjectId.value = projectId;
  resetNodeForm();
  showAddNodeModal.value = true;
}

function resetNodeForm() {
  newNode.nodeName = '';
  newNode.plannedStart = '';
  newNode.plannedEnd = '';
  newNode.actualComplete = '';
  newNode.supportMaterial = '';
  newNode.progressStatus = '未开始';
  newNode.tab = '前期';
  newNode.group = '项目端';
  newNode.responsible = '';
  newNode.progress = 10;
  newNode.fileUrl = '';
}

function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  const fileType = file.type;
  const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
  
  if (!allowedTypes.includes(fileType) && !file.name.match(/\.(pdf|jpg|jpeg|png|gif|doc|docx|xls|xlsx)$/i)) {
    alert('不支持的文件格式，请上传PDF/图片/Office文件');
    return;
  }
  
  newNode.fileUrl = URL.createObjectURL(file);
  newNode.supportMaterial = file.name;
  input.value = '';
}

function downloadFile(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
}

function viewFile(url: string) {
  window.open(url, '_blank');
}

function handleAddNode() {
  if (!selectedProjectId.value || !newNode.nodeName.trim()) return;
  
  let overdueDays = 0;
  if (newNode.plannedEnd && newNode.actualComplete) {
    const planned = new Date(newNode.plannedEnd).getTime();
    const actual = new Date(newNode.actualComplete).getTime();
    overdueDays = Math.ceil((actual - planned) / (1000 * 60 * 60 * 24));
  } else if (newNode.plannedEnd && !newNode.actualComplete) {
    const planned = new Date(newNode.plannedEnd).getTime();
    const now = new Date().getTime();
    overdueDays = Math.ceil((planned - now) / (1000 * 60 * 60 * 24));
  }
  
  projectStore.addNode(selectedProjectId.value, {
    nodeName: newNode.nodeName,
    plannedStart: newNode.plannedStart || null,
    plannedEnd: newNode.plannedEnd || null,
    actualComplete: newNode.actualComplete || null,
    supportMaterial: newNode.supportMaterial,
    progressStatus: newNode.progressStatus,
    overdueDays,
    tab: newNode.tab,
    group: newNode.group,
    responsible: newNode.responsible,
    progress: newNode.progress,
  });
  
  showAddNodeModal.value = false;
  resetNodeForm();
}
</script>

<template>
  <div class="department-page">
    <Navbar />
    
    <main class="main-content">
      <div class="page-header">
        <div class="filters">
          <select v-model="filters.department" class="select">
            <option value="">全部部门</option>
            <option v-for="dept in departments.slice(1)" :key="dept" :value="dept">
              {{ dept }}
            </option>
          </select>
          <select v-model="filters.status" class="select">
            <option value="">全部状态</option>
            <option v-for="status in statusOptions.slice(1)" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </div>
        <button class="btn btn-primary" @click="showAddModal = true">+ 新增项目</button>
      </div>

      <div class="section">
        <h2 class="section-title">项目进度瀑布图</h2>
        <div class="chart-container">
          <div class="bar-chart">
            <div v-for="project in sortedProjectsByProgress" :key="project.id" class="bar-item">
              <div class="bar-label">{{ project.name }}</div>
              <div class="bar-wrapper">
                <div class="bar" :style="{ width: formatProgress(project.totalProgress) }"></div>
              </div>
              <div class="bar-value">{{ formatProgress(project.totalProgress) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th rowspan="2">序号</th>
                <th rowspan="2">部门</th>
                <th rowspan="2">所属项目名称</th>
                <th rowspan="2">容量(MW)</th>
                <th rowspan="2">投资类型</th>
                <th rowspan="2">项目状态</th>
                <th rowspan="2">负责人</th>
                <th rowspan="2">子负责人</th>
                <th colspan="6">项目节点信息</th>
                <th rowspan="2">项目总进度</th>
                <th rowspan="2">操作</th>
              </tr>
              <tr>
                <th>项目节点</th>
                <th>预计开始</th>
                <th>预计结束</th>
                <th>实际完成</th>
                <th>支撑材料</th>
                <th>逾期天数</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="(project, pIdx) in filteredProjects" :key="project.id">
                <tr v-for="(node, nIdx) in project.nodes" :key="`${project.id}-${nIdx}`">
                  <template v-if="nIdx === 0">
                    <td :rowspan="project.nodes.length">{{ pIdx + 1 }}</td>
                    <td :rowspan="project.nodes.length">{{ project.department }}</td>
                    <td :rowspan="project.nodes.length" class="project-name-cell" @click="goToProject(project.id)">{{ project.name }}</td>
                    <td :rowspan="project.nodes.length">{{ project.capacity || '-' }}</td>
                    <td :rowspan="project.nodes.length">{{ project.investmentType }}</td>
                    <td :rowspan="project.nodes.length">
                      <span class="status-tag" :class="{
                        'status-tag-success': project.status === '正常',
                        'status-tag-warning': project.status === '暂停',
                        'status-tag-error': project.status === '终止'
                      }">{{ project.status }}</span>
                    </td>
                    <td :rowspan="project.nodes.length">{{ project.manager }}</td>
                    <td :rowspan="project.nodes.length">{{ project.subManager || '-' }}</td>
                  </template>
                  <td>{{ node.nodeName }}</td>
                  <td>{{ formatDate(node.plannedStart) }}</td>
                  <td>{{ formatDate(node.plannedEnd) }}</td>
                  <td>{{ formatDate(node.actualComplete) }}</td>
                  <td>{{ node.supportMaterial || '-' }}</td>
                  <td :class="{ 'overdue-text': node.overdueDays > 0 }">
                    {{ node.overdueDays > 0 ? node.overdueDays : (node.overdueDays < 0 ? Math.abs(node.overdueDays) + '(提前)' : (node.overdueDays === 0 ? 0 : '-')) }}
                  </td>
                  <template v-if="nIdx === 0">
                    <td :rowspan="project.nodes.length">{{ formatProgress(project.totalProgress) }}</td>
                    <td :rowspan="project.nodes.length">
                      <button class="btn-icon" title="查询" @click="goToProject(project.id)">👁</button>
                      <button class="btn-icon" title="修改" @click="openAddNodeModal(project.id)">✏️</button>
                      <button class="btn-icon" title="删除项目" @click="handleDelete(project.id)">🗑</button>
                    </td>
                  </template>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <div class="pagination">
          <div class="pagination-info">
            共 {{ filteredProjects.length }} 个项目
          </div>
        </div>
      </div>

      <!-- 新增项目模态框 -->
      <div v-if="showAddModal" class="modal-overlay" @click.self="showAddModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">新增项目</h3>
            <button class="btn-icon" @click="showAddModal = false">✕</button>
          </div>
          
          <form @submit.prevent="handleAddProject">
            <div class="input-group">
              <label class="input-label">项目名称 *</label>
              <input v-model="newProject.name" class="input" :class="{ 'input-error': errors.name }" placeholder="请输入项目名称" />
              <span v-if="errors.name" class="error-text">{{ errors.name }}</span>
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">容量(MW)</label>
                <input v-model.number="newProject.capacity" type="number" class="input" placeholder="请输入容量" />
              </div>
              <div class="input-group">
                <label class="input-label">投资类型 *</label>
                <select v-model="newProject.investmentType" class="input">
                  <option value="自投">自投</option>
                  <option value="并购">并购</option>
                  <option value="合资">合资</option>
                  <option value="其他">其他</option>
                </select>
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">负责部门 *</label>
                <input v-model="newProject.department" class="input" :class="{ 'input-error': errors.department }" placeholder="请输入负责部门" />
                <span v-if="errors.department" class="error-text">{{ errors.department }}</span>
              </div>
              <div class="input-group">
                <label class="input-label">负责人 *</label>
                <input v-model="newProject.manager" class="input" :class="{ 'input-error': errors.manager }" placeholder="请输入负责人" />
                <span v-if="errors.manager" class="error-text">{{ errors.manager }}</span>
              </div>
            </div>

            <button type="submit" class="btn btn-primary mt-4" style="width: 100%">新增项目</button>
          </form>
        </div>
      </div>

      <!-- 添加节点模态框 -->
      <div v-if="showAddNodeModal" class="modal-overlay" @click.self="showAddNodeModal = false">
        <div class="modal-content">
          <div class="modal-header">
            <h3 class="modal-title">添加节点</h3>
            <button class="btn-icon" @click="showAddNodeModal = false">✕</button>
          </div>
          
          <form @submit.prevent="handleAddNode">
            <div class="input-group">
              <label class="input-label">任务内容 *</label>
              <input v-model="newNode.nodeName" class="input" placeholder="请输入任务内容" required />
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">所属阶段</label>
                <select v-model="newNode.tab" class="input">
                  <option value="前期">项目前期</option>
                  <option value="建设期">项目建设期</option>
                  <option value="并网期">项目并网期</option>
                </select>
              </div>
              <div class="input-group">
                <label class="input-label">分组</label>
                <select v-model="newNode.group" class="input">
                  <option value="基金端">基金端</option>
                  <option value="项目端">项目端</option>
                  <option value="采购端">采购端</option>
                </select>
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">开始时间</label>
                <input v-model="newNode.plannedStart" type="date" class="input" />
              </div>
              <div class="input-group">
                <label class="input-label">预计完成时间</label>
                <input v-model="newNode.plannedEnd" type="date" class="input" />
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">实际完成时间</label>
                <input v-model="newNode.actualComplete" type="date" class="input" />
              </div>
              <div class="input-group">
                <label class="input-label">进度状态</label>
                <select v-model="newNode.progressStatus" class="input">
                  <option value="未开始">未开始</option>
                  <option value="进行中">进行中</option>
                  <option value="已完成">已完成</option>
                </select>
              </div>
            </div>

            <div class="form-row mt-4">
              <div class="input-group">
                <label class="input-label">负责人</label>
                <input v-model="newNode.responsible" class="input" placeholder="请输入负责人" />
              </div>
              <div class="input-group">
                <label class="input-label">进度 (%)</label>
                <input v-model.number="newNode.progress" type="number" class="input" min="0" max="100" />
              </div>
            </div>

            <div class="input-group mt-4">
              <label class="input-label">支撑材料 (PDF/图片/Office文件)</label>
              <div class="file-upload-box">
                <input type="file" :accept="'.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx'" @change="handleFileUpload" class="file-input" />
                <span class="file-hint">点击或拖拽文件到此处上传</span>
              </div>
              <div v-if="newNode.supportMaterial" class="file-list">
                <div class="file-item">
                  <span class="file-name">{{ newNode.supportMaterial }}</span>
                  <button type="button" class="file-btn" @click="viewFile(newNode.fileUrl)">查看</button>
                  <button type="button" class="file-btn" @click="downloadFile(newNode.fileUrl, newNode.supportMaterial)">下载</button>
                </div>
              </div>
              <input v-model="newNode.supportMaterial" class="input mt-2" placeholder="或输入文件链接" />
            </div>

            <button type="submit" class="btn btn-primary mt-4" style="width: 100%">添加节点</button>
          </form>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.department-page {
  min-height: 100vh;
  background: var(--light-ash);
}

.main-content {
  padding: 80px 24px 24px;
  max-width: 1600px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: nowrap;
}

.filters {
  display: flex;
  gap: 12px;
  flex-wrap: nowrap;
}

.select {
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--pale-silver);
  border-radius: 4px;
  font-size: 14px;
  background: var(--pure-white);
  min-width: 120px;
}

.card {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
  min-width: 1400px;
}

.data-table th,
.data-table td {
  padding: 8px;
  text-align: left;
  border: 1px solid var(--cloud-gray);
}

.data-table th {
  font-weight: 500;
  color: var(--pewter);
  background: var(--light-ash);
}

.data-table tr:hover {
  background: var(--light-ash);
}

.project-name-cell {
  color: var(--electric-blue);
  cursor: pointer;
}

.project-name-cell:hover {
  text-decoration: underline;
}

.overdue-text {
  color: var(--error);
}

.status-tag {
  display: inline-block;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 11px;
}

.status-tag-success {
  background: rgba(76, 175, 80, 0.15);
  color: var(--success);
}

.status-tag-warning {
  background: rgba(255, 152, 0, 0.15);
  color: var(--warning);
}

.status-tag-error {
  background: rgba(231, 76, 60, 0.15);
  color: var(--error);
}

.btn-icon {
  width: 28px;
  height: 28px;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 4px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
}

.btn-icon:hover {
  background: var(--light-ash);
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
  width: 500px;
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

.input {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  border: 1px solid var(--pale-silver);
  border-radius: 4px;
  font-size: 14px;
}

.input:focus {
  border-color: var(--electric-blue);
}

.input-error {
  border-color: var(--error);
}

.error-text {
  color: var(--error);
  font-size: 12px;
}

.form-row {
  display: flex;
  gap: 16px;
}

.form-row > * {
  flex: 1;
}

.mt-4 {
  margin-top: 16px;
}

.section {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 16px;
}

.section-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0 0 16px;
}

.chart-container {
  padding: 16px 0;
}

.bar-chart {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.bar-label {
  width: 120px;
  font-size: 13px;
  color: var(--graphite);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bar-wrapper {
  flex: 1;
  height: 24px;
  background: var(--cloud-gray);
  border-radius: 4px;
  overflow: hidden;
}

.bar {
  height: 100%;
  background: var(--electric-blue);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.bar-value {
  width: 50px;
  font-size: 13px;
  color: var(--graphite);
  text-align: right;
}

.file-upload-box {
  border: 2px dashed var(--cloud-gray);
  border-radius: 4px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  position: relative;
}

.file-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}

.file-hint {
  font-size: 12px;
  color: var(--pewter);
}

.file-list {
  margin-top: 8px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background: var(--light-ash);
  border-radius: 4px;
}

.file-name {
  flex: 1;
  font-size: 12px;
  color: var(--graphite);
}

.file-btn {
  padding: 4px 8px;
  font-size: 11px;
  background: var(--electric-blue);
  color: var(--pure-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.file-btn:hover {
  opacity: 0.8;
}
</style>