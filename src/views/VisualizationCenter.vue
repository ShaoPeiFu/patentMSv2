<template>
  <div class="visualization-center">
    <!-- 页面头部 -->
    <div class="page-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="page-title">可视化中心</h1>
          <p class="page-description">
            交互式数据可视化平台，提供多维度专利数据分析视图
          </p>
        </div>

        <div class="header-actions">
          <el-button type="primary" @click="createDashboard">
            <el-icon><Plus /></el-icon>
            创建仪表板
          </el-button>

          <el-dropdown @command="handleQuickAction">
            <el-button>
              快速操作
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="import">导入数据</el-dropdown-item>
                <el-dropdown-item command="export">导出报告</el-dropdown-item>
                <el-dropdown-item command="settings">系统设置</el-dropdown-item>
                <el-dropdown-item command="help">使用帮助</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 导航标签 -->
    <div class="nav-tabs">
      <el-tabs v-model="activeTab" @tab-change="handleTabChange">
        <el-tab-pane label="仪表板" name="dashboard">
          <template #label>
            <span class="tab-label">
              <el-icon><DataBoard /></el-icon>
              仪表板
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="时间轴" name="timeline">
          <template #label>
            <span class="tab-label">
              <el-icon><Timer /></el-icon>
              时间轴
            </span>
          </template>
        </el-tab-pane>

        <el-tab-pane label="技术族谱" name="techtree">
          <template #label>
            <span class="tab-label">
              <el-icon><Share /></el-icon>
              技术族谱
            </span>
          </template>
        </el-tab-pane>
      </el-tabs>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 仪表板视图 -->
      <div v-if="activeTab === 'dashboard'" class="dashboard-view">
        <div v-if="dashboards.length === 0" class="empty-state">
          <el-empty description="暂无仪表板">
            <template #image>
              <el-icon class="empty-icon"><DataBoard /></el-icon>
            </template>
            <div class="empty-actions">
              <el-button type="primary" @click="createDashboard">
                创建第一个仪表板
              </el-button>
              <el-button @click="loadSampleDashboard">
                加载示例仪表板
              </el-button>
            </div>
          </el-empty>
        </div>

        <div v-else class="dashboard-content">
          <!-- 仪表板列表 -->
          <div class="dashboard-sidebar">
            <div class="sidebar-header">
              <h3>我的仪表板</h3>
              <el-button size="small" @click="createDashboard">
                <el-icon><Plus /></el-icon>
              </el-button>
            </div>

            <div class="dashboard-list">
              <div
                v-for="dashboard in dashboards"
                :key="dashboard.id"
                class="dashboard-item"
                :class="{ active: activeDashboard?.id === dashboard.id }"
                @click="selectDashboard(dashboard)"
              >
                <div class="dashboard-info">
                  <h4>{{ dashboard.name }}</h4>
                  <p>{{ dashboard.description || "暂无描述" }}</p>
                  <div class="dashboard-meta">
                    <span>{{ dashboard.widgets.length }} 个组件</span>
                    <span>{{ formatDate(dashboard.updatedAt) }}</span>
                  </div>
                </div>

                <div class="dashboard-actions">
                  <el-button
                    size="small"
                    @click.stop="editDashboard(dashboard)"
                  >
                    <el-icon><Edit /></el-icon>
                  </el-button>
                  <el-button
                    size="small"
                    type="danger"
                    @click.stop="deleteDashboard(dashboard.id)"
                  >
                    <el-icon><Delete /></el-icon>
                  </el-button>
                </div>
              </div>
            </div>
          </div>

          <!-- 仪表板内容 -->
          <div class="dashboard-main">
            <InteractiveDashboard v-if="activeDashboard" />
            <div v-else class="select-dashboard">
              <el-icon class="select-icon"><DataBoard /></el-icon>
              <p>请选择一个仪表板开始使用</p>
            </div>
          </div>
        </div>
      </div>

      <!-- 时间轴视图 -->
      <div v-if="activeTab === 'timeline'" class="timeline-view">
        <TimelineView />
      </div>

      <!-- 技术族谱视图 -->
      <div v-if="activeTab === 'techtree'" class="techtree-view">
        <TechTreeView :theme="activeTheme" />
      </div>
    </div>

    <!-- 创建仪表板对话框 -->
    <el-dialog v-model="showCreateDialog" title="创建仪表板" width="500px">
      <el-form
        ref="createFormRef"
        :model="createForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="仪表板名称" prop="name">
          <el-input v-model="createForm.name" placeholder="请输入仪表板名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="createForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入仪表板描述"
          />
        </el-form-item>

        <el-form-item label="模板">
          <el-select v-model="createForm.template" placeholder="选择仪表板模板">
            <el-option label="空白仪表板" value="blank" />
            <el-option label="专利概览" value="patent-overview" />
            <el-option label="技术分析" value="tech-analysis" />
            <el-option label="竞争分析" value="competition" />
            <el-option label="投资分析" value="investment" />
          </el-select>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmCreateDashboard"
          >创建</el-button
        >
      </template>
    </el-dialog>

    <!-- 编辑仪表板对话框 -->
    <el-dialog v-model="showEditDialog" title="编辑仪表板" width="500px">
      <el-form
        ref="editFormRef"
        :model="editForm"
        :rules="createRules"
        label-width="100px"
      >
        <el-form-item label="仪表板名称" prop="name">
          <el-input v-model="editForm.name" placeholder="请输入仪表板名称" />
        </el-form-item>

        <el-form-item label="描述">
          <el-input
            v-model="editForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入仪表板描述"
          />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">取消</el-button>
        <el-button type="primary" @click="confirmEditDashboard">保存</el-button>
      </template>
    </el-dialog>

    <!-- 浮动操作按钮 -->
    <div class="floating-actions">
      <el-tooltip content="刷新数据" placement="left">
        <el-button
          type="primary"
          size="large"
          circle
          @click="refreshData"
          :loading="loading"
        >
          <el-icon><Refresh /></el-icon>
        </el-button>
      </el-tooltip>
    </div>

    <!-- 主题切换器 -->
    <div class="theme-switcher">
      <el-tooltip content="切换主题" placement="left">
        <el-button
          circle
          @click="toggleTheme"
          :style="{
            background: activeTheme.colors.primary[0],
            borderColor: activeTheme.colors.primary[0],
            color: activeTheme.colors.background,
          }"
        >
          <el-icon><Sunny /></el-icon>
        </el-button>
      </el-tooltip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox, type FormInstance } from "element-plus";
import { useVisualizationStore } from "@/stores/visualization";
import type { DashboardLayout } from "@/types/visualization";
import {
  Plus,
  ArrowDown,
  DataBoard,
  Timer,
  Share,
  Edit,
  Delete,
  Refresh,
  Sunny,
} from "@element-plus/icons-vue";

// 组件导入
import InteractiveDashboard from "@/components/InteractiveDashboard.vue";
import TimelineView from "@/components/TimelineView.vue";
import TechTreeView from "@/components/TechTreeView.vue";

const visualizationStore = useVisualizationStore();

// 响应式数据
const activeTab = ref("dashboard");
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const editingDashboard = ref<DashboardLayout | null>(null);
const loading = ref(false);
const createFormRef = ref<FormInstance>();
const editFormRef = ref<FormInstance>();

const createForm = reactive({
  name: "",
  description: "",
  template: "blank",
});

const editForm = reactive({
  name: "",
  description: "",
});

const createRules = {
  name: [
    { required: true, message: "请输入仪表板名称", trigger: "blur" },
    { min: 2, max: 50, message: "长度在 2 到 50 个字符", trigger: "blur" },
  ],
};

// 计算属性
const dashboards = computed(() => visualizationStore.dashboards);
const activeDashboard = computed(() => visualizationStore.activeDashboard);
const activeTheme = computed(() => visualizationStore.activeTheme);

// 方法
const handleTabChange = (tabName: string) => {
  activeTab.value = tabName;

  // 清除仪表板选择状态
  if (tabName !== "dashboard") {
    visualizationStore.setCurrentDashboard(null);
  }
};

// 确保数据在组件挂载时正确加载
onMounted(() => {
  // 如果没有仪表板，创建默认仪表板
  if (dashboards.value.length === 0) {
    const defaultDashboard = visualizationStore.createDashboard(
      "默认仪表板",
      "系统默认仪表板"
    );
    visualizationStore.setCurrentDashboard(defaultDashboard);
  }
  // 如果没有选中的仪表板，选择第一个
  else if (!activeDashboard.value && dashboards.value.length > 0) {
    visualizationStore.setCurrentDashboard(dashboards.value[0]);
  }
});

const handleQuickAction = (command: string) => {
  switch (command) {
    case "import":
      ElMessage.info("数据导入功能开发中");
      break;
    case "export":
      ElMessage.info("报告导出功能开发中");
      break;
    case "settings":
      ElMessage.info("系统设置功能开发中");
      break;
    case "help":
      ElMessage.info("使用帮助功能开发中");
      break;
  }
};

const createDashboard = () => {
  createForm.name = "";
  createForm.description = "";
  createForm.template = "blank";
  showCreateDialog.value = true;
};

const confirmCreateDashboard = async () => {
  if (!createFormRef.value) return;

  try {
    await createFormRef.value.validate();

    const dashboard = visualizationStore.createDashboard(
      createForm.name,
      createForm.description
    );

    // 根据模板添加默认组件
    addTemplateWidgets(dashboard, createForm.template);

    // 选择新创建的仪表板
    visualizationStore.setCurrentDashboard(dashboard);

    showCreateDialog.value = false;
    ElMessage.success("仪表板创建成功");
  } catch (error) {
    console.error("创建仪表板失败:", error);
  }
};

const addTemplateWidgets = (dashboard: DashboardLayout, template: string) => {
  const templates = {
    "patent-overview": [
      {
        type: "metric",
        title: "专利总数",
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: { value: 1234, unit: "件", trend: "up", trendValue: 12 },
      },
      {
        type: "metric",
        title: "授权率",
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: { value: 78, unit: "%", trend: "stable", trendValue: 2 },
      },
      {
        type: "chart",
        title: "专利申请趋势",
        position: { x: 0, y: 2, w: 6, h: 4 },
        config: {
          chartType: "line",
          dataSource: "patent",
          xField: "date",
          yField: "count",
        },
      },
      {
        type: "chart",
        title: "技术领域分布",
        position: { x: 6, y: 0, w: 6, h: 6 },
        config: {
          chartType: "pie",
          dataSource: "patent",
          xField: "category",
          yField: "count",
        },
      },
    ],
    "tech-analysis": [
      {
        type: "chart",
        title: "技术演进趋势",
        position: { x: 0, y: 0, w: 8, h: 4 },
        config: {
          chartType: "line",
          dataSource: "tech",
          xField: "year",
          yField: "patents",
        },
      },
      {
        type: "metric",
        title: "新兴技术",
        position: { x: 8, y: 0, w: 4, h: 2 },
        config: { value: 23, unit: "项", trend: "up", trendValue: 15 },
      },
      {
        type: "table",
        title: "技术热点",
        position: { x: 0, y: 4, w: 12, h: 4 },
        config: { dataSource: "tech", columns: ["name", "patents", "growth"] },
      },
    ],
    competition: [
      {
        type: "chart",
        title: "竞争对手分析",
        position: { x: 0, y: 0, w: 6, h: 4 },
        config: { chartType: "radar", dataSource: "competitor" },
      },
      {
        type: "chart",
        title: "市场份额",
        position: { x: 6, y: 0, w: 6, h: 4 },
        config: { chartType: "pie", dataSource: "market" },
      },
      {
        type: "table",
        title: "竞争态势",
        position: { x: 0, y: 4, w: 12, h: 4 },
        config: {
          dataSource: "competition",
          columns: ["company", "patents", "market_share"],
        },
      },
    ],
    investment: [
      {
        type: "metric",
        title: "总投资",
        position: { x: 0, y: 0, w: 3, h: 2 },
        config: { value: 1250, unit: "万元", trend: "up", trendValue: 8 },
      },
      {
        type: "metric",
        title: "ROI",
        position: { x: 3, y: 0, w: 3, h: 2 },
        config: { value: 23.5, unit: "%", trend: "up", trendValue: 5 },
      },
      {
        type: "chart",
        title: "投资回报分析",
        position: { x: 0, y: 2, w: 8, h: 4 },
        config: { chartType: "bar", dataSource: "investment" },
      },
      {
        type: "metric",
        title: "预期收益",
        position: { x: 8, y: 2, w: 4, h: 4 },
        config: { value: 3200, unit: "万元", trend: "up", trendValue: 12 },
      },
    ],
  };

  const widgets = templates[template as keyof typeof templates] || [];

  widgets.forEach((widget) => {
    visualizationStore.addWidget(dashboard.id, widget as any);
  });
};

const selectDashboard = (dashboard: DashboardLayout) => {
  visualizationStore.setCurrentDashboard(dashboard);
};

const editDashboard = (dashboard: DashboardLayout) => {
  editingDashboard.value = dashboard;
  editForm.name = dashboard.name;
  editForm.description = dashboard.description || "";
  showEditDialog.value = true;
};

const confirmEditDashboard = async () => {
  if (!editFormRef.value || !editingDashboard.value) return;

  try {
    await editFormRef.value.validate();

    visualizationStore.updateDashboard(editingDashboard.value.id, {
      name: editForm.name,
      description: editForm.description,
    });

    showEditDialog.value = false;
    editingDashboard.value = null;
    ElMessage.success("仪表板更新成功");
  } catch (error) {
    console.error("更新仪表板失败:", error);
  }
};

const deleteDashboard = async (dashboardId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除这个仪表板吗？", "确认删除", {
      type: "warning",
    });

    visualizationStore.deleteDashboard(dashboardId);
    ElMessage.success("仪表板删除成功");
  } catch (error) {
    // 用户取消删除
  }
};

const loadSampleDashboard = () => {
  const sampleDashboard = visualizationStore.createDashboard(
    "示例专利仪表板",
    "展示专利数据分析的综合仪表板"
  );

  addTemplateWidgets(sampleDashboard, "patent-overview");
  visualizationStore.setCurrentDashboard(sampleDashboard);

  ElMessage.success("示例仪表板已加载");
};

const refreshData = async () => {
  loading.value = true;

  try {
    // 模拟数据刷新
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 生成新的演示数据
    visualizationStore.generateTimelineData();
    // visualizationStore.generateGeographicData();
    visualizationStore.generateTechnologyTree();

    ElMessage.success("数据刷新成功");
  } catch (error) {
    ElMessage.error("数据刷新失败");
  } finally {
    loading.value = false;
  }
};

const toggleTheme = () => {
  const currentTheme = visualizationStore.currentTheme;
  const newTheme = currentTheme === "default" ? "dark" : "default";
  visualizationStore.setTheme(newTheme);
  ElMessage.success(`已切换到${newTheme === "dark" ? "深色" : "浅色"}主题`);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

// 生命周期
onMounted(() => {
  // 如果没有仪表板，创建默认的
  if (dashboards.value.length === 0) {
    const defaultDashboard = visualizationStore.createDashboard(
      "我的第一个仪表板",
      "专利数据可视化概览"
    );
    addTemplateWidgets(defaultDashboard, "patent-overview");
  }

  // 选择第一个仪表板
  if (dashboards.value.length > 0 && !activeDashboard.value) {
    visualizationStore.setCurrentDashboard(dashboards.value[0]);
  }
});
</script>

<style scoped>
.visualization-center {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow-y: auto;
}

.page-header {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 20px 24px;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1400px;
  margin: 0 auto;
}

.page-title {
  margin: 0 0 8px 0;
  font-size: 28px;
  font-weight: 700;
  color: #1a202c;
  background: linear-gradient(135deg, #667eea, #764ba2);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.page-description {
  margin: 0;
  color: #4a5568;
  font-size: 16px;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.nav-tabs {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding: 0 24px;
}

.tab-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.main-content {
  flex: 1;
  overflow-y: auto;
  position: relative;
}

.dashboard-view {
  min-height: 100%;
  display: flex;
  flex-direction: column;
  overflow-y: auto;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
}

.empty-icon {
  font-size: 64px;
  color: #cbd5e0;
}

.empty-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.dashboard-content {
  flex: 1;
  display: flex;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.dashboard-sidebar {
  width: 320px;
  background: rgba(255, 255, 255, 0.9);
  border-right: 1px solid rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
}

.sidebar-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}

.sidebar-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2d3748;
}

.dashboard-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.dashboard-item {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 16px;
  margin-bottom: 12px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
  animation: fadeInUp 0.3s ease;
}

.dashboard-item:hover {
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.dashboard-item.active {
  border-color: #667eea;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
}

.dashboard-info {
  flex: 1;
  min-width: 0;
}

.dashboard-info h4 {
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.dashboard-info p {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #718096;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.dashboard-meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 12px;
  color: #a0aec0;
}

.dashboard-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.dashboard-item:hover .dashboard-actions {
  opacity: 1;
}

.dashboard-main {
  flex: 1;
  position: relative;
}

.select-dashboard {
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  color: #a0aec0;
}

.select-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.timeline-view,
.techtree-view {
  height: 100%;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  overflow-y: auto;
}

.floating-actions {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 1000;
}

.theme-switcher {
  position: fixed;
  bottom: 24px;
  right: 80px;
  z-index: 1000;
}

/* 响应式设计 */
@media (max-width: 1024px) {
  .header-content {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }

  .dashboard-content {
    flex-direction: column;
    overflow-y: auto;
  }

  .dashboard-sidebar {
    width: 100%;
    height: 200px;
    border-right: none;
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    overflow-y: auto;
  }

  .dashboard-list {
    display: flex;
    overflow-x: auto;
    overflow-y: hidden;
    padding: 16px;
    gap: 16px;
  }

  .dashboard-item {
    min-width: 280px;
    margin-bottom: 0;
  }
}

@media (max-width: 768px) {
  .page-header {
    padding: 16px;
  }

  .nav-tabs {
    padding: 0 16px;
  }

  .page-title {
    font-size: 24px;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .floating-actions {
    bottom: 16px;
    right: 16px;
  }

  .theme-switcher {
    bottom: 16px;
    right: 72px;
  }

  .dashboard-sidebar {
    height: 150px;
    overflow-y: auto;
  }

  .dashboard-item {
    min-width: 240px;
  }
}

/* 深色主题适配 */
.visualization-center[data-theme="dark"] {
  background: linear-gradient(135deg, #1a202c 0%, #2d3748 100%);
}

.visualization-center[data-theme="dark"] .page-header {
  background: rgba(26, 32, 44, 0.95);
  color: #f7fafc;
}

.visualization-center[data-theme="dark"] .dashboard-content {
  background: rgba(26, 32, 44, 0.95);
}

.visualization-center[data-theme="dark"] .dashboard-sidebar {
  background: rgba(45, 55, 72, 0.9);
  border-right-color: rgba(255, 255, 255, 0.1);
}

.visualization-center[data-theme="dark"] .dashboard-item {
  background: rgba(74, 85, 104, 0.8);
  color: #f7fafc;
}

/* 动画效果 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.main-content > div {
  animation: fadeInUp 0.5s ease;
}

/* 滚动条样式 */
.dashboard-list::-webkit-scrollbar {
  width: 6px;
}

.dashboard-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.dashboard-list::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
}

.dashboard-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
}
</style>
