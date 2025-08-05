import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import type {
  DeadlineRecord,
  SmartReminder,
  CalendarEvent,
  RiskAssessment,
  BatchOperation,
  DeadlineStatistics,
  DeadlineQueryCondition,
  DeadlineType,
  RiskLevel,
  ReminderLevel
} from '@/types/deadline';

export const useDeadlineStore = defineStore('deadline', () => {
  // 状态
  const deadlineRecords = ref<DeadlineRecord[]>([]);
  const smartReminders = ref<SmartReminder[]>([]);
  const calendarEvents = ref<CalendarEvent[]>([]);
  const riskAssessments = ref<RiskAssessment[]>([]);
  const batchOperations = ref<BatchOperation[]>([]);
  const loading = ref(false);

  // 计算属性
  const statistics = computed((): DeadlineStatistics => {
    const total = deadlineRecords.value.length;
    const pending = deadlineRecords.value.filter(d => d.status === 'pending').length;
    const completed = deadlineRecords.value.filter(d => d.status === 'completed').length;
    const overdue = deadlineRecords.value.filter(d => d.status === 'overdue').length;
    const cancelled = deadlineRecords.value.filter(d => d.status === 'cancelled').length;
    const extended = deadlineRecords.value.filter(d => d.status === 'extended').length;

    // 按类型统计
    const byType: Record<DeadlineType, { count: number; overdue: number; completed: number }> = {
      application: { count: 0, overdue: 0, completed: 0 },
      examination: { count: 0, overdue: 0, completed: 0 },
      maintenance: { count: 0, overdue: 0, completed: 0 },
      renewal: { count: 0, overdue: 0, completed: 0 },
      priority: { count: 0, overdue: 0, completed: 0 },
      extension: { count: 0, overdue: 0, completed: 0 },
      correction: { count: 0, overdue: 0, completed: 0 },
      opposition: { count: 0, overdue: 0, completed: 0 },
      appeal: { count: 0, overdue: 0, completed: 0 },
      other: { count: 0, overdue: 0, completed: 0 }
    };

    deadlineRecords.value.forEach(deadline => {
      byType[deadline.deadlineType].count++;
      if (deadline.status === 'overdue') {
        byType[deadline.deadlineType].overdue++;
      }
      if (deadline.status === 'completed') {
        byType[deadline.deadlineType].completed++;
      }
    });

    // 按风险等级统计
    const byRiskLevel: Record<RiskLevel, { count: number; overdue: number }> = {
      low: { count: 0, overdue: 0 },
      medium: { count: 0, overdue: 0 },
      high: { count: 0, overdue: 0 },
      critical: { count: 0, overdue: 0 }
    };

    deadlineRecords.value.forEach(deadline => {
      if (deadline.riskLevel && byRiskLevel[deadline.riskLevel]) {
        byRiskLevel[deadline.riskLevel].count++;
        if (deadline.status === 'overdue') {
          byRiskLevel[deadline.riskLevel].overdue++;
        }
      }
    });

    // 即将到期的期限
    const upcomingDeadlines = deadlineRecords.value
      .filter(d => d.status === 'pending' && d.daysUntilDeadline <= 30)
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    // 已逾期的期限
    const overdueDeadlines = deadlineRecords.value
      .filter(d => d.status === 'overdue')
      .sort((a, b) => Math.abs(a.daysUntilDeadline) - Math.abs(b.daysUntilDeadline));

    // 高风险期限
    const highRiskDeadlines = deadlineRecords.value
      .filter(d => d.riskLevel === 'high' || d.riskLevel === 'critical')
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    return {
      total,
      pending,
      completed,
      overdue,
      cancelled,
      extended,
      byType,
      byRiskLevel,
      upcomingDeadlines,
      overdueDeadlines,
      highRiskDeadlines
    };
  });

  const urgentReminders = computed(() =>
    smartReminders.value.filter(reminder => 
      reminder.reminderLevel === 'urgent' || reminder.reminderLevel === 'critical'
    )
  );

  const unreadReminders = computed(() =>
    smartReminders.value.filter(reminder => !reminder.isRead)
  );

  const pendingBatchOperations = computed(() =>
    batchOperations.value.filter(op => op.status === 'pending' || op.status === 'processing')
  );

  // 方法
  const loadDeadlineRecords = async () => {
    loading.value = true;
    try {
      const stored = localStorage.getItem('deadlineRecords');
      if (stored) {
        deadlineRecords.value = JSON.parse(stored);
      } else {
        deadlineRecords.value = generateSampleDeadlines();
        saveDeadlinesToStorage();
      }
      
      // 更新所有记录的剩余天数
      deadlineRecords.value.forEach(deadline => {
        deadline.daysUntilDeadline = calculateDaysUntilDeadline(deadline.deadlineDate);
      });
      saveDeadlinesToStorage();
    } catch (error) {
      console.error('加载期限记录失败:', error);
    } finally {
      loading.value = false;
    }
  };

  const loadSmartReminders = async () => {
    try {
      const stored = localStorage.getItem('smartReminders');
      if (stored) {
        smartReminders.value = JSON.parse(stored);
      } else {
        smartReminders.value = generateSampleReminders();
        saveRemindersToStorage();
      }
    } catch (error) {
      console.error('加载智能提醒失败:', error);
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const stored = localStorage.getItem('calendarEvents');
      if (stored) {
        calendarEvents.value = JSON.parse(stored);
      } else {
        calendarEvents.value = generateSampleCalendarEvents();
        saveCalendarEventsToStorage();
      }
    } catch (error) {
      console.error('加载日历事件失败:', error);
    }
  };

  const loadRiskAssessments = async () => {
    try {
      const stored = localStorage.getItem('riskAssessments');
      if (stored) {
        riskAssessments.value = JSON.parse(stored);
      } else {
        riskAssessments.value = generateSampleRiskAssessments();
        saveRiskAssessmentsToStorage();
      }
    } catch (error) {
      console.error('加载风险评估失败:', error);
    }
  };

  const addDeadlineRecord = async (deadline: Omit<DeadlineRecord, 'id' | 'createdAt' | 'updatedAt'>) => {
    const newDeadline: DeadlineRecord = {
      ...deadline,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    deadlineRecords.value.push(newDeadline);
    saveDeadlinesToStorage();

    // 自动生成智能提醒
    await generateSmartReminders(newDeadline);

    // 自动生成日历事件
    await generateCalendarEvent(newDeadline);

    // 自动进行风险评估
    await performRiskAssessment(newDeadline);

    return newDeadline;
  };

  const updateDeadlineRecord = async (id: number, updates: Partial<DeadlineRecord>) => {
    const index = deadlineRecords.value.findIndex(deadline => deadline.id === id);
    if (index !== -1) {
      deadlineRecords.value[index] = {
        ...deadlineRecords.value[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      saveDeadlinesToStorage();

      // 如果状态变为已完成，更新相关记录
      if (updates.status === 'completed') {
        await markRemindersAsCompleted(id);
        await updateCalendarEvent(id, { isCompleted: true });
      }
    }
  };

  const deleteDeadlineRecord = async (id: number) => {
    const index = deadlineRecords.value.findIndex(deadline => deadline.id === id);
    if (index !== -1) {
      deadlineRecords.value.splice(index, 1);
      saveDeadlinesToStorage();
    }
  };

  const generateSmartReminders = async (deadline: DeadlineRecord) => {
    const reminderDates = calculateReminderDates(deadline.deadlineDate);
    
    for (const [level, date] of Object.entries(reminderDates)) {
      const reminder: SmartReminder = {
        id: Date.now() + Math.random(),
        deadlineId: deadline.id,
        patentId: deadline.patentId,
        patentNumber: deadline.patentNumber,
        patentTitle: deadline.patentTitle,
        reminderType: 'notification',
        reminderLevel: level as ReminderLevel,
        message: `专利 ${deadline.patentNumber} 的 ${getDeadlineTypeText(deadline.deadlineType)} 期限将在 ${date} 到期`,
        scheduledDate: date,
        isSent: false,
        isRead: false,
        createdAt: new Date().toISOString()
      };

      smartReminders.value.push(reminder);
    }
    saveRemindersToStorage();
  };

  const generateCalendarEvent = async (deadline: DeadlineRecord) => {
    const event: CalendarEvent = {
      id: Date.now(),
      deadlineId: deadline.id,
      patentId: deadline.patentId,
      title: `${deadline.patentNumber} - ${getDeadlineTypeText(deadline.deadlineType)}`,
      description: deadline.description,
      startDate: deadline.deadlineDate,
      endDate: deadline.deadlineDate,
      allDay: true,
      color: getRiskColor(deadline.riskLevel),
      type: 'deadline',
      priority: deadline.priority,
      isCompleted: false
    };

    calendarEvents.value.push(event);
    saveCalendarEventsToStorage();
  };

  const performRiskAssessment = async (deadline: DeadlineRecord) => {
    const riskScore = calculateRiskScore(deadline);
    const riskLevel = getRiskLevel(riskScore);
    const riskFactors = identifyRiskFactors(deadline);
    const mitigationActions = generateMitigationActions(deadline, riskFactors);

    const assessment: RiskAssessment = {
      id: Date.now(),
      patentId: deadline.patentId,
      patentNumber: deadline.patentNumber,
      patentTitle: deadline.patentTitle,
      riskLevel,
      riskScore,
      riskFactors,
      mitigationActions,
      assessmentDate: new Date().toISOString(),
      nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      assessedBy: '系统自动评估'
    };

    riskAssessments.value.push(assessment);
    saveRiskAssessmentsToStorage();
  };

  const markRemindersAsCompleted = async (deadlineId: number) => {
    smartReminders.value = smartReminders.value.filter(
      reminder => reminder.deadlineId !== deadlineId
    );
    saveRemindersToStorage();
  };

  const updateCalendarEvent = async (deadlineId: number, updates: Partial<CalendarEvent>) => {
    const event = calendarEvents.value.find(e => e.deadlineId === deadlineId);
    if (event) {
      Object.assign(event, updates);
      saveCalendarEventsToStorage();
    }
  };

  const markReminderAsRead = async (id: number) => {
    const reminder = smartReminders.value.find(r => r.id === id);
    if (reminder) {
      reminder.isRead = true;
      saveRemindersToStorage();
    }
  };

  const createBatchOperation = async (operation: Omit<BatchOperation, 'id' | 'createdAt'>) => {
    const newOperation: BatchOperation = {
      ...operation,
      id: Date.now(),
      createdAt: new Date().toISOString()
    };

    batchOperations.value.push(newOperation);
    saveBatchOperationsToStorage();
    return newOperation;
  };

  const executeBatchOperation = async (operationId: number) => {
    const operation = batchOperations.value.find(op => op.id === operationId);
    if (!operation) return;

    operation.status = 'processing';
    operation.progress = 0;

    try {
      for (let i = 0; i < operation.targetDeadlines.length; i++) {
        const deadlineId = operation.targetDeadlines[i];
        
        switch (operation.operationType) {
          case 'extend':
            await extendDeadline(deadlineId, operation.parameters.extensionDays);
            break;
          case 'complete':
            await completeDeadline(deadlineId);
            break;
          case 'cancel':
            await cancelDeadline(deadlineId);
            break;
          case 'remind':
            await sendReminder(deadlineId);
            break;
        }

        operation.progress = ((i + 1) / operation.targetDeadlines.length) * 100;
      }

      operation.status = 'completed';
      operation.completedAt = new Date().toISOString();
      operation.result.success = operation.targetDeadlines.length;
    } catch (error) {
      operation.status = 'failed';
      operation.result.errors.push(error as string);
    }

    saveBatchOperationsToStorage();
  };

  const extendDeadline = async (deadlineId: number, extensionDays: number) => {
    const deadline = deadlineRecords.value.find(d => d.id === deadlineId);
    if (deadline) {
      const newDate = new Date(deadline.deadlineDate);
      newDate.setDate(newDate.getDate() + extensionDays);
      
      await updateDeadlineRecord(deadlineId, {
        deadlineDate: newDate.toISOString().split('T')[0],
        status: 'extended',
        daysUntilDeadline: calculateDaysUntilDeadline(newDate.toISOString().split('T')[0])
      });
    } else {
      throw new Error('未找到指定的期限记录');
    }
  };

  const completeDeadline = async (deadlineId: number) => {
    await updateDeadlineRecord(deadlineId, {
      status: 'completed',
      isCompleted: true,
      completedDate: new Date().toISOString()
    });
  };

  const cancelDeadline = async (deadlineId: number) => {
    await updateDeadlineRecord(deadlineId, {
      status: 'cancelled'
    });
  };

  const sendReminder = async (deadlineId: number) => {
    const deadline = deadlineRecords.value.find(d => d.id === deadlineId);
    if (deadline) {
      const reminder: SmartReminder = {
        id: Date.now(),
        deadlineId: deadline.id,
        patentId: deadline.patentId,
        patentNumber: deadline.patentNumber,
        patentTitle: deadline.patentTitle,
        reminderType: 'notification',
        reminderLevel: 'urgent',
        message: `紧急提醒：专利 ${deadline.patentNumber} 的 ${getDeadlineTypeText(deadline.deadlineType)} 期限即将到期`,
        scheduledDate: new Date().toISOString(),
        isSent: true,
        sentAt: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString()
      };

      smartReminders.value.push(reminder);
      saveRemindersToStorage();
    }
  };

  const queryDeadlines = (conditions: DeadlineQueryCondition): DeadlineRecord[] => {
    let filtered = [...deadlineRecords.value];

    if (conditions.patentId) {
      filtered = filtered.filter(deadline => deadline.patentId === conditions.patentId);
    }

    if (conditions.patentNumber) {
      filtered = filtered.filter(deadline =>
        deadline.patentNumber.toLowerCase().includes(conditions.patentNumber!.toLowerCase())
      );
    }

    if (conditions.deadlineType) {
      filtered = filtered.filter(deadline => deadline.deadlineType === conditions.deadlineType);
    }

    if (conditions.status) {
      filtered = filtered.filter(deadline => deadline.status === conditions.status);
    }

    if (conditions.riskLevel) {
      filtered = filtered.filter(deadline => deadline.riskLevel === conditions.riskLevel);
    }

    if (conditions.dateRange) {
      filtered = filtered.filter(deadline => {
        const deadlineDate = new Date(deadline.deadlineDate);
        const start = new Date(conditions.dateRange!.start);
        const end = new Date(conditions.dateRange!.end);
        return deadlineDate >= start && deadlineDate <= end;
      });
    }

    if (conditions.priority) {
      filtered = filtered.filter(deadline => deadline.priority === conditions.priority);
    }

    return filtered;
  };

  // 辅助方法
  const calculateReminderDates = (deadlineDate: string) => {
    const date = new Date(deadlineDate);
    return {
      info: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      warning: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      urgent: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      critical: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    };
  };

  const calculateDaysUntilDeadline = (deadlineDate: string) => {
    const today = new Date();
    const deadline = new Date(deadlineDate);
    const diffTime = deadline.getTime() - today.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  };

  const calculateRiskScore = (deadline: DeadlineRecord) => {
    let score = 0;
    
    // 基于剩余天数
    if (deadline.daysUntilDeadline < 0) score += 40;
    else if (deadline.daysUntilDeadline <= 7) score += 30;
    else if (deadline.daysUntilDeadline <= 30) score += 20;
    else if (deadline.daysUntilDeadline <= 90) score += 10;

    // 基于优先级
    if (deadline.priority === 'high') score += 20;
    else if (deadline.priority === 'medium') score += 10;

    // 基于期限类型
    if (deadline.deadlineType === 'maintenance') score += 15;
    else if (deadline.deadlineType === 'priority') score += 15;

    return Math.min(score, 100);
  };

  const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 80) return 'critical';
    if (score >= 60) return 'high';
    if (score >= 30) return 'medium';
    return 'low';
  };

  const identifyRiskFactors = (deadline: DeadlineRecord): string[] => {
    const factors: string[] = [];
    
    if (deadline.daysUntilDeadline < 0) {
      factors.push('已逾期');
    } else if (deadline.daysUntilDeadline <= 7) {
      factors.push('即将到期');
    }
    
    if (deadline.priority === 'high') {
      factors.push('高优先级');
    }
    
    if (deadline.deadlineType === 'maintenance') {
      factors.push('年费期限');
    }
    
    if (deadline.deadlineType === 'priority') {
      factors.push('优先权期限');
    }

    return factors;
  };

  const generateMitigationActions = (_deadline: DeadlineRecord, riskFactors: string[]): string[] => {
    const actions: string[] = [];
    
    if (riskFactors.includes('已逾期')) {
      actions.push('立即处理逾期事项');
      actions.push('申请延期或补救措施');
    }
    
    if (riskFactors.includes('即将到期')) {
      actions.push('优先处理此期限');
      actions.push('设置紧急提醒');
    }
    
    if (riskFactors.includes('高优先级')) {
      actions.push('分配专人负责');
      actions.push('定期跟进进度');
    }
    
    if (riskFactors.includes('年费期限')) {
      actions.push('确认缴费金额');
      actions.push('准备缴费材料');
    }

    return actions;
  };

  const getRiskColor = (riskLevel: RiskLevel): string => {
    const colors = {
      low: '#67c23a',
      medium: '#e6a23c',
      high: '#f56c6c',
      critical: '#ff0000'
    };
    return colors[riskLevel];
  };

  const getDeadlineTypeText = (type: DeadlineType): string => {
    const texts: Record<DeadlineType, string> = {
      application: '申请期限',
      examination: '审查期限',
      maintenance: '年费期限',
      renewal: '续展期限',
      priority: '优先权期限',
      extension: '延期期限',
      correction: '更正期限',
      opposition: '异议期限',
      appeal: '上诉期限',
      other: '其他期限'
    };
    return texts[type];
  };

  // 存储方法
  const saveDeadlinesToStorage = () => {
    localStorage.setItem('deadlineRecords', JSON.stringify(deadlineRecords.value));
  };

  const saveRemindersToStorage = () => {
    localStorage.setItem('smartReminders', JSON.stringify(smartReminders.value));
  };

  const saveCalendarEventsToStorage = () => {
    localStorage.setItem('calendarEvents', JSON.stringify(calendarEvents.value));
  };

  const saveRiskAssessmentsToStorage = () => {
    localStorage.setItem('riskAssessments', JSON.stringify(riskAssessments.value));
  };

  const saveBatchOperationsToStorage = () => {
    localStorage.setItem('batchOperations', JSON.stringify(batchOperations.value));
  };

  // 生成示例数据
  const generateSampleDeadlines = (): DeadlineRecord[] => {
    const today = new Date();
    const futureDate1 = new Date(today.getTime() + 15 * 24 * 60 * 60 * 1000); // 15天后
    const pastDate1 = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000); // 5天前
    const futureDate2 = new Date(today.getTime() + 45 * 24 * 60 * 60 * 1000); // 45天后
    
    return [
      {
        id: 1,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        deadlineType: 'maintenance',
        deadlineDate: futureDate1.toISOString().split('T')[0],
        status: 'pending',
        description: '专利年费缴纳期限',
        priority: 'high',
        riskLevel: 'high',
        reminderLevel: 'urgent',
        daysUntilDeadline: calculateDaysUntilDeadline(futureDate1.toISOString().split('T')[0]),
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 2,
        patentId: 2,
        patentNumber: 'CN202300002',
        patentTitle: '智能控制系统',
        deadlineType: 'examination',
        deadlineDate: pastDate1.toISOString().split('T')[0],
        status: 'overdue',
        description: '专利审查答复期限',
        priority: 'medium',
        riskLevel: 'critical',
        reminderLevel: 'critical',
        daysUntilDeadline: calculateDaysUntilDeadline(pastDate1.toISOString().split('T')[0]),
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: 3,
        patentId: 3,
        patentNumber: 'CN202300003',
        patentTitle: '数据处理方法',
        deadlineType: 'priority',
        deadlineDate: futureDate2.toISOString().split('T')[0],
        status: 'pending',
        description: '优先权声明期限',
        priority: 'high',
        riskLevel: 'medium',
        reminderLevel: 'warning',
        daysUntilDeadline: calculateDaysUntilDeadline(futureDate2.toISOString().split('T')[0]),
        isCompleted: false,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];
  };

  const generateSampleReminders = (): SmartReminder[] => {
    return [
      {
        id: 1,
        deadlineId: 1,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        reminderType: 'notification',
        reminderLevel: 'urgent',
        message: '专利 CN202300001 的年费期限将在 2024-02-15 到期',
        scheduledDate: '2024-02-01',
        isSent: true,
        sentAt: '2024-02-01T10:00:00Z',
        isRead: false,
        createdAt: '2024-01-01T00:00:00Z'
      }
    ];
  };

  const generateSampleCalendarEvents = (): CalendarEvent[] => {
    return [
      {
        id: 1,
        deadlineId: 1,
        patentId: 1,
        title: 'CN202300001 - 年费期限',
        description: '专利年费缴纳期限',
        startDate: '2024-02-15',
        endDate: '2024-02-15',
        allDay: true,
        color: '#f56c6c',
        type: 'deadline',
        priority: 'high',
        isCompleted: false
      }
    ];
  };

  const generateSampleRiskAssessments = (): RiskAssessment[] => {
    return [
      {
        id: 1,
        patentId: 1,
        patentNumber: 'CN202300001',
        patentTitle: '一种新型传感器技术',
        riskLevel: 'high',
        riskScore: 75,
        riskFactors: ['即将到期', '高优先级', '年费期限'],
        mitigationActions: ['优先处理此期限', '设置紧急提醒', '确认缴费金额', '准备缴费材料'],
        assessmentDate: '2024-01-01T00:00:00Z',
        nextAssessmentDate: '2024-01-08T00:00:00Z',
        assessedBy: '系统自动评估'
      }
    ];
  };

  return {
    // 状态
    deadlineRecords,
    smartReminders,
    calendarEvents,
    riskAssessments,
    batchOperations,
    loading,

    // 计算属性
    statistics,
    urgentReminders,
    unreadReminders,
    pendingBatchOperations,

    // 方法
    loadDeadlineRecords,
    loadSmartReminders,
    loadCalendarEvents,
    loadRiskAssessments,
    addDeadlineRecord,
    updateDeadlineRecord,
    deleteDeadlineRecord,
    extendDeadline,
    completeDeadline,
    cancelDeadline,
    markReminderAsRead,
    createBatchOperation,
    executeBatchOperation,
    queryDeadlines
  };
}); 