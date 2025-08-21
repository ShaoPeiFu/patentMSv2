import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
import deadlineAPI from "@/services/deadlineAPI";
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
  ReminderLevel,
} from "@/types/deadline";

export const useDeadlineStore = defineStore("deadline", () => {
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
    const pending = deadlineRecords.value.filter(
      (d) => d.status === "pending"
    ).length;
    const completed = deadlineRecords.value.filter(
      (d) => d.status === "completed"
    ).length;
    const overdue = deadlineRecords.value.filter(
      (d) => d.status === "overdue"
    ).length;
    const cancelled = deadlineRecords.value.filter(
      (d) => d.status === "cancelled"
    ).length;
    const extended = deadlineRecords.value.filter(
      (d) => d.status === "extended"
    ).length;

    // 按类型统计
    const byType: Record<
      DeadlineType,
      { count: number; overdue: number; completed: number }
    > = {
      application: { count: 0, overdue: 0, completed: 0 },
      examination: { count: 0, overdue: 0, completed: 0 },
      maintenance: { count: 0, overdue: 0, completed: 0 },
      renewal: { count: 0, overdue: 0, completed: 0 },
      priority: { count: 0, overdue: 0, completed: 0 },
      extension: { count: 0, overdue: 0, completed: 0 },
      correction: { count: 0, overdue: 0, completed: 0 },
      opposition: { count: 0, overdue: 0, completed: 0 },
      appeal: { count: 0, overdue: 0, completed: 0 },
      other: { count: 0, overdue: 0, completed: 0 },
    };

    deadlineRecords.value.forEach((deadline) => {
      // 安全检查：确保 deadlineType 存在于 byType 中
      if (deadline.deadlineType && byType[deadline.deadlineType]) {
        byType[deadline.deadlineType].count++;
        if (deadline.status === "overdue") {
          byType[deadline.deadlineType].overdue++;
        }
        if (deadline.status === "completed") {
          byType[deadline.deadlineType].completed++;
        }
      } else {
        console.warn(
          "未知的期限类型:",
          deadline.deadlineType,
          "期限记录:",
          deadline
        );
      }
    });

    // 按风险等级统计
    const byRiskLevel: Record<RiskLevel, { count: number; overdue: number }> = {
      low: { count: 0, overdue: 0 },
      medium: { count: 0, overdue: 0 },
      high: { count: 0, overdue: 0 },
      critical: { count: 0, overdue: 0 },
    };

    deadlineRecords.value.forEach((deadline) => {
      if (deadline.riskLevel && byRiskLevel[deadline.riskLevel]) {
        byRiskLevel[deadline.riskLevel].count++;
        if (deadline.status === "overdue") {
          byRiskLevel[deadline.riskLevel].overdue++;
        }
      }
    });

    // 即将到期的期限
    const upcomingDeadlines = deadlineRecords.value
      .filter((d) => d.status === "pending" && d.daysUntilDeadline <= 30)
      .sort((a, b) => a.daysUntilDeadline - b.daysUntilDeadline);

    // 已逾期的期限
    const overdueDeadlines = deadlineRecords.value
      .filter((d) => d.status === "overdue")
      .sort(
        (a, b) => Math.abs(a.daysUntilDeadline) - Math.abs(b.daysUntilDeadline)
      );

    // 高风险期限
    const highRiskDeadlines = deadlineRecords.value
      .filter((d) => d.riskLevel === "high" || d.riskLevel === "critical")
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
      highRiskDeadlines,
    };
  });

  const urgentReminders = computed(() =>
    smartReminders.value.filter(
      (reminder) =>
        reminder.reminderLevel === "urgent" ||
        reminder.reminderLevel === "critical"
    )
  );

  const unreadReminders = computed(() =>
    smartReminders.value.filter((reminder) => !reminder.isRead)
  );

  const pendingBatchOperations = computed(() =>
    batchOperations.value.filter(
      (op) => op.status === "pending" || op.status === "processing"
    )
  );

  // 方法
  const initializeStore = async () => {
    try {
      loading.value = true;
      await Promise.all([
        loadDeadlineRecords(),
        loadSmartReminders(),
        loadRiskAssessments(),
      ]);
    } catch (error) {
      console.error("初始化期限管理store失败:", error);
    } finally {
      loading.value = false;
    }
  };

  const loadDeadlineRecords = async (params?: DeadlineQueryCondition) => {
    loading.value = true;
    try {
      const response = await deadlineAPI.getDeadlines(params);

      // 数据验证和清理
      if (response.deadlines && Array.isArray(response.deadlines)) {
        deadlineRecords.value = response.deadlines
          .filter((deadline) => {
            // 过滤掉无效的记录
            if (!deadline || typeof deadline !== "object") {
              console.warn("发现无效的期限记录:", deadline);
              return false;
            }

            // 确保必要字段存在
            if (!deadline.id || !deadline.patentNumber) {
              console.warn("期限记录缺少必要字段:", deadline);
              return false;
            }

            return true;
          })
          .map((deadline) => ({
            ...deadline,
            // 为可能缺失的字段提供默认值
            patentNumber: deadline.patentNumber || "未知",
            patentTitle: deadline.patentTitle || "未知",
            deadlineType: deadline.deadlineType || "other",
            status: deadline.status || "pending",
            riskLevel: deadline.riskLevel || "medium",
            priority: deadline.priority || "medium",
            deadlineDate: deadline.deadlineDate || new Date().toISOString(),
            description: deadline.description || "",
            notes: deadline.notes || "",
          }));

        // 更新所有记录的剩余天数
        deadlineRecords.value.forEach((deadline) => {
          deadline.daysUntilDeadline = calculateDaysUntilDeadline(
            deadline.deadlineDate
          );
        });

        console.log("成功加载期限记录:", deadlineRecords.value.length, "条");
      } else {
        console.warn("API返回的期限记录格式不正确:", response);
        deadlineRecords.value = [];
      }
    } catch (error) {
      console.error("加载期限记录失败:", error);
      ElMessage.error("加载期限记录失败");
      deadlineRecords.value = [];
    } finally {
      loading.value = false;
    }
  };

  const loadSmartReminders = async () => {
    try {
      const response = await deadlineAPI.getSmartReminders();

      // 数据验证和清理
      if (Array.isArray(response)) {
        smartReminders.value = response
          .filter((reminder) => {
            if (!reminder || typeof reminder !== "object") {
              console.warn("发现无效的智能提醒:", reminder);
              return false;
            }
            return true;
          })
          .map((reminder) => ({
            ...reminder,
            // 为可能缺失的字段提供默认值
            patentNumber: reminder.patentNumber || "未知",
            patentTitle: reminder.patentTitle || "未知",
            message: reminder.message || "提醒消息",
            reminderLevel: reminder.reminderLevel || "info",
            scheduledDate: reminder.scheduledDate || new Date().toISOString(),
            isRead: reminder.isRead || false,
          }));

        console.log("成功加载智能提醒:", smartReminders.value.length, "条");
      } else {
        console.warn("API返回的智能提醒格式不正确:", response);
        smartReminders.value = [];
      }
    } catch (error) {
      console.error("加载智能提醒失败:", error);
      ElMessage.error("加载智能提醒失败");
      smartReminders.value = [];
    }
  };

  const loadRiskAssessments = async () => {
    try {
      const response = await deadlineAPI.getRiskAssessments();

      // 数据验证和清理
      if (Array.isArray(response)) {
        riskAssessments.value = response
          .filter((assessment) => {
            if (!assessment || typeof assessment !== "object") {
              console.warn("发现无效的风险评估:", assessment);
              return false;
            }
            return true;
          })
          .map((assessment) => ({
            ...assessment,
            // 为可能缺失的字段提供默认值
            riskLevel: assessment.riskLevel || "medium",
            description: assessment.description || "风险评估",
            recommendations: assessment.recommendations || [],
          }));

        console.log("成功加载风险评估:", riskAssessments.value.length, "条");
      } else {
        console.warn("API返回的风险评估格式不正确:", response);
        riskAssessments.value = [];
      }
    } catch (error) {
      console.error("加载风险评估失败:", error);
      ElMessage.error("加载风险评估失败");
      riskAssessments.value = [];
    }
  };

  const loadCalendarEvents = async () => {
    try {
      const response = await deadlineAPI.getCalendarEvents();

      // 数据验证和清理
      if (Array.isArray(response)) {
        calendarEvents.value = response
          .filter((event) => {
            if (!event || typeof event !== "object") {
              console.warn("发现无效的日历事件:", event);
              return false;
            }
            return true;
          })
          .map((event) => ({
            ...event,
            // 为可能缺失的字段提供默认值
            title: event.title || "日历事件",
            description: event.description || "",
            color: event.color || "#409EFF",
            type: event.type || "deadline",
            priority: event.priority || "medium",
          }));

        console.log("成功加载日历事件:", calendarEvents.value.length, "条");
      } else {
        console.warn("API返回的日历事件格式不正确:", response);
        calendarEvents.value = [];
      }
    } catch (error) {
      console.error("加载日历事件失败:", error);
      ElMessage.error("加载日历事件失败");
      calendarEvents.value = [];
    }
  };

  const addDeadlineRecord = async (
    deadlineData: Omit<DeadlineRecord, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      loading.value = true;

      // 计算剩余天数
      const deadlineDate = new Date(deadlineData.deadlineDate);
      const now = new Date();
      const daysUntilDeadline = Math.ceil(
        (deadlineDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 准备API数据
      const apiData = {
        patentId: deadlineData.patentId,
        patentNumber: deadlineData.patentNumber,
        patentTitle: deadlineData.patentTitle,
        title:
          deadlineData.title ||
          `${deadlineData.deadlineType} - ${deadlineData.patentNumber}`,
        description: deadlineData.description || "",
        deadlineDate: deadlineData.deadlineDate,
        dueDate: deadlineData.deadlineDate, // 兼容后端字段
        deadlineType: deadlineData.deadlineType,
        type: deadlineData.deadlineType, // 兼容后端字段
        status: deadlineData.status || "pending",
        priority: deadlineData.priority || "medium",
        riskLevel: deadlineData.riskLevel || "medium",
        reminderLevel: deadlineData.reminderLevel || "info",
        daysUntilDeadline: daysUntilDeadline,
        isCompleted: deadlineData.isCompleted || false,
        notes: deadlineData.notes || "",
      };

      const newDeadline = await deadlineAPI.createDeadline(apiData);

      // 添加到本地状态
      deadlineRecords.value.push(newDeadline);

      // 自动生成智能提醒
      await generateSmartReminders(newDeadline);

      // 自动进行风险评估
      await performRiskAssessment(newDeadline);

      ElMessage.success("期限记录添加成功");
      return newDeadline;
    } catch (error) {
      console.error("添加期限记录失败:", error);
      ElMessage.error("添加期限记录失败");
      throw error;
    }
  };

  const updateDeadlineRecord = async (
    id: number,
    updates: Partial<DeadlineRecord>
  ) => {
    try {
      const updatedDeadline = await deadlineAPI.updateDeadline(id, updates);

      // 更新本地状态
      const index = deadlineRecords.value.findIndex(
        (deadline) => deadline.id === id
      );
      if (index !== -1) {
        deadlineRecords.value[index] = updatedDeadline;
      }

      // 如果状态变为已完成，更新相关记录
      if (updates.status === "completed") {
        await markRemindersAsCompleted(id);
        await updateCalendarEvent(id, { isCompleted: true });
      }

      ElMessage.success("期限记录更新成功");
    } catch (error) {
      console.error("更新期限记录失败:", error);
      ElMessage.error("更新期限记录失败");
      throw error;
    }
  };

  const deleteDeadlineRecord = async (id: number) => {
    try {
      await deadlineAPI.deleteDeadline(id);

      // 从本地状态中移除
      const index = deadlineRecords.value.findIndex(
        (deadline) => deadline.id === id
      );
      if (index !== -1) {
        deadlineRecords.value.splice(index, 1);
      }

      ElMessage.success("期限记录删除成功");
    } catch (error) {
      console.error("删除期限记录失败:", error);
      ElMessage.error("删除期限记录失败");
      throw error;
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
        reminderType: "notification",
        reminderLevel: level as ReminderLevel,
        message: `专利 ${deadline.patentNumber} 的 ${getDeadlineTypeText(
          deadline.deadlineType
        )} 期限将在 ${date} 到期`,
        scheduledDate: date,
        isSent: false,
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      smartReminders.value.push(reminder);
    }
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
      nextAssessmentDate: new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000
      ).toISOString(),
      assessedBy: "系统自动评估",
    };

    riskAssessments.value.push(assessment);
  };

  const markRemindersAsCompleted = async (deadlineId: number) => {
    smartReminders.value = smartReminders.value.filter(
      (reminder) => reminder.deadlineId !== deadlineId
    );
  };

  const updateCalendarEvent = async (
    deadlineId: number,
    updates: Partial<CalendarEvent>
  ) => {
    const event = calendarEvents.value.find((e) => e.deadlineId === deadlineId);
    if (event) {
      Object.assign(event, updates);
    }
  };

  const markReminderAsRead = async (id: number) => {
    const reminder = smartReminders.value.find((r) => r.id === id);
    if (reminder) {
      reminder.isRead = true;
    }
  };

  const createBatchOperation = async (
    operation: Omit<BatchOperation, "id" | "createdAt">
  ) => {
    const newOperation: BatchOperation = {
      ...operation,
      id: Date.now(),
      createdAt: new Date().toISOString(),
    };

    batchOperations.value.push(newOperation);
    return newOperation;
  };

  const executeBatchOperation = async (operationId: number) => {
    const operation = batchOperations.value.find((op) => op.id === operationId);
    if (!operation) return;

    operation.status = "processing";
    operation.progress = 0;

    try {
      for (let i = 0; i < operation.targetDeadlines.length; i++) {
        const deadlineId = operation.targetDeadlines[i];

        switch (operation.operationType) {
          case "extend":
            await extendDeadline(
              deadlineId,
              operation.parameters.extensionDays
            );
            break;
          case "complete":
            await completeDeadline(deadlineId);
            break;
          case "cancel":
            await cancelDeadline(deadlineId);
            break;
          case "remind":
            await sendReminder(deadlineId);
            break;
        }

        operation.progress = ((i + 1) / operation.targetDeadlines.length) * 100;
      }

      operation.status = "completed";
      operation.completedAt = new Date().toISOString();
      operation.result.success = operation.targetDeadlines.length;
    } catch (error) {
      operation.status = "failed";
      operation.result.errors.push(error as string);
    }
  };

  const extendDeadline = async (deadlineId: number, extensionDays: number) => {
    try {
      const deadline = deadlineRecords.value.find((d) => d.id === deadlineId);
      if (!deadline) {
        throw new Error("未找到指定的期限记录");
      }

      // 计算新的到期日期
      const currentDate = new Date(deadline.deadlineDate);
      const newDate = new Date(currentDate);
      newDate.setDate(newDate.getDate() + extensionDays);

      // 计算新的剩余天数
      const now = new Date();
      const newDaysUntilDeadline = Math.ceil(
        (newDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );

      // 更新期限记录
      await updateDeadlineRecord(deadlineId, {
        deadlineDate: newDate.toISOString().split("T")[0],
        dueDate: newDate.toISOString().split("T")[0], // 同时更新dueDate字段
        status: "extended",
        daysUntilDeadline: newDaysUntilDeadline,
        notes: deadline.notes
          ? `${deadline.notes}\n\n[延期记录] ${new Date().toLocaleDateString(
              "zh-CN"
            )} 延期${extensionDays}天，新到期日：${newDate.toLocaleDateString(
              "zh-CN"
            )}`
          : `[延期记录] ${new Date().toLocaleDateString(
              "zh-CN"
            )} 延期${extensionDays}天，新到期日：${newDate.toLocaleDateString(
              "zh-CN"
            )}`,
      });

      // 更新本地状态
      const index = deadlineRecords.value.findIndex((d) => d.id === deadlineId);
      if (index !== -1) {
        deadlineRecords.value[index] = {
          ...deadlineRecords.value[index],
          deadlineDate: newDate.toISOString().split("T")[0],
          dueDate: newDate.toISOString().split("T")[0],
          status: "extended",
          daysUntilDeadline: newDaysUntilDeadline,
        };
      }

      // 同步更新对应的日历事件
      await syncCalendarEventAfterDeadlineUpdate(deadlineId, {
        startDate: newDate.toISOString().split("T")[0],
        endDate: newDate.toISOString().split("T")[0],
        title: `${deadline.patentNumber} - ${getDeadlineTypeText(
          deadline.deadlineType
        )} (已延期)`,
      });

      console.log(`期限 ${deadlineId} 延期成功，延期${extensionDays}天`);
    } catch (error) {
      console.error("延期操作失败:", error);
      throw error;
    }
  };

  const completeDeadline = async (deadlineId: number) => {
    await updateDeadlineRecord(deadlineId, {
      status: "completed",
      isCompleted: true,
      completedDate: new Date().toISOString(),
    });
  };

  const cancelDeadline = async (deadlineId: number) => {
    await updateDeadlineRecord(deadlineId, {
      status: "cancelled",
    });
  };

  const sendReminder = async (deadlineId: number) => {
    const deadline = deadlineRecords.value.find((d) => d.id === deadlineId);
    if (deadline) {
      const reminder: SmartReminder = {
        id: Date.now(),
        deadlineId: deadline.id,
        patentId: deadline.patentId,
        patentNumber: deadline.patentNumber,
        patentTitle: deadline.patentTitle,
        reminderType: "notification",
        reminderLevel: "urgent",
        message: `紧急提醒：专利 ${
          deadline.patentNumber
        } 的 ${getDeadlineTypeText(deadline.deadlineType)} 期限即将到期`,
        scheduledDate: new Date().toISOString(),
        isSent: true,
        sentAt: new Date().toISOString(),
        isRead: false,
        createdAt: new Date().toISOString(),
      };

      smartReminders.value.push(reminder);
    }
  };

  const queryDeadlines = (
    conditions: DeadlineQueryCondition
  ): DeadlineRecord[] => {
    let filtered = [...deadlineRecords.value];

    if (conditions.patentId) {
      filtered = filtered.filter(
        (deadline) => deadline.patentId === conditions.patentId
      );
    }

    if (conditions.patentNumber) {
      filtered = filtered.filter((deadline) =>
        deadline.patentNumber
          .toLowerCase()
          .includes(conditions.patentNumber!.toLowerCase())
      );
    }

    if (conditions.deadlineType) {
      filtered = filtered.filter(
        (deadline) => deadline.deadlineType === conditions.deadlineType
      );
    }

    if (conditions.status) {
      filtered = filtered.filter(
        (deadline) => deadline.status === conditions.status
      );
    }

    if (conditions.riskLevel) {
      filtered = filtered.filter(
        (deadline) => deadline.riskLevel === conditions.riskLevel
      );
    }

    if (conditions.dateRange) {
      filtered = filtered.filter((deadline) => {
        const deadlineDate = new Date(deadline.deadlineDate);
        const start = new Date(conditions.dateRange!.start);
        const end = new Date(conditions.dateRange!.end);
        return deadlineDate >= start && deadlineDate <= end;
      });
    }

    if (conditions.priority) {
      filtered = filtered.filter(
        (deadline) => deadline.priority === conditions.priority
      );
    }

    return filtered;
  };

  // 辅助方法
  const calculateReminderDates = (deadlineDate: string) => {
    const date = new Date(deadlineDate);
    return {
      info: new Date(date.getTime() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      warning: new Date(date.getTime() - 14 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      urgent: new Date(date.getTime() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      critical: new Date(date.getTime() - 3 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
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
    if (deadline.priority === "high") score += 20;
    else if (deadline.priority === "medium") score += 10;

    // 基于期限类型
    if (deadline.deadlineType === "maintenance") score += 15;
    else if (deadline.deadlineType === "priority") score += 15;

    return Math.min(score, 100);
  };

  const getRiskLevel = (score: number): RiskLevel => {
    if (score >= 80) return "critical";
    if (score >= 60) return "high";
    if (score >= 30) return "medium";
    return "low";
  };

  const identifyRiskFactors = (deadline: DeadlineRecord): string[] => {
    const factors: string[] = [];

    if (deadline.daysUntilDeadline < 0) {
      factors.push("已逾期");
    } else if (deadline.daysUntilDeadline <= 7) {
      factors.push("即将到期");
    }

    if (deadline.priority === "high") {
      factors.push("高优先级");
    }

    if (deadline.deadlineType === "maintenance") {
      factors.push("年费期限");
    }

    if (deadline.deadlineType === "priority") {
      factors.push("优先权期限");
    }

    return factors;
  };

  const generateMitigationActions = (
    _deadline: DeadlineRecord,
    riskFactors: string[]
  ): string[] => {
    const actions: string[] = [];

    if (riskFactors.includes("已逾期")) {
      actions.push("立即处理逾期事项");
      actions.push("申请延期或补救措施");
    }

    if (riskFactors.includes("即将到期")) {
      actions.push("优先处理此期限");
      actions.push("设置紧急提醒");
    }

    if (riskFactors.includes("高优先级")) {
      actions.push("分配专人负责");
      actions.push("定期跟进进度");
    }

    if (riskFactors.includes("年费期限")) {
      actions.push("确认缴费金额");
      actions.push("准备缴费材料");
    }

    return actions;
  };

  const getRiskColor = (riskLevel: RiskLevel): string => {
    const colors = {
      low: "#67c23a",
      medium: "#e6a23c",
      high: "#f56c6c",
      critical: "#ff0000",
    };
    return colors[riskLevel];
  };

  const getDeadlineTypeText = (type: DeadlineType): string => {
    const texts: Record<DeadlineType, string> = {
      application: "申请期限",
      examination: "审查期限",
      maintenance: "年费期限",
      renewal: "续展期限",
      priority: "优先权期限",
      extension: "延期期限",
      correction: "更正期限",
      opposition: "异议期限",
      appeal: "上诉期限",
      other: "其他期限",
    };
    return texts[type];
  };

  // 同步更新日历事件
  const syncCalendarEventAfterDeadlineUpdate = async (
    deadlineId: number,
    updates: Partial<CalendarEvent>
  ) => {
    try {
      // 查找对应的日历事件
      const event = calendarEvents.value.find(
        (e) => e.deadlineId === deadlineId
      );
      if (event) {
        // 更新前端状态
        Object.assign(event, updates);

        // 同步更新后端数据库
        await deadlineAPI.updateCalendarEvent(event.id, updates);
        console.log(`✅ 日历事件 ${event.id} 同步更新成功`);
      } else {
        console.log(`⚠️ 未找到期限 ${deadlineId} 对应的日历事件`);
      }
    } catch (error) {
      console.error(`❌ 同步日历事件失败:`, error);
    }
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
    initializeStore,
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
    queryDeadlines,
  };
});
