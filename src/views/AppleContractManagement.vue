<template>
  <div class="apple-contract-management">
    <!-- 动态背景 -->
    <div class="page-background">
      <div class="floating-elements">
        <div class="element element-1"></div>
        <div class="element element-2"></div>
        <div class="element element-3"></div>
      </div>
    </div>

    <!-- 页面标题区域 -->
    <div class="page-header">
      <div class="header-content">
        <div class="breadcrumb">
          <span class="breadcrumb-item">首页</span>
          <span class="breadcrumb-separator">/</span>
          <span class="breadcrumb-item active">合同管理</span>
        </div>
        <h1 class="page-title">合同管理</h1>
        <p class="page-subtitle">管理律师事务所、合同模板和费用协议</p>
      </div>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-section">
      <div class="stats-grid">
        <div
          class="stat-card"
          v-for="(stat, index) in contractStats"
          :key="stat.label"
          :style="{ animationDelay: `${index * 0.1}s` }"
          ref="statCards"
        >
          <div class="stat-icon">
            <el-icon><component :is="stat.icon" /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-number">{{ stat.value }}</div>
            <div class="stat-label">{{ stat.label }}</div>
            <div class="stat-trend" :class="stat.trend">
              <el-icon><component :is="stat.trendIcon" /></el-icon>
              <span>{{ stat.trendValue }}</span>
            </div>
          </div>
          <div class="stat-glow"></div>
        </div>
      </div>
    </div>

    <!-- 功能标签页 -->
    <div class="tabs-section">
      <AppleCard elevated>
        <el-tabs v-model="activeTab" class="contract-tabs">
          <!-- 律师事务所管理 -->
          <el-tab-pane label="律师事务所管理" name="lawFirms">
            <div class="tab-content">
              <div class="tab-header">
                <h3 class="section-title">律师事务所管理</h3>
                <AppleButton
                  variant="primary"
                  @click="showAddLawFirmDialog = true"
                >
                  <el-icon><Plus /></el-icon>
                  添加律师事务所
                </AppleButton>
              </div>

              <!-- 搜索和筛选 -->
              <div class="search-filters">
                <el-input
                  v-model="lawFirmSearch"
                  placeholder="搜索律师事务所名称"
                  style="width: 300px"
                  clearable
                >
                  <template #prefix>
                    <el-icon><Search /></el-icon>
                  </template>
                </el-input>
              </div>

              <!-- 律师事务所列表 -->
              <div class="law-firms-grid">
                <div
                  class="law-firm-card"
                  v-for="firm in filteredLawFirms"
                  :key="firm.id"
                  ref="lawFirmCards"
                >
                  <div class="firm-icon">
                    <el-icon><OfficeBuilding /></el-icon>
                  </div>
                  <div class="firm-content">
                    <h4 class="firm-name">{{ firm.name }}</h4>
                    <p class="firm-specialties">
                      {{ formatSpecialties(firm.specialties) }}
                    </p>
                    <div class="firm-meta">
                      <span class="firm-contact">
                        <el-icon><User /></el-icon>
                        {{ firm.contactPerson }}
                      </span>
                      <span class="firm-phone">
                        <el-icon><Phone /></el-icon>
                        {{ firm.phone }}
                      </span>
                      <span v-if="firm.email" class="firm-email">
                        <el-icon><Message /></el-icon>
                        {{ firm.email }}
                      </span>
                      <span v-if="firm.address" class="firm-address">
                        <el-icon><Location /></el-icon>
                        {{ firm.address }}
                      </span>
                    </div>
                    <div class="firm-details">
                      <span v-if="firm.serviceLevel" class="firm-service-level">
                        <el-tag
                          :type="getServiceLevelType(firm.serviceLevel)"
                          size="small"
                        >
                          {{ getServiceLevelText(firm.serviceLevel) }}
                        </el-tag>
                      </span>
                      <span v-if="firm.status" class="firm-status">
                        <el-tag
                          :type="getLawFirmStatusType(firm.status)"
                          size="small"
                        >
                          {{ getLawFirmStatusText(firm.status) }}
                        </el-tag>
                      </span>
                    </div>
                    <div class="firm-stats">
                      <span
                        v-if="firm.contractCount !== undefined"
                        class="firm-contracts"
                      >
                        合同: {{ firm.contractCount }}
                      </span>
                      <span
                        v-if="firm.totalRevenue !== undefined"
                        class="firm-revenue"
                      >
                        收入: ¥{{ formatCurrency(firm.totalRevenue) }}
                      </span>
                    </div>
                    <div class="firm-rating">
                      <el-rate
                        v-model="firm.rating"
                        disabled
                        show-score
                        text-color="#ff9900"
                      />
                    </div>
                  </div>
                  <div class="firm-actions">
                    <AppleButton
                      size="small"
                      variant="secondary"
                      @click="editLawFirm(firm)"
                    >
                      编辑
                    </AppleButton>
                    <AppleButton
                      size="small"
                      variant="danger"
                      @click="deleteLawFirm(firm)"
                    >
                      删除
                    </AppleButton>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 合同模板库 -->
          <el-tab-pane label="合同模板库" name="templates">
            <div class="tab-content">
              <div class="tab-header">
                <h3 class="section-title">合同模板库</h3>
                <AppleButton
                  variant="primary"
                  @click="showAddTemplateDialog = true"
                >
                  <el-icon><Plus /></el-icon>
                  添加模板
                </AppleButton>
              </div>

              <!-- 模板列表 -->
              <div class="templates-grid">
                <div
                  class="template-card"
                  v-for="template in contractTemplates"
                  :key="template.id"
                  ref="templateCards"
                >
                  <div class="template-icon">
                    <el-icon><DocumentIcon /></el-icon>
                  </div>
                  <div class="template-content">
                    <h4 class="template-name">{{ template.name }}</h4>
                    <p class="template-description">
                      {{ template.description }}
                    </p>
                    <div class="template-meta">
                      <span class="template-type">{{ template.type }}</span>
                      <span class="template-version"
                        >v{{ template.version }}</span
                      >
                    </div>
                  </div>
                  <div class="template-actions">
                    <AppleButton
                      size="small"
                      variant="primary"
                      @click="previewTemplate()"
                    >
                      预览
                    </AppleButton>
                    <AppleButton
                      size="small"
                      variant="secondary"
                      @click="editTemplate(template)"
                    >
                      编辑
                    </AppleButton>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 费用协议跟踪 -->
          <el-tab-pane label="费用协议跟踪" name="agreements">
            <div class="tab-content">
              <div class="tab-header">
                <h3 class="section-title">费用协议跟踪</h3>
                <AppleButton
                  variant="primary"
                  @click="showAddAgreementDialog = true"
                >
                  <el-icon><Plus /></el-icon>
                  添加协议
                </AppleButton>
              </div>

              <!-- 协议列表 -->
              <div class="agreements-list">
                <div
                  class="agreement-card"
                  v-for="agreement in feeAgreements"
                  :key="agreement.id"
                  :ref="
                    (el) => {
                      if (el) agreementCards.push(el as HTMLElement);
                    }
                  "
                >
                  <div class="agreement-header">
                    <div class="agreement-info">
                      <h4 class="agreement-type">{{ agreement.feeType }}</h4>
                      <p class="agreement-description">
                        {{ agreement.description }}
                      </p>
                    </div>
                    <div class="agreement-status">
                      <el-tag :type="getStatusType(agreement.status)">
                        {{ getStatusText(agreement.status) }}
                      </el-tag>
                    </div>
                  </div>
                  <div class="agreement-details">
                    <div class="detail-item">
                      <span class="label">金额：</span>
                      <span class="value"
                        >¥{{ formatCurrency(agreement.amount) }}</span
                      >
                    </div>
                    <div class="detail-item">
                      <span class="label">开始日期：</span>
                      <span class="value">{{
                        formatDate(agreement.startDate)
                      }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="label">结束日期：</span>
                      <span class="value">{{
                        formatDate(agreement.endDate)
                      }}</span>
                    </div>
                  </div>
                  <div class="agreement-actions">
                    <AppleButton
                      size="small"
                      variant="secondary"
                      @click="editAgreement(agreement)"
                    >
                      编辑
                    </AppleButton>
                    <AppleButton
                      size="small"
                      variant="danger"
                      @click="deleteAgreement(agreement)"
                    >
                      删除
                    </AppleButton>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- 服务质量评估 -->
          <el-tab-pane label="服务质量评估" name="evaluations">
            <div class="tab-content">
              <div class="tab-header">
                <h3 class="section-title">服务质量评估</h3>
                <AppleButton
                  variant="primary"
                  @click="showAddEvaluationDialog = true"
                >
                  <el-icon><Plus /></el-icon>
                  添加评估
                </AppleButton>
              </div>

              <!-- 评估列表 -->
              <div class="evaluations-grid">
                <div
                  class="evaluation-card"
                  v-for="evaluation in serviceEvaluations"
                  :key="evaluation.id"
                  :ref="
                    (el) => {
                      if (el) evaluationCards.push(el as HTMLElement);
                    }
                  "
                >
                  <div class="evaluation-icon">
                    <el-icon><Star /></el-icon>
                  </div>
                  <div class="evaluation-content">
                    <h4 class="evaluation-date">
                      {{ formatDate(evaluation.evaluationDate) }}
                    </h4>
                    <p class="evaluation-comments">
                      {{ evaluation.comments }}
                    </p>
                    <div class="evaluation-meta">
                      <span class="evaluation-score"
                        >评分: {{ evaluation.overallScore }}/5</span
                      >
                    </div>
                    <div class="evaluation-score">
                      <el-rate
                        v-model="evaluation.overallScore"
                        disabled
                        show-score
                        text-color="#ff9900"
                      />
                    </div>
                  </div>
                  <div class="evaluation-actions">
                    <AppleButton
                      size="small"
                      variant="secondary"
                      @click="viewEvaluation()"
                    >
                      查看
                    </AppleButton>
                    <AppleButton
                      size="small"
                      variant="primary"
                      @click="editEvaluation(evaluation)"
                    >
                      编辑
                    </AppleButton>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </AppleCard>
    </div>

    <!-- 对话框 -->
    <el-dialog
      v-model="showAddLawFirmDialog"
      title="添加律师事务所"
      width="600px"
      class="apple-dialog"
    >
      <LawFirmForm
        @submit="handleLawFirmSubmit"
        @cancel="showAddLawFirmDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showAddTemplateDialog"
      title="添加合同模板"
      width="600px"
      class="apple-dialog"
    >
      <ContractTemplateForm
        @submit="handleTemplateSubmit"
        @cancel="showAddTemplateDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showAddAgreementDialog"
      title="添加费用协议"
      width="600px"
      class="apple-dialog"
    >
      <FeeAgreementForm
        @submit="handleAgreementSubmit"
        @cancel="showAddAgreementDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showAddEvaluationDialog"
      title="添加服务评估"
      width="600px"
      class="apple-dialog"
    >
      <ServiceEvaluationForm
        @submit="handleEvaluationSubmit"
        @cancel="showAddEvaluationDialog = false"
      />
    </el-dialog>

    <!-- 编辑对话框 -->
    <el-dialog
      v-model="showEditLawFirmDialog"
      title="编辑律师事务所"
      width="600px"
      class="apple-dialog"
    >
      <LawFirmForm
        :initial-data="editingLawFirm"
        @submit="handleEditLawFirmSubmit"
        @cancel="showEditLawFirmDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showEditTemplateDialog"
      title="编辑合同模板"
      width="600px"
      class="apple-dialog"
    >
      <ContractTemplateForm
        :initial-data="editingTemplate"
        @submit="handleEditTemplateSubmit"
        @cancel="showEditTemplateDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showEditAgreementDialog"
      title="编辑费用协议"
      width="600px"
      class="apple-dialog"
    >
      <FeeAgreementForm
        :initial-data="editingAgreement"
        @submit="handleEditAgreementSubmit"
        @cancel="showEditAgreementDialog = false"
      />
    </el-dialog>

    <el-dialog
      v-model="showEditEvaluationDialog"
      title="编辑服务评估"
      width="600px"
      class="apple-dialog"
    >
      <ServiceEvaluationForm
        :initial-data="editingEvaluation"
        @submit="handleEditEvaluationSubmit"
        @cancel="showEditEvaluationDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import { storeToRefs } from "pinia";
import { useContractStore } from "@/stores/contract";
import { ElMessage, ElMessageBox } from "element-plus";
import { appleAnimations } from "@/utils/animations";
import AppleButton from "@/components/ui/AppleButton.vue";
import AppleCard from "@/components/ui/AppleCard.vue";
import LawFirmForm from "@/components/contracts/LawFirmForm.vue";
import ContractTemplateForm from "@/components/contracts/ContractTemplateForm.vue";
import FeeAgreementForm from "@/components/contracts/FeeAgreementForm.vue";
import ServiceEvaluationForm from "@/components/contracts/ServiceEvaluationForm.vue";
import type {
  LawFirm,
  ContractTemplate,
  FeeAgreement,
  ServiceEvaluation,
} from "@/types/contract";
import {
  Plus,
  Search,
  Document as DocumentIcon,
  OfficeBuilding,
  Star,
} from "@element-plus/icons-vue";

const contractStore = useContractStore();

// 响应式引用
const statCards = ref<HTMLElement[]>([]);
const lawFirmCards = ref<HTMLElement[]>([]);
const templateCards = ref<HTMLElement[]>([]);
const agreementCards = ref<HTMLElement[]>([]);
const evaluationCards = ref<HTMLElement[]>([]);

// 标签页状态
const activeTab = ref("lawFirms");

// 搜索状态
const lawFirmSearch = ref("");

// 对话框状态
const showAddLawFirmDialog = ref(false);
const showAddTemplateDialog = ref(false);
const showAddAgreementDialog = ref(false);
const showAddEvaluationDialog = ref(false);

// 编辑对话框状态
const showEditLawFirmDialog = ref(false);
const showEditTemplateDialog = ref(false);
const showEditAgreementDialog = ref(false);
const showEditEvaluationDialog = ref(false);

// 编辑数据
const editingLawFirm = ref<LawFirm | null>(null);
const editingTemplate = ref<ContractTemplate | null>(null);
const editingAgreement = ref<FeeAgreement | null>(null);
const editingEvaluation = ref<ServiceEvaluation | null>(null);

// 使用 storeToRefs 获取响应式引用
const {
  lawFirms,
  contractTemplates,
  feeAgreements,
  serviceEvaluations,
  contracts,
} = storeToRefs(contractStore);

// 合同统计数据
const contractStats = computed(() => {
  const contractsData = contracts.value;
  const lawFirmsData = lawFirms.value;

  return [
    {
      icon: "DocumentIcon",
      value: contractsData.length.toString(),
      label: "总合同数",
      trend: "up",
      trendValue: "+15%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "OfficeBuilding",
      value: (lawFirmsData?.length || 0).toString(),
      label: "律师事务所",
      trend: "up",
      trendValue: "+8%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Money",
      value: `¥${formatCurrency(calculateTotalValue())}`,
      label: "合同总价值",
      trend: "up",
      trendValue: "+12%",
      trendIcon: "TrendCharts",
    },
    {
      icon: "Star",
      value: calculateAverageRating().toFixed(1),
      label: "平均评分",
      trend: "up",
      trendValue: "+5%",
      trendIcon: "TrendCharts",
    },
  ];
});

// 过滤后的律师事务所
const filteredLawFirms = computed(() => {
  if (!lawFirmSearch.value) return lawFirms.value;
  return lawFirms.value.filter((firm) =>
    firm.name.toLowerCase().includes(lawFirmSearch.value.toLowerCase())
  );
});

// 计算总价值
const calculateTotalValue = () => {
  if (!contractStore.contracts || !Array.isArray(contractStore.contracts)) {
    return 0;
  }
  return contractStore.contracts.reduce(
    (total, contract) => total + (contract.value || 0),
    0
  );
};

// 计算平均评分
const calculateAverageRating = () => {
  const evaluations = contractStore.serviceEvaluations;
  if (!evaluations || !Array.isArray(evaluations) || evaluations.length === 0) {
    return 0;
  }
  const totalScore = evaluations.reduce(
    (sum, evaluation) => sum + (evaluation.overallScore || 0),
    0
  );
  return totalScore / evaluations.length;
};

// 格式化货币
const formatCurrency = (amount: number) => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0";
  }
  return new Intl.NumberFormat("zh-CN").format(amount);
};

// 格式化日期
const formatDate = (date: string | Date) => {
  if (!date) return "-";
  const d = new Date(date);
  return d.toLocaleDateString("zh-CN");
};

// 格式化专业领域
const formatSpecialties = (
  specialties: string | string[] | null | undefined
) => {
  if (!specialties) return "未设置";

  try {
    // 如果是字符串，尝试解析JSON
    if (typeof specialties === "string") {
      const parsed = JSON.parse(specialties);
      if (Array.isArray(parsed)) {
        return parsed.join(", ");
      }
      return specialties;
    }

    // 如果是数组，直接join
    if (Array.isArray(specialties)) {
      return specialties.join(", ");
    }

    return "未设置";
  } catch (error) {
    console.warn("解析专业领域数据失败:", error);
    return "数据格式错误";
  }
};

// 获取状态类型
const getStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: "success",
    pending: "warning",
    expired: "danger",
    inactive: "info",
  };
  return typeMap[status] || "info";
};

// 获取状态文本
const getStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: "生效中",
    pending: "待审核",
    expired: "已过期",
    inactive: "已停用",
  };
  return textMap[status] || "未知";
};

// 获取服务级别类型
const getServiceLevelType = (level: string) => {
  const typeMap: Record<string, string> = {
    premium: "success",
    standard: "warning",
    basic: "info",
  };
  return typeMap[level] || "info";
};

// 获取服务级别文本
const getServiceLevelText = (level: string) => {
  const textMap: Record<string, string> = {
    premium: "高级",
    standard: "标准",
    basic: "基础",
  };
  return textMap[level] || "未知";
};

// 获取律师事务所状态类型
const getLawFirmStatusType = (status: string) => {
  const typeMap: Record<string, string> = {
    active: "success",
    inactive: "info",
    suspended: "warning",
  };
  return typeMap[status] || "info";
};

// 获取律师事务所状态文本
const getLawFirmStatusText = (status: string) => {
  const textMap: Record<string, string> = {
    active: "活跃",
    inactive: "非活跃",
    suspended: "暂停",
  };
  return textMap[status] || "未知";
};

// 律师事务所操作
const editLawFirm = (firm: LawFirm) => {
  editingLawFirm.value = { ...firm };
  showEditLawFirmDialog.value = true;
};

const deleteLawFirm = async (firm: LawFirm) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除律师事务所 "${firm.name}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await contractStore.deleteLawFirm(firm.id);
    ElMessage.success("律师事务所删除成功");

    // 刷新数据，确保删除后的律师事务所立即从列表中移除
    await contractStore.fetchLawFirms();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleLawFirmSubmit = async (firmData: Partial<LawFirm>) => {
  try {
    await contractStore.addLawFirm(firmData as LawFirm);
    showAddLawFirmDialog.value = false;
    ElMessage.success("律师事务所添加成功");

    // 刷新数据，确保新添加的律师事务所立即显示
    await contractStore.fetchLawFirms();

    // 自动刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const handleEditLawFirmSubmit = async (firmData: Partial<LawFirm>) => {
  try {
    if (editingLawFirm.value) {
      await contractStore.updateLawFirm(editingLawFirm.value.id, firmData);
      showEditLawFirmDialog.value = false;
      editingLawFirm.value = null;
      ElMessage.success("律师事务所更新成功");

      // 刷新数据，确保更新后的律师事务所立即显示
      await contractStore.fetchLawFirms();

      // 自动刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

// 合同模板操作
const previewTemplate = () => {
  ElMessage.info("预览模板功能开发中");
};

const editTemplate = (template: ContractTemplate) => {
  editingTemplate.value = { ...template };
  showEditTemplateDialog.value = true;
};

const handleTemplateSubmit = async (
  templateData: Partial<ContractTemplate>
) => {
  try {
    await contractStore.addTemplate(templateData as ContractTemplate);
    showAddTemplateDialog.value = false;
    ElMessage.success("合同模板添加成功");

    // 刷新数据，确保新添加的合同模板立即显示
    await contractStore.fetchContractTemplates();

    // 自动刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

const handleEditTemplateSubmit = async (
  templateData: Partial<ContractTemplate>
) => {
  try {
    if (editingTemplate.value) {
      await contractStore.updateTemplate(
        editingTemplate.value.id,
        templateData
      );
      showEditTemplateDialog.value = false;
      editingTemplate.value = null;
      ElMessage.success("合同模板更新成功");

      // 刷新数据，确保更新后的合同模板立即显示
      await contractStore.fetchContractTemplates();

      // 自动刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

// 费用协议操作
const editAgreement = (agreement: FeeAgreement) => {
  editingAgreement.value = { ...agreement };
  showEditAgreementDialog.value = true;
};

const deleteAgreement = async (agreement: FeeAgreement) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除费用协议 "${agreement.feeType}" 吗？`,
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );
    await contractStore.deleteFeeAgreement(agreement.id);
    ElMessage.success("费用协议删除成功");

    // 刷新数据，确保删除后的费用协议立即从列表中移除
    await contractStore.fetchFeeAgreements();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const handleAgreementSubmit = async (agreementData: Partial<FeeAgreement>) => {
  try {
    console.log("📝 开始添加费用协议...");
    console.log("提交数据:", agreementData);

    const result = await contractStore.addFeeAgreement(
      agreementData as FeeAgreement
    );
    console.log("✅ 费用协议添加成功:", result);

    showAddAgreementDialog.value = false;
    ElMessage.success("费用协议添加成功");

    console.log("🔄 刷新费用协议数据...");
    // 刷新数据，确保新添加的费用协议立即显示
    await contractStore.fetchFeeAgreements();

    console.log("📊 刷新后的费用协议数量:", feeAgreements.value.length);
    console.log("费用协议列表:", feeAgreements.value);

    // 自动刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    console.error("❌ 添加费用协议失败:", error);
    ElMessage.error("添加失败");
  }
};

const handleEditAgreementSubmit = async (
  agreementData: Partial<FeeAgreement>
) => {
  try {
    if (editingAgreement.value) {
      await contractStore.updateFeeAgreement(
        editingAgreement.value.id,
        agreementData
      );
      showEditAgreementDialog.value = false;
      editingAgreement.value = null;
      ElMessage.success("费用协议更新成功");

      // 刷新数据，确保更新后的费用协议立即显示
      await contractStore.fetchFeeAgreements();

      // 自动刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

// 服务评估操作
const viewEvaluation = () => {
  ElMessage.info("查看评估功能开发中");
};

const editEvaluation = (evaluation: ServiceEvaluation) => {
  editingEvaluation.value = { ...evaluation };
  showEditEvaluationDialog.value = true;
};

const handleEditEvaluationSubmit = async (
  evaluationData: Partial<ServiceEvaluation>
) => {
  try {
    if (editingEvaluation.value) {
      await contractStore.updateEvaluation(
        editingEvaluation.value.id,
        evaluationData
      );
      showEditEvaluationDialog.value = false;
      editingEvaluation.value = null;
      ElMessage.success("服务评估更新成功");

      // 刷新数据，确保更新后的服务评估立即显示
      await contractStore.fetchServiceEvaluations();

      // 自动刷新页面
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  } catch (error) {
    ElMessage.error("更新失败");
  }
};

const handleEvaluationSubmit = async (
  evaluationData: Partial<ServiceEvaluation>
) => {
  try {
    await contractStore.addEvaluation(evaluationData as ServiceEvaluation);
    showAddEvaluationDialog.value = false;
    ElMessage.success("服务评估添加成功");

    // 刷新数据，确保新添加的服务评估立即显示
    await contractStore.fetchServiceEvaluations();

    // 自动刷新页面
    setTimeout(() => {
      window.location.reload();
    }, 1000);
  } catch (error) {
    ElMessage.error("添加失败");
  }
};

// 不需要额外 watch，storeToRefs 已保证响应式联动

// 组件挂载时的动画和初始化
onMounted(async () => {
  try {
    console.log("🚀 开始初始化合同管理数据...");

    // 初始化数据
    await contractStore.initialize();

    console.log("📊 初始化完成，当前数据状态:");
    console.log("律师事务所数量:", lawFirms.value.length);
    console.log("合同数量:", contracts.value.length);
    console.log("费用协议数量:", feeAgreements.value.length);
    console.log("合同模板数量:", contractTemplates.value.length);
    console.log("服务评估数量:", serviceEvaluations.value.length);

    // 等待DOM更新后执行动画
    await nextTick();

    // 执行卡片动画
    if (statCards.value.length > 0) {
      appleAnimations.animateCards(statCards.value);
    }

    // 执行律师事务所卡片动画
    if (lawFirmCards.value.length > 0) {
      appleAnimations.animateCards(lawFirmCards.value);
    }

    // 执行模板卡片动画
    if (templateCards.value.length > 0) {
      appleAnimations.animateCards(templateCards.value);
    }

    // 执行协议卡片动画
    if (agreementCards.value.length > 0) {
      appleAnimations.animateCards(agreementCards.value);
    }

    // 执行评估卡片动画
    if (evaluationCards.value.length > 0) {
      appleAnimations.animateCards(evaluationCards.value);
    }
  } catch (error) {
    console.error("初始化合同管理数据失败:", error);
    ElMessage.error("初始化数据失败，请刷新页面重试");
  }
});
</script>

<style scoped>
.apple-contract-management {
  padding: 24px;
  max-width: 1400px;
  margin: 0 auto;
  position: relative;
  min-height: 100vh;
}

/* 动态背景 */
.page-background {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: -1;
  overflow: hidden;
}

.floating-elements {
  position: relative;
  width: 100%;
  height: 100%;
}

.element {
  position: absolute;
  border-radius: 50%;
  opacity: 0.05;
  animation: float 25s ease-in-out infinite;
}

.element-1 {
  width: 150px;
  height: 150px;
  background: linear-gradient(45deg, #007aff, #5856d6);
  top: 15%;
  left: 15%;
  animation-delay: 0s;
}

.element-2 {
  width: 120px;
  height: 120px;
  background: linear-gradient(45deg, #34c759, #30d158);
  top: 70%;
  right: 25%;
  animation-delay: -8s;
}

.element-3 {
  width: 100px;
  height: 100px;
  background: linear-gradient(45deg, #ff9500, #ff2d55);
  bottom: 25%;
  left: 40%;
  animation-delay: -16s;
}

/* 页面标题区域 */
.page-header {
  margin-bottom: 32px;
  background: linear-gradient(
    135deg,
    rgba(255, 255, 255, 0.9) 0%,
    rgba(255, 255, 255, 0.7) 100%
  );
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 32px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: var(--apple-shadow-soft);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
  font-size: 0.9em;
  color: var(--apple-text-secondary);
}

.breadcrumb-item {
  transition: color 0.3s ease;
}

.breadcrumb-item.active {
  color: var(--apple-accent);
  font-weight: 600;
}

.breadcrumb-separator {
  opacity: 0.5;
}

.page-title {
  font-size: 2.5em;
  font-weight: 700;
  margin: 0 0 8px 0;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  text-fill-color: transparent;
}

.page-subtitle {
  font-size: 1.1em;
  color: var(--apple-text-secondary);
  margin: 0;
}

/* 统计卡片 */
.statistics-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
}

.stat-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;
  box-shadow: var(--apple-shadow-soft);
  opacity: 0;
  transform: translateY(30px);
}

.stat-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: var(--apple-shadow-medium);
}

.stat-glow {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(
    circle at center,
    rgba(0, 122, 255, 0.1) 0%,
    transparent 70%
  );
  opacity: 0;
  transition: opacity 0.3s ease;
}

.stat-card:hover .stat-glow {
  opacity: 1;
}

.stat-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  flex-shrink: 0;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
}

.stat-card:hover .stat-icon {
  transform: scale(1.1) rotate(5deg);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 1.8em;
  font-weight: 700;
  color: var(--apple-text-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 0.9em;
  color: var(--apple-text-secondary);
  margin-bottom: 8px;
}

.stat-trend {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 0.8em;
  font-weight: 600;
}

.stat-trend.up {
  color: var(--apple-success);
}

.stat-trend.down {
  color: var(--apple-danger);
}

/* 标签页区域 */
.tabs-section {
  margin-bottom: 32px;
}

.contract-tabs :deep(.el-tabs__header) {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(10px);
  border-radius: 16px;
  margin-bottom: 24px;
  padding: 8px;
}

.contract-tabs :deep(.el-tabs__nav-wrap) {
  padding: 0;
}

.contract-tabs :deep(.el-tabs__item) {
  border-radius: 12px;
  transition: all 0.3s ease;
}

.contract-tabs :deep(.el-tabs__item.is-active) {
  background: var(--apple-accent);
  color: white;
}

.tab-content {
  padding: 0;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 1.5em;
  font-weight: 600;
  margin: 0;
  color: var(--apple-text-primary);
}

.search-filters {
  margin-bottom: 24px;
}

/* 律师事务所列表 */
.law-firms-list {
  display: grid;
  gap: 20px;
}

.law-firm-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: var(--apple-shadow-soft);
  opacity: 0;
  transform: translateY(20px);
}

.law-firm-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-medium);
}

.firm-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #007aff, #5856d6);
  border-radius: 12px;
  margin-right: 16px;
  color: white;
  font-size: 1.5em;
}

.firm-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.firm-info {
  flex: 1;
}

.firm-name {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.firm-specialties {
  color: var(--apple-text-secondary);
  margin: 0 0 12px 0;
  font-size: 0.9em;
  line-height: 1.4;
}

.firm-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-bottom: 12px;
}

.firm-contact,
.firm-phone,
.firm-email,
.firm-address {
  color: var(--apple-text-secondary);
  font-size: 0.85em;
  display: flex;
  align-items: center;
  gap: 6px;
}

.firm-contact::before {
  content: "👤";
  font-size: 0.9em;
}

.firm-phone::before {
  content: "📞";
  font-size: 0.9em;
}

.firm-email::before {
  content: "📧";
  font-size: 0.9em;
}

.firm-address::before {
  content: "📍";
  font-size: 0.9em;
}

.firm-rating {
  margin-top: 8px;
}

.firm-description {
  color: var(--apple-text-secondary);
  margin: 0;
  font-size: 0.9em;
}

.firm-details {
  margin-bottom: 16px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.firm-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
  font-size: 0.85em;
  color: var(--apple-text-secondary);
}

.firm-contracts,
.firm-revenue {
  display: flex;
  align-items: center;
  gap: 4px;
}

.firm-contracts::before {
  content: "📋";
  font-size: 0.9em;
}

.firm-revenue::before {
  content: "💰";
  font-size: 0.9em;
}

.detail-item {
  display: flex;
  margin-bottom: 8px;
}

.detail-item .label {
  font-weight: 600;
  color: var(--apple-text-secondary);
  width: 100px;
  flex-shrink: 0;
}

.detail-item .value {
  color: var(--apple-text-primary);
}

.firm-actions {
  display: flex;
  gap: 12px;
}

/* 模板网格 */
.templates-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* 律师事务所网格 */
.law-firms-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

/* 服务质量评估网格 */
.evaluations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 20px;
}

.template-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: var(--apple-shadow-soft);
  opacity: 0;
  transform: scale(0.9);
}

.template-card:hover {
  transform: translateY(-4px) scale(1.02);
  box-shadow: var(--apple-shadow-medium);
}

.template-icon {
  width: 50px;
  height: 50px;
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20px;
  color: white;
  margin-bottom: 16px;
}

.template-content {
  margin-bottom: 16px;
}

.template-name {
  font-size: 1.1em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.template-description {
  color: var(--apple-text-secondary);
  margin: 0 0 12px 0;
  font-size: 0.9em;
}

.template-meta {
  display: flex;
  gap: 12px;
}

.template-type,
.template-version {
  font-size: 0.8em;
  color: var(--apple-text-secondary);
}

.template-actions {
  display: flex;
  gap: 12px;
}

/* 协议列表 */
.agreements-list {
  display: grid;
  gap: 20px;
}

.agreement-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: var(--apple-shadow-soft);
  opacity: 1;
  transform: translateY(0);
}

.agreement-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-medium);
}

.agreement-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.agreement-info {
  flex: 1;
}

.agreement-name {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.agreement-description {
  color: var(--apple-text-secondary);
  margin: 0;
  font-size: 0.9em;
}

.agreement-type {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.agreement-details {
  margin-bottom: 16px;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.detail-item:last-child {
  border-bottom: none;
}

.detail-item .label {
  color: var(--apple-text-secondary);
  font-weight: 500;
  min-width: 80px;
}

.detail-item .value {
  color: var(--apple-text-primary);
  font-weight: 600;
}

.agreement-actions {
  display: flex;
  gap: 12px;
}

/* 评估列表 */
.evaluations-list {
  display: grid;
  gap: 20px;
}

.evaluation-card {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
  box-shadow: var(--apple-shadow-soft);
  opacity: 1;
  transform: translateY(0);
}

.evaluation-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--apple-shadow-medium);
}

.evaluation-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.evaluation-info {
  flex: 1;
}

.evaluation-title {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.evaluation-description {
  color: var(--apple-text-secondary);
  margin: 0;
  font-size: 0.9em;
}

.evaluation-actions {
  display: flex;
  gap: 12px;
}

/* 评估卡片内容样式 */
.evaluation-content {
  flex: 1;
}

.evaluation-date {
  font-size: 1.2em;
  font-weight: 600;
  margin: 0 0 8px 0;
  color: var(--apple-text-primary);
}

.evaluation-comments {
  color: var(--apple-text-secondary);
  margin: 0 0 12px 0;
  font-size: 0.9em;
  line-height: 1.5;
}

.evaluation-meta {
  margin-bottom: 12px;
}

.evaluation-score {
  color: var(--apple-text-primary);
  font-weight: 500;
}

.evaluation-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, #ff9900, #ff6b35);
  border-radius: 12px;
  margin-right: 16px;
  color: white;
  font-size: 1.5em;
}

/* 对话框样式 */
.apple-dialog :deep(.el-dialog) {
  border-radius: 20px;
  overflow: hidden;
  box-shadow: var(--apple-shadow-medium);
}

.apple-dialog :deep(.el-dialog__header) {
  background: linear-gradient(135deg, var(--apple-accent), #5856d6);
  color: white;
  padding: 24px;
}

.apple-dialog :deep(.el-dialog__body) {
  padding: 24px;
}

/* 动画 */
@keyframes float {
  0%,
  100% {
    transform: translateY(0px) rotate(0deg);
  }
  33% {
    transform: translateY(-15px) rotate(120deg);
  }
  66% {
    transform: translateY(10px) rotate(240deg);
  }
}

/* 深色模式适配 */
@media (prefers-color-scheme: dark) {
  .page-header {
    background: linear-gradient(
      135deg,
      rgba(0, 0, 0, 0.8) 0%,
      rgba(0, 0, 0, 0.6) 100%
    );
    border-color: rgba(255, 255, 255, 0.1);
  }

  .stat-card,
  .law-firm-card,
  .template-card,
  .agreement-card,
  .evaluation-card {
    background: rgba(0, 0, 0, 0.8);
    border-color: rgba(255, 255, 255, 0.1);
  }

  .contract-tabs :deep(.el-tabs__header) {
    background: rgba(0, 0, 0, 0.8);
  }
}

/* 响应式设计 */
@media (max-width: 768px) {
  .apple-contract-management {
    padding: 16px;
  }

  .page-title {
    font-size: 2em;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .templates-grid {
    grid-template-columns: 1fr;
  }

  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }

  .firm-header,
  .agreement-header,
  .evaluation-header {
    flex-direction: column;
    gap: 12px;
  }

  .firm-actions,
  .template-actions,
  .agreement-actions,
  .evaluation-actions {
    flex-direction: column;
  }
}
</style>
