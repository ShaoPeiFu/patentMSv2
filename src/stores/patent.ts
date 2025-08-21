import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  Patent,
  PatentStatus,
  PatentType,
  PatentStatistics,
} from "@/types/patent";
import { useActivityStore } from "./activity";
import { useUserStore } from "./user";
import { useNotificationStore } from "./notification";
import {
  patentAPI,
  activityAPI,
  patentAnalysisAPI,
  patentFamilyAPI,
  patentCitationAPI,
  patentEvaluationAPI,
  patentAlertAPI,
  patentSearchAPI,
  enhancedMaintenanceAPI,
  patentQualityAPI,
  enhancedStatsAPI,
  patentMonitoringAPI,
  patentLicenseAPI,
  patentLitigationAPI,
  patentTransactionAPI,
} from "@/utils/api";

// 专利申请接口
export interface PatentApplication {
  id: number;
  patentId: number;
  patentNumber: string;
  title: string;
  type: PatentType;
  applicant: string;
  submitDate: string;
  status: "pending" | "approved" | "rejected";
  priority: "high" | "medium" | "low";
  reviewHistory: ReviewHistoryItem[];
  description: string;
  technicalField: string;
  keywords: string[];
  applicants: string[];
  inventors: string[];
  categoryId: number;
}

// 审核历史项
export interface ReviewHistoryItem {
  id: number;
  reviewer: string;
  action: string;
  comment?: string;
  time: string;
}

export const usePatentStore = defineStore("patent", () => {
  // 状态
  const patents = ref<Patent[]>([]);
  const applications = ref<PatentApplication[]>([]); // 专利申请列表
  const loading = ref(false);
  const currentPatent = ref<Patent | null>(null);
  const searchKeyword = ref("");
  const filterStatus = ref<PatentStatus | "">("");
  const filterType = ref<PatentType | "">("");
  const filterCategory = ref<number | "">("");
  const total = ref(0); // 新增：用于存储总专利数

  // 计算属性
  const totalPatents = computed(() =>
    patents.value ? patents.value.length : 0
  );

  const patentsByStatus = computed(() => {
    if (!patents.value) return {} as Record<PatentStatus, Patent[]>;
    const grouped = patents.value.reduce((acc, patent) => {
      const status = patent.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(patent);
      return acc;
    }, {} as Record<PatentStatus, Patent[]>);
    return grouped;
  });

  // 真实统计数据计算
  const statistics = computed((): PatentStatistics => {
    const now = new Date();
    const thirtyDaysFromNow = new Date(
      now.getTime() + 30 * 24 * 60 * 60 * 1000
    );

    const expiringSoon = patents.value
      ? patents.value.filter((_patent) => {
          if (!_patent.expirationDate) return false;
          const expirationDate = new Date(_patent.expirationDate);
          return expirationDate <= thirtyDaysFromNow && expirationDate > now;
        }).length
      : 0;

    const maintenanceDue = patents.value
      ? patents.value.filter((_patent) => {
          // 检查是否有即将到期的维护费
          // 由于我们没有包含 fees 关联字段，这里暂时返回 0
          // TODO: 如果需要准确的维护费信息，需要在查询时包含 fees 字段
          return false;
        }).length
      : 0;

    const recentApplications = patents.value
      ? patents.value.filter((p) => {
          const applicationDate = new Date(p.applicationDate);
          const sixMonthsAgo = new Date(
            now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000
          );
          return applicationDate >= sixMonthsAgo;
        }).length
      : 0;

    return {
      total: patents.value ? patents.value.length : 0,
      byStatus: Object.keys(patentsByStatus.value).reduce((acc, status) => {
        acc[status as PatentStatus] =
          patentsByStatus.value[status as PatentStatus]?.length || 0;
        return acc;
      }, {} as Record<PatentStatus, number>),
      byType: patents.value
        ? patents.value.reduce((acc, patent) => {
            acc[patent.type] = (acc[patent.type] || 0) + 1;
            return acc;
          }, {} as Record<PatentType, number>)
        : ({} as Record<PatentType, number>),
      byCategory: {} as Record<number, number>,
      byYear: patents.value
        ? patents.value.reduce((acc, patent) => {
            const year = new Date(patent.applicationDate).getFullYear();
            acc[year] = (acc[year] || 0) + 1;
            return acc;
          }, {} as Record<number, number>)
        : ({} as Record<number, number>),
      recentApplications,
      expiringSoon,
      maintenanceDue,
    };
  });

  // 过滤后的专利列表
  const filteredPatents = computed(() => {
    if (!patents.value) return [];
    let filtered = patents.value;

    // 关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase();
      filtered = filtered.filter(
        (patent) =>
          patent.title.toLowerCase().includes(keyword) ||
          patent.description?.toLowerCase().includes(keyword) ||
          false ||
          patent.patentNumber.toLowerCase().includes(keyword) ||
          patent.abstract?.toLowerCase().includes(keyword) ||
          false ||
          (patent.keywords &&
            Array.isArray(patent.keywords) &&
            patent.keywords.some((k) => k.toLowerCase().includes(keyword))) ||
          (patent.applicants &&
            Array.isArray(patent.applicants) &&
            patent.applicants.some((a) => a.toLowerCase().includes(keyword))) ||
          (patent.inventors &&
            Array.isArray(patent.inventors) &&
            patent.inventors.some((i) => i.toLowerCase().includes(keyword)))
      );
    }

    // 状态过滤
    if (filterStatus.value) {
      filtered = filtered.filter(
        (patent) => patent.status === filterStatus.value
      );
    }

    // 类型过滤
    if (filterType.value) {
      filtered = filtered.filter((patent) => patent.type === filterType.value);
    }

    return filtered;
  });

  // 数据验证
  const validatePatent = (patent: Partial<Patent>): string[] => {
    const errors: string[] = [];

    if (!patent.title?.trim()) {
      errors.push("专利标题不能为空");
    }

    if (!patent.patentNumber?.trim()) {
      errors.push("专利号不能为空");
    }

    if (!patent.applicationDate) {
      errors.push("申请日期不能为空");
    }

    if (!patent.type) {
      errors.push("专利类型不能为空");
    }

    if (!patent.status) {
      errors.push("专利状态不能为空");
    }

    // 申请人验证 - 如果为空数组，使用默认值
    if (!patent.applicants || patent.applicants.length === 0) {
      patent.applicants = ["新浪科技有限公司"];
    }

    // 发明人验证 - 如果为空数组，使用默认值
    if (!patent.inventors || patent.inventors.length === 0) {
      patent.inventors = ["系统管理员"];
    }

    // 检查专利号是否重复（编辑时排除自身）
    if (patent.patentNumber && patent.patentNumber.trim()) {
      if (patents.value) {
        const duplicatePatent = patents.value.find(
          (p) => p.patentNumber === patent.patentNumber && p.id !== patent.id
        );

        if (duplicatePatent) {
          errors.push("专利号已存在");
        }
      }
    }

    return errors;
  };

  // 方法
  const fetchPatents = async (params?: { status?: string }) => {
    loading.value = true;
    try {
      const apiResponse = await patentAPI.getPatents({
        page: 1,
        limit: 1000,
        status: params?.status,
      });

      if (apiResponse && apiResponse.patents) {
        patents.value = apiResponse.patents;
        total.value = apiResponse.pagination?.total || patents.value.length;
      } else {
        patents.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取专利列表失败:", error);
      patents.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addPatent = async (patent: Omit<Patent, "id">) => {
    try {
      // 数据验证
      const errors = validatePatent(patent);
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }

      // 通过API创建专利
      const apiResponse = await patentAPI.createPatent(patent);
      if (!apiResponse || !apiResponse.id) {
        throw new Error("创建专利失败");
      }

      const newPatent = apiResponse;

      // 添加到本地数组
      if (patents.value) {
        patents.value.push(newPatent);
      }

      // 记录活动
      try {
        await activityAPI.createActivity({
          type: "patent_add",
          title: "新增专利",
          description: newPatent.title,
          targetId: newPatent.id,
          targetName: newPatent.title,
          status: "success",
          statusText: "已完成",
        });
      } catch (activityError) {
        console.warn("记录活动失败:", activityError);
        // 使用本地活动记录
        const activityStore = useActivityStore();
        activityStore.addActivity({
          type: "patent_add",
          title: "新增专利",
          description: newPatent.title,
          userId: 1, // 当前用户ID
          userName: "系统管理员",
          targetId: newPatent.id,
          targetName: newPatent.title,
          timestamp: new Date().toISOString(),
          status: "success",
          statusText: "已完成",
        });
      }

      return newPatent;
    } catch (error) {
      console.error("创建专利失败:", error);
      throw error;
    }
  };

  const updatePatent = async (id: number, updates: Partial<Patent>) => {
    try {
      // 数据验证
      const errors = validatePatent({
        ...patents.value.find((p) => p.id === id),
        ...updates,
      } as Patent);
      if (errors.length > 0) {
        throw new Error(errors.join("; "));
      }

      // 通过API更新专利
      const apiResponse = await patentAPI.updatePatent(id, updates);
      if (!apiResponse || !apiResponse.id) {
        throw new Error("更新专利失败");
      }

      // 更新本地数据
      if (patents.value) {
        const index = patents.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          patents.value[index] = {
            ...patents.value[index],
            ...updates,
            updatedAt: new Date().toISOString(),
          };
        }
      }

      return apiResponse;
    } catch (error) {
      console.error("更新专利失败:", error);
      throw error;
    }
  };

  const deletePatent = async (id: number) => {
    try {
      // 通过API删除专利
      await patentAPI.deletePatent(id);

      // 从本地数组中移除
      if (patents.value) {
        const index = patents.value.findIndex((p) => p.id === id);
        if (index !== -1) {
          patents.value.splice(index, 1);
        }
      }

      return true;
    } catch (error) {
      console.error("删除专利失败:", error);
      throw error;
    }
  };

  const searchPatents = (keyword: string) => {
    searchKeyword.value = keyword;
    return filteredPatents.value;
  };

  const filterByStatus = (status: PatentStatus | "") => {
    filterStatus.value = status;
  };

  const filterByType = (type: PatentType | "") => {
    filterType.value = type;
  };

  const clearFilters = () => {
    searchKeyword.value = "";
    filterStatus.value = "";
    filterType.value = "";
    filterCategory.value = "";
  };

  const getPatentById = (id: number) => {
    if (!patents.value) return null;
    return patents.value.find((p) => p.id === id) || null;
  };

  const getPatentsByStatus = (status: PatentStatus) => {
    if (!patents.value) return [];
    return patents.value.filter((p) => p.status === status);
  };

  const getPatentsByType = (type: PatentType) => {
    if (!patents.value) return [];
    return patents.value.filter((p) => p.type === type);
  };

  const getExpiringPatents = (days: number = 30) => {
    if (!patents.value) return [];
    const now = new Date();
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return patents.value.filter((patent) => {
      if (!patent.expirationDate) return false;
      const expirationDate = new Date(patent.expirationDate);
      return expirationDate <= targetDate && expirationDate > now;
    });
  };

  const getMaintenanceDuePatents = (days: number = 180) => {
    if (!patents.value) return [];
    const now = new Date();
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);

    return patents.value.filter((patent) => {
      if (!patent.fees || !Array.isArray(patent.fees)) return false;
      return patent.fees.some((fee) => {
        const dueDate = new Date(fee.dueDate);
        return (
          dueDate <= targetDate && dueDate > now && fee.type === "maintenance"
        );
      });
    });
  };

  // 专利申请相关方法
  const submitApplication = async (
    applicationData: Omit<
      PatentApplication,
      "id" | "patentId" | "status" | "reviewHistory"
    >
  ) => {
    const userStore = useUserStore();
    const activityStore = useActivityStore();
    const notificationStore = useNotificationStore();

    try {
      // 生成申请ID
      if (!applications.value) {
        throw new Error("专利申请列表未初始化");
      }

      const applicationId =
        applications.value.length > 0
          ? Math.max(...applications.value.map((app) => app.id)) + 1
          : 1;

      // 创建专利申请
      const newApplication: PatentApplication = {
        ...applicationData,
        id: applicationId,
        patentId: 0, // 暂时为0，审核通过后会创建真正的专利
        status: "pending",
        reviewHistory: [
          {
            id: 1,
            reviewer: userStore.currentUser?.realName || "申请人",
            action: "提交专利申请",
            time: new Date().toLocaleString(),
          },
        ],
      };

      // 添加到申请列表
      if (applications.value) {
        applications.value.push(newApplication);
      }

      // 记录活动
      activityStore.addActivity({
        type: "patent_application",
        title: "专利申请提交",
        description: `提交专利申请：${applicationData.title}`,
        userId: userStore.currentUser?.id || 0,
        userName: userStore.currentUser?.realName || "申请人",
        targetId: applicationId,
        targetName: applicationData.title,
        timestamp: new Date().toISOString(),
        status: "pending",
        statusText: "待审核",
      });

      // 发送通知
      notificationStore.createPatentNotification(
        applicationData.title,
        "created",
        userStore.currentUser?.id || 0
      );

      return newApplication;
    } catch (error) {
      console.error("提交专利申请失败:", error);
      throw error;
    }
  };

  // 获取所有专利申请
  const getApplications = () => {
    return applications.value || [];
  };

  // 获取待审核的专利申请
  const getPendingApplications = () => {
    if (!applications.value) return [];
    return applications.value.filter((app) => app.status === "pending");
  };

  // 审核专利申请
  const reviewApplication = async (
    applicationId: number,
    result: "approved" | "rejected",
    comment?: string
  ) => {
    const userStore = useUserStore();
    const activityStore = useActivityStore();

    try {
      if (!applications.value) {
        throw new Error("专利申请列表未初始化");
      }

      const applicationIndex = applications.value.findIndex(
        (app) => app.id === applicationId
      );
      if (applicationIndex === -1) {
        throw new Error("专利申请不存在");
      }

      const application = applications.value[applicationIndex];
      const reviewer = userStore.currentUser?.realName || "审核员";

      // 更新申请状态
      application.status = result;
      if (!application.reviewHistory) {
        application.reviewHistory = [];
      }
      application.reviewHistory.push({
        id: application.reviewHistory.length + 1,
        reviewer,
        action: result === "approved" ? "审核通过" : "审核拒绝",
        comment,
        time: new Date().toLocaleString(),
      });

      // 如果审核通过，创建真正的专利
      if (result === "approved") {
        const patentId =
          patents.value && patents.value.length > 0
            ? Math.max(...patents.value.map((p) => p.id)) + 1
            : 1;

        const newPatent: Patent = {
          id: patentId,
          title: application.title,
          description: application.description,
          patentNumber: application.patentNumber,
          applicationDate: application.submitDate,
          type: application.type,
          status: "approved" as PatentStatus,
          categoryId: application.categoryId,
          applicants: application.applicants,
          inventors: application.inventors,
          technicalField: application.technicalField,
          keywords: application.keywords,
          abstract: application.description,
          claims: "",
          documents: [],
          fees: [],
          deadlines: [],
          userId: userStore.currentUser?.id || 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 添加到专利列表
        if (patents.value) {
          patents.value.push(newPatent);
        }

        // 更新申请的patentId
        application.patentId = patentId;
      }

      // 记录活动
      activityStore.addActivity({
        type: "patent_review",
        title: `专利申请${result === "approved" ? "通过" : "拒绝"}`,
        description: `${result === "approved" ? "通过" : "拒绝"}专利申请：${
          application.title
        }`,
        userId: userStore.currentUser?.id || 0,
        userName: userStore.currentUser?.realName || "审核员",
        targetId: applicationId,
        targetName: application.title,
        timestamp: new Date().toISOString(),
        status: result === "approved" ? "success" : "warning",
        statusText: result === "approved" ? "已通过" : "已拒绝",
      });

      return application;
    } catch (error) {
      console.error("审核专利申请失败:", error);
      throw error;
    }
  };

  // 加载专利申请数据
  const loadApplications = async () => {
    try {
      // 这里应该调用专利申请的API
      // 暂时设置为空数组，等待API实现
      applications.value = [];
    } catch (error) {
      console.error("加载专利申请数据失败:", error);
      applications.value = [];
    }
  };

  // 专利分析相关方法
  const analyzePatentTechnology = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentAnalysisAPI.analyzeTechnology(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              analysis: {
                ...(patent as any).analysis,
                technology: result.data,
              },
            }
          : patent
      );
      return result;
    } catch (error) {
      console.error("专利技术分析失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const analyzePatentCompetition = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentAnalysisAPI.analyzeCompetition(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              analysis: {
                ...(patent as any).analysis,
                competition: result.data,
              },
            }
          : patent
      );
      return result;
    } catch (error) {
      console.error("专利竞争分析失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const evaluatePatentValue = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentAnalysisAPI.evaluateValue(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              analysis: { ...(patent as any).analysis, value: result.data },
            }
          : patent
      );
      return result;
    } catch (error) {
      console.error("专利价值评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const evaluatePatentRisk = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentAnalysisAPI.evaluateRisk(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              analysis: { ...(patent as any).analysis, risk: result.data },
            }
          : patent
      );
      return result;
    } catch (error) {
      console.error("专利风险评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利族管理方法
  const getPatentFamily = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentFamilyAPI.getPatentFamily(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId ? { ...patent, family: result.data } : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取专利族失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createPatentFamily = async (data: {
    name: string;
    description?: string;
    patentIds: number[];
  }) => {
    try {
      loading.value = true;
      const result = await patentFamilyAPI.createPatentFamily(data);
      return result.data;
    } catch (error) {
      console.error("创建专利族失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利引用关系方法
  const getPatentCitations = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentCitationAPI.getCitations(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              citations: {
                ...(patent as any).citations,
                forwardCitations: result.data,
              },
            }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取专利引用失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const getPatentCitedBy = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentCitationAPI.getCitedBy(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              citations: {
                ...(patent as any).citations,
                backwardCitations: result.data,
              },
            }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取被引用专利失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const getCitationNetwork = async (patentId: number, depth: number = 2) => {
    try {
      loading.value = true;
      const result = await patentCitationAPI.getCitationNetwork(
        patentId,
        depth
      );
      return result.data;
    } catch (error) {
      console.error("获取引用网络失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利评估方法
  const getPatentEvaluations = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentEvaluationAPI.getEvaluations(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? { ...patent, evaluations: result.data }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取专利评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createPatentEvaluation = async (
    patentId: number,
    data: {
      evaluatorId: number;
      score: number;
      criteria: string[];
      comments: string;
      recommendations: string[];
    }
  ) => {
    try {
      loading.value = true;
      const result = await patentEvaluationAPI.createEvaluation(patentId, data);
      // 更新本地专利数据
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? {
              ...patent,
              evaluations: [
                ...((patent as any).evaluations || []),
                result.data,
              ],
            }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("创建专利评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利监控方法
  const getPatentMonitoring = async (userId: number) => {
    try {
      loading.value = true;
      const result = await patentMonitoringAPI.getMonitoringList(userId);
      return result.data;
    } catch (error) {
      console.error("获取专利监控失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const addPatentToMonitoring = async (patentId: number, userId: number) => {
    try {
      loading.value = true;
      const result = await patentMonitoringAPI.addToMonitoring(
        patentId,
        userId
      );
      return result.data;
    } catch (error) {
      console.error("添加专利监控失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const removePatentFromMonitoring = async (
    patentId: number,
    userId: number
  ) => {
    try {
      loading.value = true;
      const result = await patentMonitoringAPI.removeFromMonitoring(
        patentId,
        userId
      );
      return result.data;
    } catch (error) {
      console.error("移除专利监控失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利交易方法
  const getPatentTransactions = async () => {
    try {
      loading.value = true;
      const result = await patentTransactionAPI.getTransactions(1); // 使用默认专利ID
      return result.data;
    } catch (error) {
      console.error("获取专利交易失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createPatentTransaction = async (data: {
    patentId: number;
    type: "sale" | "license" | "assignment" | "mortgage";
    buyerId: number;
    sellerId: number;
    amount: number;
    currency: string;
    terms: any;
  }) => {
    try {
      loading.value = true;
      const result = await patentTransactionAPI.createTransaction(
        data.patentId,
        {
          transactionType: data.type,
          amount: data.amount,
          currency: data.currency,
          buyer: data.buyerId.toString(),
          seller: data.sellerId.toString(),
          terms: data.terms,
        }
      );
      return result.data;
    } catch (error) {
      console.error("创建专利交易失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利诉讼方法
  const getPatentLitigations = async () => {
    try {
      loading.value = true;
      const result = await patentLitigationAPI.getLitigations(1);
      return result.data;
    } catch (error) {
      console.error("获取专利诉讼失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createPatentLitigation = async (data: {
    patentId: number;
    caseNumber: string;
    court: string;
    plaintiff: string;
    defendant: string;
    filingDate: string;
    status: string;
    description: string;
  }) => {
    try {
      loading.value = true;
      const result = await patentLitigationAPI.createLitigation(data.patentId, {
        caseNumber: data.caseNumber,
        court: data.court,
        plaintiff: data.plaintiff,
        defendant: data.defendant,
        caseType: data.status,
        description: data.description,
      });
      return result.data;
    } catch (error) {
      console.error("创建专利诉讼失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利许可方法
  const getPatentLicenses = async () => {
    try {
      loading.value = true;
      const result = await patentLicenseAPI.getLicenses(1);
      return result.data;
    } catch (error) {
      console.error("获取专利许可失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createPatentLicense = async (data: {
    patentId: number;
    licenseeId: number;
    licensorId: number;
    type: "exclusive" | "non-exclusive" | "sublicense";
    territory: string[];
    duration: string;
    royalty: number;
    terms: any;
  }) => {
    try {
      loading.value = true;
      const result = await patentLicenseAPI.createLicense(data.patentId, {
        licensee: data.licenseeId.toString(),
        licenseType: data.type,
        territory: data.territory.join(", "),
        duration: data.duration,
        royalty: data.royalty.toString(),
        terms: data.terms,
      });
      return result.data;
    } catch (error) {
      console.error("创建专利许可失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 高级检索方法
  const advancedSearch = async (params: {
    keywords: string[];
    status: string[];
    type: string[];
    categoryId: number[];
    dateRange: { start: string; end: string };
    applicants: string[];
    inventors: string[];
    page: number;
    limit: number;
  }) => {
    try {
      loading.value = true;
      const result = await patentSearchAPI.advancedSearch(params);
      patents.value = result.data.patents;
      total.value = result.data.total;
      // currentPage.value = result.data.page; // 注释掉未定义的变量
      return result.data;
    } catch (error) {
      console.error("高级检索失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const findSimilarPatents = async (patentId: number, limit: number = 10) => {
    try {
      loading.value = true;
      const result = await patentSearchAPI.findSimilarPatents(patentId, limit);
      return result.data;
    } catch (error) {
      console.error("查找相似专利失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 增强统计方法
  const getPatentTrends = async (period: string, groupBy: string) => {
    try {
      loading.value = true;
      const result = await enhancedStatsAPI.getPatentTrends(period, groupBy);
      return result.data;
    } catch (error) {
      console.error("获取专利趋势失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const getTechnologyDistribution = async (category?: string) => {
    try {
      loading.value = true;
      const result = await enhancedStatsAPI.getTechnologyDistribution(category);
      return result.data;
    } catch (error) {
      console.error("获取技术分布失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const getApplicantRanking = async (limit: number = 20) => {
    try {
      loading.value = true;
      const result = await enhancedStatsAPI.getApplicantRanking(limit);
      return result.data;
    } catch (error) {
      console.error("获取申请人排名失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利预警方法
  const getPatentAlerts = async (params?: {
    page?: number;
    limit?: number;
    type?: string;
    severity?: string;
    status?: string;
  }) => {
    try {
      loading.value = true;
      const result = await patentAlertAPI.getAlerts(params);
      return result.data;
    } catch (error) {
      console.error("获取专利预警失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createAlertRule = async (data: {
    name: string;
    type: string;
    conditions: any;
    actions: any[];
    enabled: boolean;
  }) => {
    try {
      loading.value = true;
      const result = await patentAlertAPI.createAlertRule(data);
      return result.data;
    } catch (error) {
      console.error("创建预警规则失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利质量评估方法
  const getPatentQualityAssessment = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentQualityAPI.getQualityAssessment(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? { ...patent, qualityAssessment: result.data }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取专利质量评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const performQualityAssessment = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await patentQualityAPI.performQualityAssessment(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? { ...patent, qualityAssessment: result.data }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("执行质量评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利维护增强方法
  const getPatentMaintenancePlan = async (patentId: number) => {
    try {
      loading.value = true;
      const result = await enhancedMaintenanceAPI.getMaintenancePlan(patentId);
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? { ...patent, maintenancePlan: result.data }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("获取维护计划失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createMaintenancePlan = async (
    patentId: number,
    data: {
      schedule: any[];
      reminders: any[];
      autoRenewal: boolean;
    }
  ) => {
    try {
      loading.value = true;
      const result = await enhancedMaintenanceAPI.createMaintenancePlan(
        patentId,
        data
      );
      patents.value = patents.value.map((patent) =>
        patent.id === patentId
          ? { ...patent, maintenancePlan: result.data }
          : patent
      );
      return result.data;
    } catch (error) {
      console.error("创建维护计划失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 批量操作增强方法
  const bulkAnalyzePatents = async (
    patentIds: number[],
    analysisType: string
  ) => {
    try {
      loading.value = true;
      const promises = patentIds.map((id) => {
        switch (analysisType) {
          case "technology":
            return analyzePatentTechnology(id);
          case "competition":
            return analyzePatentCompetition(id);
          case "value":
            return evaluatePatentValue(id);
          case "risk":
            return evaluatePatentRisk(id);
          default:
            return Promise.resolve();
        }
      });

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("批量分析专利失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const bulkQualityAssessment = async (patentIds: number[]) => {
    try {
      loading.value = true;
      const promises = patentIds.map((id) => performQualityAssessment(id));
      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("批量质量评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 数据导出增强方法
  const exportPatentAnalysis = async (
    patentIds: number[],
    format: string = "excel"
  ) => {
    try {
      loading.value = true;
      // 这里可以调用后端导出API或在前端生成报告
      const filteredPatents = patents.value.filter((p) =>
        patentIds.includes(p.id)
      );
      const analysisData = filteredPatents.map((patent) => ({
        id: patent.id,
        title: patent.title,
        patentNumber: patent.patentNumber,
        status: patent.status,
        analysis: (patent as any).analysis,
        qualityAssessment: (patent as any).qualityAssessment,
        evaluations: (patent as any).evaluations,
        family: (patent as any).family,
        citations: (patent as any).citations,
      }));

      // 根据格式生成不同的导出文件
      if (format === "excel") {
        // 生成Excel文件
        return generateExcelReport(analysisData);
      } else if (format === "pdf") {
        // 生成PDF报告
        return generatePDFReport(analysisData);
      }

      return analysisData;
    } catch (error) {
      console.error("导出专利分析失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 辅助方法
  const generateExcelReport = (data: any[]) => {
    // 这里可以实现Excel生成逻辑
    console.log("生成Excel报告:", data);
    return data;
  };

  const generatePDFReport = (data: any[]) => {
    // 这里可以实现PDF生成逻辑
    console.log("生成PDF报告:", data);
    return data;
  };

  // 获取专利完整信息
  const getPatentFullInfo = async (patentId: number) => {
    try {
      loading.value = true;
      const promises = [
        getPatentById(patentId),
        getPatentFamily(patentId),
        getPatentCitations(patentId),
        getPatentCitedBy(patentId),
        getPatentEvaluations(patentId),
        getPatentQualityAssessment(patentId),
        getPatentMaintenancePlan(patentId),
      ];

      const results = await Promise.all(promises);
      return results;
    } catch (error) {
      console.error("获取专利完整信息失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 专利文档管理方法
  const getPatentDocuments = async (patentId: number) => {
    try {
      const response = await patentAPI.getPatentDocuments(patentId);
      return response;
    } catch (error) {
      console.error("获取专利文档失败:", error);
      throw error;
    }
  };

  const createPatentDocument = async (
    patentId: number,
    data: {
      name: string;
      type: string;
      fileUrl: string;
      fileSize?: number;
    }
  ) => {
    try {
      const response = await patentAPI.createPatentDocument(patentId, data);
      return response;
    } catch (error) {
      console.error("创建专利文档失败:", error);
      throw error;
    }
  };

  const deletePatentDocument = async (patentId: number, documentId: number) => {
    try {
      const response = await patentAPI.deletePatentDocument(
        patentId,
        documentId
      );
      return response;
    } catch (error) {
      console.error("删除专利文档失败:", error);
      throw error;
    }
  };

  // 初始化时加载数据
  fetchPatents();
  loadApplications();

  return {
    // 状态
    patents,

    loading,
    currentPatent,
    searchKeyword,
    filterStatus,
    filterType,
    filterCategory,
    total, // 新增：暴露total

    // 计算属性
    totalPatents,
    patentsByStatus,
    statistics,
    filteredPatents,

    // 基础方法
    fetchPatents,
    addPatent,
    updatePatent,
    deletePatent,

    searchPatents,
    filterByStatus,
    filterByType,

    clearFilters,
    getPatentById,
    getPatentsByStatus,
    getPatentsByType,

    getExpiringPatents,
    getMaintenanceDuePatents,
    validatePatent,

    // 专利申请相关方法
    submitApplication,
    getApplications,
    getPendingApplications,
    reviewApplication,
    loadApplications,

    // 专利分析相关方法
    analyzePatentTechnology,
    analyzePatentCompetition,
    evaluatePatentValue,
    evaluatePatentRisk,

    // 专利族管理方法
    getPatentFamily,
    createPatentFamily,

    // 专利引用关系方法
    getPatentCitations,
    getPatentCitedBy,
    getCitationNetwork,

    // 专利评估方法
    getPatentEvaluations,
    createPatentEvaluation,

    // 专利监控方法
    getPatentMonitoring,
    addPatentToMonitoring,
    removePatentFromMonitoring,

    // 专利交易方法
    getPatentTransactions,
    createPatentTransaction,

    // 专利诉讼方法
    getPatentLitigations,
    createPatentLitigation,

    // 专利许可方法
    getPatentLicenses,
    createPatentLicense,

    // 高级检索方法
    advancedSearch,
    findSimilarPatents,

    // 增强统计方法
    getPatentTrends,
    getTechnologyDistribution,
    getApplicantRanking,

    // 专利预警方法
    getPatentAlerts,
    createAlertRule,

    // 专利质量评估方法
    getPatentQualityAssessment,
    performQualityAssessment,

    // 专利维护增强方法
    getPatentMaintenancePlan,
    createMaintenancePlan,

    // 批量操作增强方法
    bulkAnalyzePatents,
    bulkQualityAssessment,

    // 数据导出增强方法
    exportPatentAnalysis,

    // 获取专利完整信息
    getPatentFullInfo,

    // 专利文档管理方法
    getPatentDocuments,
    createPatentDocument,
    deletePatentDocument,
  };
});
