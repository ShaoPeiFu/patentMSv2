<template>
  <div class="personal-workspace">
    <!-- 工作台头部 -->
    <div class="workspace-header">
      <div class="workspace-info">
        <h2>{{ currentWorkspace.name }}</h2>
        <p v-if="currentWorkspace.description">
          {{ currentWorkspace.description }}
        </p>
      </div>

      <div class="workspace-actions">
        <el-button-group>
          <el-button
            size="small"
            @click="refreshWorkspace"
            :loading="isRefreshing"
          >
            <el-icon><Refresh /></el-icon>
            刷新
          </el-button>
          <el-button size="small" @click="showWorkspaceSettings = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </el-button-group>

        <el-dropdown @command="handleWorkspaceAction">
          <el-button size="small">
            <el-icon><More /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="switch">切换工作台</el-dropdown-item>
              <el-dropdown-item command="edit">编辑工作台</el-dropdown-item>
              <el-dropdown-item command="duplicate"
                >复制工作台</el-dropdown-item
              >
              <el-dropdown-item
                command="delete"
                :disabled="currentWorkspace.isDefault"
                divided
              >
                删除工作台
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </div>

    <!-- 工作台内容 -->
    <div class="workspace-content">
      <!-- 网格布局 -->
      <div
        v-if="currentWorkspace.layout === 'grid'"
        class="workspace-grid"
        :class="{
          'compact-mode': personalizationStore.settings.interface.compactMode,
        }"
      >
        <div
          v-for="widget in visibleWidgets"
          :key="widget.id"
          class="workspace-widget"
          :class="`widget-${widget.type}`"
          :style="getWidgetGridStyle(widget)"
        >
          <div class="widget-header">
            <h3>{{ widget.name }}</h3>
            <div class="widget-controls">
              <el-button size="small" @click="editWidget(widget)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" @click="removeWidget(widget.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="widget-content">
            <component
              :is="getWidgetComponent(widget.type)"
              :widget="widget"
              :config="widget.config"
            />
          </div>
        </div>
      </div>

      <!-- 列表布局 -->
      <div
        v-else-if="currentWorkspace.layout === 'list'"
        class="workspace-list"
      >
        <div
          v-for="widget in visibleWidgets"
          :key="widget.id"
          class="workspace-widget-list"
        >
          <div class="widget-header">
            <h3>{{ widget.name }}</h3>
            <div class="widget-controls">
              <el-button size="small" @click="editWidget(widget)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button size="small" @click="removeWidget(widget.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>

          <div class="widget-content">
            <component
              :is="getWidgetComponent(widget.type)"
              :widget="widget"
              :config="widget.config"
            />
          </div>
        </div>
      </div>

      <!-- 看板布局 -->
      <div
        v-else-if="currentWorkspace.layout === 'kanban'"
        class="workspace-kanban"
      >
        <div class="kanban-columns">
          <div
            v-for="column in kanbanColumns"
            :key="column.id"
            class="kanban-column"
          >
            <div class="column-header">
              <h3>{{ column.name }}</h3>
              <span class="column-count">{{ column.widgets.length }}</span>
            </div>

            <div class="column-content">
              <div
                v-for="widget in column.widgets"
                :key="widget.id"
                class="kanban-widget"
                draggable="true"
                @dragstart="handleDragStart(widget, $event)"
                @dragover="handleDragOver($event)"
                @drop="handleDrop(widget, column.id, $event)"
              >
                <div class="widget-header">
                  <h4>{{ widget.name }}</h4>
                </div>
                <div class="widget-content">
                  <component
                    :is="getWidgetComponent(widget.type)"
                    :widget="widget"
                    :config="widget.config"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 空状态 -->
    <div v-if="visibleWidgets.length === 0" class="workspace-empty">
      <el-empty description="工作台暂无内容">
        <el-button type="primary" @click="showWidgetSelector = true">
          <el-icon><Plus /></el-icon>
          添加组件
        </el-button>
      </el-empty>
    </div>

    <!-- 工作台设置对话框 -->
    <el-dialog v-model="showWorkspaceSettings" title="工作台设置" width="600px">
      <el-form :model="workspaceForm" label-width="100px">
        <el-form-item label="工作台名称">
          <el-input v-model="workspaceForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input
            v-model="workspaceForm.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>
        <el-form-item label="布局">
          <el-radio-group v-model="workspaceForm.layout">
            <el-radio label="grid">网格布局</el-radio>
            <el-radio label="list">列表布局</el-radio>
            <el-radio label="kanban">看板布局</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWorkspaceSettings = false">取消</el-button>
          <el-button type="primary" @click="saveWorkspaceSettings">
            保存设置
          </el-button>
        </span>
      </template>
    </el-dialog>

    <!-- 组件选择对话框 -->
    <el-dialog v-model="showWidgetSelector" title="添加组件" width="800px">
      <div class="widget-selector">
        <el-tabs v-model="widgetCategory">
          <el-tab-pane label="数据组件" name="data">
            <div class="widget-grid">
              <div
                v-for="widget in dataWidgets"
                :key="widget.id"
                class="widget-option"
                @click="addWidget(widget)"
              >
                <div class="widget-icon">
                  <el-icon><component :is="widget.icon" /></el-icon>
                </div>
                <h4>{{ widget.name }}</h4>
                <p>{{ widget.description }}</p>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="图表组件" name="chart">
            <div class="widget-grid">
              <div
                v-for="widget in chartWidgets"
                :key="widget.id"
                class="widget-option"
                @click="addWidget(widget)"
              >
                <div class="widget-icon">
                  <el-icon><component :is="widget.icon" /></el-icon>
                </div>
                <h4>{{ widget.name }}</h4>
                <p>{{ widget.description }}</p>
              </div>
            </div>
          </el-tab-pane>

          <el-tab-pane label="功能组件" name="function">
            <div class="widget-grid">
              <div
                v-for="widget in functionWidgets"
                :key="widget.id"
                class="widget-option"
                @click="addWidget(widget)"
              >
                <div class="widget-icon">
                  <el-icon><component :is="widget.icon" /></el-icon>
                </div>
                <h4>{{ widget.name }}</h4>
                <p>{{ widget.description }}</p>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from "vue";
import { usePersonalizationStore } from "@/stores/personalization";
import { ElMessage, ElMessageBox } from "element-plus";
import {
  Refresh,
  Setting,
  More,
  Edit,
  Delete,
  Plus,
} from "@element-plus/icons-vue";

// 导入组件
import PatentOverviewWidget from "./widgets/PatentOverviewWidget.vue";
import RecentPatentsWidget from "./widgets/RecentPatentsWidget.vue";
import PatentChartWidget from "./widgets/PatentChartWidget.vue";
import QuickActionsWidget from "./widgets/QuickActionsWidget.vue";

const personalizationStore = usePersonalizationStore();

// 响应式数据
const isRefreshing = ref(false);
const showWorkspaceSettings = ref(false);
const showWidgetSelector = ref(false);
const widgetCategory = ref("data");

// 工作台表单
const workspaceForm = reactive({
  name: "",
  description: "",
  layout: "grid" as "grid" | "list" | "kanban",
});

// 计算属性
const currentWorkspace = computed(() => personalizationStore.currentWorkspace);
const visibleWidgets = computed(() => personalizationStore.visibleWidgets);

// 看板列
const kanbanColumns = computed(() => {
  const columns: Array<{
    id: string;
    name: string;
    widgets: any[];
  }> = [
    { id: "todo", name: "待处理", widgets: [] },
    { id: "in-progress", name: "进行中", widgets: [] },
    { id: "done", name: "已完成", widgets: [] },
  ];

  // 根据组件类型分配到不同列
  visibleWidgets.value.forEach((widget: any, index: number) => {
    const columnIndex = index % 3;
    columns[columnIndex].widgets.push(widget);
  });

  return columns;
});

// 可用组件
const dataWidgets = [
  {
    id: "patent-overview",
    name: "专利概览",
    description: "显示专利统计信息",
    icon: "DataAnalysis",
    type: "metric",
  },
  {
    id: "recent-patents",
    name: "最近专利",
    description: "显示最近的专利列表",
    icon: "Files",
    type: "list",
  },
  {
    id: "user-activity",
    name: "用户活动",
    description: "显示用户活动记录",
    icon: "User",
    type: "list",
  },
];

const chartWidgets = [
  {
    id: "patent-chart",
    name: "专利统计",
    description: "专利数据图表",
    icon: "PieChart",
    type: "chart",
  },
  {
    id: "trend-analysis",
    name: "趋势分析",
    description: "专利趋势图表",
    icon: "TrendCharts",
    type: "chart",
  },
  {
    id: "status-distribution",
    name: "状态分布",
    description: "专利状态分布图",
    icon: "Histogram",
    type: "chart",
  },
];

const functionWidgets = [
  {
    id: "quick-actions",
    name: "快捷操作",
    description: "常用操作快捷入口",
    icon: "Setting",
    type: "custom",
  },
  {
    id: "notifications",
    name: "通知中心",
    description: "系统通知和提醒",
    icon: "Bell",
    type: "custom",
  },
  {
    id: "search-widget",
    name: "快速搜索",
    description: "快速搜索功能",
    icon: "Search",
    type: "custom",
  },
];

// 方法
const refreshWorkspace = async () => {
  isRefreshing.value = true;
  try {
    // 模拟刷新数据
    await new Promise((resolve) => setTimeout(resolve, 1000));
    ElMessage.success("工作台已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  } finally {
    isRefreshing.value = false;
  }
};

const handleWorkspaceAction = async (command: string) => {
  switch (command) {
    case "switch":
      // 切换工作台逻辑
      ElMessage.info("切换工作台功能开发中");
      break;
    case "edit":
      editWorkspace();
      break;
    case "duplicate":
      duplicateWorkspace();
      break;
    case "delete":
      await deleteWorkspace();
      break;
  }
};

const editWorkspace = () => {
  workspaceForm.name = currentWorkspace.value.name;
  workspaceForm.description = currentWorkspace.value.description;
  workspaceForm.layout = currentWorkspace.value.layout;
  showWorkspaceSettings.value = true;
};

const duplicateWorkspace = () => {
  const newWorkspace = {
    name: `${currentWorkspace.value.name} - 副本`,
    description: currentWorkspace.value.description,
    layout: currentWorkspace.value.layout,
    widgets: [...currentWorkspace.value.widgets],
    isDefault: false,
  };

  personalizationStore.createWorkspace(newWorkspace);
  ElMessage.success("工作台复制成功");
};

const deleteWorkspace = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要删除此工作台吗？此操作不可恢复。",
      "确认删除",
      { type: "warning" }
    );

    personalizationStore.deleteWorkspace(currentWorkspace.value.id);
    ElMessage.success("工作台删除成功");
  } catch (error) {
    // 用户取消操作
  }
};

const saveWorkspaceSettings = () => {
  personalizationStore.updateWorkspace(currentWorkspace.value.id, {
    name: workspaceForm.name,
    description: workspaceForm.description,
    layout: workspaceForm.layout,
  });

  showWorkspaceSettings.value = false;
  ElMessage.success("工作台设置已保存");
};

const getWidgetGridStyle = (widget: any) => {
  return {
    gridColumn: `span ${widget.position.w}`,
    gridRow: `span ${widget.position.h}`,
  };
};

const getWidgetComponent = (type: string) => {
  const componentMap: Record<string, any> = {
    metric: PatentOverviewWidget,
    list: RecentPatentsWidget,
    chart: PatentChartWidget,
    custom: QuickActionsWidget,
  };

  return componentMap[type] || PatentOverviewWidget;
};

const editWidget = (_widget: any) => {
  ElMessage.info("编辑组件功能开发中");
};

const removeWidget = async (widgetId: string) => {
  try {
    await ElMessageBox.confirm("确定要移除此组件吗？", "确认移除", {
      type: "warning",
    });

    personalizationStore.removeWidget(widgetId);
    ElMessage.success("组件已移除");
  } catch (error) {
    // 用户取消操作
  }
};

const addWidget = (widgetTemplate: any) => {
  const newWidget = {
    name: widgetTemplate.name,
    type: widgetTemplate.type,
    position: { x: 0, y: 0, w: 6, h: 2 },
    config: {},
    isVisible: true,
    order: visibleWidgets.value.length + 1,
  };

  personalizationStore.addWidget(newWidget);
  showWidgetSelector.value = false;
  ElMessage.success("组件添加成功");
};

// 拖拽功能
const handleDragStart = (widget: any, event: DragEvent) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData("text/plain", widget.id);
  }
};

const handleDragOver = (event: DragEvent) => {
  event.preventDefault();
};

const handleDrop = (_widget: any, _columnId: string, event: DragEvent) => {
  event.preventDefault();
  // 处理拖拽逻辑
  ElMessage.info("拖拽功能开发中");
};

onMounted(() => {
  console.log("个人工作台已加载");
});
</script>

<style scoped>
.personal-workspace {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.workspace-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
}

.workspace-info h2 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 20px;
}

.workspace-info p {
  margin: 0;
  color: #909399;
  font-size: 14px;
}

.workspace-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.workspace-content {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

/* 网格布局 */
.workspace-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 20px;
  min-height: 400px;
}

.workspace-grid.compact-mode {
  gap: 15px;
}

.workspace-widget {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.workspace-widget:hover {
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.widget-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 500;
}

.widget-controls {
  display: flex;
  gap: 5px;
}

.widget-content {
  padding: 20px;
  min-height: 100px;
}

/* 列表布局 */
.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.workspace-widget-list {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

/* 看板布局 */
.workspace-kanban {
  height: 100%;
  overflow-x: auto;
}

.kanban-columns {
  display: flex;
  gap: 20px;
  height: 100%;
  min-width: 800px;
}

.kanban-column {
  flex: 1;
  min-width: 250px;
  background: #f8f9fa;
  border-radius: 8px;
  padding: 15px;
}

.column-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
  padding-bottom: 10px;
  border-bottom: 1px solid #e4e7ed;
}

.column-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
}

.column-count {
  background: #409eff;
  color: white;
  padding: 2px 8px;
  border-radius: 10px;
  font-size: 12px;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 10px;
  min-height: 200px;
}

.kanban-widget {
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 15px;
  cursor: move;
  transition: all 0.2s ease;
}

.kanban-widget:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.kanban-widget .widget-header h4 {
  margin: 0 0 10px 0;
  color: #303133;
  font-size: 14px;
}

/* 空状态 */
.workspace-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 400px;
}

/* 组件选择器 */
.widget-selector {
  padding: 20px 0;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}

.widget-option {
  padding: 20px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.widget-option:hover {
  border-color: #409eff;
  background: #f0f9ff;
  transform: translateY(-2px);
}

.widget-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 10px;
}

.widget-option h4 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 16px;
}

.widget-option p {
  margin: 0;
  color: #909399;
  font-size: 14px;
  line-height: 1.4;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .workspace-header {
    flex-direction: column;
    gap: 15px;
    align-items: flex-start;
  }

  .workspace-grid {
    grid-template-columns: repeat(6, 1fr);
    gap: 15px;
  }

  .kanban-columns {
    flex-direction: column;
    min-width: auto;
  }

  .kanban-column {
    min-width: auto;
  }
}

/* 深色模式支持 */
:deep(.dark-mode) .workspace-header {
  background: #1a1a1a;
  border-color: #4c4c4c;
}

:deep(.dark-mode) .workspace-widget {
  background: #1a1a1a;
  border-color: #4c4c4c;
}

:deep(.dark-mode) .widget-header {
  background: #2a2a2a;
  border-color: #4c4c4c;
}

:deep(.dark-mode) .kanban-column {
  background: #2a2a2a;
}

:deep(.dark-mode) .kanban-widget {
  background: #1a1a1a;
  border-color: #4c4c4c;
}
</style>
