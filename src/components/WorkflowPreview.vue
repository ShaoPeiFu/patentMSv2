<template>
  <div class="workflow-preview">
    <!-- 工作流基本信息 -->
    <el-card class="info-card">
      <template #header>
        <h4>工作流信息</h4>
      </template>

      <el-descriptions :column="2" border>
        <el-descriptions-item label="名称">{{
          workflow.name
        }}</el-descriptions-item>
        <el-descriptions-item label="分类">{{
          workflow.category
        }}</el-descriptions-item>
        <el-descriptions-item label="类型">
          <el-tag :type="getTypeTagType(workflow.type)">{{
            getTypeText(workflow.type)
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="优先级">
          <el-tag :type="getPriorityTagType(workflow.priority)">{{
            getPriorityText(workflow.priority)
          }}</el-tag>
        </el-descriptions-item>
        <el-descriptions-item label="版本">{{
          workflow.version
        }}</el-descriptions-item>
        <el-descriptions-item label="步骤数">{{
          workflow.steps?.length || 0
        }}</el-descriptions-item>
        <el-descriptions-item label="描述" :span="2">{{
          workflow.description || "暂无描述"
        }}</el-descriptions-item>
        <el-descriptions-item label="标签" :span="2">
          <el-tag
            v-for="tag in workflow.tags"
            :key="tag"
            size="small"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <span
            v-if="!workflow.tags || workflow.tags.length === 0"
            class="text-muted"
            >暂无标签</span
          >
        </el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 工作流程图 -->
    <el-card class="flowchart-card">
      <template #header>
        <h4>工作流程图</h4>
      </template>

      <div class="flowchart">
        <div class="flow-start">
          <div class="flow-node start-node">
            <el-icon><VideoPlay /></el-icon>
            <span>开始</span>
          </div>
        </div>

        <div
          v-for="(step, index) in workflow.steps"
          :key="step.id || index"
          class="flow-step"
        >
          <!-- 连接线 -->
          <div class="flow-connector">
            <div class="connector-line"></div>
            <el-icon class="connector-icon"><ArrowDown /></el-icon>
          </div>

          <!-- 步骤节点 -->
          <div class="flow-node step-node" :class="getStepNodeClass(step)">
            <div class="node-header">
              <span class="step-number">{{ step.stepNumber }}</span>
              <span class="step-name">{{ step.name }}</span>
            </div>

            <div class="node-content">
              <div class="step-info">
                <div class="info-item">
                  <el-icon><User /></el-icon>
                  <span>{{
                    step.approverRoles
                      .map((role) => getRoleText(role))
                      .join(", ")
                  }}</span>
                </div>

                <div class="info-item" v-if="step.timeLimit">
                  <el-icon><Timer /></el-icon>
                  <span>{{ step.timeLimit }}小时</span>
                </div>

                <div
                  class="info-item"
                  v-if="step.minApprovals && step.minApprovals > 1"
                >
                  <el-icon><Check /></el-icon>
                  <span>需要{{ step.minApprovals }}人审批</span>
                </div>
              </div>

              <div class="step-features">
                <el-tag v-if="step.isRequired" type="danger" size="small"
                  >必需</el-tag
                >
                <el-tag v-if="step.allowParallel" type="success" size="small"
                  >并行</el-tag
                >
                <el-tag v-if="step.autoApprove" type="warning" size="small"
                  >自动批准</el-tag
                >
                <el-tag v-if="step.delegationAllowed" type="info" size="small"
                  >可委托</el-tag
                >
              </div>
            </div>
          </div>
        </div>

        <!-- 结束节点 -->
        <div class="flow-end">
          <div class="flow-connector">
            <div class="connector-line"></div>
            <el-icon class="connector-icon"><ArrowDown /></el-icon>
          </div>

          <div class="flow-node end-node">
            <el-icon><CircleCheck /></el-icon>
            <span>完成</span>
          </div>
        </div>
      </div>
    </el-card>

    <!-- 工作流分析 -->
    <el-card class="analysis-card">
      <template #header>
        <h4>工作流分析</h4>
      </template>

      <el-row :gutter="20">
        <el-col :span="8">
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><Timer /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ estimatedTime }}</div>
              <div class="metric-label">预计耗时(小时)</div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><User /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">{{ totalApprovers }}</div>
              <div class="metric-label">参与角色数</div>
            </div>
          </div>
        </el-col>

        <el-col :span="8">
          <div class="metric-card">
            <div class="metric-icon">
              <el-icon><Rank /></el-icon>
            </div>
            <div class="metric-content">
              <div class="metric-value">
                {{ getComplexityText(complexity) }}
              </div>
              <div class="metric-label">复杂度</div>
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 工作流特征 -->
      <div class="workflow-features">
        <h5>工作流特征：</h5>
        <div class="features-list">
          <el-tag v-if="hasParallelSteps" type="success">包含并行步骤</el-tag>
          <el-tag v-if="hasTimeouts" type="warning">设置时间限制</el-tag>
          <el-tag v-if="hasDelegation" type="info">支持委托审批</el-tag>
          <el-tag v-if="hasAutoApproval" type="primary">支持自动批准</el-tag>
          <el-tag v-if="hasConditionalSteps" type="danger">包含条件分支</el-tag>
        </div>
      </div>

      <!-- 潜在问题提醒 -->
      <div v-if="warnings.length > 0" class="warnings">
        <h5>注意事项：</h5>
        <el-alert
          v-for="warning in warnings"
          :key="warning"
          :title="warning"
          type="warning"
          :closable="false"
          style="margin-bottom: 8px"
        />
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import {
  VideoPlay,
  ArrowDown,
  CircleCheck,
  User,
  Timer,
  Check,
  Rank,
} from "@element-plus/icons-vue";
import type { ApprovalWorkflow, ApprovalStep } from "@/types/document";

// Props
interface Props {
  workflow: Partial<ApprovalWorkflow>;
}

const props = defineProps<Props>();

// 计算属性
const estimatedTime = computed(() => {
  if (!props.workflow.steps) return 0;
  return props.workflow.steps.reduce(
    (total, step) => total + (step.timeLimit || 0),
    0
  );
});

const totalApprovers = computed(() => {
  if (!props.workflow.steps) return 0;
  const allRoles = new Set<string>();
  props.workflow.steps.forEach((step) => {
    step.approverRoles.forEach((role) => allRoles.add(role));
  });
  return allRoles.size;
});

const complexity = computed(() => {
  if (!props.workflow.steps) return "simple";

  const stepCount = props.workflow.steps.length;
  const hasParallel = props.workflow.steps.some((step) => step.allowParallel);
  const hasConditional = props.workflow.type === "conditional";

  if (stepCount <= 2 && !hasParallel && !hasConditional) return "simple";
  if (stepCount <= 4 && (hasParallel || hasConditional)) return "medium";
  return "complex";
});

const hasParallelSteps = computed(
  () => props.workflow.steps?.some((step) => step.allowParallel) || false
);

const hasTimeouts = computed(
  () =>
    props.workflow.steps?.some(
      (step) => step.timeLimit && step.timeLimit > 0
    ) || false
);

const hasDelegation = computed(
  () => props.workflow.steps?.some((step) => step.delegationAllowed) || false
);

const hasAutoApproval = computed(
  () => props.workflow.steps?.some((step) => step.autoApprove) || false
);

const hasConditionalSteps = computed(
  () => props.workflow.type === "conditional"
);

const warnings = computed(() => {
  const warnings: string[] = [];

  if (!props.workflow.steps || props.workflow.steps.length === 0) {
    warnings.push("工作流没有审批步骤");
  }

  if (estimatedTime.value > 168) {
    // 超过一周
    warnings.push(`预计耗时过长(${estimatedTime.value}小时)，建议优化审批流程`);
  }

  if (props.workflow.steps?.some((step) => step.approverRoles.length === 0)) {
    warnings.push("存在未设置审批角色的步骤");
  }

  if (props.workflow.steps?.some((step) => !step.name?.trim())) {
    warnings.push("存在未命名的审批步骤");
  }

  if (hasParallelSteps.value && props.workflow.type === "sequential") {
    warnings.push("工作流类型为顺序执行，但包含并行步骤");
  }

  return warnings;
});

// 方法
const getTypeText = (type?: string) => {
  const typeMap = {
    sequential: "顺序执行",
    parallel: "并行执行",
    conditional: "条件执行",
  };
  return typeMap[type as keyof typeof typeMap] || type;
};

const getTypeTagType = (type?: string) => {
  const typeMap = {
    sequential: "",
    parallel: "success",
    conditional: "warning",
  };
  return typeMap[type as keyof typeof typeMap] || "";
};

const getPriorityText = (priority?: string) => {
  const priorityMap = {
    low: "低",
    medium: "中",
    high: "高",
    urgent: "紧急",
  };
  return priorityMap[priority as keyof typeof priorityMap] || priority;
};

const getPriorityTagType = (priority?: string) => {
  const typeMap = {
    low: "info",
    medium: "",
    high: "warning",
    urgent: "danger",
  };
  return typeMap[priority as keyof typeof typeMap] || "";
};

const getRoleText = (role: string) => {
  const roleMap = {
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return roleMap[role as keyof typeof roleMap] || role;
};

const getStepNodeClass = (step: ApprovalStep) => {
  if (step.isRequired) return "required-step";
  if (step.allowParallel) return "parallel-step";
  return "normal-step";
};

const getComplexityText = (complexity: string) => {
  const complexityMap = {
    simple: "简单",
    medium: "中等",
    complex: "复杂",
  };
  return complexityMap[complexity as keyof typeof complexityMap] || complexity;
};
</script>

<style scoped>
.workflow-preview {
  padding: 20px;
}

.info-card,
.flowchart-card,
.analysis-card {
  margin-bottom: 20px;
}

.info-card :deep(.el-card__header),
.flowchart-card :deep(.el-card__header),
.analysis-card :deep(.el-card__header) {
  padding: 12px 20px;
  background: #f8f9fa;
}

.info-card h4,
.flowchart-card h4,
.analysis-card h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.text-muted {
  color: #999;
  font-style: italic;
}

/* 流程图样式 */
.flowchart {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
}

.flow-node {
  padding: 16px 24px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  background: white;
  border: 2px solid #e4e7ed;
  min-width: 200px;
  text-align: center;
  position: relative;
}

.start-node,
.end-node {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: bold;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.step-node {
  background: white;
  border-left: 4px solid #409eff;
}

.step-node.required-step {
  border-left-color: #f56c6c;
}

.step-node.parallel-step {
  border-left-color: #67c23a;
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 12px;
}

.step-number {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.step-name {
  font-weight: bold;
  color: #2c3e50;
}

.node-content {
  text-align: left;
}

.step-info {
  margin-bottom: 8px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 14px;
  color: #666;
}

.step-features {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}

.flow-connector {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 16px 0;
}

.connector-line {
  width: 2px;
  height: 20px;
  background: #409eff;
}

.connector-icon {
  color: #409eff;
  font-size: 16px;
  margin-top: -2px;
}

/* 分析卡片样式 */
.metric-card {
  display: flex;
  align-items: center;
  padding: 20px;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(45deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-size: 24px;
  margin-right: 16px;
}

.metric-content {
  flex: 1;
}

.metric-value {
  font-size: 2em;
  font-weight: bold;
  color: #2c3e50;
  line-height: 1;
  margin-bottom: 4px;
}

.metric-label {
  color: #7f8c8d;
  font-size: 0.9em;
}

.workflow-features {
  margin-top: 20px;
}

.workflow-features h5 {
  margin: 0 0 12px 0;
  color: #2c3e50;
}

.features-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.warnings {
  margin-top: 20px;
}

.warnings h5 {
  margin: 0 0 12px 0;
  color: #e6a23c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-preview {
    padding: 10px;
  }

  .flowchart {
    padding: 10px;
  }

  .flow-node {
    min-width: 150px;
    padding: 12px 16px;
  }

  .metric-card {
    flex-direction: column;
    text-align: center;
  }

  .metric-icon {
    margin-right: 0;
    margin-bottom: 12px;
  }

  .features-list {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
