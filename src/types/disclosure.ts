// 交底书相关类型定义

export interface DisclosureDocument {
  id: number;
  companyFileNumber: string; // 公司案号
  title: string;
  submitterId: number;
  department: string;
  technicalField?: string;
  description: string;
  keywords?: string;
  inventors: string;
  applicants?: string;
  attachments?: string; // JSON字符串存储附件信息
  status: DisclosureStatus;
  submissionDate: string;
  createdAt: string;
  updatedAt: string;
  submitter?: {
    id: number;
    realName: string;
    department: string;
    email: string;
  };
  evaluations?: DisclosureEvaluation[];
  agencies?: AgencyAssignment[];
}

export interface DisclosureEvaluation {
  id: number;
  disclosureId: number;
  evaluatorId: number;
  evaluationType: EvaluationType;
  evaluationResult: EvaluationResult;
  positiveOpinions?: string;
  negativeOpinions?: string;
  modificationSuggestions?: string;
  patentability?: string;
  marketValue?: string;
  technicalAdvantage?: string;
  competitorAnalysis?: string;
  recommendedAction?: string;
  comments?: string;
  evaluationDate: string;
  createdAt: string;
  updatedAt: string;
  evaluator?: {
    id: number;
    realName: string;
    email: string;
  };
}

export interface PatentAgency {
  id: number;
  name: string;
  contactPerson: string;
  phone?: string;
  email?: string;
  address?: string;
  specialties?: string; // JSON字符串存储专业领域
  serviceLevel: ServiceLevel;
  rating: number;
  collaborationCount: number;
  status: AgencyStatus;
  createdAt: string;
  updatedAt: string;
}

export interface AgencyAssignment {
  id: number;
  disclosureId: number;
  agencyId: number;
  assignedBy: number;
  assignmentDate: string;
  expectedCompletion?: string;
  status: AssignmentStatus;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  agency?: PatentAgency;
  assignedByUser?: {
    id: number;
    realName: string;
  };
}

// 枚举类型
export type DisclosureStatus =
  | "submitted" // 已提交
  | "under_evaluation" // 评估中
  | "approved" // 通过
  | "rejected" // 驳回
  | "archived"; // 归档

export type EvaluationType =
  | "initial" // 初步评估
  | "detailed" // 详细评估
  | "final"; // 最终评估

export type EvaluationResult =
  | "approved" // 通过
  | "rejected" // 驳回
  | "needs_modification"; // 需要修改

export type ServiceLevel =
  | "standard" // 标准
  | "premium" // 高级
  | "vip"; // VIP

export type AgencyStatus =
  | "active" // 活跃
  | "inactive" // 非活跃
  | "suspended"; // 暂停

export type AssignmentStatus =
  | "assigned" // 已分配
  | "in_progress" // 进行中
  | "completed" // 已完成
  | "cancelled"; // 已取消

// 表单数据类型
export interface DisclosureFormData {
  title: string;
  department: string;
  technicalField?: string;
  description: string;
  keywords?: string;
  inventors: string;
  applicants?: string;
  attachments?: File[];
}

export interface EvaluationFormData {
  evaluationType: EvaluationType;
  evaluationResult: EvaluationResult;
  positiveOpinions?: string;
  negativeOpinions?: string;
  modificationSuggestions?: string;
  patentability?: string;
  marketValue?: string;
  technicalAdvantage?: string;
  competitorAnalysis?: string;
  recommendedAction?: string;
  comments?: string;
}

export interface AgencyFormData {
  name: string;
  contactPerson: string;
  phone?: string;
  email?: string;
  address?: string;
  specialties?: string[];
  serviceLevel: ServiceLevel;
}

// 公司案号生成规则
export interface CompanyFileNumberRule {
  department: string;
  prefix: string;
  dateFormat: string; // YYYYMM, YYYY等
  separator: string;
  sequence: boolean; // 是否使用序号
}

// 搜索和筛选
export interface DisclosureSearchParams {
  keyword?: string;
  status?: DisclosureStatus;
  department?: string;
  technicalField?: string;
  submissionDateStart?: string;
  submissionDateEnd?: string;
  evaluatorId?: number;
}

// 统计信息
export interface DisclosureStatistics {
  total: number;
  byStatus: Record<DisclosureStatus, number>;
  byDepartment: Record<string, number>;
  byTechnicalField: Record<string, number>;
  monthlySubmissions: Array<{
    month: string;
    count: number;
  }>;
  evaluationEfficiency: {
    averageDays: number;
    pendingCount: number;
  };
}
