<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import Navbar from '../components/Navbar.vue';
import { useProjectStore } from '../stores/project';

const router = useRouter();
const projectStore = useProjectStore();

const stats = computed(() => ({
  total: projectStore.totalCount,
  inProgress: projectStore.inProgressCount,
  completed: projectStore.completedCount,
  overdue: projectStore.overdueCount,
}));

const projectList = computed(() => projectStore.projects);

const sortedProjectList = computed(() => {
  return [...projectStore.projects].sort((a, b) => b.totalProgress - a.totalProgress);
});

const todoItems = computed(() => {
  const items: { project: string; node: string; overdue: number }[] = [];
  projectStore.projects.forEach(p => {
    p.nodes.forEach(n => {
      if (n.overdueDays > 0 && !n.actualComplete) {
        items.push({ project: p.name, node: n.nodeName, overdue: n.overdueDays });
      }
    });
  });
  return items.sort((a, b) => b.overdue - a.overdue).slice(0, 5);
});

function formatProgress(val: number): string {
  return (val * 100).toFixed(2) + '%';
}

function goToProject(id: number) {
  router.push(`/project/${id}`);
}
</script>

<template>
  <div class="home-page">
    <Navbar />
    
    <main class="main-content">
      <div class="stats-grid">
        <div class="stat-card stat-card-blue">
          <div class="stat-value">{{ stats.total }}</div>
          <div class="stat-label">项目总数</div>
        </div>
        <div class="stat-card stat-card-orange">
          <div class="stat-value">{{ stats.inProgress }}</div>
          <div class="stat-label">进行中</div>
        </div>
        <div class="stat-card stat-card-green">
          <div class="stat-value">{{ stats.completed }}</div>
          <div class="stat-label">已完成</div>
        </div>
        <div class="stat-card stat-card-yellow">
          <div class="stat-value">{{ stats.overdue }}</div>
          <div class="stat-label">逾期项目</div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">项目进度瀑布图</h2>
        <div class="chart-container">
          <div class="bar-chart">
            <div v-for="project in sortedProjectList" :key="project.id" class="bar-item">
              <div class="bar-label">{{ project.name }}</div>
              <div class="bar-wrapper">
                <div class="bar" :style="{ width: formatProgress(project.totalProgress) }"></div>
              </div>
              <div class="bar-value">{{ formatProgress(project.totalProgress) }}</div>
            </div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2 class="section-title">项目汇总展示</h2>
        <div class="table-container">
          <table class="data-table">
            <thead>
              <tr>
                <th>序号</th>
                <th>所属项目名称</th>
                <th>容量(MW)</th>
                <th>投资类型</th>
                <th>项目状态</th>
                <th>负责人</th>
                <th>负责部门</th>
                <th>目前项目节点</th>
                <th>节点状态</th>
                <th>逾期天数</th>
                <th>项目总进度</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(project, idx) in projectList" :key="project.id" @click="goToProject(project.id)" class="clickable-row">
                <td>{{ idx + 1 }}</td>
                <td>{{ project.name }}</td>
                <td>{{ project.capacity || '-' }}</td>
                <td>{{ project.investmentType }}</td>
                <td>
                  <span class="status-tag" :class="{
                    'status-tag-success': project.status === '正常',
                    'status-tag-warning': project.status === '暂停',
                    'status-tag-error': project.status === '终止'
                  }">{{ project.status }}</span>
                </td>
                <td>{{ project.manager }}</td>
                <td>{{ project.department }}</td>
                <td>{{ project.currentNode || '-' }}</td>
                <td>
                  <span class="status-tag" :class="{
                    'status-tag-success': project.nodeStatus === '已完成',
                    'status-tag-warning': project.nodeStatus === '进行中',
                    'status-tag-default': project.nodeStatus === '待开始'
                  }">{{ project.nodeStatus }}</span>
                </td>
                <td :class="{ 'overdue-text': project.overdueDays > 0 }">
                  {{ project.overdueDays > 0 ? project.overdueDays : (project.overdueDays < 0 ? Math.abs(project.overdueDays) + '(提前)' : 0) }}
                </td>
                <td>{{ formatProgress(project.totalProgress) }}</td>
                <td>{{ project.remark || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="two-col">
        <div class="card todo-card">
          <h3 class="card-title">当前待办事项</h3>
          <div class="todo-list">
            <div v-for="(item, idx) in todoItems" :key="idx" class="todo-item">
              <div class="todo-checkbox">☐</div>
              <div class="todo-content">
                <div class="todo-project">{{ item.project }}</div>
                <div class="todo-node">{{ item.node }}</div>
              </div>
              <div class="todo-overdue" :class="{ 'overdue-error': item.overdue > 30 }">
                逾期{{ item.overdue }}天
              </div>
            </div>
            <div v-if="todoItems.length === 0" class="todo-empty">
              暂无待办事项
            </div>
          </div>
        </div>

        <div class="card project-list-card">
          <h3 class="card-title">项目状态</h3>
          <div class="project-list">
            <div
              v-for="project in projectList.slice(0, 4)"
              :key="project.id"
              class="project-item"
              @click="goToProject(project.id)"
            >
              <div class="project-name">{{ project.name }}</div>
              <div class="project-progress">
                <div class="progress-bar">
                  <div class="progress-fill" :style="{ width: formatProgress(project.totalProgress) }"></div>
                </div>
                <span class="progress-text">{{ formatProgress(project.totalProgress) }}</span>
              </div>
              <div class="project-meta">
                <span class="status-tag" :class="{
                  'status-tag-success': project.status === '正常',
                  'status-tag-warning': project.status === '暂停',
                  'status-tag-error': project.status === '终止'
                }">{{ project.status }}</span>
                <span class="current-node">当前节点: {{ project.currentNode || '-' }}</span>
              </div>
              <div class="project-link">点击查看详情 →</div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.home-page {
  min-height: 100vh;
  background: var(--light-ash);
}

.main-content {
  padding: 80px 24px 24px;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 24px;
}

.stat-card {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
  text-align: center;
}

.stat-card-blue {
  background: linear-gradient(135deg, #5d7a92, #104f8f);
}

.stat-card-blue .stat-value,
.stat-card-blue .stat-label {
  color: var(--pure-white);
}

.stat-card-orange {
  background: linear-gradient(135deg, #8b8781, #dbbd9e);
}

.stat-card-orange .stat-value,
.stat-card-orange .stat-label {
  color: var(--pure-white);
}

.stat-card-green {
  background: linear-gradient(135deg, #6c756c, #b2e0b5);
}

.stat-card-green .stat-value,
.stat-card-green .stat-label {
  color: var(--pure-white);
}

.stat-card-yellow {
  background: linear-gradient(135deg, #FFC107, #FFA000);
}

.stat-card-yellow .stat-value,
.stat-card-yellow .stat-label {
  color: var(--pure-white);
}

.stat-value {
  font-size: 32px;
  font-weight: 500;
  color: var(--carbon-dark);
}

.stat-value.stat-overdue {
  color: var(--error);
}

.stat-label {
  font-size: 14px;
  color: var(--pewter);
  margin-top: 4px;
}

.section {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.section-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0 0 16px;
}

.table-container {
  overflow-x: auto;
}

.data-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.data-table th,
.data-table td {
  padding: 10px 8px;
  text-align: left;
  border-bottom: 1px solid var(--cloud-gray);
}

.data-table th {
  font-weight: 500;
  color: var(--pewter);
  font-size: 12px;
  background: var(--light-ash);
}

.data-table tr:hover {
  background: var(--light-ash);
}

.clickable-row {
  cursor: pointer;
}

.overdue-text {
  color: var(--error);
}

.status-tag {
  display: inline-block;
  padding: 2px 8px;
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

.two-col {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 16px;
}

.card {
  background: var(--pure-white);
  border-radius: 12px;
  padding: 20px;
}

.card-title {
  font-size: 17px;
  font-weight: 500;
  color: var(--carbon-dark);
  margin: 0 0 16px;
}

.todo-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.todo-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--light-ash);
  border-radius: 4px;
}

.todo-checkbox {
  font-size: 16px;
}

.todo-content {
  flex: 1;
}

.todo-project {
  font-size: 14px;
  color: var(--graphite);
  font-weight: 500;
}

.todo-node {
  font-size: 12px;
  color: var(--pewter);
}

.todo-overdue {
  font-size: 12px;
  color: var(--warning);
}

.todo-overdue.overdue-error {
  color: var(--error);
}

.todo-empty {
  text-align: center;
  color: var(--pewter);
  padding: 24px;
}

.project-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.project-item {
  padding: 16px;
  border: 1px solid var(--cloud-gray);
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s;
}

.project-item:hover {
  background: var(--light-ash);
}

.project-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--carbon-dark);
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin: 8px 0;
}

.progress-bar {
  flex: 1;
  height: 8px;
  background: var(--cloud-gray);
  border-radius: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--electric-blue);
  border-radius: 4px;
}

.progress-text {
  font-size: 14px;
  color: var(--graphite);
  min-width: 50px;
}

.project-meta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.current-node {
  font-size: 12px;
  color: var(--pewter);
}

.project-link {
  font-size: 12px;
  color: var(--electric-blue);
  margin-top: 8px;
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
</style>