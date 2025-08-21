// 用户类型定义
export interface User {
  id: number;
  username: string;
  email: string;
  realName: string;
  role: string;
  department?: string;
  avatar?: string;
  createdAt?: string;
  lastLoginAt?: string;
}

// 专利状态枚举
export type PatentStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "maintained";

// 专利类型枚举
export type PatentType = "invention" | "utility_model" | "design" | "software";

// 专利分类
export interface PatentCategory {
  id: number;
  name: string;
  description?: string;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

// 专利实体
export interface Patent {
  id: number;
  title: string;
  description?: string;
  patentNumber: string;
  applicationDate: string;
  publicationDate?: string;
  grantDate?: string;
  expirationDate?: string;
  status: PatentStatus;
  type: PatentType;
  categoryId?: number;
  category?: PatentCategory;
  priority?: string;
  technicalField?: string;
  keywords?: string[];
  applicants?: string[];
  inventors?: string[];
  abstract?: string;
  claims?: string;
  drawings?: string[];
  familyId?: number;
  userId: number;
  user?: User;
  fees?: PatentFee[];
  deadlines?: Deadline[];
  documents?: PatentDocument[];
  createdAt: string;
  updatedAt: string;
}

// 专利文档
export interface PatentDocument {
  id: number;
  patentId: number;
  name: string;
  type: "application" | "publication" | "grant" | "amendment" | "other";
  fileUrl: string;
  fileSize: number;
  uploadedAt: string;
  uploadedBy: number;
}

// 专利费用
export interface PatentFee {
  id: number;
  patentId: number;
  type: "application" | "examination" | "grant" | "maintenance" | "other";
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: "pending" | "paid" | "overdue";
  description?: string;
}

// 专利事件
export interface PatentEvent {
  id: number;
  patentId: number;
  type:
    | "application"
    | "publication"
    | "examination"
    | "grant"
    | "maintenance"
    | "amendment";
  title: string;
  description: string;
  date: string;
  documents?: PatentDocument[];
}

// 专利搜索参数
export interface PatentSearchParams {
  keyword?: string;
  status?: PatentStatus[];
  type?: PatentType[];
  categoryId?: number[];
  dateRange?: {
    start: string;
    end: string;
  };
  applicants?: string[];
  inventors?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

// 专利统计
export interface PatentStatistics {
  total: number;
  byStatus: Record<PatentStatus, number>;
  byType: Record<PatentType, number>;
  byCategory: Record<number, number>;
  byYear: Record<string, number>;
  recentApplications: number;
  expiringSoon: number;
  maintenanceDue: number;
}

// API响应类型
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Element Plus 表格相关类型
export interface PatentTableSelection {
  id: number;
  title: string;
  patentNumber: string;
  status: PatentStatus;
  type: PatentType;
  applicationDate: string;
}

// 快速操作接口
export interface QuickAction {
  icon: string;
  title: string;
  description: string;
  action: () => void;
}

// 菜单项接口
export interface MenuItem {
  path: string;
  title: string;
  icon: any; // Vue组件类型
  exact: boolean;
}

// 文件上传相关
export interface UploadFile {
  name: string;
  file: File | null;
  type: string;
  description: string;
}

// 验证规则
export interface ValidationRule {
  required?: boolean;
  message?: string;
  trigger?: string;
  validator?: (
    rule: any,
    value: any,
    callback: (error?: Error) => void
  ) => void;
  min?: number;
  max?: number;
  pattern?: RegExp;
}

// API响应包装
export interface ApiResult<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 专利分析相关类型
export interface PatentAnalysis {
  id: number;
  patentId: number;
  type: "technology" | "competition" | "value" | "risk";
  analysisData: any;
  createdAt: string;
  updatedAt: string;
}

export interface TechnologyAnalysis {
  technologyArea: string;
  innovationLevel: number;
  marketPotential: number;
  competitiveAdvantage: string[];
  technicalChallenges: string[];
  recommendations: string[];
}

export interface CompetitionAnalysis {
  competitors: string[];
  marketShare: number;
  competitivePosition: "leader" | "challenger" | "follower" | "niche";
  threats: string[];
  opportunities: string[];
}

export interface ValueEvaluation {
  estimatedValue: number;
  currency: string;
  valuationMethod: string;
  factors: string[];
  confidence: number;
  lastUpdated: string;
}

export interface RiskAssessment {
  riskLevel: "low" | "medium" | "high" | "critical";
  riskFactors: string[];
  mitigationStrategies: string[];
  probability: number;
  impact: number;
}

// 专利族相关类型
export interface PatentFamily {
  id: number;
  name: string;
  description?: string;
  patentIds: number[];
  patents: Patent[];
  createdAt: string;
  updatedAt: string;
}

// 专利引用关系类型
export interface PatentCitation {
  id: number;
  citingPatentId: number;
  citedPatentId: number;
  citationType: "forward" | "backward";
  citationDate: string;
  relevance: number;
  citingPatent?: Patent;
  citedPatent?: Patent;
}

export interface CitationNetwork {
  patentId: number;
  forwardCitations: PatentCitation[];
  backwardCitations: PatentCitation[];
  networkDepth: number;
  totalConnections: number;
}

// 专利评估类型
export interface PatentEvaluation {
  id: number;
  patentId: number;
  evaluatorId: number;
  evaluator: User;
  score: number;
  criteria: string[];
  comments: string;
  recommendations: string[];
  evaluationDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationStats {
  totalEvaluations: number;
  averageScore: number;
  scoreDistribution: { score: number; count: number }[];
  evaluatorBreakdown: { evaluatorId: number; count: number }[];
}

// 专利监控类型
export interface PatentMonitoring {
  id: number;
  patentId: number;
  userId: number;
  user: User;
  patent: Patent;
  monitoringRules: MonitoringRule[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MonitoringRule {
  id: number;
  type:
    | "status_change"
    | "deadline_approaching"
    | "citation_update"
    | "legal_action";
  conditions: any;
  actions: string[];
  enabled: boolean;
}

export interface MonitoringNotification {
  id: number;
  userId: number;
  patentId: number;
  type: string;
  message: string;
  severity: "low" | "medium" | "high" | "critical";
  isRead: boolean;
  createdAt: string;
}

// 专利交易类型
export interface PatentTransaction {
  id: number;
  patentId: number;
  patent: Patent;
  type: "sale" | "license" | "assignment" | "mortgage";
  buyerId: number;
  buyer: User;
  sellerId: number;
  seller: User;
  amount: number;
  currency: string;
  terms: any;
  status: "pending" | "in_progress" | "completed" | "cancelled";
  transactionDate: string;
  createdAt: string;
  updatedAt: string;
}

// 专利诉讼类型
export interface PatentLitigation {
  id: number;
  patentId: number;
  patent: Patent;
  caseNumber: string;
  court: string;
  plaintiff: string;
  defendant: string;
  filingDate: string;
  status: "pending" | "active" | "settled" | "dismissed" | "closed";
  description: string;
  documents: LitigationDocument[];
  createdAt: string;
  updatedAt: string;
}

export interface LitigationDocument {
  id: number;
  litigationId: number;
  name: string;
  type: string;
  fileUrl: string;
  uploadDate: string;
}

// 专利许可类型
export interface PatentLicense {
  id: number;
  patentId: number;
  patent: Patent;
  licenseeId: number;
  licensee: User;
  licensorId: number;
  licensor: User;
  type: "exclusive" | "non-exclusive" | "sublicense";
  territory: string[];
  duration: string;
  royalty: number;
  terms: any;
  status: "active" | "expired" | "terminated" | "pending";
  startDate: string;
  endDate: string;
  createdAt: string;
  updatedAt: string;
}

// 专利检索类型
export interface AdvancedSearchParams {
  keywords: string[];
  status: string[];
  type: string[];
  categoryId: number[];
  dateRange: { start: string; end: string };
  applicants: string[];
  inventors: string[];
  page: number;
  limit: number;
}

export interface SearchResult {
  patents: Patent[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 专利统计类型
export interface PatentTrends {
  period: string;
  groupBy: string;
  data: { date: string; count: number }[];
}

export interface TechnologyDistribution {
  category: string;
  count: number;
  percentage: number;
}

export interface RankingItem {
  id: number;
  name: string;
  count: number;
  rank: number;
}

export interface ValueDistribution {
  valueRange: string;
  count: number;
  percentage: number;
}

export interface GeographicDistribution {
  country: string;
  count: number;
  percentage: number;
}

// 专利预警类型
export interface PatentAlert {
  id: number;
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  message: string;
  status: "active" | "acknowledged" | "resolved";
  patentId?: number;
  patent?: Patent;
  createdAt: string;
  updatedAt: string;
}

export interface AlertRule {
  id: number;
  name: string;
  type: string;
  conditions: any;
  actions: any[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AlertStats {
  totalAlerts: number;
  activeAlerts: number;
  alertsBySeverity: { severity: string; count: number }[];
  alertsByType: { type: string; count: number }[];
}

// 专利质量类型
export interface QualityAssessment {
  id: number;
  patentId: number;
  patent: Patent;
  overallScore: number;
  technicalScore: number;
  legalScore: number;
  commercialScore: number;
  metrics: QualityMetrics;
  recommendations: string[];
  assessmentDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface QualityMetrics {
  novelty: number;
  inventiveness: number;
  industrialApplicability: number;
  clarity: number;
  support: number;
  enablement: number;
  writtenDescription: number;
}

// 专利维护增强类型
export interface MaintenancePlan {
  id: number;
  patentId: number;
  patent: Patent;
  schedule: MaintenanceSchedule[];
  reminders: MaintenanceReminder[];
  autoRenewal: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MaintenanceSchedule {
  id: number;
  dueDate: string;
  type: string;
  description: string;
  amount: number;
  currency: string;
  status: "pending" | "completed" | "overdue";
}

export interface MaintenanceReminder {
  id: number;
  reminderDate: string;
  message: string;
  isSent: boolean;
  sentAt?: string;
}

export interface MaintenanceHistory {
  id: number;
  patentId: number;
  action: string;
  date: string;
  amount: number;
  currency: string;
  notes: string;
  performedBy: string;
}

// 扩展的专利类型
export interface ExtendedPatent extends Patent {
  analysis?: PatentAnalysis;
  family?: PatentFamily;
  citations?: CitationNetwork;
  evaluations?: PatentEvaluation[];
  monitoring?: PatentMonitoring;
  transactions?: PatentTransaction[];
  litigations?: PatentLitigation[];
  licenses?: PatentLicense[];
  qualityAssessment?: QualityAssessment;
  maintenancePlan?: MaintenancePlan;
}

// 期限类型定义
export interface Deadline {
  id: number;
  patentId: number;
  title: string;
  description?: string;
  dueDate: string;
  type: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
}
