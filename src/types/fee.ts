// 费用类型
export type FeeType = 
  | 'application'      // 申请费
  | 'examination'      // 审查费
  | 'maintenance'      // 年费
  | 'renewal'          // 续展费
  | 'priority'         // 优先权费
  | 'extension'        // 延期费
  | 'correction'       // 更正费
  | 'other';           // 其他费用

// 费用状态
export type FeeStatus = 
  | 'pending'          // 待缴费
  | 'paid'             // 已缴费
  | 'overdue'          // 逾期
  | 'waived'           // 减免
  | 'refunded';        // 已退款

// 缴费提醒级别
export type ReminderLevel = 
  | 'info'             // 信息提醒
  | 'warning'          // 警告提醒
  | 'urgent'           // 紧急提醒
  | 'critical';        // 严重逾期

// 预算类型
export type BudgetType = 
  | 'monthly'          // 月度预算
  | 'quarterly'        // 季度预算
  | 'yearly'           // 年度预算
  | 'project';         // 项目预算

// 费用记录
export interface FeeRecord {
  id: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  feeType: FeeType;
  amount: number;
  currency: string;
  dueDate: string;
  paidDate?: string;
  status: FeeStatus;
  description: string;
  receiptNumber?: string;
  paymentMethod?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 缴费提醒
export interface FeeReminder {
  id: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  feeType: FeeType;
  amount: number;
  dueDate: string;
  daysUntilDue: number;
  level: ReminderLevel;
  isRead: boolean;
  isSent: boolean;
  sentAt?: string;
  createdAt: string;
}

// 费用预算
export interface FeeBudget {
  id: number;
  name: string;
  type: BudgetType;
  amount: number;
  currency: string;
  startDate: string;
  endDate: string;
  spentAmount: number;
  remainingAmount: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// 预算分配
export interface BudgetAllocation {
  id: number;
  budgetId: number;
  budgetName: string;
  feeType: FeeType;
  allocatedAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
}

// 财务对账记录
export interface ReconciliationRecord {
  id: number;
  patentId: number;
  patentNumber: string;
  patentTitle: string;
  feeType: FeeType;
  expectedAmount: number;
  actualAmount: number;
  difference: number;
  reconciliationDate: string;
  status: 'matched' | 'unmatched' | 'pending';
  notes?: string;
  createdAt: string;
}

// 费用统计
export interface FeeStatistics {
  totalFees: number;
  paidFees: number;
  pendingFees: number;
  overdueFees: number;
  totalAmount: number;
  paidAmount: number;
  pendingAmount: number;
  overdueAmount: number;
  byType: Record<FeeType, {
    count: number;
    amount: number;
  }>;
  byStatus: Record<FeeStatus, {
    count: number;
    amount: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    total: number;
    paid: number;
    pending: number;
  }>;
}

// 费用查询条件
export interface FeeQueryCondition {
  patentId?: number;
  patentNumber?: string;
  feeType?: FeeType;
  status?: FeeStatus;
  dateRange?: {
    start: string;
    end: string;
  };
  amountRange?: {
    min: number;
    max: number;
  };
}

// 费用导出选项
export interface FeeExportOptions {
  format: 'excel' | 'csv' | 'pdf';
  includeDetails: boolean;
  dateRange?: {
    start: string;
    end: string;
  };
  filters?: FeeQueryCondition;
} 