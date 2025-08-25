import api from "./api";
import type {
  DisclosureDocument,
  DisclosureEvaluation,
  PatentAgency,
  AgencyAssignment,
  DisclosureFormData,
  EvaluationFormData,
  AgencyFormData,
  DisclosureSearchParams,
  DisclosureStatistics,
  CompanyFileNumberRule,
} from "../types/disclosure";

// 交底书管理API
export const disclosureAPI = {
  // 获取交底书列表
  getDisclosures: async (
    params?: DisclosureSearchParams
  ): Promise<{
    data: DisclosureDocument[];
    total: number;
    page: number;
    limit: number;
  }> => {
    const response = await api.get("/disclosures", { params });
    return response.data;
  },

  // 获取交底书详情
  getDisclosure: async (id: number): Promise<DisclosureDocument> => {
    const response = await api.get(`/disclosures/${id}`);
    return response.data;
  },

  // 创建交底书
  createDisclosure: async (
    data: DisclosureFormData
  ): Promise<DisclosureDocument> => {
    const formData = new FormData();

    // 添加基本字段
    Object.entries(data).forEach(([key, value]) => {
      if (key === "attachments") return; // 附件单独处理
      if (value !== undefined && value !== null) {
        formData.append(key, String(value));
      }
    });

    // 添加附件
    if (data.attachments && data.attachments.length > 0) {
      data.attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });
    }

    const response = await api.post("/disclosures", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 更新交底书
  updateDisclosure: async (
    id: number,
    data: Partial<DisclosureFormData>
  ): Promise<DisclosureDocument> => {
    const response = await api.put(`/disclosures/${id}`, data);
    return response.data;
  },

  // 删除交底书
  deleteDisclosure: async (id: number): Promise<void> => {
    await api.delete(`/disclosures/${id}`);
  },

  // 生成公司案号
  generateCompanyFileNumber: async (department: string): Promise<string> => {
    const response = await api.post("/disclosures/generate-file-number", {
      department,
    });
    return response.data.fileNumber;
  },

  // 获取统计信息
  getStatistics: async (): Promise<DisclosureStatistics> => {
    const response = await api.get("/disclosures/statistics");
    return response.data;
  },
};

// 评估管理API
export const evaluationAPI = {
  // 获取评估列表
  getEvaluations: async (
    disclosureId?: number
  ): Promise<DisclosureEvaluation[]> => {
    const params = disclosureId ? { disclosureId } : {};
    const response = await api.get("/evaluations", { params });
    return response.data;
  },

  // 创建评估
  createEvaluation: async (
    disclosureId: number,
    data: EvaluationFormData
  ): Promise<DisclosureEvaluation> => {
    const response = await api.post(
      `/disclosures/${disclosureId}/evaluations`,
      data
    );
    return response.data;
  },

  // 更新评估
  updateEvaluation: async (
    id: number,
    data: Partial<EvaluationFormData>
  ): Promise<DisclosureEvaluation> => {
    const response = await api.put(`/evaluations/${id}`, data);
    return response.data;
  },

  // 删除评估
  deleteEvaluation: async (id: number): Promise<void> => {
    await api.delete(`/evaluations/${id}`);
  },

  // 获取待评估的交底书
  getPendingEvaluations: async (): Promise<DisclosureDocument[]> => {
    const response = await api.get("/evaluations/pending");
    return response.data;
  },
};

// 代理机构管理API
export const agencyAPI = {
  // 获取代理机构列表
  getAgencies: async (): Promise<PatentAgency[]> => {
    const response = await api.get("/agencies");
    return response.data;
  },

  // 获取代理机构详情
  getAgency: async (id: number): Promise<PatentAgency> => {
    const response = await api.get(`/agencies/${id}`);
    return response.data;
  },

  // 创建代理机构
  createAgency: async (data: AgencyFormData): Promise<PatentAgency> => {
    const response = await api.post("/agencies", data);
    return response.data;
  },

  // 更新代理机构
  updateAgency: async (
    id: number,
    data: Partial<AgencyFormData>
  ): Promise<PatentAgency> => {
    const response = await api.put(`/agencies/${id}`, data);
    return response.data;
  },

  // 删除代理机构
  deleteAgency: async (id: number): Promise<void> => {
    await api.delete(`/agencies/${id}`);
  },

  // 分配代理机构
  assignAgency: async (
    disclosureId: number,
    agencyId: number,
    notes?: string
  ): Promise<AgencyAssignment> => {
    const response = await api.post(
      `/disclosures/${disclosureId}/assign-agency`,
      {
        agencyId,
        notes,
      }
    );
    return response.data;
  },

  // 更新分配状态
  updateAssignment: async (
    assignmentId: number,
    status: string,
    notes?: string
  ): Promise<AgencyAssignment> => {
    const response = await api.put(`/agency-assignments/${assignmentId}`, {
      status,
      notes,
    });
    return response.data;
  },

  // 获取分配记录
  getAssignments: async (
    disclosureId?: number,
    agencyId?: number
  ): Promise<AgencyAssignment[]> => {
    const params: Record<string, any> = {};
    if (disclosureId) params.disclosureId = disclosureId;
    if (agencyId) params.agencyId = agencyId;

    const response = await api.get("/agency-assignments", { params });
    return response.data;
  },
};

// 公司案号规则管理API
export const fileNumberAPI = {
  // 获取案号生成规则
  getRules: async (): Promise<CompanyFileNumberRule[]> => {
    const response = await api.get("/file-number-rules");
    return response.data;
  },

  // 更新案号生成规则
  updateRule: async (
    department: string,
    rule: CompanyFileNumberRule
  ): Promise<CompanyFileNumberRule> => {
    const response = await api.put(`/file-number-rules/${department}`, rule);
    return response.data;
  },

  // 预览案号
  previewFileNumber: async (department: string): Promise<string> => {
    const response = await api.post("/file-number-rules/preview", {
      department,
    });
    return response.data.preview;
  },
};
