<template>
  <div class="interactive-dashboard">
    <!-- 工具栏 -->
    <div class="dashboard-toolbar">
      <div class="toolbar-left">
        <el-button-group size="small">
          <el-button :type="editMode ? 'primary' : ''" @click="toggleEditMode">
            <el-icon><Edit /></el-icon>
            {{ editMode ? "完成编辑" : "编辑布局" }}
          </el-button>
          <el-button @click="addWidget">
            <el-icon><Plus /></el-icon>
            添加组件
          </el-button>
          <el-button @click="showSettings = true">
            <el-icon><Setting /></el-icon>
            设置
          </el-button>
        </el-button-group>
      </div>

      <div class="toolbar-right">
        <el-select
          v-model="selectedTheme"
          @change="handleThemeChange"
          size="small"
        >
          <el-option
            v-for="theme in themes"
            :key="theme.id"
            :label="theme.name"
            :value="theme.id"
          />
        </el-select>

        <el-button size="small" @click="exportDashboard">
          <el-icon><Download /></el-icon>
          导出
        </el-button>

        <el-button size="small" @click="refreshDashboard">
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </div>

    <!-- 仪表板网格 -->
    <div class="dashboard-grid" ref="gridContainer" :style="dashboardStyle">
      <grid-layout
        v-model:layout="layout"
        :col-num="12"
        :row-height="60"
        :margin="[10, 10]"
        :is-draggable="editMode"
        :is-resizable="editMode"
        :responsive="true"
        :vertical-compact="true"
        :use-css-transforms="true"
        @layout-updated="handleLayoutUpdated"
      >
        <grid-item
          v-for="widget in widgets"
          :key="widget.id"
          :x="widget.position.x"
          :y="widget.position.y"
          :w="widget.position.w"
          :h="widget.position.h"
          :i="widget.id"
          class="dashboard-widget"
          :class="{ 'edit-mode': editMode }"
        >
          <!-- 编辑模式工具栏 -->
          <div v-if="editMode" class="widget-toolbar">
            <el-button-group size="small">
              <el-button @click="editWidget(widget)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button @click="duplicateWidget(widget)">
                <el-icon><DocumentCopy /></el-icon>
              </el-button>
              <el-button type="danger" @click="removeWidget(widget.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </el-button-group>
          </div>

          <!-- 组件内容 -->
          <div class="widget-content">
            <component
              :is="getWidgetComponent(widget.type)"
              :widget="widget"
              :theme="activeTheme"
              :edit-mode="editMode"
              @update="handleWidgetUpdate"
            />
          </div>
        </grid-item>
      </grid-layout>
    </div>

    <!-- 空状态 -->
    <div v-if="widgets.length === 0" class="empty-dashboard">
      <el-empty description="暂无组件">
        <el-button type="primary" @click="addWidget">添加第一个组件</el-button>
      </el-empty>
    </div>

    <!-- 添加组件对话框 -->
    <el-dialog v-model="showAddWidget" title="添加组件" width="600px">
      <div class="widget-gallery">
        <div
          v-for="widgetType in widgetTypes"
          :key="widgetType.type"
          class="widget-type-card"
          @click="selectWidgetType(widgetType)"
        >
          <div class="widget-icon">
            <el-icon><component :is="widgetType.icon" /></el-icon>
          </div>
          <div class="widget-info">
            <h4>{{ widgetType.title }}</h4>
            <p>{{ widgetType.description }}</p>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- 组件编辑对话框 -->
    <el-dialog v-model="showEditWidget" title="编辑组件" width="800px">
      <div v-if="editingWidget" class="widget-editor">
        <el-form :model="editingWidget" label-width="120px">
          <el-form-item label="组件标题">
            <el-input v-model="editingWidget.title" />
          </el-form-item>

          <el-form-item label="组件类型">
            <el-select v-model="editingWidget.type" disabled>
              <el-option
                v-for="type in widgetTypes"
                :key="type.type"
                :label="type.title"
                :value="type.type"
              />
            </el-select>
          </el-form-item>

          <!-- 动态配置表单 -->
          <component
            :is="getWidgetConfigComponent(editingWidget.type)"
            v-model="editingWidget.config"
            :widget="editingWidget"
          />
        </el-form>
      </div>

      <template #footer>
        <el-button @click="showEditWidget = false">取消</el-button>
        <el-button type="primary" @click="saveWidgetEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- 设置对话框 -->
    <el-dialog v-model="showSettings" title="仪表板设置" width="600px">
      <el-form :model="dashboardSettings" label-width="120px">
        <el-form-item label="仪表板名称">
          <el-input v-model="dashboardSettings.name" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="dashboardSettings.description"
            type="textarea"
            :rows="3"
          />
        </el-form-item>

        <el-form-item label="自动刷新">
          <el-switch v-model="dashboardSettings.autoRefresh" />
          <span v-if="dashboardSettings.autoRefresh" style="margin-left: 10px">
            间隔:
            <el-select v-model="dashboardSettings.refreshInterval" size="small">
              <el-option label="1分钟" :value="1" />
              <el-option label="5分钟" :value="5" />
              <el-option label="10分钟" :value="10" />
              <el-option label="30分钟" :value="30" />
              <el-option label="1小时" :value="60" />
            </el-select>
          </span>
        </el-form-item>

        <el-form-item label="网格大小">
          <el-slider
            v-model="dashboardSettings.gridSize"
            :min="40"
            :max="120"
            :step="10"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showSettings = false">取消</el-button>
        <el-button type="primary" @click="saveDashboardSettings"
          >保存</el-button
        >
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import {
  ref,
  reactive,
  computed,
  onMounted,
  onUnmounted,
  watch,
  defineAsyncComponent,
} from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { useVisualizationStore } from "@/stores/visualization";
import type { DashboardWidget } from "@/types/visualization";
import {
  Edit,
  Plus,
  Setting,
  Download,
  Refresh,
  Delete,
  DocumentCopy,
} from "@element-plus/icons-vue";

// 导入网格布局组件
import { GridLayout, GridItem } from "vue3-grid-layout-next";
import "vue3-grid-layout-next/dist/style.css";

// 异步加载组件
const ChartWidget = defineAsyncComponent(
  () => import("./widgets/ChartWidget.vue")
);
const MetricWidget = defineAsyncComponent(
  () => import("./widgets/MetricWidget.vue")
);
const TableWidget = defineAsyncComponent(
  () => import("./widgets/TableWidget.vue")
);
const MapWidget = defineAsyncComponent(() => import("./widgets/MapWidget.vue"));
const TimelineWidget = defineAsyncComponent(
  () => import("./widgets/TimelineWidget.vue")
);

// 配置组件
const ChartConfig = defineAsyncComponent(
  () => import("./widgets/configs/ChartConfig.vue")
);
const MetricConfig = defineAsyncComponent(
  () => import("./widgets/configs/MetricConfig.vue")
);
const TableConfig = defineAsyncComponent(
  () => import("./widgets/configs/TableConfig.vue")
);
const MapConfig = defineAsyncComponent(
  () => import("./widgets/configs/MapConfig.vue")
);
const TimelineConfig = defineAsyncComponent(
  () => import("./widgets/configs/TimelineConfig.vue")
);

const visualizationStore = useVisualizationStore();

// 响应式数据
const editMode = ref(false);
const showAddWidget = ref(false);
const showEditWidget = ref(false);
const showSettings = ref(false);
const editingWidget = ref<DashboardWidget | null>(null);
const layout = ref<any[]>([]);
const refreshTimer = ref<number | null>(null);

const dashboardSettings = reactive({
  name: "",
  description: "",
  autoRefresh: false,
  refreshInterval: 5,
  gridSize: 60,
});

// 组件类型定义
const widgetTypes = [
  {
    type: "chart",
    title: "图表组件",
    description: "显示各种类型的图表",
    icon: "TrendCharts",
  },
  {
    type: "metric",
    title: "指标组件",
    description: "显示关键性能指标",
    icon: "DataBoard",
  },
  {
    type: "table",
    title: "表格组件",
    description: "显示结构化数据",
    icon: "Operation",
  },
  {
    type: "timeline",
    title: "时间轴组件",
    description: "显示时间序列事件",
    icon: "Timer",
  },
];

// 计算属性
const widgets = computed(
  () => visualizationStore.activeDashboard?.widgets || []
);
const themes = computed(() => visualizationStore.themes);
const activeTheme = computed(() => visualizationStore.activeTheme);
const selectedTheme = ref(visualizationStore.currentTheme);

const dashboardStyle = computed(() => ({
  "--grid-size": `${dashboardSettings.gridSize}px`,
  "--theme-primary": activeTheme.value.colors.primary[0],
  "--theme-background": activeTheme.value.colors.background,
  "--theme-text": activeTheme.value.colors.text,
  "--theme-border": activeTheme.value.colors.border,
}));

// 方法
const toggleEditMode = () => {
  editMode.value = !editMode.value;
  if (!editMode.value) {
    ElMessage.success("布局已保存");
  }
};

const addWidget = () => {
  showAddWidget.value = true;
};

const selectWidgetType = (widgetType: any) => {
  const newWidget = {
    type: widgetType.type,
    title: widgetType.title,
    position: { x: 0, y: 0, w: 4, h: 3 },
    config: getDefaultConfig(widgetType.type),
  };

  if (visualizationStore.activeDashboard) {
    visualizationStore.addWidget(
      visualizationStore.activeDashboard.id,
      newWidget
    );
    updateLayout();
  }

  showAddWidget.value = false;
  ElMessage.success("组件添加成功");
};

const editWidget = (widgetOrItem: DashboardWidget | any) => {
  // 处理来自SimpleGridLayout的item参数
  let widget: DashboardWidget;
  if (widgetOrItem.id && typeof widgetOrItem.component === "string") {
    // 这是来自SimpleGridLayout的item，需要找到对应的widget
    widget = widgets.value.find((w) => w.id === widgetOrItem.id)!;
  } else {
    // 这是直接传入的widget
    widget = widgetOrItem as DashboardWidget;
  }

  if (widget) {
    editingWidget.value = { ...widget };
    showEditWidget.value = true;
  }
};

const duplicateWidget = (widget: DashboardWidget) => {
  if (visualizationStore.activeDashboard) {
    const duplicatedWidget = {
      ...widget,
      title: `${widget.title} (副本)`,
      position: {
        ...widget.position,
        x: widget.position.x + 1,
        y: widget.position.y + 1,
      },
    };
    delete (duplicatedWidget as any).id;

    visualizationStore.addWidget(
      visualizationStore.activeDashboard.id,
      duplicatedWidget
    );
    updateLayout();
    ElMessage.success("组件复制成功");
  }
};

const removeWidget = async (widgetId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个组件吗？", "确认删除", {
      type: "warning",
    });

    if (visualizationStore.activeDashboard) {
      visualizationStore.removeWidget(
        visualizationStore.activeDashboard.id,
        widgetId
      );
      updateLayout();
      ElMessage.success("组件删除成功");
    }
  } catch (error) {
    // 用户取消删除
  }
};

const saveWidgetEdit = () => {
  if (editingWidget.value && visualizationStore.activeDashboard) {
    visualizationStore.updateWidget(
      visualizationStore.activeDashboard.id,
      editingWidget.value.id,
      editingWidget.value
    );
    showEditWidget.value = false;
    editingWidget.value = null;
    ElMessage.success("组件更新成功");
  }
};

const handleLayoutUpdated = (newLayout: any[]) => {
  if (!visualizationStore.activeDashboard) return;

  // 批量更新所有组件位置
  newLayout.forEach((item) => {
    const widget = widgets.value.find((w) => w.id === item.i);
    if (widget) {
      visualizationStore.updateWidget(
        visualizationStore.activeDashboard!.id,
        widget.id,
        {
          position: {
            x: item.x,
            y: item.y,
            w: item.w,
            h: item.h,
          },
        }
      );
    }
  });

  // 立即保存到localStorage
  visualizationStore.saveToStorage();
};

const handleWidgetUpdate = (widgetId: string, data: any) => {
  if (visualizationStore.activeDashboard) {
    visualizationStore.updateWidget(
      visualizationStore.activeDashboard.id,
      widgetId,
      { data }
    );
  }
};

const handleThemeChange = (themeId: string) => {
  visualizationStore.setTheme(themeId);
  ElMessage.success("主题切换成功");
};

const refreshDashboard = () => {
  widgets.value.forEach((widget) => {
    // 触发组件数据刷新
    handleWidgetUpdate(widget.id, null);
  });
  ElMessage.success("仪表板刷新成功");
};

const exportDashboard = () => {
  ElMessage.info("导出功能开发中");
};

const saveDashboardSettings = () => {
  if (visualizationStore.activeDashboard) {
    visualizationStore.updateDashboard(visualizationStore.activeDashboard.id, {
      name: dashboardSettings.name,
      description: dashboardSettings.description,
    });

    // 处理自动刷新
    if (dashboardSettings.autoRefresh) {
      startAutoRefresh();
    } else {
      stopAutoRefresh();
    }

    showSettings.value = false;
    ElMessage.success("设置保存成功");
  }
};

const updateLayout = () => {
  layout.value = widgets.value.map((widget) => ({
    i: widget.id,
    x: widget.position.x,
    y: widget.position.y,
    w: widget.position.w,
    h: widget.position.h,
  }));
};

const startAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
  }

  refreshTimer.value = setInterval(() => {
    refreshDashboard();
  }, dashboardSettings.refreshInterval * 60 * 1000);
};

const stopAutoRefresh = () => {
  if (refreshTimer.value) {
    clearInterval(refreshTimer.value);
    refreshTimer.value = null;
  }
};

// 组件映射
const getWidgetComponent = (type: string) => {
  const components: Record<string, any> = {
    chart: ChartWidget,
    metric: MetricWidget,
    table: TableWidget,
    map: MapWidget,
    timeline: TimelineWidget,
  };
  return components[type] || "div";
};

const getWidgetConfigComponent = (type: string) => {
  const components: Record<string, any> = {
    chart: ChartConfig,
    metric: MetricConfig,
    table: TableConfig,
    map: MapConfig,
    timeline: TimelineConfig,
  };
  return components[type] || "div";
};

const getDefaultConfig = (type: string) => {
  const configs: Record<string, any> = {
    chart: {
      chartType: "line",
      dataSource: "patent",
      xField: "date",
      yField: "count",
    },
    metric: {
      value: 0,
      unit: "",
      trend: "none",
      trendValue: 0,
    },
    table: {
      dataSource: "patent",
      columns: ["title", "type", "status"],
      pageSize: 10,
    },
    map: {
      mapType: "china",
      dataField: "patentCount",
      colorScheme: "blue",
    },
    timeline: {
      dataSource: "timeline",
      eventTypes: ["application", "approval"],
      granularity: "month",
    },
  };
  return configs[type] || {};
};

// 生命周期
onMounted(() => {
  if (visualizationStore.activeDashboard) {
    dashboardSettings.name = visualizationStore.activeDashboard.name;
    dashboardSettings.description =
      visualizationStore.activeDashboard.description || "";
    updateLayout();
  }

  // 确保数据已加载
  if (
    visualizationStore.activeDashboard &&
    visualizationStore.activeDashboard.widgets.length > 0
  ) {
    // 延迟更新布局，确保组件已渲染
    setTimeout(() => {
      updateLayout();
    }, 100);
  }
});

// 监听仪表板变化
watch(
  () => visualizationStore.activeDashboard,
  (newDashboard) => {
    if (newDashboard) {
      dashboardSettings.name = newDashboard.name;
      dashboardSettings.description = newDashboard.description || "";
      // 延迟更新布局，确保组件已渲染
      setTimeout(() => {
        updateLayout();
      }, 100);
    }
  },
  { immediate: true }
);

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.interactive-dashboard {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: var(--theme-background, #f5f5f5);
  color: var(--theme-text, #333);
}

.dashboard-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--theme-background, white);
  border-bottom: 1px solid var(--theme-border, #ddd);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dashboard-grid {
  flex: 1;
  padding: 16px;
  overflow: auto;
}

.dashboard-widget {
  background: var(--theme-background, white);
  border: 1px solid var(--theme-border, #ddd);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.dashboard-widget:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
}

.dashboard-widget.edit-mode {
  border: 2px dashed var(--theme-primary, #409eff);
}

.widget-toolbar {
  position: absolute;
  top: 8px;
  right: 8px;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dashboard-widget:hover .widget-toolbar {
  opacity: 1;
}

.widget-content {
  height: 100%;
  padding: 16px;
  overflow: hidden;
}

.empty-dashboard {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.widget-gallery {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
  padding: 16px 0;
}

.widget-type-card {
  display: flex;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--theme-border, #ddd);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.widget-type-card:hover {
  border-color: var(--theme-primary, #409eff);
  background: var(--theme-background, #f8f9fa);
}

.widget-icon {
  margin-right: 12px;
  font-size: 24px;
  color: var(--theme-primary, #409eff);
}

.widget-info h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
  font-weight: 600;
}

.widget-info p {
  margin: 0;
  font-size: 14px;
  color: #666;
}

.widget-editor {
  max-height: 60vh;
  overflow-y: auto;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .dashboard-toolbar {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .toolbar-left,
  .toolbar-right {
    width: 100%;
    justify-content: center;
  }

  .dashboard-grid {
    padding: 8px;
  }

  .widget-gallery {
    grid-template-columns: 1fr;
  }
}
</style>
