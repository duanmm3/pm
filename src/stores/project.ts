import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type { Project, ProjectNode, ProjectFormData } from '../types';
import { mockProjects } from '../utils/mockData';

export const useProjectStore = defineStore('project', () => {
  const projects = ref<Project[]>([...mockProjects]);

  const totalCount = computed(() => projects.value.length);
  const inProgressCount = computed(() => projects.value.filter(p => p.nodeStatus === '进行中').length);
  const completedCount = computed(() => projects.value.filter(p => p.nodeStatus === '已完成').length);
  const overdueCount = computed(() => projects.value.filter(p => p.overdueDays > 0).length);

  function getProjectById(id: number): Project | undefined {
    return projects.value.find(p => p.id === id);
  }

  function addProject(data: ProjectFormData) {
    const newProject: Project = {
      id: Date.now(),
      name: data.name,
      capacity: data.capacity,
      investmentType: data.investmentType,
      status: '正常',
      department: data.department,
      manager: data.manager,
      subManager: '',
      currentNode: '',
      nodeStatus: '待开始',
      overdueDays: 0,
      totalProgress: 0,
      remark: '',
      nodes: [],
      createdAt: new Date(),
    };
    projects.value.unshift(newProject);
    return newProject;
  }

  function updateProject(id: number, data: Partial<Project>) {
    const idx = projects.value.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects.value[idx] = { ...projects.value[idx], ...data };
      return projects.value[idx];
    }
    return null;
  }

  function deleteProject(id: number): boolean {
    const idx = projects.value.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects.value.splice(idx, 1);
      return true;
    }
    return false;
  }

  function addNode(projectId: number, node: ProjectNode) {
    const idx = projects.value.findIndex(p => p.id === projectId);
    if (idx !== -1) {
      const newNode = { ...node, id: Date.now() };
      projects.value[idx].nodes.push(newNode);
      updateProjectProgress(idx);
    }
  }

  function updateNode(projectId: number, nodeIndex: number, data: Partial<ProjectNode>) {
    const pidx = projects.value.findIndex(p => p.id === projectId);
    if (pidx !== -1) {
      projects.value[pidx].nodes[nodeIndex] = { ...projects.value[pidx].nodes[nodeIndex], ...data };
      updateProjectProgress(pidx);
    }
  }

  function deleteNode(projectId: number, nodeIndex: number) {
    const pidx = projects.value.findIndex(p => p.id === projectId);
    if (pidx !== -1) {
      projects.value[pidx].nodes.splice(nodeIndex, 1);
      updateProjectProgress(pidx);
    }
  }

  function updateProjectProgress(pidx: number) {
    const nodes = projects.value[pidx].nodes;
    if (nodes.length === 0) {
      projects.value[pidx].totalProgress = 0;
      return;
    }
    const completed = nodes.filter(n => n.actualComplete).length;
    projects.value[pidx].totalProgress = completed / nodes.length;
    
    const current = nodes.find(n => !n.actualComplete && n.overdueDays <= 0);
    if (current) {
      projects.value[pidx].currentNode = current.nodeName;
      projects.value[pidx].nodeStatus = '进行中';
    }
  }

  return {
    projects,
    totalCount,
    inProgressCount,
    completedCount,
    overdueCount,
    getProjectById,
    addProject,
    updateProject,
    deleteProject,
    addNode,
    updateNode,
    deleteNode,
  };
});