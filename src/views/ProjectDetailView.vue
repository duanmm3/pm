<script setup lang="ts">
import { ref, computed, reactive } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import { useProjectStore } from '../stores/project';

const route = useRoute();
const router = useRouter();
const projectStore = useProjectStore();

const projectId = computed(() => Number(route.params.id));
const project = computed(() => projectStore.getProjectById(projectId.value));

const activeTab = ref<'前期' | '建设期' | '并网期'>('前期');
const showAddNodeModal = ref(false);
const isEditing = ref(false);
const editForm = reactive({
  name: '',
  capacity: null as number | null,
  investmentType: '自投' as '自投' | '并购' | '合资' | '其他',
  department: '',
  manager: '',
  subManager: '',
  remark: '',
  status: '正常' as '正常' | '暂停' | '待定' | '终止',
});
const uploadedFiles = ref<Map<number, { name: string; url: string; type: string }[]>>(new Map());

const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/gif', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

const newNode = reactive({
  nodeName: '',
  plannedStart: '',
  plannedEnd: '',
  actualComplete: '',
  supportMaterial: '',
  progressStatus: '未开始' as '已完成' | '进行中' | '未开始',
  group: '项目端',
  responsible: '',
  progress: 10,
});

const tabs = ['前期', '建设期', '并网期'] as const;

const preProjectNodes = computed(() => {
  return project.value?.nodes.filter(n => n.tab === '前期') || [];
});

const constructionNodes = computed(() => {
  return project.value?.nodes.filter(n => n.tab === '建设期') || [];
});

const gridConnectionNodes = computed(() => {
  return project.value?.nodes.filter(n => n.tab === '并网期') || [];
});

function getNodesByTab(tab: string) {
  switch (tab) {
    case '前期': return preProjectNodes.value;
    case '建设期': return constructionNodes.value;
    case '并网期': return gridConnectionNodes.value;
    default: return [];
  }
}

function getGroups(tab: string) {
  const nodes = getNodesByTab(tab);
  const groups = new Set(nodes.map(n => n.group || '项目端'));
  return Array.from(groups);
}

function getNodesByGroup(tab: string, group: string) {
  const nodes = getNodesByTab(tab);
  return nodes.filter(n => (n.group || '项目端') === group);
}

function calculateSubProgress(tab: string): number {
  const nodes = getNodesByTab(tab);
  if (nodes.length === 0) return 0;
  const completed = nodes.filter(n => n.progressStatus === '已完成').length;
  return completed / nodes.length;
}

function calculateCountdown(tab: string): number {
  const nodes = getNodesByTab(tab);
  if (nodes.length === 0) return 0;
  
  const futureNodes = nodes.filter(n => !n.actualComplete && n.plannedEnd);
  if (futureNodes.length === 0) return 0;
  
  const now = new Date().getTime();
  let minDays = Infinity;
  
  futureNodes.forEach(n => {
    if (n.plannedEnd) {
      const end = new Date(n.plannedEnd as any).getTime();
      const days = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
      if (days > 0 && days < minDays) {
        minDays = days;
      }
    }
  });
  
  return minDays === Infinity ? 0 : minDays;
}

function getProjectDates(tab: string) {
  const nodes = getNodesByTab(tab);
  const startNodes = nodes.filter(n => n.plannedStart);
  const endNodes = nodes.filter(n => n.plannedEnd);
  
  let start = null;
  let end = null;
  
  if (startNodes.length > 0) {
    const starts = startNodes.map(n => new Date(n.plannedStart as any).getTime());
    start = new Date(Math.min(...starts));
  }
  
  if (endNodes.length > 0) {
    const ends = endNodes.map(n => new Date(n.plannedEnd as any).getTime());
    end = new Date(Math.max(...ends));
  }
  
  return { start, end };
}

function formatDate(date: any): string {
  if (!date) return '/';
  const d = new Date(date);
  return d.toLocaleDateString('zh-CN');
}

function formatProgress(val: number): string {
  return (val * 100).toFixed(0) + '%';
}

function goBack() {
  router.push('/department');
}

function startEdit() {
  if (!project.value) return;
  editForm.name = project.value.name;
  editForm.capacity = project.value.capacity;
  editForm.investmentType = project.value.investmentType;
  editForm.department = project.value.department;
  editForm.manager = project.value.manager;
  editForm.subManager = project.value.subManager || '';
  editForm.remark = project.value.remark || '';
  editForm.status = project.value.status;
  isEditing.value = true;
}

function saveEdit() {
  if (!project.value) return;
  projectStore.updateProject(project.value.id, {
    name: editForm.name,
    capacity: editForm.capacity,
    investmentType: editForm.investmentType,
    department: editForm.department,
    manager: editForm.manager,
    subManager: editForm.subManager,
    remark: editForm.remark,
    status: editForm.status,
  });
  isEditing.value = false;
}

function cancelEdit() {
  isEditing.value = false;
}

function openAddNodeModal() {
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
  newNode.group = '项目端';
  newNode.responsible = '';
  newNode.progress = 10;
}

function handleAddNode() {
  if (!project.value || !newNode.nodeName.trim()) return;
  
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
  
  projectStore.addNode(project.value.id, {
    nodeName: newNode.nodeName,
    plannedStart: newNode.plannedStart || null,
    plannedEnd: newNode.plannedEnd || null,
    actualComplete: newNode.actualComplete || null,
    supportMaterial: newNode.supportMaterial,
    progressStatus: newNode.progressStatus,
    overdueDays,
    tab: activeTab.value,
    group: newNode.group,
    responsible: newNode.responsible,
    progress: newNode.progress,
  });
  
  showAddNodeModal.value = false;
  resetNodeForm();
}

function handleFileUpload(event: Event, nodeId?: number) {
  const input = event.target as HTMLInputElement;
  if (!input.files || input.files.length === 0) return;
  
  const file = input.files[0];
  const fileType = file.type;
  
  if (!allowedTypes.includes(fileType) && !file.name.match(/\.(pdf|jpg|jpeg|png|gif|doc|docx|xls|xlsx)$/i)) {
    alert('不支持的文件格式，请上传PDF/图片/Office文件');
    return;
  }
  
  const fileURL = URL.createObjectURL(file);
  const fileInfo = { name: file.name, url: fileURL, type: fileType };
  
  if (nodeId) {
    const files = uploadedFiles.value.get(nodeId) || [];
    files.push(fileInfo);
    uploadedFiles.value.set(nodeId, files);
  } else {
    newNode.supportMaterial = fileInfo.name;
    (newNode as any).fileUrl = fileURL;
  }
  
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
</script>

<template>
  <div class="project-detail-page">
    <Navbar />
    
    <main class="main-content">
      <div v-if="project" class="content">
        <div class="page-header">
          <button class="back-btn" @click="goBack">← 返回列表</button>
          <h1 class="page-title">项目详情</h1>
        </div>

        <div class="info-card card">
          <div class="info-header">
            <template v-if="!isEditing">
              <h2 class="project-name">{{ project.name }}</h2>
              <button class="edit-btn" @click="startEdit">编辑</button>
            </template>
            <template v-else>
              <input v-model="editForm.name" class="input edit-input" />
              <select v-model="editForm.status" class="input edit-select">
                <option value="正常">正常</option>
                <option value="暂停">暂停</option>
                <option value="待定">待定</option>
                <option value="终止">终止</option>
              </select>
            </template>
          </div>
          
          <div class="info-grid">
            <template v-if="!isEditing">
              <div class="info-item">
                <span class="info-label">容量</span>
                <span class="info-value">{{ project.capacity ? `${project.capacity} MW` : '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">投资类型</span>
                <span class="info-value">{{ project.investmentType }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">部门</span>
                <span class="info-value">{{ project.department }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">负责人</span>
                <span class="info-value">{{ project.manager }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">子负责人</span>
                <span class="info-value">{{ project.subManager || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">项目总进度</span>
                <span class="info-value">{{ formatProgress(project.totalProgress) }}</span>
              </div>
            </template>
            <template v-else>
              <div class="info-item">
                <span class="info-label">容量</span>
                <input v-model.number="editForm.capacity" type="number" class="input edit-input" />
              </div>
              <div class="info-item">
                <span class="info-label">投资类型</span>
                <select v-model="editForm.investmentType" class="input edit-select">
                  <option value="自投">自投</option>
                  <option value="并购">并购</option>
                  <option value="合资">合资</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div class="info-item">
                <span class="info-label">部门</span>
                <input v-model="editForm.department" class="input edit-input" />
              </div>
              <div class="info-item">
                <span class="info-label">负责人</span>
                <input v-model="editForm.manager" class="input edit-input" />
              </div>
              <div class="info-item">
                <span class="info-label">子负责人</span>
                <input v-model="editForm.subManager" class="input edit-input" />
              </div>
              <div class="info-item">
                <span class="info-label">项目总进度</span>
                <span class="info-value">{{ formatProgress(project.totalProgress) }}</span>
              </div>
            </template>
          </div>
          
          <div v-if="!isEditing && project.remark" class="info-remark">
            <span class="info-label">项目描述</span>
            <p>{{ project.remark }}</p>
          </div>
          <div v-else class="info-remark">
            <span class="info-label">项目描述</span>
            <textarea v-model="editForm.remark" class="input edit-textarea" rows="2"></textarea>
          </div>
          
          <div v-if="isEditing" class="edit-actions">
            <button class="btn btn-primary" @click="saveEdit">保存</button>
            <button class="btn btn-secondary" @click="cancelEdit">取消</button>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="tabs-container">
          <div class="tabs">
            <button 
              v-for="tab in tabs" 
              :key="tab"
              class="tab-btn"
              :class="{ active: activeTab === tab }"
              @click="activeTab = tab"
            >
              项目{{ tab }}
            </button>
          </div>

          <!-- Tab Content -->
          <div v-if="activeTab === '前期'" class="tab-content">
            <div class="countdown-section">
              <div class="countdown-item">
                <span class="countdown-label">开始时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('前期').start) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">计划开工时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('前期').end) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">倒计时（天）</span>
                <span class="countdown-value" :class="{ 'countdown-warning': calculateCountdown('前期') < 0 }">{{ calculateCountdown('前期') }}</span>
              </div>
            </div>

            <div v-for="group in getGroups('前期')" :key="group" class="group-section">
              <div class="group-header">
                <span class="group-name">{{ group }}总负责人：XX</span>
                <span class="group-progress">子进度 {{ formatProgress(calculateSubProgress('前期')) }}</span>
              </div>
              
              <table class="node-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>任务内容</th>
                    <th>负责人</th>
                    <th>开始时间</th>
                    <th>预计完成时间</th>
                    <th>实际完成时间</th>
                    <th>进度</th>
                    <th>支撑材料</th>
                    <th>逾期天数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(node, idx) in getNodesByGroup('前期', group)" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ node.nodeName }}</td>
                    <td>{{ node.responsible || '-' }}</td>
                    <td>{{ formatDate(node.plannedStart) }}</td>
                    <td>{{ formatDate(node.plannedEnd) }}</td>
                    <td>{{ formatDate(node.actualComplete) }}</td>
                    <td>{{ node.progress ? node.progress + '%' : '-' }}</td>
                    <td>
                      <div v-if="node.supportMaterial" class="file-cell">
                        <span class="file-name-cell">{{ node.supportMaterial }}</span>
                        <button type="button" class="file-btn" @click="viewFile(node.supportMaterial as any)">查看</button>
                        <button type="button" class="file-btn" @click="downloadFile(node.supportMaterial as any, node.supportMaterial as any)">下载</button>
                      </div>
                      <span v-else>-</span>
                    </td>
                    <td :class="{ 'overdue-text': node.overdueDays > 0 }">
                      {{ node.overdueDays > 0 ? node.overdueDays : (node.overdueDays < 0 ? Math.abs(node.overdueDays) + '(提前)' : (node.overdueDays === 0 ? 0 : '-')) }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeTab === '建设期'" class="tab-content">
            <div class="countdown-section">
              <div class="countdown-item">
                <span class="countdown-label">开始时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('建设期').start) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">计划完成时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('建设期').end) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">倒计时（天）</span>
                <span class="countdown-value" :class="{ 'countdown-warning': calculateCountdown('建设期') < 0 }">{{ calculateCountdown('建设期') }}</span>
              </div>
            </div>

            <div v-for="group in getGroups('建设期')" :key="group" class="group-section">
              <div class="group-header">
                <span class="group-name">{{ group }}总负责人</span>
              </div>
              
              <table class="node-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>任务内容</th>
                    <th>负责人</th>
                    <th>开始时间</th>
                    <th>预计完成时间</th>
                    <th>实际完成时间</th>
                    <th>进度</th>
                    <th>支撑材料</th>
                    <th>逾期天数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(node, idx) in getNodesByGroup('建设期', group)" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ node.nodeName }}</td>
                    <td>{{ node.responsible || '-' }}</td>
                    <td>{{ formatDate(node.plannedStart) }}</td>
                    <td>{{ formatDate(node.plannedEnd) }}</td>
                    <td>{{ formatDate(node.actualComplete) }}</td>
                    <td>{{ node.progress ? node.progress + '%' : '-' }}</td>
                    <td>
                      <div v-if="node.supportMaterial" class="file-cell">
                        <span class="file-name-cell">{{ node.supportMaterial }}</span>
                        <button type="button" class="file-btn" @click="viewFile(node.supportMaterial as any)">查看</button>
                        <button type="button" class="file-btn" @click="downloadFile(node.supportMaterial as any, node.supportMaterial as any)">下载</button>
                      </div>
                      <span v-else>-</span>
                    </td>
                    <td :class="{ 'overdue-text': node.overdueDays > 0 }">
                      {{ node.overdueDays > 0 ? node.overdueDays : (node.overdueDays < 0 ? Math.abs(node.overdueDays) + '(提前)' : (node.overdueDays === 0 ? 0 : '-')) }}
                    </td>
                  </tr>
                  <tr v-if="getNodesByGroup('建设期', group).length === 0">
                    <td colspan="9" class="empty-cell">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div v-if="activeTab === '并网期'" class="tab-content">
            <div class="countdown-section">
              <div class="countdown-item">
                <span class="countdown-label">开始时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('并网期').start) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">计划完成时间</span>
                <span class="countdown-value">{{ formatDate(getProjectDates('并网期').end) }}</span>
              </div>
              <div class="countdown-item">
                <span class="countdown-label">倒计时（天）</span>
                <span class="countdown-value" :class="{ 'countdown-warning': calculateCountdown('并网期') < 0 }">{{ calculateCountdown('并网期') }}</span>
              </div>
            </div>

            <div v-for="group in getGroups('并网期')" :key="group" class="group-section">
              <div class="group-header">
                <span class="group-name">{{ group }}总负责人</span>
                <span class="group-progress">子进度 {{ formatProgress(calculateSubProgress('并网期')) }}</span>
              </div>
              
              <table class="node-table">
                <thead>
                  <tr>
                    <th>序号</th>
                    <th>任务内容</th>
                    <th>负责人</th>
                    <th>开始时间</th>
                    <th>预计完成时间</th>
                    <th>实际完成时间</th>
                    <th>进度</th>
                    <th>支撑材料</th>
                    <th>逾期天数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(node, idx) in getNodesByGroup('并网期', group)" :key="idx">
                    <td>{{ idx + 1 }}</td>
                    <td>{{ node.nodeName }}</td>
                    <td>{{ node.responsible || '-' }}</td>
                    <td>{{ formatDate(node.plannedStart) }}</td>
                    <td>{{ formatDate(node.plannedEnd) }}</td>
                    <td>{{ formatDate(node.actualComplete) }}</td>
                    <td>{{ node.progress ? node.progress + '%' : '-' }}</td>
                    <td>
                      <div v-if="node.supportMaterial" class="file-cell">
                        <span class="file-name-cell">{{ node.supportMaterial }}</span>
                        <button type="button" class="file-btn" @click="viewFile(node.supportMaterial as any)">查看</button>
                        <button type="button" class="file-btn" @click="downloadFile(node.supportMaterial as any, node.supportMaterial as any)">下载</button>
                      </div>
                      <span v-else>-</span>
                    </td>
                    <td :class="{ 'overdue-text': node.overdueDays > 0 }">
                      {{ node.overdueDays > 0 ? node.overdueDays : (node.overdueDays < 0 ? Math.abs(node.overdueDays) + '(提前)' : (node.overdueDays === 0 ? 0 : '-')) }}
                    </td>
                  </tr>
                  <tr v-if="getNodesByGroup('并网期', group).length === 0">
                    <td colspan="9" class="empty-cell">暂无数据</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <button class="btn btn-primary add-node-btn" @click="openAddNodeModal">+ 添加节点</button>
        </div>
      </div>

      <div v-else class="not-found">
        <p>项目不存在</p>
        <button class="btn btn-primary" @click="goBack">返回列表</button>
      </div>
    </main>

    <!-- 添加节点模态框 -->
    <div v-if="showAddNodeModal" class="modal-overlay" @click.self="showAddNodeModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3 class="modal-title">添加节点 - {{ activeTab }}</h3>
          <button class="btn-icon" @click="showAddNodeModal = false">✕</button>
        </div>
        
        <form @submit.prevent="handleAddNode">
          <div class="input-group">
            <label class="input-label">任务内容 *</label>
            <input v-model="newNode.nodeName" class="input" placeholder="请输入任务内容" required />
          </div>

          <div class="input-group mt-4">
            <label class="input-label">分组</label>
            <select v-model="newNode.group" class="input">
              <option value="基金端">基金端</option>
              <option value="项目端">项目端</option>
              <option value="采购端">采购端</option>
            </select>
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
              <input type="file" :accept="'.pdf,.jpg,.jpeg,.png,.gif,.doc,.docx,.xls,.xlsx'" @change="handleFileUpload($event)" class="file-input" />
              <span class="file-hint">点击或拖拽文件到此处上传</span>
            </div>
            <div v-if="newNode.supportMaterial" class="file-list">
              <div class="file-item">
                <span class="file-name">{{ newNode.supportMaterial }}</span>
                <button type="button" class="file-btn" @click="viewFile((newNode as any).fileUrl)">查看</button>
                <button type="button" class="file-btn" @click="downloadFile((newNode as any).fileUrl, newNode.supportMaterial)">下载</button>
              </div>
            </div>
            <input v-model="newNode.supportMaterial" class="input mt-2" placeholder="或输入文件链接" />
          </div>

          <button type="submit" class="btn btn-primary mt-4" style="width: 100%">添加节点</button>
        </form>
      </div>
    </div>
  </div>
</template>

<style scoped>
.project-detail-page {
  min-height: 100vh;
  background: var(--light-ash);
}

.main-content {
  padding: 80px 24px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.back-btn {
  background: none;
  border: none;
  color: var(--electric-blue);
  cursor: pointer;
  font-size: 14px;
}

.page-title {
  font-size: 28px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.info-card {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
}

.info-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.edit-btn {
  padding: 6px 12px;
  font-size: 12px;
  background: var(--electric-blue);
  color: var(--pure-white);
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-input {
  height: 32px;
  padding: 0 8px;
  font-size: 14px;
}

.edit-select {
  height: 32px;
  padding: 0 8px;
  font-size: 14px;
}

.edit-textarea {
  padding: 8px;
  font-size: 14px;
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}

.project-name {
  font-size: 20px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: var(--pewter);
}

.info-value {
  font-size: 14px;
  color: var(--graphite);
}

.info-remark {
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--cloud-gray);
}

.info-remark p {
  font-size: 14px;
  color: var(--graphite);
}

.tabs-container {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
}

.tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  border-bottom: 1px solid var(--cloud-gray);
  padding-bottom: 12px;
}

.tab-btn {
  padding: 8px 16px;
  border: none;
  background: transparent;
  cursor: pointer;
  font-size: 14px;
  color: var(--pewter);
  border-radius: 4px;
}

.tab-btn.active {
  background: var(--electric-blue);
  color: var(--pure-white);
}

.tab-content {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.countdown-section {
  display: flex;
  gap: 32px;
  padding: 16px;
  background: var(--light-ash);
  border-radius: 8px;
}

.countdown-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.countdown-label {
  font-size: 12px;
  color: var(--pewter);
}

.countdown-value {
  font-size: 16px;
  font-weight: 500;
  color: var(--carbon-dark);
}

.countdown-value.countdown-warning {
  color: var(--warning);
}

.group-section {
  margin-top: 16px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding: 12px;
  background: var(--light-ash);
  border-radius: 4px;
}

.group-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--carbon-dark);
}

.group-progress {
  font-size: 14px;
  color: var(--electric-blue);
}

.node-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 12px;
}

.node-table th,
.node-table td {
  padding: 10px 8px;
  text-align: left;
  border: 1px solid var(--cloud-gray);
}

.node-table th {
  font-weight: 500;
  color: var(--pewter);
  background: var(--light-ash);
}

.node-table tr:hover {
  background: var(--light-ash);
}

.overdue-text {
  color: var(--error);
}

.empty-cell {
  text-align: center;
  color: var(--pewter);
  padding: 24px;
}

.add-node-btn {
  margin-top: 20px;
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

.status-tag-warning {
  background: rgba(255, 152, 0, 0.15);
  color: var(--warning);
}

.status-tag-error {
  background: rgba(231, 76, 60, 0.15);
  color: var(--error);
}

.status-tag-default {
  background: rgba(142, 142, 142, 0.15);
  color: var(--silver-fog);
}

.btn-icon {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 18px;
  color: var(--pewter);
}

.not-found {
  text-align: center;
  padding: 80px;
}

.not-found p {
  margin-bottom: 16px;
  color: var(--pewter);
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

.file-link {
  color: var(--electric-blue);
  text-decoration: none;
}

.file-link:hover {
  text-decoration: underline;
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

.file-cell {
  display: flex;
  align-items: center;
  gap: 4px;
}

.file-name-cell {
  max-width: 100px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 11px;
  color: var(--electric-blue);
}
</style>