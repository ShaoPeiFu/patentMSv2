<template>
  <div class="template-manager">
    <!-- 模板列表 -->
    <div class="template-list">
      <div class="list-header">
        <h4>工作流模板</h4>
        <el-button type="primary" @click="showCreateTemplate = true">
          <el-icon><Plus /></el-icon>
          创建模板
        </el-button>
      </div>

      <div class="template-grid">
        <div
          v-for="template in documentStore.workflowTemplates"
          :key="template.id"
          class="template-card"
        >
          <div class="template-header">
            <h5>{{ template.name }}</h5>
            <el-tag
              size="small"
              :type="getComplexityTagType(template.complexity)"
            >
              {{ getComplexityText(template.complexity) }}
            </el-tag>
          </div>

          <div class="template-content">
            <p class="template-description">{{ template.description }}</p>

            <div class="template-meta">
              <div class="meta-item">
                <el-icon><Folder /></el-icon>
                <span>{{ template.category }}</span>
              </div>
              <div class="meta-item">
                <el-icon><Timer /></el-icon>
                <span>{{ template.estimatedDuration }}小时</span>
              </div>
              <div class="meta-item">
                <el-icon><Operation /></el-icon>
                <span>{{ template.steps.length }}步骤</span>
              </div>
              <div class="meta-item">
                <el-icon><View /></el-icon>
                <span>已用{{ template.usage }}次</span>
              </div>
            </div>
          </div>

          <div class="template-actions">
            <el-button size="small" @click="previewTemplate(template)">
              预览
            </el-button>
            <el-button
              size="small"
              type="primary"
              @click="useTemplate(template)"
            >
              使用模板
            </el-button>
            <el-button
              size="small"
              type="danger"
              @click="deleteTemplate(template.id)"
            >
              删除
            </el-button>
          </div>
        </div>

        <!-- 空状态 -->
        <div
          v-if="documentStore.workflowTemplates.length === 0"
          class="empty-templates"
        >
          <el-empty description="暂无工作流模板">
            <el-button type="primary" @click="showCreateTemplate = true">
              创建第一个模板
            </el-button>
          </el-empty>
        </div>
      </div>
    </div>

    <!-- 创建模板对话框 -->
    <el-dialog v-model="showCreateTemplate" title="创建工作流模板" width="60%">
      <el-form
        ref="templateFormRef"
        :model="templateForm"
        :rules="templateRules"
        label-width="120px"
      >
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="模板名称" prop="name">
              <el-input
                v-model="templateForm.name"
                placeholder="请输入模板名称"
              />
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="分类" prop="category">
              <el-select
                v-model="templateForm.category"
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
          <el-col :span="12">
            <el-form-item label="复杂度" prop="complexity">
              <el-select
                v-model="templateForm.complexity"
                placeholder="请选择复杂度"
                style="width: 100%"
              >
                <el-option label="简单" value="simple" />
                <el-option label="中等" value="medium" />
                <el-option label="复杂" value="complex" />
              </el-select>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="预计耗时(小时)" prop="estimatedDuration">
              <el-input-number
                v-model="templateForm.estimatedDuration"
                :min="1"
                :max="720"
                style="width: 100%"
              />
            </el-form-item>
          </el-col>
        </el-row>

        <el-form-item label="描述" prop="description">
          <el-input
            v-model="templateForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入模板描述"
          />
        </el-form-item>

        <!-- 步骤配置 -->
        <el-form-item label="审批步骤">
          <div class="steps-config">
            <div
              v-for="(step, index) in templateForm.steps"
              :key="index"
              class="step-config"
            >
              <el-card>
                <template #header>
                  <div class="step-header">
                    <span>步骤 {{ index + 1 }}</span>
                    <el-button
                      size="small"
                      type="danger"
                      @click="removeTemplateStep(index)"
                    >
                      删除
                    </el-button>
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
                    <el-checkbox v-model="step.isRequired"
                      >必需步骤</el-checkbox
                    >
                  </el-col>
                  <el-col :span="8">
                    <el-checkbox v-model="step.allowParallel"
                      >允许并行</el-checkbox
                    >
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
            </div>

            <el-button
              @click="addTemplateStep"
              style="width: 100%; margin-top: 16px"
            >
              <el-icon><Plus /></el-icon>
              添加步骤
            </el-button>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateTemplate = false">取消</el-button>
        <el-button type="primary" @click="saveTemplate">保存模板</el-button>
      </template>
    </el-dialog>

    <!-- 使用模板对话框 -->
    <el-dialog v-model="showUseTemplate" title="使用模板创建工作流" width="50%">
      <el-form
        ref="useFormRef"
        :model="useForm"
        :rules="useRules"
        label-width="120px"
      >
        <el-form-item label="工作流名称" prop="name">
          <el-input v-model="useForm.name" placeholder="请输入工作流名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="useForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作流描述"
          />
        </el-form-item>

        <el-form-item label="标签">
          <el-input
            v-model="useForm.tagsInput"
            placeholder="请输入标签，用逗号分隔"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showUseTemplate = false">取消</el-button>
        <el-button type="primary" @click="createFromTemplate"
          >创建工作流</el-button
        >
      </template>
    </el-dialog>

    <!-- 模板预览对话框 -->
    <el-dialog v-model="showPreview" title="模板预览" width="70%">
      <WorkflowPreview
        v-if="showPreview && previewData"
        :workflow="previewData"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from "vue";
import { useDocumentStore } from "@/stores/document";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Folder, Timer, Operation, View } from "@element-plus/icons-vue";
import type { WorkflowTemplate, ApprovalStep } from "@/types/document";
import WorkflowPreview from "./WorkflowPreview.vue";

// Emits
const emit = defineEmits<{
  "create-workflow": [templateId: string, customData: any];
}>();

// Store
const documentStore = useDocumentStore();

// 响应式数据
const showCreateTemplate = ref(false);
const showUseTemplate = ref(false);
const showPreview = ref(false);
const selectedTemplate = ref<WorkflowTemplate | null>(null);
const previewData = ref<any>(null);

const templateFormRef = ref();
const useFormRef = ref();

// 模板表单
const templateForm = reactive({
  name: "",
  description: "",
  category: "文档",
  complexity: "simple" as "simple" | "medium" | "complex",
  estimatedDuration: 24,
  steps: [] as Partial<ApprovalStep>[],
});

// 使用模板表单
const useForm = reactive({
  name: "",
  description: "",
  tagsInput: "",
});

// 验证规则
const templateRules = {
  name: [{ required: true, message: "请输入模板名称", trigger: "blur" }],
  category: [{ required: true, message: "请选择分类", trigger: "change" }],
  complexity: [{ required: true, message: "请选择复杂度", trigger: "change" }],
  estimatedDuration: [
    { required: true, message: "请输入预计耗时", trigger: "blur" },
  ],
  description: [{ required: true, message: "请输入模板描述", trigger: "blur" }],
};

const useRules = {
  name: [{ required: true, message: "请输入工作流名称", trigger: "blur" }],
};

// 方法
const addTemplateStep = () => {
  templateForm.steps.push({
    stepNumber: templateForm.steps.length + 1,
    name: "",
    description: "",
    approverRoles: [],
    isRequired: true,
    allowParallel: false,
    timeLimit: 24,
  });
};

const removeTemplateStep = (index: number) => {
  templateForm.steps.splice(index, 1);
  // 重新编号
  templateForm.steps.forEach((step, i) => {
    step.stepNumber = i + 1;
  });
};

const saveTemplate = async () => {
  try {
    const valid = await templateFormRef.value?.validate();
    if (!valid) return;

    if (templateForm.steps.length === 0) {
      ElMessage.warning("请至少添加一个审批步骤");
      return;
    }

    await documentStore.createWorkflowTemplate({
      name: templateForm.name,
      description: templateForm.description,
      category: templateForm.category,
      complexity: templateForm.complexity,
      estimatedDuration: templateForm.estimatedDuration,
      steps: templateForm.steps as Omit<ApprovalStep, "id">[],
      createdBy: 1, // 这里应该使用当前用户ID
    });

    ElMessage.success("模板创建成功");
    showCreateTemplate.value = false;

    // 重置表单
    Object.assign(templateForm, {
      name: "",
      description: "",
      category: "文档",
      complexity: "simple",
      estimatedDuration: 24,
      steps: [],
    });
  } catch (error) {
    ElMessage.error("创建失败: " + (error as Error).message);
  }
};

const useTemplate = (template: WorkflowTemplate) => {
  selectedTemplate.value = template;
  useForm.name = `基于${template.name}的工作流`;
  useForm.description = template.description;
  showUseTemplate.value = true;
};

const createFromTemplate = async () => {
  try {
    const valid = await useFormRef.value?.validate();
    if (!valid || !selectedTemplate.value) return;

    const customData = {
      name: useForm.name,
      description: useForm.description,
      tags: useForm.tagsInput
        ? useForm.tagsInput.split(",").map((tag) => tag.trim())
        : [],
      createdBy: 1, // 这里应该使用当前用户ID
    };

    emit("create-workflow", selectedTemplate.value.id, customData);
    showUseTemplate.value = false;

    // 重置表单
    Object.assign(useForm, {
      name: "",
      description: "",
      tagsInput: "",
    });
  } catch (error) {
    ElMessage.error("创建失败: " + (error as Error).message);
  }
};

const previewTemplate = (template: WorkflowTemplate) => {
  // 将模板转换为工作流格式用于预览
  previewData.value = {
    name: template.name,
    description: template.description,
    category: template.category,
    type: "sequential",
    priority: "medium",
    version: "1.0",
    steps: template.steps.map((step, index) => ({
      ...step,
      id: `preview-step-${index}`,
      stepNumber: index + 1,
    })),
    tags: [],
  };
  showPreview.value = true;
};

const deleteTemplate = async (templateId: string) => {
  try {
    await ElMessageBox.confirm(
      "确定要删除这个模板吗？此操作不可恢复。",
      "确认删除",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    const index = documentStore.workflowTemplates.findIndex(
      (t) => t.id === templateId
    );
    if (index !== -1) {
      documentStore.workflowTemplates.splice(index, 1);
      documentStore.saveToStorage();
      ElMessage.success("模板删除成功");
    }
  } catch {
    // 用户取消操作
  }
};

// 辅助函数
const getComplexityText = (complexity: string) => {
  const complexityMap = {
    simple: "简单",
    medium: "中等",
    complex: "复杂",
  };
  return complexityMap[complexity as keyof typeof complexityMap] || complexity;
};

const getComplexityTagType = (complexity: string) => {
  const typeMap = {
    simple: "success",
    medium: "warning",
    complex: "danger",
  };
  return typeMap[complexity as keyof typeof typeMap] || "";
};
</script>

<style scoped>
.template-manager {
  padding: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.list-header h4 {
  margin: 0;
  color: #2c3e50;
}

.template-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 20px;
}

.template-card {
  border: 1px solid #e4e7ed;
  border-radius: 12px;
  overflow: hidden;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.template-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.template-header {
  padding: 16px 20px 12px;
  border-bottom: 1px solid #f0f0f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.template-header h5 {
  margin: 0;
  color: #2c3e50;
  font-size: 16px;
}

.template-content {
  padding: 16px 20px;
}

.template-description {
  color: #666;
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.template-meta {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: #666;
}

.template-actions {
  padding: 12px 20px;
  border-top: 1px solid #f0f0f0;
  display: flex;
  gap: 8px;
}

.empty-templates {
  grid-column: 1 / -1;
  text-align: center;
  padding: 40px;
}

.steps-config {
  width: 100%;
}

.step-config {
  margin-bottom: 16px;
}

.step-config .el-card {
  border: 1px solid #e4e7ed;
}

.step-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .template-grid {
    grid-template-columns: 1fr;
  }

  .template-meta {
    grid-template-columns: 1fr;
  }

  .template-actions {
    flex-direction: column;
  }

  .list-header {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
}
</style>
