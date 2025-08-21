import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { feeAPI } from "@/utils/api";
import type { Fee, FeeCategory, FeeStatus, FeeRecord } from "@/types/fee";

export const useFeeStore = defineStore("fee", () => {
  // 状态
  const fees = ref<any[]>([]);
  const categories = ref<FeeCategory[]>([]);
  const loading = ref(false);
  const total = ref(0);

  // 计算属性
  const pendingFees = computed(() =>
    fees.value.filter((fee: any) => fee.status === "pending")
  );

  const overdueFees = computed(() =>
    fees.value.filter((fee: any) => fee.status === "overdue")
  );

  const paidFees = computed(() =>
    fees.value.filter((fee: any) => fee.status === "paid")
  );

  const feesByCategory = computed(
    () => (categoryId: number) =>
      fees.value.filter((fee: any) => fee.categoryId === categoryId)
  );

  const feesByStatus = computed(
    () => (status: FeeStatus) =>
      fees.value.filter((fee: any) => fee.status === status)
  );

  const totalAmount = computed(() =>
    fees.value.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  );

  const pendingAmount = computed(() =>
    pendingFees.value.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  );

  const overdueAmount = computed(() =>
    overdueFees.value.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  );

  const paidAmount = computed(() =>
    paidFees.value.reduce((sum: number, fee: any) => sum + fee.amount, 0)
  );

  const loadFromStorage = () => {
    console.warn("本地存储已废弃，请使用API获取数据");
    // 不再从本地存储加载数据
  };

  const saveToStorage = () => {
    console.warn("本地存储已废弃，数据将直接保存到后端");
    // 不再保存到本地存储
  };

  // API集成方法
  const fetchFees = async (params?: {
    page?: number;
    limit?: number;
    status?: string;
    categoryId?: number;
  }) => {
    try {
      loading.value = true;
      console.log("开始获取费用列表...");
      const response = await feeAPI.getFees(params);
      console.log("获取费用列表API响应:", response);

      // 检查响应格式：可能是直接的数据、Axios响应对象或嵌套结构
      let feesData = null;
      let totalCount = 0;

      if (response && response.data) {
        // Axios响应对象，需要进一步检查data内部结构
        if (response.data.fees && Array.isArray(response.data.fees)) {
          // 嵌套结构：{fees: [...], pagination: {...}}
          feesData = response.data.fees;
          totalCount =
            response.data.pagination?.total || response.data.fees.length;
        } else if (Array.isArray(response.data)) {
          // 直接是数组
          feesData = response.data;
          totalCount = response.data.length;
        } else {
          // 其他结构，尝试提取
          feesData = response.data.fees || response.data;
          totalCount =
            response.data.pagination?.total || response.data.total || 0;
        }
      } else if (response && response.fees) {
        // 嵌套结构：{fees: [...], pagination: {...}}
        feesData = response.fees;
        totalCount = response.pagination?.total || response.fees.length;
      } else if (Array.isArray(response)) {
        // 直接是数组
        feesData = response;
        totalCount = response.length;
      }

      if (feesData && Array.isArray(feesData)) {
        console.log("提取的费用数据:", feesData);
        console.log("数据类型:", typeof feesData);
        console.log("是否为数组:", Array.isArray(feesData));
        console.log("数据长度:", feesData.length);
        console.log("总数量:", totalCount);

        fees.value = feesData;
        total.value = totalCount;
        console.log("更新后的fees.value:", fees.value);
        console.log("更新后的total.value:", total.value);
        // 不再保存到本地存储
      } else {
        console.warn("响应格式不正确，无法提取费用数据:", response);
        throw new Error("API响应格式不正确");
      }
    } catch (error) {
      console.error("获取费用列表失败:", error);
      // 不再回退到本地存储，直接抛出错误
      throw error;
    } finally {
      loading.value = false;
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await feeAPI.getCategories();
      console.log("获取费用分类API响应:", response);

      // 检查响应格式：可能是直接的数据、Axios响应对象或嵌套结构
      let categoriesData = null;

      if (response && response.data) {
        // Axios响应对象，需要进一步检查data内部结构
        if (
          response.data.categories &&
          Array.isArray(response.data.categories)
        ) {
          // 嵌套结构：{categories: [...]}
          categoriesData = response.data.categories;
        } else if (Array.isArray(response.data)) {
          // 直接是数组
          categoriesData = response.data;
        } else {
          // 其他结构，尝试提取
          categoriesData = response.data.categories || response.data;
        }
      } else if (response && response.categories) {
        // 嵌套结构：{categories: [...]}
        categoriesData = response.categories;
      } else if (Array.isArray(response)) {
        // 直接是数组
        categoriesData = response;
      }

      if (categoriesData && Array.isArray(categoriesData)) {
        console.log("提取的费用分类数据:", categoriesData);
        categories.value = categoriesData;
        // 不再保存到本地存储
      } else {
        console.warn("响应格式不正确，无法提取费用分类数据:", response);
        throw new Error("API响应格式不正确");
      }
    } catch (error) {
      console.error("获取费用分类失败:", error);
      // 不再回退到本地存储，直接抛出错误
      throw error;
    }
  };

  // 费用管理
  const addFee = async (
    fee: Omit<FeeRecord, "id" | "createdAt" | "updatedAt">
  ): Promise<FeeRecord> => {
    try {
      console.log("开始创建费用，输入数据:", fee);

      // 准备API数据，确保字段映射正确
      const apiData = {
        patentId: fee.patentId,
        type: fee.feeType, // 使用feeType作为type字段
        feeType: fee.feeType,
        amount: fee.amount,
        currency: fee.currency || "CNY",
        dueDate: fee.dueDate,
        description: fee.description || "",
        notes: fee.notes || "",
      };

      console.log("准备发送到API的数据:", apiData);

      const response = await feeAPI.createFee(apiData);
      console.log("API响应:", response);

      // 检查响应格式：可能是直接的数据、Axios响应对象或嵌套结构
      let newFee = null;
      if (response && response.data) {
        // Axios响应对象
        newFee = response.data;
      } else if (response && response.id) {
        // 直接的数据对象
        newFee = response;
      } else {
        throw new Error("创建费用失败：API响应格式错误");
      }

      // 添加到本地状态
      fees.value.unshift(newFee);
      total.value++;

      // 重新从后端加载数据以确保数据一致性
      await fetchFees();
      console.log("费用列表重新加载完成");
      return newFee;
    } catch (error: any) {
      console.error("创建费用失败:", error);

      // 如果是API错误，直接抛出，让上层处理
      if (error.response) {
        const errorMessage = error.response.data?.error || "创建费用失败";
        const errorDetails = error.response.data?.details || {};
        console.error("API错误详情:", errorDetails);
        throw new Error(
          `${errorMessage}: ${Object.values(errorDetails)
            .filter(Boolean)
            .join(", ")}`
        );
      }

      // 如果是网络错误或其他错误，也直接抛出
      throw error;
    }
  };

  const updateFee = async (
    id: number,
    updates: Partial<{
      type: string;
      feeType: string;
      amount: number;
      currency: string;
      dueDate: string;
      status: string;
      description: string;
      notes: string;
      paidDate: string;
      receiptNumber: string;
      paymentMethod: string;
    }>
  ): Promise<any> => {
    try {
      const response = await feeAPI.updateFee(id, updates);
      // 检查响应格式：可能是直接的数据或Axios响应对象
      if (response && (response.data || response.id)) {
        const updatedFee = response.data || response;
        // 更新成功后，重新从后端加载数据以确保数据一致性
        await fetchFees();
        return updatedFee;
      }
      throw new Error("更新费用失败：API响应格式错误");
    } catch (error: any) {
      console.error("更新费用失败:", error);

      // 如果是API错误，直接抛出，让上层处理
      if (error.response) {
        const errorMessage = error.response.data?.error || "更新费用失败";
        const errorDetails = error.response.data?.details || {};
        console.error("API错误详情:", errorDetails);
        throw new Error(
          `${errorMessage}: ${Object.values(errorDetails)
            .filter(Boolean)
            .join(", ")}`
        );
      }

      // 如果是网络错误或其他错误，也直接抛出
      throw error;
    }
  };

  const deleteFee = async (id: number): Promise<boolean> => {
    try {
      await feeAPI.deleteFee(id);
      // 删除成功后，重新从后端加载数据以确保数据一致性
      await fetchFees();
      return true;
    } catch (error: any) {
      console.error("删除费用失败:", error);

      // 如果是API错误，直接抛出，让上层处理
      if (error.response) {
        const errorMessage = error.response.data?.error || "删除费用失败";
        console.error("API错误详情:", errorMessage);
        throw new Error(errorMessage);
      }

      // 如果是网络错误或其他错误，也直接抛出
      throw error;
    }
  };

  // 费用分类管理
  const addCategory = async (
    category: Omit<FeeCategory, "id" | "createdAt" | "updatedAt">
  ): Promise<FeeCategory> => {
    try {
      const response = await feeAPI.createCategory(category);
      if (response && response.data) {
        const newCategory = response.data;
        categories.value.push(newCategory);
        saveToStorage();
        return newCategory;
      }
      throw new Error("创建费用分类失败");
    } catch (error) {
      console.error("创建费用分类失败:", error);
      // 回退到本地存储
      const newCategory: FeeCategory = {
        ...category,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      categories.value.push(newCategory);
      saveToStorage();
      return newCategory;
    }
  };

  const updateCategory = async (
    id: number,
    updates: Partial<FeeCategory>
  ): Promise<FeeCategory> => {
    try {
      const response = await feeAPI.updateCategory(id, updates);
      if (response && response.data) {
        const updatedCategory = response.data;
        const index = categories.value.findIndex(
          (category: any) => category.id === id
        );
        if (index !== -1) {
          categories.value[index] = updatedCategory;
          saveToStorage();
        }
        return updatedCategory;
      }
      throw new Error("更新费用分类失败");
    } catch (error) {
      console.error("更新费用分类失败:", error);
      // 回退到本地存储
      const index = categories.value.findIndex(
        (category) => category.id === id
      );
      if (index !== -1) {
        categories.value[index] = {
          ...categories.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
        };
        saveToStorage();
        return categories.value[index];
      }
      throw error;
    }
  };

  const deleteCategory = async (id: number): Promise<boolean> => {
    try {
      await feeAPI.deleteCategory(id);
      const index = categories.value.findIndex(
        (category) => category.id === id
      );
      if (index !== -1) {
        categories.value.splice(index, 1);
        saveToStorage();
      }
      return true;
    } catch (error) {
      console.error("删除费用分类失败:", error);
      // 回退到本地存储
      const index = categories.value.findIndex(
        (category) => category.id === id
      );
      if (index !== -1) {
        categories.value.splice(index, 1);
        saveToStorage();
        return true;
      }
      return false;
    }
  };

  // 费用状态管理
  const updateFeeStatus = async (
    id: number,
    status: FeeStatus
  ): Promise<Fee> => {
    try {
      const response = await feeAPI.updateFeeStatus(id, status);
      if (response && response.data) {
        const updatedFee = response.data;
        const index = fees.value.findIndex((fee) => fee.id === id);
        if (index !== -1) {
          fees.value[index] = updatedFee;
          saveToStorage();
        }
        return updatedFee;
      }
      throw new Error("更新费用状态失败");
    } catch (error) {
      console.error("更新费用状态失败:", error);
      // 回退到本地存储
      const index = fees.value.findIndex((fee) => fee.id === id);
      if (index !== -1) {
        fees.value[index] = {
          ...fees.value[index],
          status,
          updatedAt: new Date().toISOString(),
        };
        saveToStorage();
        return fees.value[index];
      }
      throw error;
    }
  };

  // 费用统计
  const getFeeStatistics = () => {
    const totalFees = fees.value.length;
    const pendingCount = pendingFees.value.length;
    const overdueCount = overdueFees.value.length;
    const paidCount = paidFees.value.length;

    const feesByMonth = fees.value.reduce((acc, fee) => {
      const month = new Date(fee.dueDate).toISOString().slice(0, 7);
      acc[month] = (acc[month] || 0) + fee.amount;
      return acc;
    }, {} as Record<string, number>);

    const categoryStats = categories.value.map((category) => ({
      id: category.id,
      name: category.name,
      count: fees.value.filter((fee) => fee.categoryId === category.id).length,
      totalAmount: fees.value
        .filter((fee) => fee.categoryId === category.id)
        .reduce((sum, fee) => sum + fee.amount, 0),
    }));

    return {
      totalFees,
      pendingCount,
      overdueCount,
      paidCount,
      totalAmount: totalAmount.value,
      pendingAmount: pendingAmount.value,
      overdueAmount: overdueAmount.value,
      paidAmount: paidAmount.value,
      feesByMonth,
      categoryStats,
    };
  };

  // 初始化方法
  const initialize = () => {
    loadFromStorage();
    if (fees.value.length === 0) {
      fees.value = generateSampleFees();
      saveToStorage();
    }
    if (categories.value.length === 0) {
      categories.value = generateSampleCategories();
      saveToStorage();
    }
  };

  // 生成示例数据
  const generateSampleFees = (): Fee[] => {
    return [
      {
        id: 1,
        title: "专利申请费",
        description: "发明专利的官方申请费用",
        amount: 5000,
        categoryId: 1,
        status: "pending",
        dueDate: "2024-12-31",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        title: "商标注册费",
        description: "商标注册的官方费用",
        amount: 3000,
        categoryId: 2,
        status: "paid",
        dueDate: "2024-06-30",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
  };

  const generateSampleCategories = (): FeeCategory[] => {
    return [
      {
        id: 1,
        name: "专利申请费",
        description: "专利相关的官方费用",
        color: "#1890ff",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
      {
        id: 2,
        name: "商标注册费",
        description: "商标相关的官方费用",
        color: "#52c41a",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
      },
    ];
  };

  return {
    // 状态
    fees,
    categories,
    loading,
    total,

    // 计算属性
    pendingFees,
    overdueFees,
    paidFees,
    feesByCategory,
    feesByStatus,
    totalAmount,
    pendingAmount,
    overdueAmount,
    paidAmount,

    // 方法
    loadFromStorage,
    saveToStorage,
    initialize,

    // API集成方法
    fetchFees,
    fetchCategories,

    // 费用管理
    addFee,
    updateFee,
    deleteFee,

    // 费用分类管理
    addCategory,
    updateCategory,
    deleteCategory,

    // 费用状态管理
    updateFeeStatus,

    // 费用统计
    getFeeStatistics,

    // 添加缺失的方法
    feeRecords: computed(() => {
      console.log("=== feeRecords 计算属性被调用 ===");
      console.log("原始费用数据:", fees.value);
      console.log("原始费用数据类型:", typeof fees.value);
      console.log("原始费用数据是否为数组:", Array.isArray(fees.value));
      console.log("原始费用数据长度:", fees.value?.length || 0);

      if (!fees.value || fees.value.length === 0) {
        console.log("费用数据为空，返回空数组");
        return [];
      }

      const mappedFees = fees.value.map((fee, index) => {
        console.log(`处理第${index + 1}个费用:`, fee);
        const mapped = {
          id: fee.id,
          patentId: fee.patentId || 0,
          patentNumber: fee.patentNumber || "未知",
          patentTitle: fee.patentTitle || "未知",
          feeType: fee.feeType || fee.type || "maintenance",
          type: fee.type || fee.feeType || "maintenance",
          amount: fee.amount || 0,
          currency: fee.currency || "CNY",
          dueDate: fee.dueDate,
          paidDate: fee.paidDate,
          status: fee.status || "pending",
          description: fee.description || "",
          receiptNumber: fee.receiptNumber,
          paymentMethod: fee.paymentMethod,
          notes: fee.notes,
          categoryId: fee.categoryId,
          createdAt: fee.createdAt,
          updatedAt: fee.updatedAt,
        };
        console.log(`第${index + 1}个费用映射后:`, mapped);
        return mapped;
      });
      console.log("最终费用记录:", mappedFees);
      console.log("=== feeRecords 计算属性调用结束 ===");
      return mappedFees;
    }),
    feeReminders: computed(() =>
      fees.value.filter((fee) => (fee.status || "pending") === "pending")
    ),
    feeBudgets: computed(() => categories.value),
    activeBudgets: computed(() => categories.value),
    reconciliationRecords: computed(() => {
      // 将已缴费的费用记录转换为对账记录格式
      return fees.value
        .filter((fee) => (fee.status || "pending") === "paid")
        .map((fee) => ({
          id: fee.id,
          patentId: fee.patentId || 0,
          patentNumber: fee.patentNumber || "未知",
          patentTitle: fee.patentTitle || "未知",
          feeType: fee.feeType || fee.type || "maintenance",
          expectedAmount: fee.amount || 0,
          actualAmount: fee.amount || 0, // 实际金额等于预期金额（已缴费）
          difference: 0, // 已缴费，差异为0
          status: fee.status || "paid",
          description: fee.description || "",
          createdAt: fee.createdAt,
          updatedAt: fee.updatedAt,
        }));
    }),
    statistics: computed(() => ({
      totalFees: fees.value.length,
      pendingFees: fees.value.filter(
        (fee) => (fee.status || "pending") === "pending"
      ).length,
      paidFees: fees.value.filter((fee) => (fee.status || "pending") === "paid")
        .length,
      overdueFees: fees.value.filter(
        (fee) => (fee.status || "pending") === "overdue"
      ).length,
      totalAmount: fees.value.reduce((sum, fee) => sum + (fee.amount || 0), 0),
      pendingAmount: fees.value
        .filter((fee) => (fee.status || "pending") === "pending")
        .reduce((sum, fee) => sum + (fee.amount || 0), 0),
      paidAmount: fees.value
        .filter((fee) => (fee.status || "pending") === "paid")
        .reduce((sum, fee) => sum + (fee.amount || 0), 0),
      overdueAmount: fees.value
        .filter((fee) => (fee.status || "pending") === "overdue")
        .reduce((sum, fee) => sum + (fee.amount || 0), 0),
    })),

    // 费用记录管理
    loadFeeRecords: async () => {
      try {
        await fetchFees();
      } catch (error) {
        console.error("加载费用记录失败:", error);
        // 不再回退到本地存储，直接抛出错误
        throw error;
      }
    },
    addFeeRecord: addFee,
    updateFeeRecord: updateFee,
    deleteFeeRecord: deleteFee,

    // 费用提醒管理
    loadFeeReminders: async () => {
      try {
        await fetchFees();
      } catch (error) {
        console.error("加载费用提醒失败:", error);
        throw error;
      }
    },
    markReminderAsPaid: async (patentId: number) => {
      // Fee接口没有patentId属性，这里暂时跳过
      console.log("Marking reminder as paid for patent:", patentId);
    },
    markReminderAsRead: async (id: number) => {
      // 这里可以添加标记为已读的逻辑
      console.log("Marking reminder as read:", id);
    },

    // 预算管理
    loadFeeBudgets: async () => {
      try {
        await fetchCategories();
      } catch (error) {
        console.error("加载费用预算失败:", error);
        throw error;
      }
    },
    addBudget: addCategory,
    updateBudget: updateCategory,
    deleteBudget: deleteCategory,

    // 对账记录管理
    loadReconciliationRecords: async () => {
      try {
        await fetchFees();
      } catch (error) {
        console.error("加载对账记录失败:", error);
        throw error;
      }
    },
    addReconciliationRecord: addFee,
    updateReconciliationRecord: updateFee,
  };
});
