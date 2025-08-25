import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  disclosureAPI,
  evaluationAPI,
  agencyAPI,
} from "../utils/disclosureAPI";
import type {
  DisclosureDocument,
  DisclosureEvaluation,
  PatentAgency,
  AgencyAssignment,
  DisclosureFormData,
  EvaluationFormData,
  AgencyFormData,
  DisclosureSearchParams,
  DisclosureStatistics,
} from "../types/disclosure";

export const useDisclosureStore = defineStore("disclosure", () => {
  // 状态
  const disclosures = ref<DisclosureDocument[]>([]);
  const currentDisclosure = ref<DisclosureDocument | null>(null);
  const evaluations = ref<DisclosureEvaluation[]>([]);
  const agencies = ref<PatentAgency[]>([]);
  const assignments = ref<AgencyAssignment[]>([]);
  const statistics = ref<DisclosureStatistics | null>(null);

  const loading = ref(false);
  const total = ref(0);
  const currentPage = ref(1);
  const pageSize = ref(20);

  // 搜索和筛选状态
  const searchParams = ref<DisclosureSearchParams>({});

  // 计算属性
  const totalPages = computed(() => Math.ceil(total.value / pageSize.value));

  const pendingDisclosures = computed(() =>
    disclosures.value.filter(
      (d) => d.status === "submitted" || d.status === "under_evaluation"
    )
  );

  const approvedDisclosures = computed(() =>
    disclosures.value.filter((d) => d.status === "approved")
  );

  const rejectedDisclosures = computed(() =>
    disclosures.value.filter((d) => d.status === "rejected")
  );

  const byDepartment = computed(() => {
    const result: Record<string, DisclosureDocument[]> = {};
    disclosures.value.forEach((disclosure) => {
      if (!result[disclosure.department]) {
        result[disclosure.department] = [];
      }
      result[disclosure.department].push(disclosure);
    });
    return result;
  });

  const activeAgencies = computed(() =>
    agencies.value.filter((a) => a.status === "active")
  );

  // 交底书管理方法
  const fetchDisclosures = async (params?: DisclosureSearchParams) => {
    loading.value = true;
    try {
      const response = await disclosureAPI.getDisclosures({
        ...params,
        // page: currentPage.value, // 移除page参数，因为DisclosureSearchParams中没有定义
        // limit: pageSize.value, // 移除limit参数，因为DisclosureSearchParams中没有定义
      });

      disclosures.value = response.data;
      total.value = response.total;
      searchParams.value = params || {};
    } catch (error) {
      console.error("获取交底书列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchDisclosure = async (id: number) => {
    loading.value = true;
    try {
      const disclosure = await disclosureAPI.getDisclosure(id);
      currentDisclosure.value = disclosure;
      return disclosure;
    } catch (error) {
      console.error("获取交底书详情失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createDisclosure = async (data: DisclosureFormData) => {
    loading.value = true;
    try {
      const disclosure = await disclosureAPI.createDisclosure(data);
      disclosures.value.unshift(disclosure);
      total.value += 1;
      return disclosure;
    } catch (error) {
      console.error("创建交底书失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateDisclosure = async (
    id: number,
    data: Partial<DisclosureFormData>
  ) => {
    loading.value = true;
    try {
      const disclosure = await disclosureAPI.updateDisclosure(id, data);
      const index = disclosures.value.findIndex((d) => d.id === id);
      if (index !== -1) {
        disclosures.value[index] = disclosure;
      }
      if (currentDisclosure.value?.id === id) {
        currentDisclosure.value = disclosure;
      }
      return disclosure;
    } catch (error) {
      console.error("更新交底书失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteDisclosure = async (id: number) => {
    loading.value = true;
    try {
      await disclosureAPI.deleteDisclosure(id);
      disclosures.value = disclosures.value.filter((d) => d.id !== id);
      total.value -= 1;
      if (currentDisclosure.value?.id === id) {
        currentDisclosure.value = null;
      }
    } catch (error) {
      console.error("删除交底书失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const generateFileNumber = async (department: string) => {
    try {
      return await disclosureAPI.generateCompanyFileNumber(department);
    } catch (error) {
      console.error("生成公司案号失败:", error);
      throw error;
    }
  };

  // 评估管理方法
  const fetchEvaluations = async (disclosureId?: number) => {
    loading.value = true;
    try {
      const data = await evaluationAPI.getEvaluations(disclosureId);
      evaluations.value = data;
      return data;
    } catch (error) {
      console.error("获取评估列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createEvaluation = async (
    disclosureId: number,
    data: EvaluationFormData
  ) => {
    loading.value = true;
    try {
      const evaluation = await evaluationAPI.createEvaluation(
        disclosureId,
        data
      );
      evaluations.value.unshift(evaluation);

      // 更新交底书状态
      const disclosureIndex = disclosures.value.findIndex(
        (d) => d.id === disclosureId
      );
      if (disclosureIndex !== -1) {
        const disclosure = disclosures.value[disclosureIndex];
        if (!disclosure.evaluations) {
          disclosure.evaluations = [];
        }
        disclosure.evaluations.unshift(evaluation);

        // 根据评估结果更新状态
        if (data.evaluationResult === "approved") {
          disclosure.status = "approved";
        } else if (data.evaluationResult === "rejected") {
          disclosure.status = "rejected";
        } else if (data.evaluationResult === "needs_modification") {
          disclosure.status = "under_evaluation";
        }
      }

      return evaluation;
    } catch (error) {
      console.error("创建评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateEvaluation = async (
    id: number,
    data: Partial<EvaluationFormData>
  ) => {
    loading.value = true;
    try {
      const evaluation = await evaluationAPI.updateEvaluation(id, data);
      const index = evaluations.value.findIndex((e) => e.id === id);
      if (index !== -1) {
        evaluations.value[index] = evaluation;
      }
      return evaluation;
    } catch (error) {
      console.error("更新评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteEvaluation = async (id: number) => {
    loading.value = true;
    try {
      await evaluationAPI.deleteEvaluation(id);
      evaluations.value = evaluations.value.filter((e) => e.id !== id);
    } catch (error) {
      console.error("删除评估失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchPendingEvaluations = async () => {
    loading.value = true;
    try {
      const data = await evaluationAPI.getPendingEvaluations();
      return data;
    } catch (error) {
      console.error("获取待评估交底书失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 代理机构管理方法
  const fetchAgencies = async () => {
    loading.value = true;
    try {
      const data = await agencyAPI.getAgencies();
      agencies.value = data;
      return data;
    } catch (error) {
      console.error("获取代理机构列表失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const createAgency = async (data: AgencyFormData) => {
    loading.value = true;
    try {
      const agency = await agencyAPI.createAgency(data);
      agencies.value.unshift(agency);
      return agency;
    } catch (error) {
      console.error("创建代理机构失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateAgency = async (id: number, data: Partial<AgencyFormData>) => {
    loading.value = true;
    try {
      const agency = await agencyAPI.updateAgency(id, data);
      const index = agencies.value.findIndex((a) => a.id === id);
      if (index !== -1) {
        agencies.value[index] = agency;
      }
      return agency;
    } catch (error) {
      console.error("更新代理机构失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const deleteAgency = async (id: number) => {
    loading.value = true;
    try {
      await agencyAPI.deleteAgency(id);
      agencies.value = agencies.value.filter((a) => a.id !== id);
    } catch (error) {
      console.error("删除代理机构失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const assignAgency = async (
    disclosureId: number,
    agencyId: number,
    notes?: string
  ) => {
    loading.value = true;
    try {
      const assignment = await agencyAPI.assignAgency(
        disclosureId,
        agencyId,
        notes
      );
      assignments.value.unshift(assignment);

      // 更新相关交底书的代理分配信息
      const disclosureIndex = disclosures.value.findIndex(
        (d) => d.id === disclosureId
      );
      if (disclosureIndex !== -1) {
        const disclosure = disclosures.value[disclosureIndex];
        if (!disclosure.agencies) {
          disclosure.agencies = [];
        }
        disclosure.agencies.unshift(assignment);
      }

      return assignment;
    } catch (error) {
      console.error("分配代理机构失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const updateAssignment = async (
    assignmentId: number,
    status: string,
    notes?: string
  ) => {
    loading.value = true;
    try {
      const assignment = await agencyAPI.updateAssignment(
        assignmentId,
        status,
        notes
      );
      const index = assignments.value.findIndex((a) => a.id === assignmentId);
      if (index !== -1) {
        assignments.value[index] = assignment;
      }
      return assignment;
    } catch (error) {
      console.error("更新分配状态失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchAssignments = async (disclosureId?: number, agencyId?: number) => {
    loading.value = true;
    try {
      const data = await agencyAPI.getAssignments(disclosureId, agencyId);
      assignments.value = data;
      return data;
    } catch (error) {
      console.error("获取分配记录失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 统计信息方法
  const fetchStatistics = async () => {
    loading.value = true;
    try {
      const data = await disclosureAPI.getStatistics();
      statistics.value = data;
      return data;
    } catch (error) {
      console.error("获取统计信息失败:", error);
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 搜索和分页方法
  const setPage = (page: number) => {
    currentPage.value = page;
    fetchDisclosures(searchParams.value);
  };

  const setPageSize = (size: number) => {
    pageSize.value = size;
    currentPage.value = 1;
    fetchDisclosures(searchParams.value);
  };

  const search = async (params: DisclosureSearchParams) => {
    currentPage.value = 1;
    await fetchDisclosures(params);
  };

  const resetSearch = async () => {
    searchParams.value = {};
    currentPage.value = 1;
    await fetchDisclosures();
  };

  // 清理方法
  const clearCurrentDisclosure = () => {
    currentDisclosure.value = null;
  };

  const clearEvaluations = () => {
    evaluations.value = [];
  };

  return {
    // 状态
    disclosures,
    currentDisclosure,
    evaluations,
    agencies,
    assignments,
    statistics,
    loading,
    total,
    currentPage,
    pageSize,
    searchParams,

    // 计算属性
    totalPages,
    pendingDisclosures,
    approvedDisclosures,
    rejectedDisclosures,
    byDepartment,
    activeAgencies,

    // 交底书方法
    fetchDisclosures,
    fetchDisclosure,
    createDisclosure,
    updateDisclosure,
    deleteDisclosure,
    generateFileNumber,

    // 评估方法
    fetchEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    fetchPendingEvaluations,

    // 代理机构方法
    fetchAgencies,
    createAgency,
    updateAgency,
    deleteAgency,
    assignAgency,
    updateAssignment,
    fetchAssignments,

    // 统计方法
    fetchStatistics,

    // 搜索和分页
    setPage,
    setPageSize,
    search,
    resetSearch,

    // 清理方法
    clearCurrentDisclosure,
    clearEvaluations,
  };
});
