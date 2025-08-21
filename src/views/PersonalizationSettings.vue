<template>
  <div class="personalization-container">
    <el-card class="settings-card">
      <template #header>
        <div class="card-header">
          <h2>🎨 个性化设置</h2>
          <p class="subtitle">自定义仪表板、个人工作台、快捷操作栏与主题定制</p>
        </div>
      </template>

      <!-- 设置导航 -->
      <el-tabs v-model="activeTab" class="settings-tabs">
        <el-tab-pane label="主题定制" name="theme">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="theme-card">
                  <template #header>
                    <div class="section-header">
                      <h3>主题设置</h3>
                      <el-button
                        type="primary"
                        size="small"
                        @click="showThemeCustomizer = true"
                      >
                        <el-icon><Brush /></el-icon>
                        自定义主题
                      </el-button>
                    </div>
                  </template>

                  <div class="theme-grid">
                    <div
                      v-for="theme in availableThemes"
                      :key="theme.id"
                      class="theme-item"
                      :class="{ active: currentTheme.id === theme.id }"
                      @click="setTheme(theme.id)"
                    >
                      <div
                        class="theme-preview"
                        :style="getThemePreviewStyle(theme)"
                      >
                        <div class="theme-header"></div>
                        <div class="theme-content">
                          <div class="theme-sidebar"></div>
                          <div class="theme-main"></div>
                        </div>
                      </div>
                      <div class="theme-info">
                        <h4>{{ theme.name }}</h4>
                        <p v-if="theme.isCustom">自定义主题</p>
                      </div>
                    </div>
                  </div>

                  <div class="theme-options">
                    <el-form :model="themeSettings" label-width="120px">
                      <el-form-item label="自动切换">
                        <el-switch
                          v-model="themeSettings.autoSwitch"
                          @change="updateThemeSettings"
                        />
                      </el-form-item>
                      <el-form-item label="首选主题">
                        <el-select
                          v-model="themeSettings.preferredTheme"
                          @change="updateThemeSettings"
                        >
                          <el-option label="浅色" value="light" />
                          <el-option label="深色" value="dark" />
                          <el-option label="自动" value="auto" />
                        </el-select>
                      </el-form-item>
                    </el-form>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="preview-card">
                  <template #header>
                    <h3>当前主题预览</h3>
                  </template>
                  <div
                    class="theme-preview-large"
                    :style="getThemePreviewStyle(currentTheme)"
                  >
                    <div class="preview-header">
                      <div class="preview-logo"></div>
                      <div class="preview-nav">
                        <div class="nav-item"></div>
                        <div class="nav-item"></div>
                        <div class="nav-item"></div>
                      </div>
                    </div>
                    <div class="preview-content">
                      <div class="preview-sidebar">
                        <div class="sidebar-item"></div>
                        <div class="sidebar-item"></div>
                        <div class="sidebar-item"></div>
                      </div>
                      <div class="preview-main">
                        <div class="main-card"></div>
                        <div class="main-card"></div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="仪表板定制" name="dashboard">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="16">
                <el-card class="dashboard-card">
                  <template #header>
                    <div class="section-header">
                      <h3>仪表板设置</h3>
                      <div class="header-actions">
                        <el-button
                          type="primary"
                          size="small"
                          @click="showWidgetSelector = true"
                        >
                          <el-icon><Plus /></el-icon>
                          添加组件
                        </el-button>
                        <el-button size="small" @click="resetDashboard">
                          <el-icon><Refresh /></el-icon>
                          重置
                        </el-button>
                      </div>
                    </div>
                  </template>

                  <div class="dashboard-layout">
                    <div class="layout-controls">
                      <el-radio-group
                        v-model="dashboardSettings.layout"
                        @change="updateDashboardSettings"
                      >
                        <el-radio-button label="grid">网格布局</el-radio-button>
                        <el-radio-button label="list">列表布局</el-radio-button>
                        <el-radio-button label="kanban"
                          >看板布局</el-radio-button
                        >
                      </el-radio-group>
                    </div>

                    <div class="widget-grid">
                      <div
                        v-for="widget in visibleWidgets"
                        :key="widget.id"
                        class="widget-item"
                        :class="`widget-${widget.type}`"
                        :style="getWidgetStyle(widget)"
                      >
                        <div class="widget-header">
                          <h4>{{ widget.name }}</h4>
                          <div class="widget-actions">
                            <el-button size="small" @click="editWidget(widget)">
                              <el-icon><Edit /></el-icon>
                            </el-button>
                            <el-button
                              size="small"
                              @click="removeWidget(widget.id)"
                            >
                              <el-icon><Delete /></el-icon>
                            </el-button>
                          </div>
                        </div>
                        <div class="widget-content">
                          <div class="widget-placeholder">
                            {{ getWidgetPlaceholder(widget) }}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </el-card>
              </el-col>

              <el-col :span="8">
                <el-card class="workspace-card">
                  <template #header>
                    <h3>工作台管理</h3>
                  </template>

                  <div class="workspace-list">
                    <div
                      v-for="workspace in dashboardSettings.workspaces"
                      :key="workspace.id"
                      class="workspace-item"
                      :class="{ active: currentWorkspace.id === workspace.id }"
                      @click="switchWorkspace(workspace.id)"
                    >
                      <div class="workspace-info">
                        <h4>{{ workspace.name }}</h4>
                        <p>{{ workspace.description }}</p>
                      </div>
                      <div class="workspace-actions">
                        <el-button
                          size="small"
                          @click="editWorkspace(workspace)"
                        >
                          <el-icon><Edit /></el-icon>
                        </el-button>
                        <el-button
                          v-if="!workspace.isDefault"
                          size="small"
                          type="danger"
                          @click="deleteWorkspace(workspace.id)"
                        >
                          <el-icon><Delete /></el-icon>
                        </el-button>
                      </div>
                    </div>

                    <el-button
                      type="dashed"
                      block
                      @click="showWorkspaceCreator = true"
                    >
                      <el-icon><Plus /></el-icon>
                      创建工作台
                    </el-button>
                  </div>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="快捷操作" name="quickActions">
          <div class="tab-content">
            <el-card class="quick-actions-card">
              <template #header>
                <div class="section-header">
                  <h3>快捷操作设置</h3>
                  <el-switch
                    v-model="quickActionSettings.enabled"
                    @change="updateQuickActionSettings"
                  />
                </div>
              </template>

              <el-row :gutter="20">
                <el-col :span="16">
                  <div class="quick-actions-config">
                    <el-form :model="quickActionSettings" label-width="120px">
                      <el-form-item label="显示位置">
                        <el-radio-group
                          v-model="quickActionSettings.position"
                          @change="updateQuickActionSettings"
                        >
                          <el-radio label="top">顶部</el-radio>
                          <el-radio label="bottom">底部</el-radio>
                          <el-radio label="left">左侧</el-radio>
                          <el-radio label="right">右侧</el-radio>
                        </el-radio-group>
                      </el-form-item>
                      <el-form-item label="最大显示数量">
                        <el-input-number
                          v-model="quickActionSettings.maxVisible"
                          :min="1"
                          :max="10"
                          @change="updateQuickActionSettings"
                        />
                      </el-form-item>
                    </el-form>

                    <div class="quick-actions-list">
                      <h4>可用操作</h4>
                      <el-table
                        :data="quickActionSettings.actions"
                        style="width: 100%"
                      >
                        <el-table-column prop="name" label="操作名称" />
                        <el-table-column
                          prop="category"
                          label="分类"
                          width="100"
                        />
                        <el-table-column label="启用状态" width="100">
                          <template #default="scope">
                            <el-switch
                              v-model="scope.row.isEnabled"
                              @change="toggleQuickAction(scope.row.id)"
                            />
                          </template>
                        </el-table-column>
                        <el-table-column label="排序" width="80">
                          <template #default="scope">
                            <el-input-number
                              v-model="scope.row.order"
                              :min="1"
                              size="small"
                              @change="updateQuickActionOrder"
                            />
                          </template>
                        </el-table-column>
                      </el-table>
                    </div>
                  </div>
                </el-col>

                <el-col :span="8">
                  <el-card class="preview-card">
                    <template #header>
                      <h3>快捷操作预览</h3>
                    </template>
                    <div
                      class="quick-actions-preview"
                      :class="`preview-${quickActionSettings.position}`"
                    >
                      <div
                        v-for="action in enabledQuickActions"
                        :key="action.id"
                        class="quick-action-item"
                      >
                        <el-icon><component :is="action.icon" /></el-icon>
                        <span>{{ action.name }}</span>
                      </div>
                    </div>
                  </el-card>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-tab-pane>

        <el-tab-pane label="界面设置" name="interface">
          <div class="tab-content">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-card class="interface-card">
                  <template #header>
                    <h3>界面设置</h3>
                  </template>

                  <el-form :model="interfaceSettings" label-width="120px">
                    <el-form-item label="侧边栏位置">
                      <el-radio-group
                        v-model="interfaceSettings.sidebarPosition"
                        @change="updateInterfaceSettings"
                      >
                        <el-radio label="left">左侧</el-radio>
                        <el-radio label="right">右侧</el-radio>
                      </el-radio-group>
                    </el-form-item>

                    <el-form-item label="头部样式">
                      <el-select
                        v-model="interfaceSettings.headerStyle"
                        @change="updateInterfaceSettings"
                      >
                        <el-option label="默认" value="default" />
                        <el-option label="简约" value="minimal" />
                        <el-option label="自定义" value="custom" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="动画效果">
                      <el-switch
                        v-model="interfaceSettings.animationEnabled"
                        @change="updateInterfaceSettings"
                      />
                    </el-form-item>

                    <el-form-item label="紧凑模式">
                      <el-switch
                        v-model="interfaceSettings.compactMode"
                        @change="updateInterfaceSettings"
                      />
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>

              <el-col :span="12">
                <el-card class="notification-card">
                  <template #header>
                    <h3>通知设置</h3>
                  </template>

                  <el-form :model="notificationSettings" label-width="120px">
                    <el-form-item label="通知位置">
                      <el-select
                        v-model="notificationSettings.position"
                        @change="updateNotificationSettings"
                      >
                        <el-option label="右上角" value="top-right" />
                        <el-option label="左上角" value="top-left" />
                        <el-option label="右下角" value="bottom-right" />
                        <el-option label="左下角" value="bottom-left" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="显示时长">
                      <el-input-number
                        v-model="notificationSettings.duration"
                        :min="1000"
                        :max="10000"
                        :step="500"
                        @change="updateNotificationSettings"
                      />
                      <span style="margin-left: 8px">毫秒</span>
                    </el-form-item>

                    <el-form-item label="声音提醒">
                      <el-switch
                        v-model="notificationSettings.soundEnabled"
                        @change="updateNotificationSettings"
                      />
                    </el-form-item>

                    <el-form-item label="桌面通知">
                      <el-switch
                        v-model="notificationSettings.desktopNotifications"
                        @change="updateNotificationSettings"
                      />
                    </el-form-item>
                  </el-form>
                </el-card>
              </el-col>
            </el-row>
          </div>
        </el-tab-pane>

        <el-tab-pane label="工作台设置" name="workspace">
          <div class="tab-content">
            <el-card class="workspace-settings-card">
              <template #header>
                <h3>工作台设置</h3>
              </template>

              <el-row :gutter="20">
                <el-col :span="12">
                  <el-form :model="workspaceSettings" label-width="120px">
                    <el-form-item label="默认视图">
                      <el-select
                        v-model="workspaceSettings.defaultView"
                        @change="updateWorkspaceSettings"
                      >
                        <el-option label="仪表板" value="dashboard" />
                        <el-option label="专利管理" value="patents" />
                        <el-option label="任务管理" value="tasks" />
                      </el-select>
                    </el-form-item>

                    <el-form-item label="最近项目数">
                      <el-input-number
                        v-model="workspaceSettings.recentItems"
                        :min="5"
                        :max="50"
                        @change="updateWorkspaceSettings"
                      />
                    </el-form-item>
                  </el-form>

                  <div class="favorite-items">
                    <h4>收藏项目</h4>
                    <el-tag
                      v-for="item in workspaceSettings.favoriteItems"
                      :key="item"
                      closable
                      @close="removeFavoriteItem(item)"
                      style="margin-right: 8px; margin-bottom: 8px"
                    >
                      {{ item }}
                    </el-tag>
                  </div>
                </el-col>

                <el-col :span="12">
                  <div class="workspace-preview">
                    <h4>工作台预览</h4>
                    <div class="preview-workspace">
                      <div class="preview-header">
                        <div class="preview-title">个人工作台</div>
                        <div class="preview-actions">
                          <el-icon><Setting /></el-icon>
                          <el-icon><Refresh /></el-icon>
                        </div>
                      </div>
                      <div class="preview-content">
                        <div class="preview-widget"></div>
                        <div class="preview-widget"></div>
                        <div class="preview-widget"></div>
                      </div>
                    </div>
                  </div>
                </el-col>
              </el-row>
            </el-card>
          </div>
        </el-tab-pane>
      </el-tabs>

      <!-- 操作按钮 -->
      <div class="settings-actions">
        <el-button @click="resetAllSettings">
          <el-icon><Refresh /></el-icon>
          重置所有设置
        </el-button>
        <el-button @click="exportSettings">
          <el-icon><Download /></el-icon>
          导出设置
        </el-button>
        <el-button type="primary" @click="saveAllSettings">
          <el-icon><Check /></el-icon>
          保存设置
        </el-button>
      </div>
    </el-card>

    <!-- 主题自定义对话框 -->
    <el-dialog v-model="showThemeCustomizer" title="自定义主题" width="60%">
      <el-form :model="customTheme" label-width="100px">
        <el-form-item label="主题名称">
          <el-input v-model="customTheme.name" />
        </el-form-item>
        <el-form-item label="主色调">
          <el-color-picker v-model="customTheme.primaryColor" />
        </el-form-item>
        <el-form-item label="辅助色">
          <el-color-picker v-model="customTheme.secondaryColor" />
        </el-form-item>
        <el-form-item label="背景色">
          <el-color-picker v-model="customTheme.backgroundColor" />
        </el-form-item>
        <el-form-item label="文字色">
          <el-color-picker v-model="customTheme.textColor" />
        </el-form-item>
        <el-form-item label="强调色">
          <el-color-picker v-model="customTheme.accentColor" />
        </el-form-item>
        <el-form-item label="深色模式">
          <el-switch v-model="customTheme.isDark" />
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showThemeCustomizer = false">取消</el-button>
          <el-button type="primary" @click="createCustomTheme"
            >创建主题</el-button
          >
        </span>
      </template>
    </el-dialog>

    <!-- 组件选择对话框 -->
    <el-dialog v-model="showWidgetSelector" title="添加组件" width="50%">
      <div class="widget-selector">
        <el-row :gutter="20">
          <el-col :span="8" v-for="widget in availableWidgets" :key="widget.id">
            <div class="widget-option" @click="addWidget(widget)">
              <div class="widget-icon">
                <el-icon><component :is="widget.icon" /></el-icon>
              </div>
              <h4>{{ widget.name }}</h4>
              <p>{{ widget.description }}</p>
            </div>
          </el-col>
        </el-row>
      </div>
    </el-dialog>

    <!-- 工作台创建对话框 -->
    <el-dialog v-model="showWorkspaceCreator" title="创建工作台" width="50%">
      <el-form :model="newWorkspace" label-width="100px">
        <el-form-item label="工作台名称">
          <el-input v-model="newWorkspace.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="newWorkspace.description" type="textarea" />
        </el-form-item>
        <el-form-item label="布局">
          <el-select v-model="newWorkspace.layout">
            <el-option label="网格布局" value="grid" />
            <el-option label="列表布局" value="list" />
            <el-option label="看板布局" value="kanban" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="showWorkspaceCreator = false">取消</el-button>
          <el-button type="primary" @click="createWorkspace"
            >创建工作台</el-button
          >
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { usePersonalizationStore } from "@/stores/personalization";
import {
  Brush,
  Plus,
  Refresh,
  Edit,
  Delete,
  Setting,
  Check,
  Download,
} from "@element-plus/icons-vue";

// 使用个性化设置状态
const personalizationStore = usePersonalizationStore();

// 响应式数据
const activeTab = ref("theme");
const showThemeCustomizer = ref(false);
const showWidgetSelector = ref(false);
const showWorkspaceCreator = ref(false);

// 主题设置
const themeSettings = reactive({
  autoSwitch: personalizationStore.settings.theme.autoSwitch,
  preferredTheme: personalizationStore.settings.theme.preferredTheme,
});

// 仪表板设置
const dashboardSettings = reactive({
  layout: personalizationStore.settings.dashboard.layout,
  workspaces: personalizationStore.settings.dashboard.workspaces,
});

// 快捷操作设置
const quickActionSettings = reactive({
  enabled: personalizationStore.settings.quickActions.enabled,
  position: personalizationStore.settings.quickActions.position,
  maxVisible: personalizationStore.settings.quickActions.maxVisible,
  actions: personalizationStore.settings.quickActions.actions,
});

// 界面设置
const interfaceSettings = reactive({
  sidebarPosition: personalizationStore.settings.interface.sidebarPosition,
  headerStyle: personalizationStore.settings.interface.headerStyle,
  animationEnabled: personalizationStore.settings.interface.animationEnabled,
  compactMode: personalizationStore.settings.interface.compactMode,
});

// 通知设置
const notificationSettings = reactive({
  position: personalizationStore.settings.notifications.position,
  duration: personalizationStore.settings.notifications.duration,
  soundEnabled: personalizationStore.settings.notifications.soundEnabled,
  desktopNotifications:
    personalizationStore.settings.notifications.desktopNotifications,
});

// 工作台设置
const workspaceSettings = reactive({
  defaultView: personalizationStore.settings.workspace.defaultView,
  recentItems: personalizationStore.settings.workspace.recentItems,
  favoriteItems: personalizationStore.settings.workspace.favoriteItems,
});

// 自定义主题
const customTheme = reactive({
  name: "",
  primaryColor: "#409eff",
  secondaryColor: "#67c23a",
  backgroundColor: "#ffffff",
  textColor: "#303133",
  accentColor: "#e6a23c",
  isDark: false,
});

// 新工作台
const newWorkspace = reactive({
  name: "",
  description: "",
  layout: "grid" as "grid" | "list" | "kanban",
});

// 可用组件
const availableWidgets = [
  {
    id: "patent-overview",
    name: "专利概览",
    description: "显示专利统计信息",
    icon: "DataAnalysis",
  },
  {
    id: "recent-patents",
    name: "最近专利",
    description: "显示最近的专利列表",
    icon: "Files",
  },
  {
    id: "patent-chart",
    name: "专利统计",
    description: "专利数据图表",
    icon: "DataAnalysis",
  },
  {
    id: "quick-actions",
    name: "快捷操作",
    description: "常用操作快捷入口",
    icon: "Setting",
  },
];

// 计算属性
const currentTheme = computed(() => personalizationStore.currentTheme);
const availableThemes = computed(() => personalizationStore.availableThemes);
const enabledQuickActions = computed(
  () => personalizationStore.enabledQuickActions
);
const currentWorkspace = computed(() => personalizationStore.currentWorkspace);
const visibleWidgets = computed(() => personalizationStore.visibleWidgets);

// 方法
const setTheme = (themeId: string) => {
  personalizationStore.setTheme(themeId);
  ElMessage.success("主题切换成功");
};

const getThemePreviewStyle = (theme: any) => {
  return {
    "--primary-color": theme.primaryColor,
    "--secondary-color": theme.secondaryColor,
    "--background-color": theme.backgroundColor,
    "--text-color": theme.textColor,
    "--accent-color": theme.accentColor,
  };
};

const updateThemeSettings = () => {
  personalizationStore.settings.theme.autoSwitch = themeSettings.autoSwitch;
  personalizationStore.settings.theme.preferredTheme =
    themeSettings.preferredTheme;
  personalizationStore.saveSettings();
};

const createCustomTheme = () => {
  personalizationStore.createCustomTheme(customTheme);
  showThemeCustomizer.value = false;
  ElMessage.success("自定义主题创建成功");
};

const updateDashboardSettings = () => {
  personalizationStore.settings.dashboard.layout = dashboardSettings.layout;
  personalizationStore.saveSettings();
};

const resetDashboard = async () => {
  try {
    await ElMessageBox.confirm("确定要重置仪表板吗？", "确认重置", {
      type: "warning",
    });
    personalizationStore.resetSettings();
    ElMessage.success("仪表板已重置");
  } catch (error) {
    // 用户取消操作
  }
};

const addWidget = (widget: any) => {
  personalizationStore.addWidget({
    name: widget.name,
    type: "custom",
    position: { x: 0, y: 0, w: 6, h: 2 },
    config: {},
    isVisible: true,
    order: visibleWidgets.value.length + 1,
  });
  showWidgetSelector.value = false;
  ElMessage.success("组件添加成功");
};

const removeWidget = (widgetId: string) => {
  personalizationStore.removeWidget(widgetId);
  ElMessage.success("组件移除成功");
};

const getWidgetStyle = (widget: any) => {
  return {
    gridColumn: `span ${widget.position.w}`,
    gridRow: `span ${widget.position.h}`,
  };
};

const getWidgetPlaceholder = (widget: any) => {
  const placeholders = {
    metric: "数据指标",
    chart: "图表组件",
    list: "列表组件",
    table: "表格组件",
    custom: "自定义组件",
  };
  return placeholders[widget.type as keyof typeof placeholders] || "组件内容";
};

const switchWorkspace = (workspaceId: string) => {
  personalizationStore.switchWorkspace(workspaceId);
  ElMessage.success("工作台切换成功");
};

const deleteWorkspace = async (workspaceId: string) => {
  try {
    await ElMessageBox.confirm("确定要删除工作台吗？", "确认删除", {
      type: "warning",
    });
    personalizationStore.deleteWorkspace(workspaceId);
    ElMessage.success("工作台删除成功");
  } catch (error) {
    // 用户取消操作
  }
};

const createWorkspace = () => {
  personalizationStore.createWorkspace({
    name: newWorkspace.name,
    description: newWorkspace.description,
    layout: newWorkspace.layout,
    widgets: [],
    isDefault: false,
  });
  showWorkspaceCreator.value = false;
  ElMessage.success("工作台创建成功");
};

const updateQuickActionSettings = () => {
  personalizationStore.settings.quickActions.enabled =
    quickActionSettings.enabled;
  personalizationStore.settings.quickActions.position =
    quickActionSettings.position;
  personalizationStore.settings.quickActions.maxVisible =
    quickActionSettings.maxVisible;
  personalizationStore.saveSettings();
};

const toggleQuickAction = (actionId: string) => {
  personalizationStore.toggleQuickAction(actionId);
};

const updateQuickActionOrder = () => {
  personalizationStore.saveSettings();
};

const updateInterfaceSettings = () => {
  personalizationStore.settings.interface.sidebarPosition =
    interfaceSettings.sidebarPosition;
  personalizationStore.settings.interface.headerStyle =
    interfaceSettings.headerStyle;
  personalizationStore.settings.interface.animationEnabled =
    interfaceSettings.animationEnabled;
  personalizationStore.settings.interface.compactMode =
    interfaceSettings.compactMode;
  personalizationStore.saveSettings();
};

const updateNotificationSettings = () => {
  personalizationStore.settings.notifications.position =
    notificationSettings.position;
  personalizationStore.settings.notifications.duration =
    notificationSettings.duration;
  personalizationStore.settings.notifications.soundEnabled =
    notificationSettings.soundEnabled;
  personalizationStore.settings.notifications.desktopNotifications =
    notificationSettings.desktopNotifications;
  personalizationStore.saveSettings();
};

const updateWorkspaceSettings = () => {
  personalizationStore.settings.workspace.defaultView =
    workspaceSettings.defaultView;
  personalizationStore.settings.workspace.recentItems =
    workspaceSettings.recentItems;
  personalizationStore.saveSettings();
};

const removeFavoriteItem = (itemId: string) => {
  personalizationStore.removeFavoriteItem(itemId);
};

const resetAllSettings = async () => {
  try {
    await ElMessageBox.confirm("确定要重置所有个性化设置吗？", "确认重置", {
      type: "warning",
    });
    personalizationStore.resetSettings();
    ElMessage.success("所有设置已重置");
  } catch (error) {
    // 用户取消操作
  }
};

const exportSettings = () => {
  personalizationStore.exportSettings();
  ElMessage.success("设置导出成功");
};

const saveAllSettings = () => {
  personalizationStore.saveSettings();
  ElMessage.success("设置保存成功");
};

const editWidget = (_widget: any) => {
  ElMessage.info("编辑组件功能开发中");
};

const editWorkspace = (_workspace: any) => {
  ElMessage.info("编辑工作台功能开发中");
};

onMounted(() => {
  console.log("个性化设置页面已加载");
});
</script>

<style scoped>
.personalization-container {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.settings-card {
  margin-bottom: 20px;
}

.card-header {
  text-align: center;
}

.card-header h2 {
  margin: 0;
  color: #303133;
  font-size: 24px;
}

.subtitle {
  margin: 10px 0 0 0;
  color: #909399;
  font-size: 14px;
}

.settings-tabs {
  margin-top: 20px;
}

.tab-content {
  padding: 20px 0;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.section-header h3 {
  margin: 0;
  color: #303133;
}

.header-actions {
  display: flex;
  gap: 10px;
}

/* 主题设置样式 */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.theme-item {
  border: 2px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s;
}

.theme-item:hover {
  border-color: #409eff;
  transform: translateY(-2px);
}

.theme-item.active {
  border-color: #409eff;
  box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
}

.theme-preview {
  height: 120px;
  background: var(--background-color);
  position: relative;
}

.theme-header {
  height: 20px;
  background: var(--primary-color);
}

.theme-content {
  display: flex;
  height: calc(100% - 20px);
}

.theme-sidebar {
  width: 30px;
  background: var(--secondary-color);
}

.theme-main {
  flex: 1;
  background: var(--background-color);
}

.theme-info {
  padding: 10px;
  text-align: center;
}

.theme-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.theme-info p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.theme-options {
  margin-top: 20px;
}

/* 仪表板样式 */
.dashboard-layout {
  margin-top: 20px;
}

.layout-controls {
  margin-bottom: 20px;
}

.widget-grid {
  display: grid;
  grid-template-columns: repeat(12, 1fr);
  gap: 15px;
  min-height: 400px;
}

.widget-item {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  background: #fff;
  overflow: hidden;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background: #f8f9fa;
  border-bottom: 1px solid #e4e7ed;
}

.widget-header h4 {
  margin: 0;
  color: #303133;
  font-size: 14px;
}

.widget-actions {
  display: flex;
  gap: 5px;
}

.widget-content {
  padding: 15px;
  min-height: 100px;
}

.widget-placeholder {
  color: #909399;
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* 工作台样式 */
.workspace-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.workspace-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s;
}

.workspace-item:hover {
  border-color: #409eff;
  background: #f8f9fa;
}

.workspace-item.active {
  border-color: #409eff;
  background: #ecf5ff;
}

.workspace-info h4 {
  margin: 0 0 5px 0;
  color: #303133;
}

.workspace-info p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.workspace-actions {
  display: flex;
  gap: 5px;
}

/* 快捷操作样式 */
.quick-actions-config {
  margin-bottom: 20px;
}

.quick-actions-list {
  margin-top: 20px;
}

.quick-actions-list h4 {
  margin: 0 0 15px 0;
  color: #303133;
}

.quick-actions-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 8px;
  min-height: 100px;
}

.quick-action-item {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 8px 12px;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  font-size: 12px;
  color: #606266;
}

.preview-top,
.preview-bottom {
  flex-direction: row;
}

.preview-left,
.preview-right {
  flex-direction: column;
}

/* 预览样式 */
.preview-card {
  height: 100%;
}

.theme-preview-large {
  height: 300px;
  background: var(--background-color);
  border-radius: 8px;
  overflow: hidden;
}

.preview-header {
  height: 40px;
  background: var(--primary-color);
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 15px;
}

.preview-logo {
  width: 80px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.preview-nav {
  display: flex;
  gap: 10px;
}

.nav-item {
  width: 40px;
  height: 20px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
}

.preview-content {
  display: flex;
  height: calc(100% - 40px);
}

.preview-sidebar {
  width: 60px;
  background: var(--secondary-color);
  padding: 10px;
}

.sidebar-item {
  width: 100%;
  height: 30px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 4px;
  margin-bottom: 10px;
}

.preview-main {
  flex: 1;
  padding: 15px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.main-card {
  height: 60px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 4px;
}

/* 工作台预览 */
.preview-workspace {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  overflow: hidden;
}

.preview-workspace .preview-header {
  background: #f8f9fa;
  color: #303133;
}

.preview-workspace .preview-content {
  padding: 15px;
  gap: 10px;
}

.preview-widget {
  height: 40px;
  background: #f8f9fa;
  border-radius: 4px;
}

/* 设置操作 */
.settings-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #e4e7ed;
}

/* 组件选择器 */
.widget-selector {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.widget-option {
  padding: 15px;
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s;
}

.widget-option:hover {
  border-color: #409eff;
  background: #f8f9fa;
}

.widget-icon {
  font-size: 24px;
  color: #409eff;
  margin-bottom: 10px;
}

.widget-option h4 {
  margin: 0 0 5px 0;
  color: #303133;
  font-size: 14px;
}

.widget-option p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .theme-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .widget-grid {
    grid-template-columns: repeat(6, 1fr);
  }

  .settings-actions {
    flex-direction: column;
  }
}

:deep(.el-tabs__content) {
  padding: 20px 0;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}
</style>
