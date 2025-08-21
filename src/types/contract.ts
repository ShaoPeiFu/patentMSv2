// 律师事务所类型
export type LawFirmStatus = "active" | "inactive" | "suspended";
export type ServiceLevel = "premium" | "standard" | "basic";

export interface LawFirm {
  id: number;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  website?: string;
  specialties: string[];
  serviceLevel: ServiceLevel;
  status: LawFirmStatus;
  rating: number;
  contractCount: number;
  totalRevenue: number;
  createdAt: string;
  updatedAt: string;
}

// 合同模板类型
export type ContractType =
  | "patent_application"
  | "patent_prosecution"
  | "patent_litigation"
  | "trademark"
  | "copyright"
  | "custom"
  | "patent_agency"
  | "trademark_registration";
export type TemplateStatus = "draft" | "active" | "archived";

export interface ContractTemplate {
  id: number;
  name: string;
  type: ContractType;
  description: string;
  content: string;
  variables: string[];
  status: TemplateStatus;
  version: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 费用协议类型
export type FeeType = "hourly" | "fixed" | "contingency" | "hybrid";
export type PaymentStatus = "pending" | "paid" | "overdue" | "cancelled";

export interface FeeAgreement {
  id: number;
  lawFirmId: number;
  contractId: number;
  feeType: FeeType;
  amount: number;
  currency: string;
  paymentTerms: string;
  startDate: string;
  endDate: string;
  status: PaymentStatus;
  paidAmount: number;
  lastPaymentDate?: string;
  nextPaymentDate?: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

// 服务质量评估类型
export type EvaluationCriteria =
  | "responsiveness"
  | "quality"
  | "communication"
  | "timeliness"
  | "cost_efficiency";
export type EvaluationStatus = "pending" | "completed" | "overdue";

export interface ServiceEvaluation {
  id: number;
  lawFirmId: number;
  contractId: number;
  evaluatorId: number;
  evaluationDate: string;
  criteria: Record<EvaluationCriteria, number>;
  overallScore: number;
  comments: string;
  recommendations: string;
  status: EvaluationStatus;
  createdAt: string;
  updatedAt: string;
}

// 合同类型
export type ContractStatus = "draft" | "active" | "completed" | "terminated";
export type ContractPriority = "high" | "medium" | "low";

export interface Contract {
  id: number;
  title: string;
  contractNumber: string;
  type: ContractType;
  lawFirmId: number;
  clientId: number;
  templateId?: number;
  status: ContractStatus;
  priority: ContractPriority;
  startDate: string;
  endDate: string;
  value: number;
  currency: string;
  description: string;
  terms: string;
  attachments: string[];
  createdBy: number;
  createdAt: string;
  updatedAt: string;
}

// 查询条件类型
export interface ContractQueryCondition {
  status?: ContractStatus;
  type?: ContractType;
  lawFirmId?: number;
  clientId?: number;
  startDate?: string;
  endDate?: string;
  keyword?: string;
  minValue?: number;
  maxValue?: number;
}

export interface LawFirmQueryCondition {
  status?: LawFirmStatus;
  serviceLevel?: ServiceLevel;
  specialty?: string;
  keyword?: string;
  minRating?: number;
  maxRating?: number;
  minRevenue?: number;
  maxRevenue?: number;
  specialties?: string[];
}

// 统计数据类型
export interface ContractStatistics {
  totalContracts: number;
  activeContracts: number;
  completedContracts: number;
  totalValue: number;
  averageRating: number;
  topLawFirms: Array<{
    id: number;
    name: string;
    contractCount: number;
    revenue: number;
  }>;
  contractsByType: Record<ContractType, number>;
  contractsByStatus: Record<ContractStatus, number>;
}

export interface LawFirmStatistics {
  totalLawFirms: number;
  activeLawFirms: number;
  averageRating: number;
  totalRevenue: number;
  topSpecialties: Array<{ specialty: string; count: number }>;
  lawFirmsByServiceLevel: Record<ServiceLevel, number>;
}

// 导出选项类型
export interface ContractExportOptions {
  format: "pdf" | "excel" | "csv";
  includeAttachments: boolean;
  dateRange?: { start: string; end: string };
  filters?: ContractQueryCondition;
}

export interface LawFirmExportOptions {
  format: "pdf" | "excel" | "csv";
  includeEvaluations: boolean;
  filters?: LawFirmQueryCondition;
}
