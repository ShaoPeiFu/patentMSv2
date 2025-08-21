import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { contractAPI, lawFirmAPI } from "@/utils/api";
import type {
  LawFirm,
  Contract,
  ContractTemplate,
  FeeAgreement,
  ServiceEvaluation,
  ContractStatistics,
  LawFirmStatistics,
  ContractQueryCondition,
  LawFirmQueryCondition,
  ServiceLevel,
} from "@/types/contract";

export const useContractStore = defineStore("contract", () => {
  // 状态
  const lawFirms = ref<LawFirm[]>([]);
  const contracts = ref<Contract[]>([]);
  const contractTemplates = ref<ContractTemplate[]>([]);
  const feeAgreements = ref<FeeAgreement[]>([]);
  const serviceEvaluations = ref<ServiceEvaluation[]>([]);
  const loading = ref(false);
  const total = ref(0);

  // 计算属性
  const activeContracts = computed(() =>
    contracts.value.filter((contract) => contract.status === "active")
  );

  const activeLawFirms = computed(() => {
    if (!Array.isArray(lawFirms.value)) return [];
    return lawFirms.value.filter((firm) => firm.status === "active");
  });

  const activeTemplates = computed(() => {
    if (!Array.isArray(contractTemplates.value)) return [];
    return contractTemplates.value.filter(
      (template) => template.status === "active"
    );
  });

  const pendingPayments = computed(() => {
    if (!Array.isArray(feeAgreements.value)) return [];
    return feeAgreements.value.filter(
      (agreement) => agreement.status === "pending"
    );
  });

  const overduePayments = computed(() => {
    if (!Array.isArray(feeAgreements.value)) return [];
    return feeAgreements.value.filter(
      (agreement) => agreement.status === "overdue"
    );
  });

  // 统计计算
  const contractStatistics = computed((): ContractStatistics => {
    // 安全检查：确保数据是数组
    if (!Array.isArray(contracts.value) || !Array.isArray(lawFirms.value)) {
      return {
        totalContracts: 0,
        activeContracts: 0,
        completedContracts: 0,
        totalValue: 0,
        averageRating: 0,
        topLawFirms: [],
        contractsByType: {
          patent_application: 0,
          patent_prosecution: 0,
          patent_litigation: 0,
          trademark: 0,
          copyright: 0,
          custom: 0,
          patent_agency: 0,
          trademark_registration: 0,
        },
        contractsByStatus: {
          draft: 0,
          active: 0,
          completed: 0,
          terminated: 0,
        },
      };
    }

    const totalContracts = contracts.value.length;
    const activeContracts = contracts.value.filter(
      (c) => c.status === "active"
    ).length;
    const completedContracts = contracts.value.filter(
      (c) => c.status === "completed"
    ).length;
    const totalValue = contracts.value.reduce(
      (sum, c) => sum + (c.value || 0),
      0
    );

    const contractsByType = contracts.value.reduce((acc, contract) => {
      acc[contract.type] = (acc[contract.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const contractsByStatus = contracts.value.reduce((acc, contract) => {
      acc[contract.status] = (acc[contract.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topLawFirms = lawFirms.value
      .map((firm) => ({
        id: firm.id,
        name: firm.name,
        contractCount: contracts.value.filter((c) => c.lawFirmId === firm.id)
          .length,
        revenue: firm.totalRevenue || 0,
      }))
      .sort((a, b) => (b.revenue || 0) - (a.revenue || 0))
      .slice(0, 5);

    const averageRating =
      lawFirms.value.length > 0
        ? lawFirms.value.reduce((sum, firm) => sum + (firm.rating || 0), 0) /
          lawFirms.value.length
        : 0;

    return {
      totalContracts,
      activeContracts,
      completedContracts,
      totalValue,
      averageRating,
      topLawFirms,
      contractsByType,
      contractsByStatus,
    };
  });

  const lawFirmStatistics = computed((): LawFirmStatistics => {
    // 安全检查：确保数据是数组
    if (!Array.isArray(lawFirms.value)) {
      return {
        totalLawFirms: 0,
        activeLawFirms: 0,
        totalRevenue: 0,
        averageRating: 0,
        topSpecialties: [],
        lawFirmsByServiceLevel: {
          basic: 0,
          standard: 0,
          premium: 0,
        },
      };
    }

    const totalLawFirms = lawFirms.value.length;
    const activeLawFirms = lawFirms.value.filter(
      (f) => f.status === "active"
    ).length;
    const totalRevenue = lawFirms.value.reduce(
      (sum, firm) => sum + (firm.totalRevenue || 0),
      0
    );
    const averageRating =
      lawFirms.value.length > 0
        ? lawFirms.value.reduce((sum, firm) => sum + (firm.rating || 0), 0) /
          lawFirms.value.length
        : 0;

    const topSpecialties = lawFirms.value
      .flatMap((firm) => {
        // 安全处理 specialties 字段
        if (typeof firm.specialties === "string") {
          try {
            const parsed = JSON.parse(firm.specialties);
            return Array.isArray(parsed) ? parsed : [];
          } catch {
            return [];
          }
        } else if (Array.isArray(firm.specialties)) {
          return firm.specialties;
        }
        return [];
      })
      .reduce((acc, specialty) => {
        if (specialty) {
          acc[specialty] = (acc[specialty] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

    const topSpecialtiesArray = Object.entries(topSpecialties)
      .map(([specialty, count]) => ({ specialty, count: count as number }))
      .sort((a, b) => (b.count as number) - (a.count as number))
      .slice(0, 5);

    const lawFirmsByServiceLevel = lawFirms.value.reduce(
      (acc, firm) => {
        const serviceLevel = firm.serviceLevel || "basic";
        acc[serviceLevel] = (acc[serviceLevel] || 0) + 1;
        return acc;
      },
      {
        basic: 0,
        standard: 0,
        premium: 0,
        enterprise: 0,
      } as Record<ServiceLevel, number>
    );

    return {
      totalLawFirms,
      activeLawFirms,
      totalRevenue,
      averageRating,
      topSpecialties: topSpecialtiesArray,
      lawFirmsByServiceLevel,
    };
  });

  // API数据获取方法
  const fetchLawFirms = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      loading.value = true;
      const response = await lawFirmAPI.getLawFirms(params);
      if (response && response.data) {
        // 检查新的API响应格式
        if (response.data.lawFirms && Array.isArray(response.data.lawFirms)) {
          // 新格式：{ success: true, data: { lawFirms: [...], pagination: {...} } }
          lawFirms.value = response.data.lawFirms;
          total.value =
            response.data.pagination?.total || response.data.lawFirms.length;
        } else if (Array.isArray(response.data)) {
          // 旧格式：直接是数组
          lawFirms.value = response.data;
          total.value = response.total || response.data.length;
        } else {
          console.warn("未知的API响应格式:", response.data);
          lawFirms.value = [];
          total.value = 0;
        }
      } else {
        lawFirms.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取律师事务所列表失败:", error);
      lawFirms.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchContracts = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    lawFirmId?: number;
  }) => {
    try {
      loading.value = true;
      const response = await contractAPI.getContracts(params);
      if (response && response.data) {
        // 检查新的API响应格式
        if (response.data.contracts && Array.isArray(response.data.contracts)) {
          // 新格式：{ success: true, data: { contracts: [...], pagination: {...} } }
          contracts.value = response.data.contracts;
          total.value =
            response.data.pagination?.total || response.data.contracts.length;
        } else if (Array.isArray(response.data)) {
          // 旧格式：直接是数组
          contracts.value = response.data;
          total.value = response.total || response.data.length;
        } else {
          console.warn("未知的API响应格式:", response.data);
          contracts.value = [];
          total.value = 0;
        }
      } else {
        contracts.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取合同列表失败:", error);
      contracts.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchContractTemplates = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) => {
    try {
      loading.value = true;
      const response = await contractAPI.getTemplates(params);
      if (response && response.data) {
        // 检查新的API响应格式
        if (response.data.templates && Array.isArray(response.data.templates)) {
          // 新格式：{ success: true, data: { templates: [...], pagination: {...} } }
          contractTemplates.value = response.data.templates;
          total.value =
            response.data.pagination?.total || response.data.templates.length;
        } else if (Array.isArray(response.data)) {
          // 旧格式：直接是数组
          contractTemplates.value = response.data;
          total.value = response.total || response.data.length;
        } else {
          console.warn("未知的API响应格式:", response.data);
          contractTemplates.value = [];
          total.value = 0;
        }
      } else {
        contractTemplates.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取合同模板列表失败:", error);
      contractTemplates.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchFeeAgreements = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    lawFirmId?: number;
  }) => {
    try {
      loading.value = true;
      const response = await contractAPI.getFeeAgreements(params);
      if (response && response.data) {
        // 检查新的API响应格式
        if (
          response.data.feeAgreements &&
          Array.isArray(response.data.feeAgreements)
        ) {
          // 新格式：{ success: true, data: { feeAgreements: [...], pagination: {...} } }
          feeAgreements.value = response.data.feeAgreements;
          total.value =
            response.data.pagination?.total ||
            response.data.feeAgreements.length;
        } else if (Array.isArray(response.data)) {
          // 旧格式：直接是数组
          feeAgreements.value = response.data;
          total.value = response.total || response.data.length;
        } else {
          console.warn("未知的API响应格式:", response.data);
          feeAgreements.value = [];
          total.value = 0;
        }
      } else {
        feeAgreements.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取费用协议列表失败:", error);
      feeAgreements.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchServiceEvaluations = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    lawFirmId?: number;
  }) => {
    try {
      loading.value = true;
      const response = await contractAPI.getServiceEvaluations(params);
      if (response && response.data) {
        // 检查新的API响应格式
        if (
          response.data.serviceEvaluations &&
          Array.isArray(response.data.serviceEvaluations)
        ) {
          // 新格式：{ success: true, data: { serviceEvaluations: [...], pagination: {...} } }
          serviceEvaluations.value = response.data.serviceEvaluations;
          total.value =
            response.data.pagination?.total ||
            response.data.serviceEvaluations.length;
        } else if (Array.isArray(response.data)) {
          // 旧格式：直接是数组
          serviceEvaluations.value = response.data;
          total.value = response.total || response.data.length;
        } else {
          console.warn("未知的API响应格式:", response.data);
          serviceEvaluations.value = [];
          total.value = 0;
        }
      } else {
        serviceEvaluations.value = [];
        total.value = 0;
      }
    } catch (error) {
      console.error("获取服务质量评估列表失败:", error);
      serviceEvaluations.value = [];
      total.value = 0;
      throw error;
    } finally {
      loading.value = false;
    }
  };

  // 律师事务所管理
  const addLawFirm = async (
    lawFirm: Omit<LawFirm, "id" | "createdAt" | "updatedAt">
  ): Promise<LawFirm> => {
    try {
      const response = await lawFirmAPI.createLawFirm(lawFirm);
      if (response && response.data) {
        const newLawFirm = response.data;

        // 安全检查：确保 lawFirms.value 是数组
        if (!Array.isArray(lawFirms.value)) {
          console.warn("lawFirms.value 不是数组，重新初始化为空数组");
          lawFirms.value = [];
        }

        lawFirms.value.push(newLawFirm);
        return newLawFirm;
      }
      throw new Error("创建律师事务所失败");
    } catch (error) {
      console.error("创建律师事务所失败:", error);
      throw error;
    }
  };

  const updateLawFirm = async (
    id: number,
    updates: Partial<LawFirm>
  ): Promise<LawFirm> => {
    try {
      const response = await lawFirmAPI.updateLawFirm(id, updates);
      if (response && response.data) {
        const updatedLawFirm = response.data;

        // 安全检查：确保 lawFirms.value 是数组
        if (!Array.isArray(lawFirms.value)) {
          console.warn("lawFirms.value 不是数组，重新初始化为空数组");
          lawFirms.value = [];
        }

        const index = lawFirms.value.findIndex((firm) => firm.id === id);
        if (index !== -1) {
          lawFirms.value[index] = updatedLawFirm;
        }
        return updatedLawFirm;
      }
      throw new Error("更新律师事务所失败");
    } catch (error) {
      console.error("更新律师事务所失败:", error);
      throw error;
    }
  };

  const deleteLawFirm = async (id: number): Promise<boolean> => {
    try {
      await lawFirmAPI.deleteLawFirm(id);

      // 安全检查：确保 lawFirms.value 是数组
      if (!Array.isArray(lawFirms.value)) {
        console.warn("lawFirms.value 不是数组，重新初始化为空数组");
        lawFirms.value = [];
        return true;
      }

      const index = lawFirms.value.findIndex((firm) => firm.id === id);
      if (index !== -1) {
        lawFirms.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error("删除律师事务所失败:", error);
      throw error;
    }
  };

  // 合同管理
  const addContract = async (
    contract: Omit<Contract, "id" | "createdAt" | "updatedAt">
  ): Promise<Contract> => {
    try {
      const response = await contractAPI.createContract(contract);
      if (response && response.data) {
        const newContract = response.data;

        // 安全检查：确保 contracts.value 是数组
        if (!Array.isArray(contracts.value)) {
          console.warn("contracts.value 不是数组，重新初始化为空数组");
          contracts.value = [];
        }

        contracts.value.push(newContract);
        return newContract;
      }
      throw new Error("创建合同失败");
    } catch (error) {
      console.error("创建合同失败:", error);
      throw error;
    }
  };

  const updateContract = async (
    id: number,
    updates: Partial<Contract>
  ): Promise<Contract> => {
    try {
      const response = await contractAPI.updateContract(id, updates);
      if (response && response.data) {
        const updatedContract = response.data;
        const index = contracts.value.findIndex(
          (contract) => contract.id === id
        );
        if (index !== -1) {
          contracts.value[index] = updatedContract;
        }
        return updatedContract;
      }
      throw new Error("更新合同失败");
    } catch (error) {
      console.error("更新合同失败:", error);
      throw error;
    }
  };

  const deleteContract = async (id: number): Promise<boolean> => {
    try {
      await contractAPI.deleteContract(id);
      const index = contracts.value.findIndex((contract) => contract.id === id);
      if (index !== -1) {
        contracts.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error("删除合同失败:", error);
      throw error;
    }
  };

  // 合同模板管理
  const addTemplate = async (
    template: Omit<ContractTemplate, "id" | "createdAt" | "updatedAt">
  ): Promise<ContractTemplate> => {
    try {
      const response = await contractAPI.createTemplate(template);
      if (response && response.data) {
        const newTemplate = response.data;
        contractTemplates.value.push(newTemplate);
        return newTemplate;
      }
      throw new Error("创建合同模板失败");
    } catch (error) {
      console.error("创建合同模板失败:", error);
      throw error;
    }
  };

  const updateTemplate = async (
    id: number,
    updates: Partial<ContractTemplate>
  ): Promise<ContractTemplate> => {
    try {
      const response = await contractAPI.updateTemplate(id, updates);
      if (response && response.data) {
        const updatedTemplate = response.data;
        const index = contractTemplates.value.findIndex(
          (template) => template.id === id
        );
        if (index !== -1) {
          contractTemplates.value[index] = updatedTemplate;
        }
        return updatedTemplate;
      }
      throw new Error("更新合同模板失败");
    } catch (error) {
      console.error("更新合同模板失败:", error);
      throw error;
    }
  };

  const deleteTemplate = async (id: number): Promise<boolean> => {
    try {
      await contractAPI.deleteTemplate(id);
      const index = contractTemplates.value.findIndex(
        (template) => template.id === id
      );
      if (index !== -1) {
        contractTemplates.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error("删除合同模板失败:", error);
      throw error;
    }
  };

  // 费用协议管理
  const addFeeAgreement = async (
    agreement: Omit<FeeAgreement, "id" | "createdAt" | "updatedAt">
  ): Promise<FeeAgreement> => {
    try {
      const response = await contractAPI.createFeeAgreement(agreement);
      if (response && response.data) {
        // 检查新的API响应格式
        if (response.data.success && response.data.data) {
          // 新格式：{ success: true, data: {...} }
          const newAgreement = response.data.data;
          feeAgreements.value.push(newAgreement);
          return newAgreement;
        } else if (response.data.id) {
          // 旧格式：直接是对象
          const newAgreement = response.data;
          feeAgreements.value.push(newAgreement);
          return newAgreement;
        }
      }
      throw new Error("创建费用协议失败");
    } catch (error) {
      console.error("创建费用协议失败:", error);
      throw error;
    }
  };

  const updateFeeAgreement = async (
    id: number,
    updates: Partial<FeeAgreement>
  ): Promise<FeeAgreement> => {
    try {
      const response = await contractAPI.updateFeeAgreement(id, updates);
      if (response && response.data) {
        // 检查新的API响应格式
        if (response.data.success && response.data.data) {
          // 新格式：{ success: true, data: {...} }
          const updatedAgreement = response.data.data;
          const index = feeAgreements.value.findIndex(
            (agreement) => agreement.id === id
          );
          if (index !== -1) {
            feeAgreements.value[index] = updatedAgreement;
          }
          return updatedAgreement;
        } else if (response.data.id) {
          // 旧格式：直接是对象
          const updatedAgreement = response.data;
          const index = feeAgreements.value.findIndex(
            (agreement) => agreement.id === id
          );
          if (index !== -1) {
            feeAgreements.value[index] = updatedAgreement;
          }
          return updatedAgreement;
        }
      }
      throw new Error("更新费用协议失败");
    } catch (error) {
      console.error("更新费用协议失败:", error);
      throw error;
    }
  };

  const deleteFeeAgreement = async (id: number): Promise<boolean> => {
    try {
      await contractAPI.deleteFeeAgreement(id);
      const index = feeAgreements.value.findIndex(
        (agreement) => agreement.id === id
      );
      if (index !== -1) {
        feeAgreements.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error("删除费用协议失败:", error);
      throw error;
    }
  };

  // 服务质量评估管理
  const addEvaluation = async (
    evaluation: Omit<ServiceEvaluation, "id" | "createdAt" | "updatedAt">
  ): Promise<ServiceEvaluation> => {
    try {
      const response = await contractAPI.createEvaluation(evaluation);
      if (response && response.data) {
        const newEvaluation = response.data;
        serviceEvaluations.value.push(newEvaluation);
        return newEvaluation;
      }
      throw new Error("创建服务质量评估失败");
    } catch (error) {
      console.error("创建服务质量评估失败:", error);
      throw error;
    }
  };

  const updateEvaluation = async (
    id: number,
    updates: Partial<ServiceEvaluation>
  ): Promise<ServiceEvaluation> => {
    try {
      const response = await contractAPI.updateEvaluation(id, updates);
      if (response && response.data) {
        const updatedEvaluation = response.data;
        const index = serviceEvaluations.value.findIndex(
          (evaluation) => evaluation.id === id
        );
        if (index !== -1) {
          serviceEvaluations.value[index] = updatedEvaluation;
        }
        return updatedEvaluation;
      }
      throw new Error("更新服务质量评估失败");
    } catch (error) {
      console.error("更新服务质量评估失败:", error);
      throw error;
    }
  };

  const deleteEvaluation = async (id: number): Promise<boolean> => {
    try {
      await contractAPI.deleteEvaluation(id);
      const index = serviceEvaluations.value.findIndex(
        (evaluation) => evaluation.id === id
      );
      if (index !== -1) {
        serviceEvaluations.value.splice(index, 1);
      }
      return true;
    } catch (error) {
      console.error("删除服务质量评估失败:", error);
      throw error;
    }
  };

  // 查询方法
  const queryContracts = (condition: ContractQueryCondition): Contract[] => {
    return contracts.value.filter((contract) => {
      if (condition.status && contract.status !== condition.status)
        return false;
      if (condition.type && contract.type !== condition.type) return false;
      if (condition.lawFirmId && contract.lawFirmId !== condition.lawFirmId)
        return false;
      if (
        condition.startDate &&
        new Date(contract.startDate) < new Date(condition.startDate)
      )
        return false;
      if (
        condition.endDate &&
        new Date(contract.endDate) > new Date(condition.endDate)
      )
        return false;
      if (condition.minValue && contract.value < condition.minValue)
        return false;
      if (condition.maxValue && contract.value > condition.maxValue)
        return false;
      return true;
    });
  };

  const queryLawFirms = (condition: LawFirmQueryCondition): LawFirm[] => {
    return lawFirms.value.filter((firm) => {
      if (condition.status && firm.status !== condition.status) return false;
      if (condition.minRating && firm.rating < condition.minRating)
        return false;
      if (condition.maxRating && firm.rating > condition.maxRating)
        return false;
      if (condition.minRevenue && firm.totalRevenue < condition.minRevenue)
        return false;
      if (condition.maxRevenue && firm.totalRevenue > condition.maxRevenue)
        return false;
      if (condition.specialties && condition.specialties.length > 0) {
        const hasSpecialty = condition.specialties.some((specialty) =>
          firm.specialties.includes(specialty)
        );
        if (!hasSpecialty) return false;
      }
      return true;
    });
  };

  // 初始化方法 - 获取所有数据
  const initialize = async () => {
    try {
      await Promise.all([
        fetchLawFirms(),
        fetchContracts(),
        fetchContractTemplates(),
        fetchFeeAgreements(),
        fetchServiceEvaluations(),
      ]);
    } catch (error) {
      console.error("初始化合同管理数据失败:", error);
    }
  };

  return {
    // 状态
    lawFirms,
    contracts,
    contractTemplates,
    feeAgreements,
    serviceEvaluations,
    loading,
    total,

    // 计算属性
    activeContracts,
    activeLawFirms,
    activeTemplates,
    pendingPayments,
    overduePayments,
    contractStatistics,
    lawFirmStatistics,

    // 数据获取方法
    fetchLawFirms,
    fetchContracts,
    fetchContractTemplates,
    fetchFeeAgreements,
    fetchServiceEvaluations,

    // 初始化方法
    initialize,

    // 律师事务所管理
    addLawFirm,
    updateLawFirm,
    deleteLawFirm,

    // 合同管理
    addContract,
    updateContract,
    deleteContract,

    // 合同模板管理
    addTemplate,
    updateTemplate,
    deleteTemplate,

    // 费用协议管理
    addFeeAgreement,
    updateFeeAgreement,
    deleteFeeAgreement,

    // 服务质量评估管理
    addEvaluation,
    updateEvaluation,
    deleteEvaluation,

    // 查询方法
    queryContracts,
    queryLawFirms,
  };
});
