import api from "@/utils/api";
import type {
  DeadlineRecord,
  SmartReminder,
  CalendarEvent,
  RiskAssessment,
  BatchOperation,
  DeadlineStatistics,
  DeadlineQueryCondition,
} from "@/types/deadline";

export const deadlineAPI = {
  // 期限记录管理
  async getDeadlines(params?: DeadlineQueryCondition): Promise<{
    deadlines: DeadlineRecord[];
    total: number;
    page: number;
    limit: number;
  }> {
    const response = await api.get("/deadlines", { params });
    return response.data;
  },

  async getDeadlineById(id: number): Promise<DeadlineRecord> {
    const response = await api.get(`/deadlines/${id}`);
    return response.data;
  },

  async createDeadline(data: Omit<DeadlineRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<DeadlineRecord> {
    const response = await api.post("/deadlines", data);
    return response.data;
  },

  async updateDeadline(id: number, data: Partial<DeadlineRecord>): Promise<DeadlineRecord> {
    const response = await api.put(`/deadlines/${id}`, data);
    return response.data;
  },

  async deleteDeadline(id: number): Promise<void> {
    await api.delete(`/deadlines/${id}`);
  },

  // 智能提醒管理
  async getSmartReminders(params?: { isRead?: boolean; level?: string }): Promise<SmartReminder[]> {
    const response = await api.get("/deadlines/reminders", { params });
    return response.data;
  },

  async createSmartReminder(data: Omit<SmartReminder, 'id' | 'createdAt'>): Promise<SmartReminder> {
    const response = await api.post("/deadlines/reminders", data);
    return response.data;
  },

  async updateSmartReminder(id: number, data: Partial<SmartReminder>): Promise<SmartReminder> {
    const response = await api.put(`/deadlines/reminders/${id}`, data);
    return response.data;
  },

  async deleteSmartReminder(id: number): Promise<void> {
    await api.delete(`/deadlines/reminders/${id}`);
  },

  async markReminderAsRead(id: number): Promise<void> {
    await api.put(`/deadlines/reminders/${id}/read`);
  },

  async markAllRemindersAsRead(): Promise<void> {
    await api.put("/deadlines/reminders/read-all");
  },

  // 日历事件管理
  async getCalendarEvents(params?: { startDate?: string; endDate?: string }): Promise<CalendarEvent[]> {
    const response = await api.get("/deadlines/calendar-events", { params });
    return response.data;
  },

  async createCalendarEvent(data: Omit<CalendarEvent, 'id' | 'createdAt'>): Promise<CalendarEvent> {
    const response = await api.post("/deadlines/calendar-events", data);
    return response.data;
  },

  async updateCalendarEvent(id: number, data: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const response = await api.put(`/deadlines/calendar-events/${id}`, data);
    return response.data;
  },

  async deleteCalendarEvent(id: number): Promise<void> {
    await api.delete(`/deadlines/calendar-events/${id}`);
  },

  // 风险评估管理
  async getRiskAssessments(params?: { riskLevel?: string }): Promise<RiskAssessment[]> {
    const response = await api.get("/deadlines/risk-assessments", { params });
    return response.data;
  },

  async createRiskAssessment(data: Omit<RiskAssessment, 'id' | 'createdAt'>): Promise<RiskAssessment> {
    const response = await api.post("/deadlines/risk-assessments", data);
    return response.data;
  },

  async updateRiskAssessment(id: number, data: Partial<RiskAssessment>): Promise<RiskAssessment> {
    const response = await api.put(`/deadlines/risk-assessments/${id}`, data);
    return response.data;
  },

  async deleteRiskAssessment(id: number): Promise<void> {
    await api.delete(`/deadlines/risk-assessments/${id}`);
  },

  // 批量操作管理
  async getBatchOperations(params?: { status?: string }): Promise<BatchOperation[]> {
    const response = await api.get("/deadlines/batch-operations", { params });
    return response.data;
  },

  async createBatchOperation(data: Omit<BatchOperation, 'id' | 'createdAt' | 'updatedAt'>): Promise<BatchOperation> {
    const response = await api.post("/deadlines/batch-operations", data);
    return response.data;
  },

  async updateBatchOperation(id: number, data: Partial<BatchOperation>): Promise<BatchOperation> {
    const response = await api.put(`/deadlines/batch-operations/${id}`, data);
    return response.data;
  },

  async deleteBatchOperation(id: number): Promise<void> {
    await api.delete(`/deadlines/batch-operations/${id}`);
  },

  async executeBatchOperation(id: number): Promise<void> {
    await api.post(`/deadlines/batch-operations/${id}/execute`);
  },

  // 统计信息
  async getDeadlineStatistics(): Promise<DeadlineStatistics> {
    const response = await api.get("/deadlines/statistics");
    return response.data;
  },

  // 期限延期
  async extendDeadline(id: number, days: number, reason?: string): Promise<DeadlineRecord> {
    const response = await api.post(`/deadlines/${id}/extend`, { days, reason });
    return response.data;
  },

  // 批量延期
  async batchExtendDeadlines(deadlineIds: number[], days: number, reason?: string): Promise<void> {
    await api.post("/deadlines/batch-extend", { deadlineIds, days, reason });
  },

  // 标记完成
  async markDeadlineAsCompleted(id: number, completionNotes?: string): Promise<DeadlineRecord> {
    const response = await api.put(`/deadlines/${id}/complete`, { completionNotes });
    return response.data;
  },

  // 批量标记完成
  async batchMarkAsCompleted(deadlineIds: number[], completionNotes?: string): Promise<void> {
    await api.post("/deadlines/batch-complete", { deadlineIds, completionNotes });
  },

  // 风险预警
  async getRiskWarnings(): Promise<{
    critical: DeadlineRecord[];
    high: DeadlineRecord[];
    medium: DeadlineRecord[];
    low: DeadlineRecord[];
  }> {
    const response = await api.get("/deadlines/risk-warnings");
    return response.data;
  },

  // 导出数据
  async exportDeadlines(format: 'csv' | 'excel' = 'csv', params?: DeadlineQueryCondition): Promise<Blob> {
    const response = await api.get("/deadlines/export", { 
      params: { ...params, format },
      responseType: 'blob'
    });
    return response.data;
  },
};

export default deadlineAPI;
