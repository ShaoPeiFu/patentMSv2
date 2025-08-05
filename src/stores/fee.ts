import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  FeeRecord,
  FeeReminder,
  FeeBudget,
  BudgetAllocation,
  ReconciliationRecord,
  FeeStatistics,
  FeeQueryCondition,
  FeeType,
  FeeStatus,
  ReminderLevel,

} from '@/types/fee';

export const useFeeStore = defineStore('fee', () => {
  // 状态
  const feeRecords = ref<FeeRecord[]>([]);
  const feeReminders = ref<FeeReminder[]>([]);
  const feeBudgets = ref<FeeBudget[]>([]);
  const budgetAllocations = ref<BudgetAllocation[]>([]);
  const reconciliationRecords = ref<ReconciliationRecord[]>([]);
  const loading = ref(false);

  // 计算属性
  const statistics = computed((): FeeStatistics => {
    const totalFees = feeRecords.value.length;
    const paidFees = feeRecords.value.filter(fee => fee.status === 'paid').length;
    const pendingFees = feeRecords.value.filter(fee => fee.status === 'pending').length;
    const overdueFees = feeRecords.value.filter(fee => fee.status === 'overdue').length;

    const totalAmount = feeRecords.value.reduce((sum, fee) => sum + fee.amount, 0);
    const paidAmount = feeRecords.value
      .filter(fee => fee.status === 'paid')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const pendingAmount = feeRecords.value
      .filter(fee => fee.status === 'pending')
      .reduce((sum, fee) => sum + fee.amount, 0);
    const overdueAmount = feeRecords.value
      .filter(fee => fee.status === 'overdue')
      .reduce((sum, fee) => sum + fee.amount, 0);

    // 按类型统计
    const byType: Record<FeeType, { count: number; amount: number }> = {
      application: { count: 0, amount: 0 },
      examination: { count: 0, amount: 0 },
      maintenance: { count: 0, amount: 0 },
      renewal: { count: 0, amount: 0 },
      priority: { count: 0, amount: 0 },
      extension: { count: 0, amount: 0 },
      correction: { count: 0, amount: 0 },
      other: { count: 0, amount: 0 }
    };

    feeRecords.value.forEach(fee => {
      byType[fee.feeType].count++;
      byType[fee.feeType].amount += fee.amount;
    });

    // 按状态统计
    const byStatus: Record<FeeStatus, { count: number; amount: number }> = {
      pending: { count: 0, amount: 0 },
      paid: { count: 0, amount: 0 },
      overdue: { count: 0, amount: 0 },
      waived: { count: 0, amount: 0 },
      refunded: { count: 0, amount: 0 }
    };

    feeRecords.value.forEach(fee => {
      byStatus[fee.status].count++;
      byStatus[fee.status].amount += fee.amount;
    });

    // 月度趋势
    const monthlyTrend = generateMonthlyTrend();

    return {
      totalFees,
      paidFees,
      pendingFees,
      overdueFees,
      totalAmount,
      paidAmount,
      pendingAmount,
      overdueAmount,
      byType,
      byStatus,
      monthlyTrend
    };
  });

  const activeBudgets = computed(() => 
    feeBudgets.value.filter(budget => budget.isActive)
  );

  const overdueReminders = computed(() => 
    feeReminders.value.filter(reminder => reminder.level === 'critical' || reminder.level === 'urgent')
  );

  const pendingReconciliations = computed(() => 
    reconciliationRecords.value.filter(record => record.status === 'pending')
  );

  // 方法
  const loadFeeRecords = async () => {
    loading.value = true;
    try {
      // 从localStorage加载数据
      const stored = localStorage.getItem('feeRecords');
      if (stored) {
        feeRecords.value = JSON.parse(stored);
      } else {
        // 生成示例数据
        feeRecords.value = generateSampleFeeRecords();
        saveToStorage();
      }
    } catch (error) {
      console.error('加载费用记录失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const loadFeeReminders = async () => {
    try {
      const stored = localStorage.getItem('feeReminders');
      if (stored) {
        feeReminders.value = JSON.parse(stored);
      } else {
        feeReminders.value = generateSampleReminders();
        saveRemindersToStorage();
      }
    } catch (error) {
      console.error('加载缴费提醒失败:', error);
    }
  };

  const loadFeeBudgets = async () => {
    try {
      const stored = localStorage.getItem('feeBudgets');
      if (stored) {
        feeBudgets.value = JSON.parse(stored);
      } else {
        feeBudgets.value = generateSampleBudgets();
        saveBudgetsToStorage();
      }
    } catch (error) {
      console.error('加载费用预算失败:', error);
    }
  };

  const loadReconciliationRecords = async () => {
    try {
      const stored = localStorage.getItem('reconciliationRecords');
      if (stored) {
        reconciliationRecords.value = JSON.parse(stored);
      } else {
        reconciliationRecords.value = generateSampleReconciliations();
        saveReconciliationsToStorage();
      }
    } catch (error) {
      console.error('加载对账记录失败:', error);
    }
  };

  const addFeeRecord = async (feeRecord: Omit<FeeRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newRecord: FeeRecord = {
      ...feeRecord,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    feeRecords.value.push(newRecord);
    saveToStorage();
    
    // 自动生成提醒
    await generateReminder(newRecord);
    
    return newRecord;
  };

  const updateFeeRecord = async (id: number, updates: Partial<FeeRecord>) => {
    const index = feeRecords.value.findIndex(record => record.id === id);
    if (index !== -1) {
      feeRecords.value[index] = {
        ...feeRecords.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveToStorage();
      
      // 如果状态变为已缴费，更新提醒
      if (updates.status === 'paid') {
        await markReminderAsPaid(id);
      }
    }
  };

  const deleteFeeRecord = async (id: number) => {
    const index = feeRecords.value.findIndex(record => record.id === id);
    if (index !== -1) {
      feeRecords.value.splice(index, 1);
      saveToStorage();
    }
  };

  const generateReminder = async (feeRecord: FeeRecord) => {
    const dueDate = new Date(feeRecord.dueDate);
    const today = new Date();
    const daysUntilDue = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    let level: ReminderLevel = 'info';
    if (daysUntilDue < 0) {
      level = 'critical';
    } else if (daysUntilDue <= 7) {
      level = 'urgent';
    } else if (daysUntilDue <= 30) {
      level = 'warning';
    }

    const reminder: FeeReminder = {
      id: Date.now(),
      patentId: feeRecord.patentId,
      patentNumber: feeRecord.patentNumber,
      patentTitle: feeRecord.patentTitle,
      feeType: feeRecord.feeType,
      amount: feeRecord.amount,
      dueDate: feeRecord.dueDate,
      daysUntilDue,
      level,
      isRead: false,
      isSent: false,
      createdAt: new Date().toISOString()
    };

    feeReminders.value.push(reminder);
    saveRemindersToStorage();
  };

  const markReminderAsPaid = async (patentId: number) => {
    feeReminders.value = feeReminders.value.filter(
      reminder => reminder.patentId !== patentId
    );
    saveRemindersToStorage();
  };

  const markReminderAsRead = async (id: number) => {
    const reminder = feeReminders.value.find(r => r.id === id);
    if (reminder) {
      reminder.isRead = true;
      saveRemindersToStorage();
    }
  };

  const addBudget = async (budget: Omit<FeeBudget, 'id' | 'createdAt' | 'updatedAt' | 'spentAmount' | 'remainingAmount'>) => {
    const newBudget: FeeBudget = {
      ...budget,
      id: Date.now(),
      spentAmount: 0,
      remainingAmount: budget.amount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    feeBudgets.value.push(newBudget);
    saveBudgetsToStorage();
    return newBudget;
  };

  const updateBudget = async (id: number, updates: Partial<FeeBudget>) => {
    const index = feeBudgets.value.findIndex(budget => budget.id === id);
    if (index !== -1) {
      feeBudgets.value[index] = {
        ...feeBudgets.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveBudgetsToStorage();
    }
  };

  const deleteBudget = async (id: number) => {
    const index = feeBudgets.value.findIndex(budget => budget.id === id);
    if (index !== -1) {
      feeBudgets.value.splice(index, 1);
      saveBudgetsToStorage();
    }
  };

  const addReconciliationRecord = async (record: Omit<ReconciliationRecord, 'id' | 'createdAt'>) => {
    const newRecord: ReconciliationRecord = {
      ...record,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    reconciliationRecords.value.push(newRecord);
    saveReconciliationsToStorage();
    return newRecord;
  };

  const updateReconciliationStatus = async (id: number, status: 'matched' | 'unmatched' | 'pending') => {
    const record = reconciliationRecords.value.find(r => r.id === id);
    if (record) {
      record.status = status;
      saveReconciliationsToStorage();
    }
  };

  const updateReconciliationRecord = async (id: number, updates: Partial<ReconciliationRecord>) => {
    const index = reconciliationRecords.value.findIndex(record => record.id === id);
    if (index !== -1) {
      reconciliationRecords.value[index] = {
        ...reconciliationRecords.value[index],
        ...updates
      };
      saveReconciliationsToStorage();
    }
  };

  const queryFees = (conditions: FeeQueryCondition): FeeRecord[] => {
    let filtered = [...feeRecords.value];

    if (conditions.patentId) {
      filtered = filtered.filter(fee => fee.patentId === conditions.patentId);
    }

    if (conditions.patentNumber) {
      filtered = filtered.filter(fee => 
        fee.patentNumber.toLowerCase().includes(conditions.patentNumber!.toLowerCase())
      );
    }

    if (conditions.feeType) {
      filtered = filtered.filter(fee => fee.feeType === conditions.feeType);
    }

    if (conditions.status) {
      filtered = filtered.filter(fee => fee.status === conditions.status);
    }

    if (conditions.dateRange) {
      filtered = filtered.filter(fee => {
        const feeDate = new Date(fee.dueDate);
        const start = new Date(conditions.dateRange!.start);
        const end = new Date(conditions.dateRange!.end);
        return feeDate >= start && feeDate <= end;
      });
    }

    if (conditions.amountRange) {
      filtered = filtered.filter(fee => 
        fee.amount >= conditions.amountRange!.min && 
        fee.amount <= conditions.amountRange!.max
      );
    }

    return filtered;
  };

  const exportFees = (options: { format: 'excel' | 'csv' | 'pdf'; filters?: FeeQueryCondition }) => {
    let data = feeRecords.value;
    
    if (options.filters) {
      data = queryFees(options.filters);
    }

    // 这里可以实现具体的导出逻辑
    console.log('导出费用数据:', data);
    return data;
  };

  // 辅助方法
  const generateMonthlyTrend = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const monthStr = date.toISOString().slice(0, 7);
      
      const monthFees = feeRecords.value.filter(fee => 
        fee.createdAt.startsWith(monthStr)
      );
      
      const total = monthFees.reduce((sum, fee) => sum + fee.amount, 0);
      const paid = monthFees
        .filter(fee => fee.status === 'paid')
        .reduce((sum, fee) => sum + fee.amount, 0);
      const pending = monthFees
        .filter(fee => fee.status === 'pending')
        .reduce((sum, fee) => sum + fee.amount, 0);
      
      months.push({
        month: monthStr,
        total,
        paid,
        pending
      });
    }
    
    return months;
  };

  const saveToStorage = () => {
    localStorage.setItem('feeRecords', JSON.stringify(feeRecords.value));
  };

  const saveRemindersToStorage = () => {
    localStorage.setItem('feeReminders', JSON.stringify(feeReminders.value));
  };

  const saveBudgetsToStorage = () => {
    localStorage.setItem('feeBudgets', JSON.stringify(feeBudgets.value));
  };

  const saveReconciliationsToStorage = () => {
    localStorage.setItem('reconciliationRecords', JSON.stringify(reconciliationRecords.value));
  };

  // 生成示例数据
  const generateSampleFeeRecords = (): FeeRecord[] => {
    return [
      {
        id: 1,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        feeType: 'application',
        amount: 500,
        currency: 'CNY',
        dueDate: '2024-02-15',
        status: 'paid',
        description: '专利申请费',
        receiptNumber: 'RCP001',
        paymentMethod: '银行转账',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        feeType: 'examination',
        amount: 800,
        currency: 'CNY',
        dueDate: '2024-03-20',
        status: 'pending',
        description: '专利审查费',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 3,
        patentId: 2,
        patentNumber: 'CN202300002',
        patentTitle: '智能控制系统',
        feeType: 'maintenance',
        amount: 1200,
        currency: 'CNY',
        dueDate: '2024-01-10',
        status: 'overdue',
        description: '专利年费',
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ];
  };

  const generateSampleReminders = (): FeeReminder[] => {
    return [
      {
        id: 1,
        patentId: 2,
        patentNumber: 'CN202300002',
        patentTitle: '智能控制系统',
        feeType: 'maintenance',
        amount: 1200,
        dueDate: '2024-01-10',
        daysUntilDue: -5,
        level: 'critical',
        isRead: false,
        isSent: true,
        sentAt: '2024-01-05T10:00:00Z',
        createdAt: '2024-01-05T10:00:00Z'
      },
      {
        id: 2,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        feeType: 'examination',
        amount: 800,
        dueDate: '2024-03-20',
        daysUntilDue: 15,
        level: 'warning',
        isRead: false,
        isSent: false,
        createdAt: '2024-01-15T10:00:00Z'
      }
    ];
  };

  const generateSampleBudgets = (): FeeBudget[] => {
    return [
      {
        id: 1,
        name: '2024年度专利费用预算',
        type: 'yearly',
        amount: 50000,
        currency: 'CNY',
        startDate: '2024-01-01',
        endDate: '2024-12-31',
        spentAmount: 2500,
        remainingAmount: 47500,
        description: '年度专利费用总预算',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        name: 'Q1季度预算',
        type: 'quarterly',
        amount: 15000,
        currency: 'CNY',
        startDate: '2024-01-01',
        endDate: '2024-03-31',
        spentAmount: 2500,
        remainingAmount: 12500,
        description: '第一季度费用预算',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-15T10:00:00Z'
      }
    ];
  };

  const generateSampleReconciliations = (): ReconciliationRecord[] => {
    return [
      {
        id: 1,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        feeType: 'application',
        expectedAmount: 500,
        actualAmount: 500,
        difference: 0,
        reconciliationDate: '2024-01-15',
        status: 'matched',
        notes: '费用核对无误',
        createdAt: '2024-01-15T10:00:00Z'
      },
      {
        id: 2,
        patentId: 2,
        patentNumber: 'CN202300002',
        patentTitle: '智能控制系统',
        feeType: 'maintenance',
        expectedAmount: 1200,
        actualAmount: 0,
        difference: -1200,
        reconciliationDate: '2024-01-10',
        status: 'unmatched',
        notes: '费用未缴纳',
        createdAt: '2024-01-10T10:00:00Z'
      }
    ];
  };

  return {
    // 状态
    feeRecords,
    feeReminders,
    feeBudgets,
    budgetAllocations,
    reconciliationRecords,
    loading,
    
    // 计算属性
    statistics,
    activeBudgets,
    overdueReminders,
    pendingReconciliations,
    
    // 方法
    loadFeeRecords,
    loadFeeReminders,
    loadFeeBudgets,
    loadReconciliationRecords,
    addFeeRecord,
    updateFeeRecord,
    deleteFeeRecord,
    generateReminder,
    markReminderAsPaid,
    markReminderAsRead,
    addBudget,
    updateBudget,
    deleteBudget,
    addReconciliationRecord,
    updateReconciliationStatus,
    updateReconciliationRecord,
    queryFees,
    exportFees
  };
}); 