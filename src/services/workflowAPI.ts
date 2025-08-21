import api from "@/utils/api";
import type { ApprovalWorkflow, WorkflowTemplate } from "@/types/document";

// 工作流API响应类型
interface WorkflowResponse {
  success: boolean;
  message?: string;
  workflow?: ApprovalWorkflow;
  workflows?: ApprovalWorkflow[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

interface WorkflowTemplateResponse {
  success: boolean;
  message?: string;
  template?: WorkflowTemplate;
  templates?: WorkflowTemplate[];
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 工作流管理API
export const workflowAPI = {
  // 获取工作流列表
  async getWorkflows(params?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<WorkflowResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append("status", params.status);
      // 注意：ApprovalWorkflow模型没有category字段
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await api.get(`/workflows?${queryParams.toString()}`);
      return response.data;
    } catch (error) {
      console.error("获取工作流列表失败:", error);
      throw error;
    }
  },

  // 获取工作流详情
  async getWorkflow(id: number): Promise<WorkflowResponse> {
    try {
      const response = await api.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error("获取工作流详情失败:", error);
      throw error;
    }
  },

  // 创建工作流
  async createWorkflow(
    workflow: Omit<ApprovalWorkflow, "id" | "createdAt" | "updatedAt">
  ): Promise<WorkflowResponse> {
    try {
      const response = await api.post("/workflows", workflow);
      return response.data;
    } catch (error) {
      console.error("创建工作流失败:", error);
      throw error;
    }
  },

  // 更新工作流
  async updateWorkflow(
    id: number,
    updates: Partial<ApprovalWorkflow>
  ): Promise<WorkflowResponse> {
    try {
      const response = await api.put(`/workflows/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error("更新工作流失败:", error);
      throw error;
    }
  },

  // 删除工作流
  async deleteWorkflow(id: number): Promise<WorkflowResponse> {
    try {
      const response = await api.delete(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      console.error("删除工作流失败:", error);
      throw error;
    }
  },

  // 切换工作流状态
  async toggleWorkflowStatus(
    id: number,
    status: "active" | "inactive"
  ): Promise<WorkflowResponse> {
    try {
      const response = await api.patch(`/workflows/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error("切换工作流状态失败:", error);
      throw error;
    }
  },
};

// 工作流模板API
export const workflowTemplateAPI = {
  // 获取模板列表
  async getTemplates(params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<WorkflowTemplateResponse> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.category) queryParams.append("category", params.category);
      if (params?.status) queryParams.append("status", params.status);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await api.get(
        `/workflow-templates?${queryParams.toString()}`
      );
      return response.data;
    } catch (error) {
      console.error("获取模板列表失败:", error);
      throw error;
    }
  },

  // 获取模板详情
  async getTemplate(id: number): Promise<WorkflowTemplateResponse> {
    try {
      const response = await api.get(`/workflow-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error("获取模板详情失败:", error);
      throw error;
    }
  },

  // 创建模板
  async createTemplate(
    template: Omit<WorkflowTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<WorkflowTemplateResponse> {
    try {
      const response = await api.post("/workflow-templates", template);
      return response.data;
    } catch (error) {
      console.error("创建模板失败:", error);
      throw error;
    }
  },

  // 更新模板
  async updateTemplate(
    id: number,
    updates: Partial<WorkflowTemplate>
  ): Promise<WorkflowTemplateResponse> {
    try {
      const response = await api.put(`/workflow-templates/${id}`, updates);
      return response.data;
    } catch (error) {
      console.error("更新模板失败:", error);
      throw error;
    }
  },

  // 删除模板
  async deleteTemplate(id: number): Promise<WorkflowTemplateResponse> {
    try {
      const response = await api.delete(`/workflow-templates/${id}`);
      return response.data;
    } catch (error) {
      console.error("删除模板失败:", error);
      throw error;
    }
  },

  // 从模板创建工作流
  async createWorkflowFromTemplate(
    templateId: number,
    workflowData: {
      name: string;
      description?: string;
      customSteps?: any[];
    }
  ): Promise<WorkflowResponse> {
    try {
      const response = await api.post(
        `/workflow-templates/${templateId}/create-workflow`,
        workflowData
      );
      return response.data;
    } catch (error) {
      console.error("从模板创建工作流失败:", error);
      throw error;
    }
  },
};

export default {
  workflow: workflowAPI,
  template: workflowTemplateAPI,
};
