import axios from "axios";
import { ElMessage } from "element-plus";
import { useUserStore } from "@/stores/user";

// 创建axios实例
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "/api",
  timeout: 30000, // 增加超时时间到30秒
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    const { response, config, code, message } = error;

    // 对于认证相关的API（注册、登录、用户信息），不进行自动跳转
    const isAuthAPI =
      config?.url?.includes("/auth/register") ||
      config?.url?.includes("/auth/login") ||
      config?.url?.includes("/users/me");

    // 处理超时错误
    if (code === "ECONNABORTED" || message?.includes("timeout")) {
      ElMessage.error("请求超时，请检查网络连接或稍后重试");
      return Promise.reject(error);
    }

    if (response?.status === 401 && !isAuthAPI) {
      // 未认证，清除token并跳转到登录页（排除认证API）
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      // 避免在初始化期间进行跳转
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
        ElMessage.error("登录已过期，请重新登录");
      }
    } else if (response?.status === 403) {
      ElMessage.error("权限不足");
    } else if (response?.status === 404) {
      ElMessage.error("请求的资源不存在");
    } else if (response?.status >= 500) {
      // 对于500错误，只在非认证API时显示错误提示
      if (!isAuthAPI) {
        ElMessage.error("服务器错误，请稍后重试");

        // 尝试恢复用户信息（可能是认证状态问题）
        try {
          const userStore = useUserStore();
          if (userStore.forceRestoreUser) {
            userStore.forceRestoreUser();
          }
        } catch (error) {
          console.warn("尝试恢复用户信息失败:", error);
        }
      }
    } else if (response?.status !== 401) {
      // 对于401错误，只在非认证API时显示错误
      ElMessage.error(response?.data?.error || "请求失败");
    }

    return Promise.reject(error);
  }
);

// 认证相关API
export const authAPI = {
  // 用户注册
  register: async (data: {
    username: string;
    email: string;
    password: string;
    realName: string;
    phone?: string;
    department: string;
    role?: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  // 管理员创建用户
  createUser: async (data: {
    username: string;
    email: string;
    password: string;
    realName: string;
    phone?: string;
    department: string;
    role?: string;
  }) => {
    const response = await api.post("/auth/create-user", data);
    return response.data;
  },

  // 用户登录
  login: async (data: { username: string; password: string }) => {
    const response = await api.post("/auth/login", data);
    return response.data;
  },

  // 检查用户名是否存在（无需认证）
  checkUsername: async (username: string) => {
    const response = await api.get(`/auth/check-username/${username}`);
    return response.data;
  },

  // 检查邮箱是否存在（无需认证）
  checkEmail: async (email: string) => {
    const response = await api.get(`/auth/check-email/${email}`);
    return response.data;
  },
};

// 用户相关API - 已移动到 src/services/userAPI.ts
// 这里保留兼容性，但建议使用 services/userAPI.ts

// 专利申请相关API
export const patentApplicationAPI = {
  // 提交专利申请
  submitApplication: async (data: any) => {
    const response = await api.post("/patent-applications", data);
    return response.data;
  },

  // 获取专利申请列表（用于审核）
  getApplications: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get("/patent-applications", { params });
    return response.data;
  },

  // 审核专利申请
  reviewApplication: async (
    id: number,
    data: { status: string; comment?: string }
  ) => {
    const response = await api.put(`/patent-applications/${id}/review`, data);
    return response.data;
  },
};

// 专利相关API
export const patentAPI = {
  // 获取专利列表
  getPatents: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
    categoryId?: number;
    search?: string;
  }) => {
    const response = await api.get("/patents", { params });
    return response.data;
  },

  // 获取专利详情
  getPatent: async (id: number) => {
    const response = await api.get(`/patents/${id}`);
    return response.data;
  },

  // 创建专利
  createPatent: async (data: any) => {
    const response = await api.post("/patents", data);
    return response.data;
  },

  // 更新专利
  updatePatent: async (id: number, data: any) => {
    const response = await api.put(`/patents/${id}`, data);
    return response.data;
  },

  // 删除专利
  deletePatent: async (id: number) => {
    const response = await api.delete(`/patents/${id}`);
    return response.data;
  },

  // 获取专利文档
  getPatentDocuments: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/documents`);
    return response.data;
  },

  // 创建专利文档
  createPatentDocument: async (
    patentId: number,
    data: {
      name: string;
      type: string;
      fileUrl: string;
      fileSize?: number;
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/documents`, data);
    return response.data;
  },

  // 删除专利文档
  deletePatentDocument: async (patentId: number, documentId: number) => {
    const response = await api.delete(
      `/patents/${patentId}/documents/${documentId}`
    );
    return response.data;
  },

  // 获取专利费用
  getPatentFees: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/fees`);
    return response.data;
  },

  // 创建专利费用
  createPatentFee: async (patentId: number, data: any) => {
    const response = await api.post(`/patents/${patentId}/fees`, data);
    return response.data;
  },

  // 获取专利截止日期
  getPatentDeadlines: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/deadlines`);
    return response.data;
  },

  // 创建专利截止日期
  createPatentDeadline: async (patentId: number, data: any) => {
    const response = await api.post(`/patents/${patentId}/deadlines`, data);
    return response.data;
  },
};

// 任务相关API
export const taskAPI = {
  // 获取任务列表
  getTasks: async () => {
    const response = await api.get("/tasks");
    return response.data;
  },

  // 创建任务
  createTask: async (data: any) => {
    const response = await api.post("/tasks", data);
    return response.data;
  },

  // 更新任务
  updateTask: async (id: number, data: any) => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data;
  },

  // 删除任务
  deleteTask: async (id: number) => {
    const response = await api.delete(`/tasks/${id}`);
    return response.data;
  },
};

// 统计相关API
export const statsAPI = {
  // 获取统计数据
  getStats: async () => {
    const response = await api.get("/stats");
    return response.data;
  },
};

// 健康检查API
export const healthAPI = {
  // 健康检查
  check: async () => {
    const response = await api.get("/health");
    return response.data;
  },
};

// 活动记录相关API
export const activityAPI = {
  // 获取活动记录列表
  getActivities: async (params?: {
    page?: number;
    limit?: number;
    userId?: number;
    type?: string;
  }) => {
    const response = await api.get("/activities", { params });
    return response.data;
  },

  // 获取单个活动记录
  getActivity: async (id: number) => {
    const response = await api.get(`/activities/${id}`);
    return response.data;
  },

  // 创建活动记录
  createActivity: async (data: {
    type: string;
    title: string;
    description?: string;
    targetId?: number;
    targetName?: string;
    status?: string;
    statusText?: string;
    metadata?: any;
  }) => {
    const response = await api.post("/activities", data);
    return response.data;
  },

  // 更新活动记录
  updateActivity: async (id: number, data: any) => {
    const response = await api.put(`/activities/${id}`, data);
    return response.data;
  },

  // 删除活动记录
  deleteActivity: async (id: number) => {
    const response = await api.delete(`/activities/${id}`);
    return response.data;
  },
};

// 评论相关API
export const commentAPI = {
  // 获取评论列表
  getComments: async (params?: {
    targetId?: number;
    targetType?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/comments", { params });
    return response.data;
  },

  // 创建评论
  createComment: async (data: {
    content: string;
    type?: string;
    targetId?: number;
    targetType?: string;
  }) => {
    const response = await api.post("/comments", data);
    return response.data;
  },

  // 更新评论
  updateComment: async (id: number, data: { content: string }) => {
    const response = await api.put(`/comments/${id}`, data);
    return response.data;
  },

  // 删除评论
  deleteComment: async (id: number) => {
    const response = await api.delete(`/comments/${id}`);
    return response.data;
  },
};

// 费用管理相关API
export const feeAPI = {
  // 获取费用列表
  getFees: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: number;
  }) => {
    const response = await api.get("/fees", { params });
    return response.data;
  },

  // 创建费用
  createFee: async (data: {
    patentId: number;
    type: string;
    amount: number;
    currency: string;
    dueDate: string;
    description?: string;
  }) => {
    const response = await api.post("/fees", data);
    return response.data;
  },

  // 更新费用
  updateFee: async (
    id: number,
    data: {
      type?: string;
      amount?: number;
      currency?: string;
      dueDate?: string;
      status?: string;
      description?: string;
    }
  ) => {
    const response = await api.put(`/fees/${id}`, data);
    return response.data;
  },

  // 删除费用
  deleteFee: async (id: number) => {
    const response = await api.delete(`/fees/${id}`);
    return response.data;
  },

  // 获取费用分类
  getCategories: async () => {
    const response = await api.get("/fee-categories");
    return response.data;
  },

  // 创建费用分类
  createCategory: async (data: {
    name: string;
    description?: string;
    color?: string;
  }) => {
    const response = await api.post("/fee-categories", data);
    return response.data;
  },

  // 更新费用分类
  updateCategory: async (id: number, data: any) => {
    const response = await api.put(`/fee-categories/${id}`, data);
    return response.data;
  },

  // 删除费用分类
  deleteCategory: async (id: number) => {
    const response = await api.delete(`/fee-categories/${id}`);
    return response.data;
  },

  // 更新费用状态
  updateFeeStatus: async (id: number, status: string) => {
    const response = await api.put(`/fees/${id}/status`, { status });
    return response.data;
  },
};

// 合同相关API
export const contractAPI = {
  // 获取合同列表
  getContracts: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    type?: string;
  }) => {
    const response = await api.get("/contracts", { params });
    return response.data;
  },

  // 创建合同
  createContract: async (data: {
    title: string;
    contractNumber: string;
    type: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    amount?: number;
    currency?: string;
    description?: string;
    terms?: any;
    parties?: any[];
    documents?: any[];
  }) => {
    const response = await api.post("/contracts", data);
    return response.data;
  },

  // 更新合同
  updateContract: async (id: number, data: any) => {
    const response = await api.put(`/contracts/${id}`, data);
    return response.data;
  },

  // 删除合同
  deleteContract: async (id: number) => {
    const response = await api.delete(`/contracts/${id}`);
    return response.data;
  },

  // 获取合同模板列表
  getTemplates: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    const response = await api.get("/contract-templates", { params });
    return response.data;
  },

  // 创建合同模板
  createTemplate: async (data: any) => {
    const response = await api.post("/contract-templates", data);
    return response.data;
  },

  // 更新合同模板
  updateTemplate: async (id: number, data: any) => {
    const response = await api.put(`/contract-templates/${id}`, data);
    return response.data;
  },

  // 删除合同模板
  deleteTemplate: async (id: number) => {
    const response = await api.delete(`/contract-templates/${id}`);
    return response.data;
  },

  // 获取费用协议列表
  getFeeAgreements: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    lawFirmId?: number;
  }) => {
    const response = await api.get("/fee-agreements", { params });
    return response.data;
  },

  // 创建费用协议
  createFeeAgreement: async (data: any) => {
    const response = await api.post("/fee-agreements", data);
    return response.data;
  },

  // 更新费用协议
  updateFeeAgreement: async (id: number, data: any) => {
    const response = await api.put(`/fee-agreements/${id}`, data);
    return response.data;
  },

  // 删除费用协议
  deleteFeeAgreement: async (id: number) => {
    const response = await api.delete(`/fee-agreements/${id}`);
    return response.data;
  },

  // 获取服务质量评估列表
  getServiceEvaluations: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    lawFirmId?: number;
  }) => {
    const response = await api.get("/service-evaluations", { params });
    return response.data;
  },

  // 创建服务质量评估
  createEvaluation: async (data: any) => {
    const response = await api.post("/service-evaluations", data);
    return response.data;
  },

  // 更新服务质量评估
  updateEvaluation: async (id: number, data: any) => {
    const response = await api.put(`/service-evaluations/${id}`, data);
    return response.data;
  },

  // 删除服务质量评估
  deleteEvaluation: async (id: number) => {
    const response = await api.delete(`/service-evaluations/${id}`);
    return response.data;
  },
};

// 律师事务所相关API
export const lawFirmAPI = {
  // 获取律师事务所列表
  getLawFirms: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const response = await api.get("/law-firms", { params });
    return response.data;
  },

  // 创建律师事务所
  createLawFirm: async (data: {
    name: string;
    contactPerson?: string;
    phone?: string;
    email?: string;
    address?: string;
    description?: string;
    rating?: number;
  }) => {
    const response = await api.post("/law-firms", data);
    return response.data;
  },

  // 更新律师事务所
  updateLawFirm: async (id: number, data: any) => {
    const response = await api.put(`/law-firms/${id}`, data);
    return response.data;
  },

  // 删除律师事务所
  deleteLawFirm: async (id: number) => {
    const response = await api.delete(`/law-firms/${id}`);
    return response.data;
  },
};

// 搜索相关API
export const searchAPI = {
  // 全局搜索
  search: async (params: {
    q: string;
    type?: string;
    page?: number;
    limit?: number;
  }) => {
    const response = await api.get("/search", { params });
    return response.data;
  },
};

// 批量操作API
export const batchAPI = {
  // 专利批量操作
  batchPatents: async (data: {
    action: "update" | "delete" | "export";
    patentIds: number[];
    data?: any;
  }) => {
    const response = await api.post("/patents/batch", data);
    return response.data;
  },
};

// 用户头像相关API
export const userAvatarAPI = {
  // 更新用户头像
  updateAvatar: async (userId: number, avatar: string) => {
    const response = await api.put(`/users/${userId}/avatar`, { avatar });
    return response.data;
  },
};

// 专利费用状态相关API
export const patentFeeAPI = {
  // 更新费用状态
  updateFeeStatus: async (patentId: number, feeId: number, status: string) => {
    const response = await api.put(`/patents/${patentId}/fees/${feeId}`, {
      status,
    });
    return response.data;
  },
};

// 专利截止日期状态相关API
export const patentDeadlineAPI = {
  // 更新截止日期状态
  updateDeadlineStatus: async (
    patentId: number,
    deadlineId: number,
    status: string
  ) => {
    const response = await api.put(
      `/patents/${patentId}/deadlines/${deadlineId}`,
      { status }
    );
    return response.data;
  },
};

// 任务状态相关API
export const taskStatusAPI = {
  // 更新任务状态
  updateTaskStatus: async (
    taskId: number,
    status: string,
    assigneeId?: number
  ) => {
    const response = await api.put(`/tasks/${taskId}/status`, {
      status,
      assigneeId,
    });
    return response.data;
  },
};

// 通知系统相关API
export const notificationAPI = {
  // 获取通知列表
  getNotifications: async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }) => {
    const response = await api.get("/notifications", { params });
    return response.data;
  },
  // 创建通知
  createNotification: async (data: {
    title: string;
    content: string;
    type: string;
    targetId?: number;
    targetType?: string;
  }) => {
    const response = await api.post("/notifications", data);
    return response.data;
  },
  // 标记通知为已读
  markAsRead: async (notificationId: number) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
  },
  // 标记所有通知为已读
  markAllAsRead: async () => {
    const response = await api.put("/notifications/read-all");
    return response.data;
  },
};

// 文件上传相关API
export const fileUploadAPI = {
  // 上传文件
  uploadFile: async (data: {
    fileName: string;
    fileType: string;
    fileSize: number;
    patentId?: number;
  }) => {
    const response = await api.post("/upload", data);
    return response.data;
  },
};

// 专利文档管理相关API
export const patentDocumentAPI = {
  // 获取专利文档列表
  getPatentDocuments: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/documents`);
    return response.data;
  },
};

// 系统设置相关API
export const systemSettingsAPI = {
  // 获取系统设置
  getSettings: async () => {
    const response = await api.get("/settings");
    return response.data;
  },
  // 更新系统设置
  updateSettings: async (data: {
    maintenanceMode?: boolean;
    allowRegistration?: boolean;
    maxFileSize?: number;
  }) => {
    const response = await api.put("/settings", data);
    return response.data;
  },
};

// 数据安全相关API
export const dataSecurityAPI = {
  // 获取数据安全设置
  getSettings: async () => {
    const response = await api.get("/data-security/settings");
    return response.data;
  },

  // 更新数据安全设置
  updateSettings: async (data: any) => {
    const response = await api.put("/data-security/settings", data);
    return response.data;
  },

  // 启动数据备份
  startBackup: async (data?: { backupType?: string; location?: string }) => {
    const response = await api.post("/data-security/backup", data);
    return response.data;
  },

  // 启动恢复测试
  startRecoveryTest: async () => {
    const response = await api.post("/data-security/recovery-test");
    return response.data;
  },

  // 获取安全事件日志
  getEvents: async (params?: {
    page?: number;
    limit?: number;
    severity?: string;
    eventType?: string;
  }) => {
    const response = await api.get("/data-security/events", { params });
    return response.data;
  },

  // 获取备份记录
  getBackups: async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    backupType?: string;
  }) => {
    const response = await api.get("/data-security/backups", { params });
    return response.data;
  },

  // 删除备份记录
  deleteBackup: async (backupId: number) => {
    const response = await api.delete(`/data-security/backups/${backupId}`);
    return response.data;
  },

  // 获取系统日志
  getSystemLogs: async (params?: {
    page?: number;
    limit?: number;
    level?: string;
    module?: string;
    startDate?: string;
    endDate?: string;
    keyword?: string;
  }) => {
    const response = await api.get("/data-security/logs", { params });
    return response.data;
  },

  // 清理日志
  cleanupLogs: async (params?: {
    beforeDate?: string;
    level?: string;
    module?: string;
  }) => {
    const response = await api.post("/data-security/logs/cleanup", params);
    return response.data;
  },
};

// 个性化设置API
export const personalizationAPI = {
  // 获取个性化设置
  getSettings: async (userId: number) => {
    const response = await api.get(`/personalization/settings/${userId}`);
    return response.data;
  },

  // 更新个性化设置
  updateSettings: async (userId: number, data: any) => {
    const response = await api.put(`/personalization/settings/${userId}`, data);
    return response.data;
  },
};

// 文档管理增强API
export const documentManagementAPI = {
  // 分析文档
  analyzeDocument: async (data: {
    documentId: number;
    analysisType: string;
  }) => {
    const response = await api.post("/documents/analyze", data);
    return response.data;
  },

  // 获取文档模板
  getTemplates: async () => {
    const response = await api.get("/documents/templates");
    return response.data;
  },
};

// 工作流管理API
export const workflowAPI = {
  // 获取工作流列表
  getWorkflows: async () => {
    const response = await api.get("/workflows");
    return response.data;
  },

  // 创建工作流
  createWorkflow: async (data: {
    name: string;
    description: string;
    steps: Array<{
      name: string;
      order: number;
      required: boolean;
    }>;
  }) => {
    const response = await api.post("/workflows", data);
    return response.data;
  },
};

// 报告生成API

// 数据导入导出API
export const dataManagementAPI = {
  // 导入数据
  importData: async (data: {
    type: string;
    fileUrl: string;
    options?: any;
  }) => {
    const response = await api.post("/data/import", data);
    return response.data;
  },

  // 导出数据
  exportData: async (data: { type: string; filters: any; format?: string }) => {
    const response = await api.post("/data/export", data);
    return response.data;
  },
};

// 系统监控API
export const monitoringAPI = {
  // 获取系统监控数据
  getSystemMetrics: async () => {
    const response = await api.get("/monitoring/system");
    return response.data;
  },

  // 获取性能监控数据
  getPerformanceMetrics: async (period?: string) => {
    const response = await api.get("/monitoring/performance", {
      params: { period },
    });
    return response.data;
  },
};

// 知识库管理API
export const knowledgeBaseAPI = {
  // 获取知识库文章列表
  getArticles: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
  }) => {
    const response = await api.get("/knowledge-base", { params });
    return response.data;
  },

  // 创建知识库文章
  createArticle: async (data: {
    title: string;
    content: string;
    category: string;
    tags?: string[];
  }) => {
    const response = await api.post("/knowledge-base", data);
    return response.data;
  },
};

// 专利分析相关API
export const patentAnalysisAPI = {
  // 专利技术分析
  analyzeTechnology: async (patentId: number) => {
    const response = await api.post(`/patents/${patentId}/analyze/technology`);
    return response.data;
  },

  // 专利竞争分析
  analyzeCompetition: async (patentId: number) => {
    const response = await api.post(`/patents/${patentId}/analyze/competition`);
    return response.data;
  },

  // 专利价值评估
  evaluateValue: async (patentId: number) => {
    const response = await api.post(`/patents/${patentId}/evaluate/value`);
    return response.data;
  },

  // 专利风险评估
  evaluateRisk: async (patentId: number) => {
    const response = await api.post(`/patents/${patentId}/evaluate/risk`);
    return response.data;
  },

  // 获取分析报告
  getAnalysisReport: async (patentId: number, type: string) => {
    const response = await api.get(`/patents/${patentId}/analysis/${type}`);
    return response.data;
  },
};

// 专利族管理API
export const patentFamilyAPI = {
  // 获取专利族
  getPatentFamily: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/family`);
    return response.data;
  },

  // 创建专利族
  createPatentFamily: async (data: {
    name: string;
    description?: string;
    patentIds: number[];
  }) => {
    const response = await api.post("/patent-families", data);
    return response.data;
  },

  // 更新专利族
  updatePatentFamily: async (familyId: number, data: any) => {
    const response = await api.put(`/patent-families/${familyId}`, data);
    return response.data;
  },

  // 删除专利族
  deletePatentFamily: async (familyId: number) => {
    const response = await api.delete(`/patent-families/${familyId}`);
    return response.data;
  },

  // 添加专利到族
  addPatentToFamily: async (familyId: number, patentId: number) => {
    const response = await api.post(`/patent-families/${familyId}/patents`, {
      patentId,
    });
    return response.data;
  },

  // 从族中移除专利
  removePatentFromFamily: async (familyId: number, patentId: number) => {
    const response = await api.delete(
      `/patent-families/${familyId}/patents/${patentId}`
    );
    return response.data;
  },
};

// 专利引用关系API
export const patentCitationAPI = {
  // 获取专利引用
  getCitations: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/citations`);
    return response.data;
  },

  // 获取被引用专利
  getCitedBy: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/cited-by`);
    return response.data;
  },

  // 添加引用关系
  addCitation: async (patentId: number, citedPatentId: number) => {
    const response = await api.post(`/patents/${patentId}/citations`, {
      citedPatentId,
    });
    return response.data;
  },

  // 移除引用关系
  removeCitation: async (patentId: number, citedPatentId: number) => {
    const response = await api.delete(
      `/patents/${patentId}/citations/${citedPatentId}`
    );
    return response.data;
  },

  // 获取引用网络图
  getCitationNetwork: async (patentId: number, depth: number = 2) => {
    const response = await api.get(`/patents/${patentId}/citation-network`, {
      params: { depth },
    });
    return response.data;
  },
};

// 专利评估API
export const patentEvaluationAPI = {
  // 获取评估列表
  getEvaluations: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/evaluations`);
    return response.data;
  },

  // 创建评估
  createEvaluation: async (
    patentId: number,
    data: {
      evaluatorId: number;
      score: number;
      criteria: string[];
      comments: string;
      recommendations: string[];
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/evaluations`, data);
    return response.data;
  },

  // 更新评估
  updateEvaluation: async (evaluationId: number, data: any) => {
    const response = await api.put(`/patent-evaluations/${evaluationId}`, data);
    return response.data;
  },

  // 删除评估
  deleteEvaluation: async (evaluationId: number) => {
    const response = await api.delete(`/patent-evaluations/${evaluationId}`);
    return response.data;
  },

  // 获取评估统计
  getEvaluationStats: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/evaluations/stats`);
    return response.data;
  },
};

// 专利监控API
export const patentMonitoringAPI = {
  // 获取监控列表
  getMonitoringList: async (userId: number) => {
    const response = await api.get(`/users/${userId}/patent-monitoring`);
    return response.data;
  },

  // 添加专利监控
  addToMonitoring: async (patentId: number, userId: number) => {
    const response = await api.post("/patent-monitoring", {
      patentId,
      userId,
    });
    return response.data;
  },

  // 移除专利监控
  removeFromMonitoring: async (patentId: number, userId: number) => {
    const response = await api.delete("/patent-monitoring", {
      data: { patentId, userId },
    });
    return response.data;
  },

  // 获取监控通知
  getMonitoringNotifications: async (userId: number) => {
    const response = await api.get(`/users/${userId}/monitoring-notifications`);
    return response.data;
  },

  // 设置监控规则
  setMonitoringRules: async (userId: number, rules: any) => {
    const response = await api.put(`/users/${userId}/monitoring-rules`, rules);
    return response.data;
  },
};

// 专利检索API
export const patentSearchAPI = {
  // 高级检索
  advancedSearch: async (params: {
    keywords: string[];
    status: string[];
    type: string[];
    categoryId: number[];
    dateRange: { start: string; end: string };
    applicants: string[];
    inventors: string[];
    page: number;
    limit: number;
  }) => {
    const response = await api.post("/patents/advanced-search", params);
    return response.data;
  },

  // 相似专利检索
  findSimilarPatents: async (patentId: number, limit: number = 10) => {
    const response = await api.get(`/patents/${patentId}/similar`, {
      params: { limit },
    });
    return response.data;
  },

  // 技术领域检索
  searchByTechnology: async (technology: string, limit: number = 20) => {
    const response = await api.get("/patents/search/technology", {
      params: { technology, limit },
    });
    return response.data;
  },

  // 申请人检索
  searchByApplicant: async (applicant: string, limit: number = 20) => {
    const response = await api.get("/patents/search/applicant", {
      params: { applicant, limit },
    });
    return response.data;
  },

  // 发明人检索
  searchByInventor: async (inventor: string, limit: number = 20) => {
    const response = await api.get("/patents/search/inventor", {
      params: { inventor, limit },
    });
    return response.data;
  },
};

// 专利统计增强API
export const enhancedStatsAPI = {
  // 获取专利趋势分析
  getPatentTrends: async (period: string, groupBy: string) => {
    const response = await api.get("/stats/patent-trends", {
      params: { period, groupBy },
    });
    return response.data;
  },

  // 获取技术分布统计
  getTechnologyDistribution: async (category?: string) => {
    const response = await api.get("/stats/technology-distribution", {
      params: { category },
    });
    return response.data;
  },

  // 获取申请人排名
  getApplicantRanking: async (limit: number = 20) => {
    const response = await api.get("/stats/applicant-ranking", {
      params: { limit },
    });
    return response.data;
  },

  // 获取发明人排名
  getInventorRanking: async (limit: number = 20) => {
    const response = await api.get("/stats/inventor-ranking", {
      params: { limit },
    });
    return response.data;
  },

  // 获取专利价值分布
  getPatentValueDistribution: async () => {
    const response = await api.get("/stats/patent-value-distribution");
    return response.data;
  },

  // 获取地理分布统计
  getGeographicDistribution: async () => {
    const response = await api.get("/stats/geographic-distribution");
    return response.data;
  },
};

// 专利预警API
export const patentAlertAPI = {
  // 获取预警列表
  getAlerts: async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
    status?: string;
  }) => {
    const response = await api.get("/patent-alerts", { params });
    return response.data;
  },

  // 创建预警规则
  createAlertRule: async (data: {
    name: string;
    type: string;
    conditions: any;
    actions: any[];
    enabled: boolean;
  }) => {
    const response = await api.post("/patent-alert-rules", data);
    return response.data;
  },

  // 更新预警规则
  updateAlertRule: async (ruleId: number, data: any) => {
    const response = await api.put(`/patent-alert-rules/${ruleId}`, data);
    return response.data;
  },

  // 删除预警规则
  deleteAlertRule: async (ruleId: number) => {
    const response = await api.delete(`/patent-alert-rules/${ruleId}`);
    return response.data;
  },

  // 获取预警统计
  getAlertStats: async () => {
    const response = await api.get("/patent-alerts/stats");
    return response.data;
  },
};

// 专利质量评估API
export const patentQualityAPI = {
  // 获取质量评估
  getQualityAssessment: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/quality-assessment`);
    return response.data;
  },

  // 执行质量评估
  performQualityAssessment: async (patentId: number) => {
    const response = await api.post(`/patents/${patentId}/quality-assessment`);
    return response.data;
  },

  // 获取质量指标
  getQualityMetrics: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/quality-metrics`);
    return response.data;
  },

  // 获取质量报告
  getQualityReport: async (patentId: number, format: string = "pdf") => {
    const response = await api.get(`/patents/${patentId}/quality-report`, {
      params: { format },
    });
    return response.data;
  },
};

// 专利维护增强API
export const enhancedMaintenanceAPI = {
  // 获取维护计划
  getMaintenancePlan: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/maintenance-plan`);
    return response.data;
  },

  // 创建维护计划
  createMaintenancePlan: async (
    patentId: number,
    data: {
      schedule: any[];
      reminders: any[];
      autoRenewal: boolean;
    }
  ) => {
    const response = await api.post(
      `/patents/${patentId}/maintenance-plan`,
      data
    );
    return response.data;
  },

  // 更新维护计划
  updateMaintenancePlan: async (planId: number, data: any) => {
    const response = await api.put(`/patent-maintenance-plans/${planId}`, data);
    return response.data;
  },

  // 获取维护历史
  getMaintenanceHistory: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/maintenance-history`);
    return response.data;
  },

  // 设置自动维护
  setAutoMaintenance: async (patentId: number, enabled: boolean) => {
    const response = await api.put(`/patents/${patentId}/auto-maintenance`, {
      enabled,
    });
    return response.data;
  },
};

// 专利监控增强API
export const enhancedMonitoringAPI = {
  // 创建专利监控
  createMonitor: async (
    patentId: number,
    data: {
      monitorType: string;
      frequency: string;
      alertEmail: string;
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/monitor`, data);
    return response.data;
  },

  // 获取专利监控信息
  getPatentMonitor: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/monitor`);
    return response.data;
  },
};

// 专利预警增强API
export const enhancedAlertAPI = {
  // 获取预警列表
  getAlerts: async (params?: { type?: string; severity?: string }) => {
    const response = await api.get("/patents/alerts", { params });
    return response.data;
  },

  // 标记预警为已读
  markAlertAsRead: async (alertId: number) => {
    const response = await api.put(`/patents/alerts/${alertId}/read`);
    return response.data;
  },

  // 删除预警
  deleteAlert: async (alertId: number) => {
    const response = await api.delete(`/patents/alerts/${alertId}`);
    return response.data;
  },
};

// 高级检索API
export const advancedSearchAPI = {
  // 高级检索
  search: async (params: {
    keywords?: string;
    technicalField?: string;
    applicant?: string;
    inventor?: string;
    dateRange?: { start: string; end: string };
    status?: string;
    type?: string;
    categoryId?: number;
  }) => {
    const response = await api.post("/patents/advanced-search", params);
    return response.data;
  },
};

// 专利统计API
export const patentStatisticsAPI = {
  // 获取统计数据
  getStatistics: async (timeRange?: string) => {
    const response = await api.get("/patents/statistics", {
      params: { timeRange },
    });
    return response.data;
  },
};

// 专利交易API
export const patentTransactionAPI = {
  // 创建交易记录
  createTransaction: async (
    patentId: number,
    data: {
      transactionType: string;
      amount: number;
      currency: string;
      buyer: string;
      seller: string;
      terms: string;
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/transactions`, data);
    return response.data;
  },

  // 获取交易记录
  getTransactions: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/transactions`);
    return response.data;
  },
};

// 专利诉讼API
export const patentLitigationAPI = {
  // 创建诉讼记录
  createLitigation: async (
    patentId: number,
    data: {
      caseNumber: string;
      court: string;
      plaintiff: string;
      defendant: string;
      caseType: string;
      description: string;
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/litigations`, data);
    return response.data;
  },

  // 获取诉讼记录
  getLitigations: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/litigations`);
    return response.data;
  },
};

// 专利许可API
export const patentLicenseAPI = {
  // 创建许可记录
  createLicense: async (
    patentId: number,
    data: {
      licensee: string;
      licenseType: string;
      territory: string;
      duration: string;
      royalty: string;
      terms: string;
    }
  ) => {
    const response = await api.post(`/patents/${patentId}/licenses`, data);
    return response.data;
  },

  // 获取许可记录
  getLicenses: async (patentId: number) => {
    const response = await api.get(`/patents/${patentId}/licenses`);
    return response.data;
  },
};

// 第三阶段：高级数据安全功能API
export const advancedSecurityAPI = {
  // 威胁检测API
  threatDetection: {
    getRules: async () => {
      const response = await api.get("/threat-detection/rules");
      return response.data;
    },
    addRule: async (rule: any) => {
      const response = await api.post("/threat-detection/rules", rule);
      return response.data;
    },
    getScores: async () => {
      const response = await api.get("/threat-detection/scores");
      return response.data;
    },
    getUserScore: async (userId: number) => {
      const response = await api.get(`/threat-detection/scores/${userId}`);
      return response.data;
    },
    analyzeEvent: async (eventType: string, metadata: any) => {
      const response = await api.post("/threat-detection/analyze", {
        eventType,
        metadata,
      });
      return response.data;
    },
    getReport: async (
      startDate?: string,
      endDate?: string,
      userId?: number
    ) => {
      const params: any = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (userId) params.userId = userId;

      const response = await api.get("/threat-detection/report", { params });
      return response.data;
    },
  },

  // 合规性检查API
  compliance: {
    getRules: async () => {
      const response = await api.get("/compliance/rules");
      return response.data;
    },
    performCheck: async (ruleId?: string) => {
      const response = await api.post("/compliance/check", { ruleId });
      return response.data;
    },
    getReport: async (period: string, startDate?: string, endDate?: string) => {
      const params: any = {};
      if (period) params.period = period;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/compliance/report", { params });
      return response.data;
    },
    getPolicies: async () => {
      const response = await api.get("/compliance/policies");
      return response.data;
    },
  },

  // 安全审计API
  audit: {
    recordEvent: async (
      action: string,
      resource: string,
      resourceId?: string,
      details?: any
    ) => {
      const response = await api.post("/audit/event", {
        action,
        resource,
        resourceId,
        details,
      });
      return response.data;
    },
    getTrails: async (
      userId?: number,
      startDate?: string,
      endDate?: string,
      limit?: number
    ) => {
      const params: any = {};
      if (userId) params.userId = userId;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (limit) params.limit = limit;

      const response = await api.get("/audit/trails", { params });
      return response.data;
    },
    getMetrics: async (
      category?: string,
      startDate?: string,
      endDate?: string
    ) => {
      const params: any = {};
      if (category) params.category = category;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await api.get("/audit/metrics", { params });
      return response.data;
    },
    getRisks: async () => {
      const response = await api.get("/audit/risks");
      return response.data;
    },
    getUserRisk: async (userId: number) => {
      const response = await api.get(`/audit/risks/${userId}`);
      return response.data;
    },
    getDashboard: async () => {
      const response = await api.get("/audit/dashboard");
      return response.data;
    },
  },
};

export default api;
