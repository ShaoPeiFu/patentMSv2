<template>
  <div class="workflow-editor">
    <el-form ref="formRef" :model="formData" :rules="rules" label-width="120px">
      <!-- 基本信息 -->
      <el-card class="section-card">
        <template #header>
          <h4>基本信息</h4>
        </template>

        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="工作流名称" prop="name">
              <el-input
                v-model="formData.name"
                placeholder="请输入工作流名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="formData.category"
                placeholder="请选择分类"
                style="width: 100%"
              >
                <el-option label="文档" value="文档" />
                <el-option label="专利" value="专利" />
                <el-option label="合同" value="合同" />
                <el-option label="报告" value="报告" />
                <el-option label="其他" value="其他" />
              </el-select>
            </el-form-item>
          </el-col>
        </el-row>

        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="工作流类型" prop="type">
              <el-select
                v-model="formData.type"
                placeholder="请选择类型"
                style="width: 100%"
              >
                <el-option label="顺序执行" value="sequential" />
                <el-option label="并行执行" value="parallel" />
                <el-option label="条件执行" value="conditional" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="优先级" prop="priority">
              <el-select
                v-model="formData.priority"
                placeholder="请选择优先级"
                style="width: 100%"
              >
                <el-option label="低" value="low" />
                <el-option label="中" value="medium" />
                <el-option label="高" value="high" />
                <el-option label="紧急" value="urgent" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="版本" prop="version">
              <el-input v-model="formData.version" placeholder="如: 1.0" />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述">
          <el-input
            v-model="formData.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作流描述"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-tag
            v-for="tag in formData.tags"
            :key="tag"
            closable
            @close="removeTag(tag)"
            style="margin-right: 8px"
          >
            {{ tag }}
          </el-tag>
          <el-input
            v-if="showTagInput"
            ref="tagInputRef"
            v-model="newTag"
            size="small"
            style="width: 120px"
            @keyup.enter="addTag"
            @blur="addTag"
          />
          <el-button v-else size="small" @click="showAddTag">
            + 添加标签
          </el-button>
        </el-form-item>
      </el-card>

      <!-- 审批步骤 -->
      <el-card class="section-card">
        <template #header>
          <div class="step-header">
            <h4>审批步骤</h4>
            <el-button type="primary" size="small" @click="addStep">
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
          </div>
        </template>

        <div class="steps-container">
          <div
            v-for="(step, index) in formData.steps"
            :key="step.id || index"
            class="step-item"
          >
            <div class="step-number">{{ step.stepNumber }}</div>

            <el-card class="step-card">
              <template #header>
                <div class="step-card-header">
                  <span>步骤 {{ step.stepNumber }}</span>
                  <div class="step-actions">
                    <el-button
                      size="small"
                      :disabled="index === 0"
                      @click="moveStepUp(index)"
                    >
                      上移
                    </el-button>
                    <el-button
                      size="small"
                      :disabled="index === (formData.steps?.length || 0) - 1"
                      @click="moveStepDown(index)"
                    >
                      下移
                    </el-button>
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeStep(index)"
                    >
                      删除
                    </el-button>
                  </div>
                </div>
              </template>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form-item label="步骤名称">
                    <el-input
                      v-model="step.name"
                      placeholder="请输入步骤名称"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="12">
                  <el-form-item label="审批角色">
                    <el-select
                      v-model="step.approverRoles"
                      multiple
                      placeholder="选择审批角色"
                      style="width: 100%"
                    >
                      <el-option label="管理员" value="admin" />
                      <el-option label="审核员" value="reviewer" />
                      <el-option label="普通用户" value="user" />
                    </el-select>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-row :gutter="20">
                <el-col :span="8">
                  <el-form-item label="时间限制(小时)">
                    <el-input-number
                      v-model="step.timeLimit"
                      :min="1"
                      :max="720"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="最小审批数">
                    <el-input-number
                      v-model="step.minApprovals"
                      :min="1"
                      :max="10"
                      style="width: 100%"
                    />
                  </el-form-item>
                </el-col>
                <el-col :span="8">
                  <el-form-item label="设置选项">
                    <div class="step-options">
                      <el-checkbox v-model="step.isRequired"
                        >必需步骤</el-checkbox
                      >
                      <el-checkbox v-model="step.allowParallel"
                        >允许并行</el-checkbox
                      >
                      <el-checkbox v-model="step.autoApprove"
                        >超时自动批准</el-checkbox
                      >
                      <el-checkbox v-model="step.delegationAllowed"
                        >允许委托</el-checkbox
                      >
                    </div>
                  </el-form-item>
                </el-col>
              </el-row>

              <el-form-item label="步骤描述">
                <el-input
                  v-model="step.description"
                  type="textarea"
                  :rows="2"
                  placeholder="请输入步骤描述"
                />
              </el-form-item>
            </el-card>

            <!-- 步骤连接线 -->
            <div
              v-if="index < (formData.steps?.length || 0) - 1"
              class="step-connector"
            >
              <el-icon><ArrowDown /></el-icon>
            </div>
          </div>
        </div>

        <div v-if="(formData.steps?.length || 0) === 0" class="empty-steps">
          <el-empty description="暂无审批步骤，请添加步骤" />
        </div>
      </el-card>
    </el-form>

    <!-- 预览和保存 -->
    <div class="editor-footer">
      <el-button @click="handleCancel">取消</el-button>
      <el-button @click="previewWorkflow">预览</el-button>
      <el-button type="primary" @click="handleSave">
        {{ workflow ? "更新" : "创建" }}
      </el-button>
    </div>

    <!-- 预览对话框 -->
    <el-dialog v-model="showPreview" title="工作流预览" width="60%">
      <WorkflowPreview v-if="showPreview" :workflow="formData" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Plus, ArrowDown } from "@element-plus/icons-vue";
import type { ApprovalWorkflow, ApprovalStep } from "@/types/document";
import WorkflowPreview from "./WorkflowPreview.vue";

// Props
interface Props {
  workflow?: ApprovalWorkflow | null;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
  save: [workflow: Partial<ApprovalWorkflow>];
  cancel: [];
}>();

// 响应式数据
const formRef = ref();
const tagInputRef = ref();
const showTagInput = ref(false);
const newTag = ref("");
const showPreview = ref(false);

// 表单数据
const formData = reactive<Partial<ApprovalWorkflow>>({
  name: "",
  description: "",
  type: "sequential",
  priority: "medium",
  category: "文档",
  version: "1.0",
  steps: [],
  isActive: true,
  tags: [],
});

// 表单验证规则
const rules = {
  name: [{ required: true, message: "请输入工作流名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择分类", trigger: "change" }],
  type: [{ required: true, message: "请选择工作流类型", trigger: "change" }],
  priority: [{ required: true, message: "请选择优先级", trigger: "change" }],
  version: [{ required: true, message: "请输入版本号", trigger: "blur" }],
};

// 计算属性
// const isEditing = computed(() => !!props.workflow);

// 方法
const addStep = () => {
  const newStep: Partial<ApprovalStep> = {
    id: `step-${Date.now()}`,
    stepNumber: formData.steps!.length + 1,
    name: "",
    description: "",
    approverRoles: [],
    isRequired: true,
    allowParallel: false,
    timeLimit: 24,
    minApprovals: 1,
    autoApprove: false,
    delegationAllowed: true,
  };

  formData.steps!.push(newStep as ApprovalStep);
};

const removeStep = (index: number) => {
  formData.steps!.splice(index, 1);
  // 重新编号步骤
  formData.steps!.forEach((step, i) => {
    step.stepNumber = i + 1;
  });
};

const moveStepUp = (index: number) => {
  if (index > 0) {
    const step = formData.steps![index];
    formData.steps!.splice(index, 1);
    formData.steps!.splice(index - 1, 0, step);
    // 重新编号
    formData.steps!.forEach((s, i) => {
      s.stepNumber = i + 1;
    });
  }
};

const moveStepDown = (index: number) => {
  if (index < formData.steps!.length - 1) {
    const step = formData.steps![index];
    formData.steps!.splice(index, 1);
    formData.steps!.splice(index + 1, 0, step);
    // 重新编号
    formData.steps!.forEach((s, i) => {
      s.stepNumber = i + 1;
    });
  }
};

const showAddTag = () => {
  showTagInput.value = true;
  nextTick(() => {
    tagInputRef.value?.focus();
  });
};

const addTag = () => {
  if (newTag.value && !formData.tags!.includes(newTag.value)) {
    formData.tags!.push(newTag.value);
  }
  newTag.value = "";
  showTagInput.value = false;
};

const removeTag = (tag: string) => {
  const index = formData.tags!.indexOf(tag);
  if (index > -1) {
    formData.tags!.splice(index, 1);
  }
};

const previewWorkflow = () => {
  formRef.value?.validate((valid: boolean) => {
    if (valid) {
      showPreview.value = true;
    } else {
      ElMessage.warning("请完善工作流信息");
    }
  });
};

const handleSave = async () => {
  try {
    const valid = await formRef.value?.validate();
    if (!valid) return;

    if (formData.steps!.length === 0) {
      ElMessage.warning("请至少添加一个审批步骤");
      return;
    }

    // 验证每个步骤
    const invalidSteps = formData.steps!.filter(
      (step) => !step.name || step.approverRoles.length === 0
    );

    if (invalidSteps.length > 0) {
      ElMessage.warning("请完善所有步骤的名称和审批角色");
      return;
    }

    emit("save", { ...formData });
  } catch {
    ElMessage.error("表单验证失败");
  }
};

const handleCancel = () => {
  emit("cancel");
};

// 初始化
onMounted(() => {
  if (props.workflow) {
    Object.assign(formData, {
      ...props.workflow,
      steps: props.workflow.steps.map((step) => ({ ...step })), // 深拷贝步骤
    });
  }
});
</script>

<style scoped>
.workflow-editor {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.section-card {
  margin-bottom: 20px;
}

.section-card :deep(.el-card__header) {
  padding: 12px 20px;
  background: #f8f9fa;
}

.section-card h4 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.steps-container {
  position: relative;
}

.step-item {
  position: relative;
  margin-bottom: 30px;
}

.step-number {
  position: absolute;
  left: -50px;
  top: 20px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: #409eff;
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  z-index: 10;
}

.step-card {
  margin-left: 20px;
}

.step-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.step-actions {
  display: flex;
  gap: 8px;
}

.step-connector {
  position: absolute;
  left: -32px;
  top: 60px;
  width: 20px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #409eff;
  font-size: 20px;
}

.step-options {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-steps {
  text-align: center;
  padding: 40px;
}

.editor-footer {
  text-align: right;
  margin-top: 30px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

.editor-footer .el-button {
  margin-left: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workflow-editor {
    padding: 10px;
  }

  .step-number {
    position: static;
    margin-bottom: 10px;
  }

  .step-card {
    margin-left: 0;
  }

  .step-connector {
    position: static;
    margin: 10px 0;
    height: 20px;
  }

  .step-actions {
    flex-direction: column;
    gap: 4px;
  }

  .step-options {
    flex-direction: row;
    flex-wrap: wrap;
  }
}
</style>
