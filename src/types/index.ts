export interface User {
  id: number;
  username: string;
  password: string;
  realName: string;
  department: string;
  phone?: string;
  email?: string;
  status: '启用' | '禁用';
  createdAt: Date;
  updatedAt: Date;
}

export interface LoginForm {
  username: string;
  password: string;
  rememberMe: boolean;
}

export interface UserFormData {
  username: string;
  password?: string;
  confirmPassword?: string;
  realName: string;
  department: string;
  phone?: string;
  email?: string;
  status: '启用' | '禁用';
}

export interface ProjectNode {
  id?: number;
  nodeName: string;
  plannedStart: Date | string | null;
  plannedEnd: Date | string | null;
  actualComplete: Date | string | null;
  supportMaterial?: string;
  progressStatus?: '已完成' | '进行中' | '未开始';
  overdueDays: number;
  tab?: '前期' | '建设期' | '并网期';
  group?: string;
  remark?: string;
  responsible?: string;
  progress?: number;
}

export interface Project {
  id: number;
  name: string;
  capacity: number | null;
  investmentType: '自投' | '并购' | '合资' | '其他';
  status: '正常' | '暂停' | '待定' | '终止';
  department: string;
  manager: string;
  subManager?: string;
  currentNode: string;
  nodeStatus: '进行中' | '已完成' | '待开始';
  overdueDays: number;
  totalProgress: number;
  remark?: string;
  nodes: ProjectNode[];
  createdAt?: Date;
}

export interface ProjectFormData {
  name: string;
  capacity: number | null;
  investmentType: '自投' | '并购' | '合资' | '其他';
  department: string;
  manager: string;
}

export interface ChangePasswordForm {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}