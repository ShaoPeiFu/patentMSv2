import { defineStore } from "pinia";
import { reactive, computed } from "vue";

// 主题类型定义
export interface Theme {
  id: string;
  name: string;
  primaryColor: string;
  secondaryColor: string;
  backgroundColor: string;
  textColor: string;
  accentColor: string;
  isDark: boolean;
  isCustom: boolean;
}

// 快捷操作项定义
export interface QuickAction {
  id: string;
  name: string;
  icon: string;
  path: string;
  category: string;
  isEnabled: boolean;
  order: number;
}

// 仪表板组件定义
export interface DashboardWidget {
  id: string;
  name: string;
  type: "chart" | "table" | "metric" | "list" | "custom";
  position: { x: number; y: number; w: number; h: number };
  config: any;
  isVisible: boolean;
  order: number;
}

// 个人工作台定义
export interface PersonalWorkspace {
  id: string;
  name: string;
  description: string;
  widgets: DashboardWidget[];
  layout: "grid" | "list" | "kanban";
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// 个性化设置定义
export interface PersonalizationSettings {
  // 主题设置
  theme: {
    currentTheme: string;
    customTheme: Theme | null;
    autoSwitch: boolean;
    preferredTheme: "light" | "dark" | "auto";
  };

  // 仪表板设置
  dashboard: {
    layout: "grid" | "list" | "kanban";
    widgets: DashboardWidget[];
    defaultWorkspace: string;
    workspaces: PersonalWorkspace[];
  };

  // 快捷操作设置
  quickActions: {
    enabled: boolean;
    position: "top" | "bottom" | "left" | "right";
    actions: QuickAction[];
    maxVisible: number;
  };

  // 界面设置
  interface: {
    sidebarCollapsed: boolean;
    sidebarPosition: "left" | "right";
    headerStyle: "default" | "minimal" | "custom";
    animationEnabled: boolean;
    compactMode: boolean;
  };

  // 通知设置
  notifications: {
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left";
    duration: number;
    soundEnabled: boolean;
    desktopNotifications: boolean;
  };

  // 工作台设置
  workspace: {
    defaultView: "dashboard" | "patents" | "tasks" | "reports";
    recentItems: number;
    favoriteItems: string[];
    customViews: any[];
  };
}

export const usePersonalizationStore = defineStore("personalization", () => {
  // 默认主题
  const defaultThemes: Theme[] = [
    {
      id: "light",
      name: "浅色主题",
      primaryColor: "#409eff",
      secondaryColor: "#67c23a",
      backgroundColor: "#ffffff",
      textColor: "#303133",
      accentColor: "#e6a23c",
      isDark: false,
      isCustom: false,
    },
    {
      id: "dark",
      name: "深色主题",
      primaryColor: "#409eff",
      secondaryColor: "#67c23a",
      backgroundColor: "#1a1a1a",
      textColor: "#ffffff",
      accentColor: "#e6a23c",
      isDark: true,
      isCustom: false,
    },
    {
      id: "blue",
      name: "蓝色主题",
      primaryColor: "#1890ff",
      secondaryColor: "#52c41a",
      backgroundColor: "#f0f2f5",
      textColor: "#262626",
      accentColor: "#faad14",
      isDark: false,
      isCustom: false,
    },
    {
      id: "green",
      name: "绿色主题",
      primaryColor: "#52c41a",
      secondaryColor: "#1890ff",
      backgroundColor: "#f6ffed",
      textColor: "#262626",
      accentColor: "#faad14",
      isDark: false,
      isCustom: false,
    },
  ];

  // 默认快捷操作
  const defaultQuickActions: QuickAction[] = [
    {
      id: "dashboard",
      name: "控制台",
      icon: "House",
      path: "/dashboard",
      category: "navigation",
      isEnabled: true,
      order: 1,
    },
    {
      id: "patents",
      name: "专利管理",
      icon: "Files",
      path: "/dashboard/patents",
      category: "management",
      isEnabled: true,
      order: 2,
    },
    {
      id: "add-patent",
      name: "添加专利",
      icon: "Plus",
      path: "/dashboard/patents/add",
      category: "action",
      isEnabled: true,
      order: 3,
    },
    {
      id: "reports",
      name: "报告中心",
      icon: "Document",
      path: "/dashboard/reports",
      category: "report",
      isEnabled: true,
      order: 4,
    },
    {
      id: "settings",
      name: "系统设置",
      icon: "Setting",
      path: "/dashboard/settings",
      category: "system",
      isEnabled: true,
      order: 5,
    },
  ];

  // 默认仪表板组件
  const defaultWidgets: DashboardWidget[] = [
    {
      id: "patent-overview",
      name: "专利概览",
      type: "metric",
      position: { x: 0, y: 0, w: 6, h: 2 },
      config: {
        metrics: ["total", "pending", "approved", "rejected"],
        chartType: "bar",
      },
      isVisible: true,
      order: 1,
    },
    {
      id: "recent-patents",
      name: "最近专利",
      type: "list",
      position: { x: 6, y: 0, w: 6, h: 4 },
      config: {
        limit: 10,
        showActions: true,
      },
      isVisible: true,
      order: 2,
    },
    {
      id: "patent-chart",
      name: "专利统计",
      type: "chart",
      position: { x: 0, y: 2, w: 6, h: 4 },
      config: {
        chartType: "pie",
        dataSource: "patent-status",
      },
      isVisible: true,
      order: 3,
    },
    {
      id: "quick-actions",
      name: "快捷操作",
      type: "custom",
      position: { x: 6, y: 4, w: 6, h: 2 },
      config: {
        actions: ["add-patent", "manage-users"],
      },
      isVisible: true,
      order: 4,
    },
  ];

  // 默认工作台
  const defaultWorkspace: PersonalWorkspace = {
    id: "default",
    name: "默认工作台",
    description: "系统默认工作台",
    widgets: defaultWidgets,
    layout: "grid",
    isDefault: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // 个性化设置
  const settings = reactive<PersonalizationSettings>({
    theme: {
      currentTheme: "light",
      customTheme: null,
      autoSwitch: false,
      preferredTheme: "light",
    },
    dashboard: {
      layout: "grid",
      widgets: [...defaultWidgets],
      defaultWorkspace: "default",
      workspaces: [defaultWorkspace],
    },
    quickActions: {
      enabled: true,
      position: "top",
      actions: [...defaultQuickActions],
      maxVisible: 5,
    },
    interface: {
      sidebarCollapsed: false,
      sidebarPosition: "left",
      headerStyle: "default",
      animationEnabled: true,
      compactMode: false,
    },
    notifications: {
      position: "top-right",
      duration: 3000,
      soundEnabled: true,
      desktopNotifications: false,
    },
    workspace: {
      defaultView: "dashboard",
      recentItems: 10,
      favoriteItems: [],
      customViews: [],
    },
  });

  // 计算属性
  const currentTheme = computed(() => {
    const themeId = settings.theme.currentTheme;
    if (themeId === "custom" && settings.theme.customTheme) {
      return settings.theme.customTheme;
    }
    return defaultThemes.find((t) => t.id === themeId) || defaultThemes[0];
  });

  const availableThemes = computed(() => {
    const themes = [...defaultThemes];
    if (settings.theme.customTheme) {
      themes.push(settings.theme.customTheme);
    }
    return themes;
  });

  const enabledQuickActions = computed(() => {
    return settings.quickActions.actions
      .filter((action) => action.isEnabled)
      .sort((a, b) => a.order - b.order)
      .slice(0, settings.quickActions.maxVisible);
  });

  const currentWorkspace = computed(() => {
    return (
      settings.dashboard.workspaces.find(
        (w) => w.id === settings.dashboard.defaultWorkspace
      ) || defaultWorkspace
    );
  });

  const visibleWidgets = computed(() => {
    return currentWorkspace.value.widgets
      .filter((widget) => widget.isVisible)
      .sort((a, b) => a.order - b.order);
  });

  // 方法
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem("personalizationSettings");
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        Object.assign(settings, parsedSettings);
      }
    } catch (error) {
      console.error("加载个性化设置失败:", error);
    }
  };

  const saveSettings = async () => {
    try {
      localStorage.setItem("personalizationSettings", JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error("保存个性化设置失败:", error);
      return false;
    }
  };

  // 主题管理
  const setTheme = (themeId: string) => {
    settings.theme.currentTheme = themeId;
    applyTheme(themeId);
    saveSettings();
  };

  const applyTheme = (themeId: string) => {
    const theme =
      themeId === "custom" && settings.theme.customTheme
        ? settings.theme.customTheme
        : defaultThemes.find((t) => t.id === themeId) || defaultThemes[0];

    if (theme) {
      // 应用CSS变量
      const root = document.documentElement;
      root.style.setProperty("--primary-color", theme.primaryColor);
      root.style.setProperty("--secondary-color", theme.secondaryColor);
      root.style.setProperty("--background-color", theme.backgroundColor);
      root.style.setProperty("--text-color", theme.textColor);
      root.style.setProperty("--accent-color", theme.accentColor);

      // 设置暗色模式类
      if (theme.isDark) {
        document.body.classList.add("dark-mode");
      } else {
        document.body.classList.remove("dark-mode");
      }
    }
  };

  const createCustomTheme = (theme: Omit<Theme, "id" | "isCustom">) => {
    const customTheme: Theme = {
      ...theme,
      id: "custom",
      isCustom: true,
    };
    settings.theme.customTheme = customTheme;
    settings.theme.currentTheme = "custom";
    applyTheme("custom");
    saveSettings();
  };

  const updateCustomTheme = (updates: Partial<Theme>) => {
    if (settings.theme.customTheme) {
      Object.assign(settings.theme.customTheme, updates);
      applyTheme("custom");
      saveSettings();
    }
  };

  // 快捷操作管理
  const toggleQuickAction = (actionId: string) => {
    const action = settings.quickActions.actions.find((a) => a.id === actionId);
    if (action) {
      action.isEnabled = !action.isEnabled;
      saveSettings();
    }
  };

  const reorderQuickActions = (actionIds: string[]) => {
    actionIds.forEach((id, index) => {
      const action = settings.quickActions.actions.find((a) => a.id === id);
      if (action) {
        action.order = index + 1;
      }
    });
    saveSettings();
  };

  const addQuickAction = (action: Omit<QuickAction, "id">) => {
    const newAction: QuickAction = {
      ...action,
      id: `custom-${Date.now()}`,
    };
    settings.quickActions.actions.push(newAction);
    saveSettings();
  };

  const removeQuickAction = (actionId: string) => {
    const index = settings.quickActions.actions.findIndex(
      (a) => a.id === actionId
    );
    if (index !== -1) {
      settings.quickActions.actions.splice(index, 1);
      saveSettings();
    }
  };

  // 仪表板管理
  const addWidget = (widget: Omit<DashboardWidget, "id">) => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget-${Date.now()}`,
    };
    currentWorkspace.value.widgets.push(newWidget);
    saveSettings();
  };

  const updateWidget = (
    widgetId: string,
    updates: Partial<DashboardWidget>
  ) => {
    const widget = currentWorkspace.value.widgets.find(
      (w) => w.id === widgetId
    );
    if (widget) {
      Object.assign(widget, updates);
      saveSettings();
    }
  };

  const removeWidget = (widgetId: string) => {
    const index = currentWorkspace.value.widgets.findIndex(
      (w) => w.id === widgetId
    );
    if (index !== -1) {
      currentWorkspace.value.widgets.splice(index, 1);
      saveSettings();
    }
  };

  const reorderWidgets = (widgetIds: string[]) => {
    widgetIds.forEach((id, index) => {
      const widget = currentWorkspace.value.widgets.find((w) => w.id === id);
      if (widget) {
        widget.order = index + 1;
      }
    });
    saveSettings();
  };

  // 工作台管理
  const createWorkspace = (
    workspace: Omit<PersonalWorkspace, "id" | "createdAt" | "updatedAt">
  ) => {
    const newWorkspace: PersonalWorkspace = {
      ...workspace,
      id: `workspace-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    settings.dashboard.workspaces.push(newWorkspace);
    saveSettings();
    return newWorkspace;
  };

  const switchWorkspace = (workspaceId: string) => {
    const workspace = settings.dashboard.workspaces.find(
      (w) => w.id === workspaceId
    );
    if (workspace) {
      settings.dashboard.defaultWorkspace = workspaceId;
      saveSettings();
    }
  };

  const updateWorkspace = (
    workspaceId: string,
    updates: Partial<PersonalWorkspace>
  ) => {
    const workspace = settings.dashboard.workspaces.find(
      (w) => w.id === workspaceId
    );
    if (workspace) {
      Object.assign(workspace, updates, {
        updatedAt: new Date().toISOString(),
      });
      saveSettings();
    }
  };

  const deleteWorkspace = (workspaceId: string) => {
    const index = settings.dashboard.workspaces.findIndex(
      (w) => w.id === workspaceId
    );
    if (index !== -1 && !settings.dashboard.workspaces[index].isDefault) {
      settings.dashboard.workspaces.splice(index, 1);
      if (settings.dashboard.defaultWorkspace === workspaceId) {
        settings.dashboard.defaultWorkspace = "default";
      }
      saveSettings();
    }
  };

  // 界面设置
  const toggleSidebar = () => {
    settings.interface.sidebarCollapsed = !settings.interface.sidebarCollapsed;
    saveSettings();
  };

  const setSidebarPosition = (position: "left" | "right") => {
    settings.interface.sidebarPosition = position;
    saveSettings();
  };

  const setHeaderStyle = (style: "default" | "minimal" | "custom") => {
    settings.interface.headerStyle = style;
    saveSettings();
  };

  const toggleAnimation = () => {
    settings.interface.animationEnabled = !settings.interface.animationEnabled;
    saveSettings();
  };

  const toggleCompactMode = () => {
    settings.interface.compactMode = !settings.interface.compactMode;
    saveSettings();
  };

  // 通知设置
  const setNotificationPosition = (
    position: "top-right" | "top-left" | "bottom-right" | "bottom-left"
  ) => {
    settings.notifications.position = position;
    saveSettings();
  };

  const setNotificationDuration = (duration: number) => {
    settings.notifications.duration = duration;
    saveSettings();
  };

  const toggleNotificationSound = () => {
    settings.notifications.soundEnabled = !settings.notifications.soundEnabled;
    saveSettings();
  };

  const toggleDesktopNotifications = () => {
    settings.notifications.desktopNotifications =
      !settings.notifications.desktopNotifications;
    saveSettings();
  };

  // 工作台设置
  const setDefaultView = (view: "dashboard" | "patents" | "tasks") => {
    settings.workspace.defaultView = view;
    saveSettings();
  };

  const addFavoriteItem = (itemId: string) => {
    if (!settings.workspace.favoriteItems.includes(itemId)) {
      settings.workspace.favoriteItems.push(itemId);
      saveSettings();
    }
  };

  const removeFavoriteItem = (itemId: string) => {
    const index = settings.workspace.favoriteItems.indexOf(itemId);
    if (index !== -1) {
      settings.workspace.favoriteItems.splice(index, 1);
      saveSettings();
    }
  };

  // 重置设置
  const resetSettings = () => {
    Object.assign(settings, {
      theme: {
        currentTheme: "light",
        customTheme: null,
        autoSwitch: false,
        preferredTheme: "light",
      },
      dashboard: {
        layout: "grid",
        widgets: [...defaultWidgets],
        defaultWorkspace: "default",
        workspaces: [defaultWorkspace],
      },
      quickActions: {
        enabled: true,
        position: "top",
        actions: [...defaultQuickActions],
        maxVisible: 5,
      },
      interface: {
        sidebarCollapsed: false,
        sidebarPosition: "left",
        headerStyle: "default",
        animationEnabled: true,
        compactMode: false,
      },
      notifications: {
        position: "top-right",
        duration: 3000,
        soundEnabled: true,
        desktopNotifications: false,
      },
      workspace: {
        defaultView: "dashboard",
        recentItems: 10,
        favoriteItems: [],
        customViews: [],
      },
    });
    applyTheme("light");
    saveSettings();
  };

  // 导出设置
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(dataBlob);
    link.download = `personalization-settings-${
      new Date().toISOString().split("T")[0]
    }.json`;
    link.click();
  };

  // 导入设置
  const importSettings = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);

      if (typeof importedSettings === "object" && importedSettings !== null) {
        Object.assign(settings, importedSettings);
        applyTheme(settings.theme.currentTheme);
        saveSettings();
        return true;
      }
      return false;
    } catch (error) {
      console.error("导入个性化设置失败:", error);
      return false;
    }
  };

  // 初始化
  loadSettings();
  applyTheme(settings.theme.currentTheme);

  return {
    // 状态
    settings,
    defaultThemes,
    defaultQuickActions,
    defaultWidgets,
    defaultWorkspace,

    // 计算属性
    currentTheme,
    availableThemes,
    enabledQuickActions,
    currentWorkspace,
    visibleWidgets,

    // 方法
    loadSettings,
    saveSettings,
    resetSettings,
    exportSettings,
    importSettings,

    // 主题管理
    setTheme,
    applyTheme,
    createCustomTheme,
    updateCustomTheme,

    // 快捷操作管理
    toggleQuickAction,
    reorderQuickActions,
    addQuickAction,
    removeQuickAction,

    // 仪表板管理
    addWidget,
    updateWidget,
    removeWidget,
    reorderWidgets,

    // 工作台管理
    createWorkspace,
    switchWorkspace,
    updateWorkspace,
    deleteWorkspace,

    // 界面设置
    toggleSidebar,
    setSidebarPosition,
    setHeaderStyle,
    toggleAnimation,
    toggleCompactMode,

    // 通知设置
    setNotificationPosition,
    setNotificationDuration,
    toggleNotificationSound,
    toggleDesktopNotifications,

    // 工作台设置
    setDefaultView,
    addFavoriteItem,
    removeFavoriteItem,
  };
});
