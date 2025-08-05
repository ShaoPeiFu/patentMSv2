// 期限类型
export type DeadlineType =
  | 'application'      // 申请期限
  | 'examination'      // 审查期限
  | 'maintenance'      // 年费期限
  | 'renewal'          // 续展期限
  | 'priority'         // 优先权期限
  | 'extension'        // 延期期限
  | 'correction'       // 更正期限
  | 'opposition'       // 异议期限
  | 'appeal'           // 上诉期限
  | 'other';           // 其他期限

// 期限状态
export type DeadlineStatus =
  | 'pending'          // 待处理
  | 'completed'        // 已完成
  | 'overdue'          // 已逾期
  | 'cancelled'        // 已取消
  | 'extended';        // 已延期

// 提醒级别
export type ReminderLevel =
  | 'info'             // 信息提醒
  | 'warning'          // 警告提醒
  | 'urgent'           // 紧急提醒
  | 'critical';        // 严重逾期

// 风险评估等级
export type RiskLevel =
  | 'low'              // 低风险
  | 'medium'           // 中风险
  | 'high'             // 高风险
  | 'critical';        // 严重风险

// 期限记录
export interface DeadlineRecord {
  id: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  deadlineType: DeadlineType;
  deadlineDate: string;
  status: DeadlineStatus;
  description: string;
  priority: 'high' | 'medium' | 'low';
  riskLevel: RiskLevel;
  reminderLevel: ReminderLevel;
  daysUntilDeadline: number;
  isCompleted: boolean;
  completedDate?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 智能提醒
export interface SmartReminder {
  id: number;
  deadlineId: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  reminderType: 'email' | 'sms' | 'notification' | 'calendar';
  reminderLevel: ReminderLevel;
  message: string;
  scheduledDate: string;
  isSent: boolean;
  sentAt?: string;
  isRead: boolean;
  createdAt: string;
}

// 日历事件
export interface CalendarEvent {
  id: number;
  deadlineId: number;
  patentId: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  allDay: boolean;
  color: string;
  type: 'deadline' | 'reminder' | 'risk';
  priority: 'high' | 'medium' | 'low';
  isCompleted: boolean;
}

// 期限风险评估
export interface RiskAssessment {
  id: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  riskLevel: RiskLevel;
  riskScore: number; // 0-100
  riskFactors: string[];
  mitigationActions: string[];
  assessmentDate: string;
  nextAssessmentDate: string;
  assessedBy: string;
  notes?: string;
}

// 批量操作
export interface BatchOperation {
  id: number;
  operationType: 'extend' | 'complete' | 'cancel' | 'remind';
  targetDeadlines: number[];
  parameters: Record<string, any>;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number; // 0-100
  result: {
    success: number;
    failed: number;
    errors: string[];
  };
  createdAt: string;
  completedAt?: string;
}

// 期限统计
export interface DeadlineStatistics {
  total: number;
  pending: number;
  completed: number;
  overdue: number;
  cancelled: number;
  extended: number;
  byType: Record<DeadlineType, {
    count: number;
    overdue: number;
    completed: number;
  }>;
  byRiskLevel: Record<RiskLevel, {
    count: number;
    overdue: number;
  }>;
  upcomingDeadlines: DeadlineRecord[];
  overdueDeadlines: DeadlineRecord[];
  highRiskDeadlines: DeadlineRecord[];
}

// 期限查询条件
export interface DeadlineQueryCondition {
  patentId?: number;
  patentNumber?: string;
  deadlineType?: DeadlineType;
  status?: DeadlineStatus;
  riskLevel?: RiskLevel;
  dateRange?: {
    start: string;
    end: string;
  };
  priority?: 'high' | 'medium' | 'low';
}

// 期限导出选项
export interface DeadlineExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeDetails: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: DeadlineQueryCondition;
} 