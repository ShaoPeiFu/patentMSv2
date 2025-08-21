<template>
  <div class="contract-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>合同管理</el-breadcrumb-item>
      </el-breadcrumb>
      <h1>合同管理</h1>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><DocumentIcon /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ contractStatistics.totalContracts }}
                </div>
                <div class="stat-label">总合同数</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><OfficeBuilding /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ lawFirmStatistics.totalLawFirms }}
                </div>
                <div class="stat-label">律师事务所</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  ¥{{ formatCurrency(contractStatistics.totalValue) }}
                </div>
                <div class="stat-label">合同总价值</div>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon">
                <el-icon><Star /></el-icon>
              </div>
              <div class="stat-info">
                <div class="stat-value">
                  {{ lawFirmStatistics.averageRating.toFixed(1) }}
                </div>
                <div class="stat-label">平均评分</div>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 功能标签页 -->
    <el-tabs v-model="activeTab" class="contract-tabs">
      <!-- 律师事务所管理 -->
      <el-tab-pane label="律师事务所管理" name="lawFirms">
        <div class="tab-content">
          <div class="tab-header">
            <h3>律师事务所管理</h3>
            <el-button type="primary" @click="showAddLawFirmDialog = true">
              <el-icon><Plus /></el-icon>
              添加律师事务所
            </el-button>
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
            <el-select
              v-model="lawFirmStatusFilter"
              placeholder="状态筛选"
              clearable
            >
              <el-option label="活跃" value="active" />
              <el-option label="非活跃" value="inactive" />
              <el-option label="暂停" value="suspended" />
            </el-select>
            <el-select
              v-model="lawFirmServiceLevelFilter"
              placeholder="服务级别"
              clearable
            >
              <el-option label="高级" value="premium" />
              <el-option label="标准" value="standard" />
              <el-option label="基础" value="basic" />
            </el-select>
          </div>

          <!-- 律师事务所列表 -->
          <el-table
            :data="filteredLawFirms"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column
              prop="name"
              label="律师事务所名称"
              min-width="200"
            />
            <el-table-column prop="contactPerson" label="联系人" width="120" />
            <el-table-column prop="phone" label="联系电话" width="150" />
            <el-table-column prop="email" label="邮箱" width="200" />
            <el-table-column label="专业领域" width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="specialty in row.specialties"
                  :key="specialty"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ specialty }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="服务级别" width="100">
              <template #default="{ row }">
                <el-tag :type="getServiceLevelType(row.serviceLevel)">
                  {{ getServiceLevelLabel(row.serviceLevel) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getStatusType(row.status)">
                  {{ getStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="评分" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.rating" disabled show-score />
              </template>
            </el-table-column>
            <el-table-column label="合同数" width="100">
              <template #default="{ row }">
                {{ row.contractCount }}
              </template>
            </el-table-column>
            <el-table-column label="总收入" width="120">
              <template #default="{ row }">
                ¥{{ formatCurrency(row.totalRevenue) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editLawFirm(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteLawFirm(row.id)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 合同模板库 -->
      <el-tab-pane label="合同模板库" name="templates">
        <div class="tab-content">
          <div class="tab-header">
            <h3>合同模板库</h3>
            <el-button type="primary" @click="showAddTemplateDialog = true">
              <el-icon><Plus /></el-icon>
              添加模板
            </el-button>
          </div>

          <!-- 模板列表 -->
          <el-table
            :data="contractTemplates"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="name" label="模板名称" min-width="200" />
            <el-table-column label="类型" width="150">
              <template #default="{ row }">
                <el-tag :type="getContractTypeType(row.type)">
                  {{ getContractTypeLabel(row.type) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="description" label="描述" min-width="300" />
            <el-table-column prop="version" label="版本" width="100" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getTemplateStatusType(row.status)">
                  {{ getTemplateStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="变量" width="200">
              <template #default="{ row }">
                <el-tag
                  v-for="variable in row.variables"
                  :key="variable"
                  size="small"
                  style="margin-right: 4px"
                >
                  {{ variable }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="previewTemplate(row)"
                  >预览</el-button
                >
                <el-button size="small" @click="editTemplate(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteTemplate(row.id)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 费用协议跟踪 -->
      <el-tab-pane label="费用协议跟踪" name="feeAgreements">
        <div class="tab-content">
          <div class="tab-header">
            <h3>费用协议跟踪</h3>
            <el-button type="primary" @click="showAddFeeAgreementDialog = true">
              <el-icon><Plus /></el-icon>
              添加费用协议
            </el-button>
          </div>

          <!-- 费用协议列表 -->
          <el-table
            :data="feeAgreements"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column
              prop="description"
              label="协议描述"
              min-width="200"
            />
            <el-table-column label="费用类型" width="120">
              <template #default="{ row }">
                <el-tag :type="getFeeTypeType(row.feeType)">
                  {{ getFeeTypeLabel(row.feeType) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="金额" width="120">
              <template #default="{ row }">
                {{ row.currency }} {{ formatCurrency(row.amount) }}
              </template>
            </el-table-column>
            <el-table-column label="已付金额" width="120">
              <template #default="{ row }">
                {{ row.currency }} {{ formatCurrency(row.paidAmount) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getPaymentStatusType(row.status)">
                  {{ getPaymentStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="startDate" label="开始日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.startDate) }}
              </template>
            </el-table-column>
            <el-table-column prop="endDate" label="结束日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.endDate) }}
              </template>
            </el-table-column>
            <el-table-column
              prop="nextPaymentDate"
              label="下次付款日期"
              width="120"
            >
              <template #default="{ row }">
                {{ formatDate(row.nextPaymentDate) }}
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="editFeeAgreement(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteFeeAgreement(row.id)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>

      <!-- 服务质量评估 -->
      <el-tab-pane label="服务质量评估" name="evaluations">
        <div class="tab-content">
          <div class="tab-header">
            <h3>服务质量评估</h3>
            <el-button type="primary" @click="showAddEvaluationDialog = true">
              <el-icon><Plus /></el-icon>
              添加评估
            </el-button>
          </div>

          <!-- 评估列表 -->
          <el-table
            :data="serviceEvaluations"
            style="width: 100%"
            v-loading="loading"
          >
            <el-table-column prop="evaluationDate" label="评估日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.evaluationDate) }}
              </template>
            </el-table-column>
            <el-table-column label="总体评分" width="120">
              <template #default="{ row }">
                <el-rate v-model="row.overallScore" disabled show-score />
              </template>
            </el-table-column>
            <el-table-column label="响应性" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.criteria.responsiveness" disabled />
              </template>
            </el-table-column>
            <el-table-column label="质量" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.criteria.quality" disabled />
              </template>
            </el-table-column>
            <el-table-column label="沟通" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.criteria.communication" disabled />
              </template>
            </el-table-column>
            <el-table-column label="及时性" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.criteria.timeliness" disabled />
              </template>
            </el-table-column>
            <el-table-column label="成本效益" width="100">
              <template #default="{ row }">
                <el-rate v-model="row.criteria.cost_efficiency" disabled />
              </template>
            </el-table-column>
            <el-table-column prop="comments" label="评价意见" min-width="200" />
            <el-table-column label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="getEvaluationStatusType(row.status)">
                  {{ getEvaluationStatusLabel(row.status) }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="200" fixed="right">
              <template #default="{ row }">
                <el-button size="small" @click="viewEvaluation(row)"
                  >查看</el-button
                >
                <el-button size="small" @click="editEvaluation(row)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deleteEvaluation(row.id)"
                  >删除</el-button
                >
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- 律师事务所添加/编辑对话框 -->
    <el-dialog
      v-model="showAddLawFirmDialog"
      :title="editingLawFirm ? '编辑律师事务所' : '添加律师事务所'"
      width="600px"
    >
      <LawFirmForm
        :initial-data="editingLawFirm"
        @submit="handleLawFirmSubmit"
        @cancel="showAddLawFirmDialog = false"
      />
    </el-dialog>

    <!-- 合同模板添加/编辑对话框 -->
    <el-dialog
      v-model="showAddTemplateDialog"
      :title="editingTemplate ? '编辑合同模板' : '添加合同模板'"
      width="800px"
    >
      <ContractTemplateForm
        :initial-data="editingTemplate"
        @submit="handleTemplateSubmit"
        @cancel="showAddTemplateDialog = false"
      />
    </el-dialog>

    <!-- 费用协议添加/编辑对话框 -->
    <el-dialog
      v-model="showAddFeeAgreementDialog"
      :title="editingFeeAgreement ? '编辑费用协议' : '添加费用协议'"
      width="600px"
    >
      <FeeAgreementForm
        :initial-data="editingFeeAgreement"
        @submit="handleFeeAgreementSubmit"
        @cancel="showAddFeeAgreementDialog = false"
      />
    </el-dialog>

    <!-- 服务质量评估添加/编辑对话框 -->
    <el-dialog
      v-model="showAddEvaluationDialog"
      :title="editingEvaluation ? '编辑服务质量评估' : '添加服务质量评估'"
      width="800px"
    >
      <ServiceEvaluationForm
        :initial-data="editingEvaluation"
        @submit="handleEvaluationSubmit"
        @cancel="showAddEvaluationDialog = false"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Document as DocumentIcon,
  OfficeBuilding,
  Money,
  Star,
  Plus,
  Search,
} from "@element-plus/icons-vue";
import { useContractStore } from "@/stores/contract";
import type {
  LawFirm,
  ContractTemplate,
  FeeAgreement,
  ServiceEvaluation,
} from "@/types/contract";
import LawFirmForm from "@/components/contracts/LawFirmForm.vue";
import ContractTemplateForm from "@/components/contracts/ContractTemplateForm.vue";
import FeeAgreementForm from "@/components/contracts/FeeAgreementForm.vue";
import ServiceEvaluationForm from "@/components/contracts/ServiceEvaluationForm.vue";

const contractStore = useContractStore();

// 响应式数据
const activeTab = ref("lawFirms");
const loading = ref(false);

// 律师事务所相关
const showAddLawFirmDialog = ref(false);
const editingLawFirm = ref<LawFirm | null>(null);
const lawFirmSearch = ref("");
const lawFirmStatusFilter = ref("");
const lawFirmServiceLevelFilter = ref("");

// 合同模板相关
const showAddTemplateDialog = ref(false);
const editingTemplate = ref<ContractTemplate | null>(null);

// 费用协议相关
const showAddFeeAgreementDialog = ref(false);
const editingFeeAgreement = ref<FeeAgreement | null>(null);

// 服务质量评估相关
const showAddEvaluationDialog = ref(false);
const editingEvaluation = ref<ServiceEvaluation | null>(null);

// 计算属性
const contractStatistics = computed(() => contractStore.contractStatistics);
const lawFirmStatistics = computed(() => contractStore.lawFirmStatistics);
const contractTemplates = computed(() => contractStore.contractTemplates);
const feeAgreements = computed(() => contractStore.feeAgreements);
const serviceEvaluations = computed(() => contractStore.serviceEvaluations);

const filteredLawFirms = computed(() => {
  let firms = contractStore.lawFirms;

  if (lawFirmSearch.value) {
    firms = firms.filter((firm) =>
      firm.name.toLowerCase().includes(lawFirmSearch.value.toLowerCase())
    );
  }

  if (lawFirmStatusFilter.value) {
    firms = firms.filter((firm) => firm.status === lawFirmStatusFilter.value);
  }

  if (lawFirmServiceLevelFilter.value) {
    firms = firms.filter(
      (firm) => firm.serviceLevel === lawFirmServiceLevelFilter.value
    );
  }

  return firms;
});

// 方法
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat("zh-CN").format(amount);
};

const getServiceLevelType = (level: string): string => {
  const typeMap: Record<string, string> = {
    premium: "success",
    standard: "warning",
    basic: "info",
  };
  return typeMap[level] || "info";
};

const getServiceLevelLabel = (level: string): string => {
  const labelMap: Record<string, string> = {
    premium: "高级",
    standard: "标准",
    basic: "基础",
  };
  return labelMap[level] || level;
};

const getStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    active: "success",
    inactive: "info",
    suspended: "danger",
  };
  return typeMap[status] || "info";
};

const getStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    active: "活跃",
    inactive: "非活跃",
    suspended: "暂停",
  };
  return labelMap[status] || status;
};

const getContractTypeType = (type: string): string => {
  const typeMap: Record<string, string> = {
    patent_application: "primary",
    patent_prosecution: "success",
    patent_litigation: "warning",
    trademark: "info",
    copyright: "danger",
    custom: "default",
  };
  return typeMap[type] || "default";
};

const getContractTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    patent_application: "专利申请",
    patent_prosecution: "专利审查",
    patent_litigation: "专利诉讼",
    trademark: "商标",
    copyright: "版权",
    custom: "自定义",
  };
  return labelMap[type] || type;
};

const getTemplateStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    draft: "info",
    active: "success",
    archived: "warning",
  };
  return typeMap[status] || "info";
};

const getTemplateStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    draft: "草稿",
    active: "活跃",
    archived: "归档",
  };
  return labelMap[status] || status;
};

const getFeeTypeType = (type: string): string => {
  const typeMap: Record<string, string> = {
    hourly: "primary",
    fixed: "success",
    contingency: "warning",
    hybrid: "info",
  };
  return typeMap[type] || "info";
};

const getFeeTypeLabel = (type: string): string => {
  const labelMap: Record<string, string> = {
    hourly: "按小时",
    fixed: "固定费用",
    contingency: "风险代理",
    hybrid: "混合模式",
  };
  return labelMap[type] || type;
};

const getPaymentStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: "warning",
    paid: "success",
    overdue: "danger",
    cancelled: "info",
  };
  return typeMap[status] || "info";
};

const getPaymentStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    pending: "待付款",
    paid: "已付款",
    overdue: "逾期",
    cancelled: "已取消",
  };
  return labelMap[status] || status;
};

const getEvaluationStatusType = (status: string): string => {
  const typeMap: Record<string, string> = {
    pending: "warning",
    completed: "success",
    overdue: "danger",
  };
  return typeMap[status] || "info";
};

const getEvaluationStatusLabel = (status: string): string => {
  const labelMap: Record<string, string> = {
    pending: "待评估",
    completed: "已完成",
    overdue: "逾期",
  };
  return labelMap[status] || status;
};

// 律师事务所管理
const editLawFirm = (lawFirm: LawFirm) => {
  editingLawFirm.value = lawFirm;
  showAddLawFirmDialog.value = true;
};

const deleteLawFirm = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个律师事务所吗？", "确认删除", {
      type: "warning",
    });
    contractStore.deleteLawFirm(id);
    ElMessage.success("律师事务所删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const handleLawFirmSubmit = (lawFirmData: any) => {
  if (editingLawFirm.value) {
    contractStore.updateLawFirm(editingLawFirm.value.id, lawFirmData);
    ElMessage.success("律师事务所更新成功");
  } else {
    contractStore.addLawFirm(lawFirmData);
    ElMessage.success("律师事务所添加成功");
  }
  showAddLawFirmDialog.value = false;
  editingLawFirm.value = null;
};

// 合同模板管理
const editTemplate = (template: ContractTemplate) => {
  editingTemplate.value = template;
  showAddTemplateDialog.value = true;
};

const deleteTemplate = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个合同模板吗？", "确认删除", {
      type: "warning",
    });
    contractStore.deleteTemplate(id);
    ElMessage.success("合同模板删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const previewTemplate = (_template: ContractTemplate) => {
  ElMessage.info("模板预览功能开发中");
};

const handleTemplateSubmit = (templateData: any) => {
  if (editingTemplate.value) {
    contractStore.updateTemplate(editingTemplate.value.id, templateData);
    ElMessage.success("合同模板更新成功");
  } else {
    contractStore.addTemplate(templateData);
    ElMessage.success("合同模板添加成功");
  }
  showAddTemplateDialog.value = false;
  editingTemplate.value = null;
};

// 费用协议管理
const editFeeAgreement = (agreement: FeeAgreement) => {
  editingFeeAgreement.value = agreement;
  showAddFeeAgreementDialog.value = true;
};

const deleteFeeAgreement = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个费用协议吗？", "确认删除", {
      type: "warning",
    });
    contractStore.deleteFeeAgreement(id);
    ElMessage.success("费用协议删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const handleFeeAgreementSubmit = (agreementData: any) => {
  if (editingFeeAgreement.value) {
    contractStore.updateFeeAgreement(
      editingFeeAgreement.value.id,
      agreementData
    );
    ElMessage.success("费用协议更新成功");
  } else {
    contractStore.addFeeAgreement(agreementData);
    ElMessage.success("费用协议添加成功");
  }
  showAddFeeAgreementDialog.value = false;
  editingFeeAgreement.value = null;
};

// 服务质量评估管理
const editEvaluation = (evaluation: ServiceEvaluation) => {
  editingEvaluation.value = evaluation;
  showAddEvaluationDialog.value = true;
};

const deleteEvaluation = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个服务质量评估吗？", "确认删除", {
      type: "warning",
    });
    contractStore.deleteEvaluation(id);
    ElMessage.success("服务质量评估删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const viewEvaluation = (_evaluation: ServiceEvaluation) => {
  ElMessage.info("评估详情查看功能开发中");
};

const handleEvaluationSubmit = (evaluationData: any) => {
  if (editingEvaluation.value) {
    contractStore.updateEvaluation(editingEvaluation.value.id, evaluationData);
    ElMessage.success("服务质量评估更新成功");
  } else {
    contractStore.addEvaluation(evaluationData);
    ElMessage.success("服务质量评估添加成功");
  }
  showAddEvaluationDialog.value = false;
  editingEvaluation.value = null;
};

// 辅助函数
const formatDate = (dateString: string | Date) => {
  if (!dateString) return "未知";
  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return "无效日期";
    }

    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
  } catch (error) {
    return String(dateString);
  }
};

// 组件挂载时初始化数据
onMounted(async () => {
  try {
    await contractStore.initialize();
  } catch (error) {
    console.error("初始化合同管理数据失败:", error);
    ElMessage.error("初始化数据失败，请刷新页面重试");
  }
});
</script>

<style scoped>
.contract-management {
  padding: 20px;
  background: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  margin: 16px 0 0 0;
  font-size: 24px;
  font-weight: 600;
  color: #303133;
}

.statistics-cards {
  margin-bottom: 24px;
}

.stat-card {
  height: 120px;
  display: flex;
  align-items: center;
}

.stat-content {
  display: flex;
  align-items: center;
  width: 100%;
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.stat-card:nth-child(1) .stat-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-card:nth-child(2) .stat-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.stat-card:nth-child(3) .stat-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.stat-card:nth-child(4) .stat-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info {
  flex: 1;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  color: #303133;
  line-height: 1;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #909399;
}

.contract-tabs {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.tab-content {
  padding: 24px;
}

.tab-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.tab-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #303133;
}

.search-filters {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .statistics-cards .el-col {
    margin-bottom: 16px;
  }

  .search-filters {
    flex-direction: column;
    align-items: stretch;
  }

  .tab-header {
    flex-direction: column;
    gap: 16px;
    align-items: stretch;
  }
}
</style>
