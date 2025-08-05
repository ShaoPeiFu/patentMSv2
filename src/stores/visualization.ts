import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type {
  DashboardLayout,
  DashboardWidget,
  TimelineEvent,
  TimelineConfig,
  TechnologyNode,
  TechnologyRelation,
  TechTreeConfig,
  VisualizationDataSource,
  VisualizationTheme,
  VisualizationFilter,
} from "@/types/visualization";

export const useVisualizationStore = defineStore("visualization", () => {
  // 状态
  const dashboards = ref<DashboardLayout[]>([]);
  const currentDashboard = ref<DashboardLayout | null>(null);
  const timelineEvents = ref<TimelineEvent[]>([]);
  const timelineConfig = ref<TimelineConfig>({
    startDate: "2020-01-01",
    endDate: new Date().toISOString().split("T")[0],
    granularity: "month",
    eventTypes: ["application", "approval", "rejection", "expiry"],
    showFilters: true,
  });
  const technologyNodes = ref<TechnologyNode[]>([]);
  const technologyRelations = ref<TechnologyRelation[]>([]);
  const techTreeConfig = ref<TechTreeConfig>({
    layout: "tree",
    nodeSize: "byPatentCount",
    edgeStyle: "curved",
    colorScheme: "category",
    showLabels: true,
    showRelations: true,
    interactionMode: "explore",
  });
  const themes = ref<VisualizationTheme[]>([]);
  const currentTheme = ref<string>("default");
  const globalFilters = ref<VisualizationFilter[]>([]);
  const dataSources = ref<VisualizationDataSource[]>([]);
  const loading = ref(false);

  // 计算属性
  const activeDashboard = computed(() => currentDashboard.value);
  const filteredTimelineEvents = computed(() => {
    let events = timelineEvents.value;

    // 应用全局过滤器
    globalFilters.value.forEach((filter) => {
      if (!filter.active) return;

      events = events.filter((event) => {
        const value = (event as any)[filter.field];
        switch (filter.operator) {
          case "eq":
            return value === filter.value;
          case "ne":
            return value !== filter.value;
          case "contains":
            return String(value).includes(filter.value);
          case "in":
            return Array.isArray(filter.value)
              ? filter.value.includes(value)
              : false;
          default:
            return true;
        }
      });
    });

    // 按日期范围过滤
    const startDate = new Date(timelineConfig.value.startDate);
    const endDate = new Date(timelineConfig.value.endDate);

    return events
      .filter((event) => {
        const eventDate = new Date(event.date);
        return eventDate >= startDate && eventDate <= endDate;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  });

  const activeTheme = computed(() => {
    return (
      themes.value.find((t) => t.id === currentTheme.value) || getDefaultTheme()
    );
  });

  // 方法
  const loadFromStorage = () => {
    try {
      const storedDashboards = localStorage.getItem("visualization_dashboards");
      if (storedDashboards) {
        dashboards.value = JSON.parse(storedDashboards);
      }

      const storedEvents = localStorage.getItem("visualization_timeline");
      if (storedEvents) {
        timelineEvents.value = JSON.parse(storedEvents);
      }

      const storedThemes = localStorage.getItem("visualization_themes");
      if (storedThemes) {
        themes.value = JSON.parse(storedThemes);
      } else {
        initializeDefaultThemes();
      }

      const storedCurrentTheme = localStorage.getItem(
        "visualization_current_theme"
      );
      if (storedCurrentTheme) {
        currentTheme.value = storedCurrentTheme;
      }

      // 恢复当前选中的仪表板
      const storedCurrentDashboard = localStorage.getItem(
        "visualization_current_dashboard"
      );
      if (storedCurrentDashboard) {
        const dashboard = dashboards.value.find(
          (d) => d.id === storedCurrentDashboard
        );
        if (dashboard) {
          currentDashboard.value = dashboard;
        }
      }
    } catch (error) {
      console.error("加载可视化数据失败:", error);
      initializeDefaultData();
    }
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(
        "visualization_dashboards",
        JSON.stringify(dashboards.value)
      );
      localStorage.setItem(
        "visualization_timeline",
        JSON.stringify(timelineEvents.value)
      );
      localStorage.setItem(
        "visualization_themes",
        JSON.stringify(themes.value)
      );
      localStorage.setItem("visualization_current_theme", currentTheme.value);
      // 保存当前选中的仪表板ID
      if (currentDashboard.value) {
        localStorage.setItem(
          "visualization_current_dashboard",
          currentDashboard.value.id
        );
      } else {
        localStorage.removeItem("visualization_current_dashboard");
      }
    } catch (error) {
      console.error("保存可视化数据失败:", error);
    }
  };

  // 仪表板管理
  const createDashboard = (
    name: string,
    description?: string
  ): DashboardLayout => {
    const dashboard: DashboardLayout = {
      id: `dashboard_${Date.now()}`,
      name,
      description,
      widgets: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    dashboards.value.push(dashboard);
    saveToStorage();
    return dashboard;
  };

  const updateDashboard = (id: string, updates: Partial<DashboardLayout>) => {
    const index = dashboards.value.findIndex((d) => d.id === id);
    if (index !== -1) {
      dashboards.value[index] = {
        ...dashboards.value[index],
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      saveToStorage();
    }
  };

  const deleteDashboard = (id: string) => {
    dashboards.value = dashboards.value.filter((d) => d.id !== id);
    if (currentDashboard.value?.id === id) {
      currentDashboard.value = null;
    }
    saveToStorage();
  };

  const setCurrentDashboard = (dashboard: DashboardLayout | null) => {
    currentDashboard.value = dashboard;
  };

  const addWidget = (
    dashboardId: string,
    widget: Omit<DashboardWidget, "id">
  ): DashboardWidget => {
    const newWidget: DashboardWidget = {
      ...widget,
      id: `widget_${Date.now()}`,
    };

    const dashboard = dashboards.value.find((d) => d.id === dashboardId);
    if (dashboard) {
      dashboard.widgets.push(newWidget);
      dashboard.updatedAt = new Date().toISOString();
      saveToStorage();
    }

    return newWidget;
  };

  const updateWidget = (
    dashboardId: string,
    widgetId: string,
    updates: Partial<DashboardWidget>
  ) => {
    const dashboard = dashboards.value.find((d) => d.id === dashboardId);
    if (dashboard) {
      const widgetIndex = dashboard.widgets.findIndex((w) => w.id === widgetId);
      if (widgetIndex !== -1) {
        dashboard.widgets[widgetIndex] = {
          ...dashboard.widgets[widgetIndex],
          ...updates,
        };
        dashboard.updatedAt = new Date().toISOString();
        saveToStorage();
      }
    }
  };

  const removeWidget = (dashboardId: string, widgetId: string) => {
    const dashboard = dashboards.value.find((d) => d.id === dashboardId);
    if (dashboard) {
      dashboard.widgets = dashboard.widgets.filter((w) => w.id !== widgetId);
      dashboard.updatedAt = new Date().toISOString();
      saveToStorage();
    }
  };

  // 时间轴管理
  const addTimelineEvent = (
    event: Omit<TimelineEvent, "id">
  ): TimelineEvent => {
    const newEvent: TimelineEvent = {
      ...event,
      id: `event_${Date.now()}`,
    };

    timelineEvents.value.push(newEvent);
    saveToStorage();
    return newEvent;
  };

  const updateTimelineEvent = (id: string, updates: Partial<TimelineEvent>) => {
    const index = timelineEvents.value.findIndex((e) => e.id === id);
    if (index !== -1) {
      timelineEvents.value[index] = {
        ...timelineEvents.value[index],
        ...updates,
      };
      saveToStorage();
    }
  };

  const deleteTimelineEvent = (id: string) => {
    timelineEvents.value = timelineEvents.value.filter((e) => e.id !== id);
    saveToStorage();
  };

  const updateTimelineConfig = (config: Partial<TimelineConfig>) => {
    timelineConfig.value = {
      ...timelineConfig.value,
      ...config,
    };
    saveToStorage();
  };

  // 技术树管理
  const addTechnologyNode = (
    node: Omit<TechnologyNode, "id">
  ): TechnologyNode => {
    const newNode: TechnologyNode = {
      ...node,
      id: `tech_${Date.now()}`,
    };

    technologyNodes.value.push(newNode);
    saveToStorage();
    return newNode;
  };

  const updateTechnologyNode = (
    id: string,
    updates: Partial<TechnologyNode>
  ) => {
    const index = technologyNodes.value.findIndex((n) => n.id === id);
    if (index !== -1) {
      technologyNodes.value[index] = {
        ...technologyNodes.value[index],
        ...updates,
      };
      saveToStorage();
    }
  };

  const deleteTechnologyNode = (id: string) => {
    technologyNodes.value = technologyNodes.value.filter((n) => n.id !== id);
    technologyRelations.value = technologyRelations.value.filter(
      (r) => r.source !== id && r.target !== id
    );
    saveToStorage();
  };

  const addTechnologyRelation = (
    relation: Omit<TechnologyRelation, "id">
  ): TechnologyRelation => {
    const newRelation: TechnologyRelation = {
      ...relation,
      id: `relation_${Date.now()}`,
    };

    technologyRelations.value.push(newRelation);
    saveToStorage();
    return newRelation;
  };

  const updateTechTreeConfig = (config: Partial<TechTreeConfig>) => {
    techTreeConfig.value = {
      ...techTreeConfig.value,
      ...config,
    };
    saveToStorage();
  };

  // 主题管理
  const setTheme = (themeId: string) => {
    currentTheme.value = themeId;
    saveToStorage();
  };

  const addTheme = (theme: VisualizationTheme) => {
    themes.value.push(theme);
    saveToStorage();
  };

  // 过滤器管理
  const addFilter = (filter: VisualizationFilter) => {
    globalFilters.value.push(filter);
  };

  const updateFilter = (id: string, updates: Partial<VisualizationFilter>) => {
    const index = globalFilters.value.findIndex((f) => f.id === id);
    if (index !== -1) {
      globalFilters.value[index] = {
        ...globalFilters.value[index],
        ...updates,
      };
    }
  };

  const removeFilter = (id: string) => {
    globalFilters.value = globalFilters.value.filter((f) => f.id !== id);
  };

  const clearFilters = () => {
    globalFilters.value = [];
  };

  // 数据生成
  const generateTimelineData = () => {
    const events: TimelineEvent[] = [];
    const eventTypes = [
      "application",
      "approval",
      "rejection",
      "expiry",
      "milestone",
    ];
    const categories = ["AI技术", "通信技术", "生物技术", "新能源", "材料科学"];

    for (let i = 0; i < 50; i++) {
      const date = new Date(
        2020,
        Math.floor(Math.random() * 48),
        Math.floor(Math.random() * 28) + 1
      );
      const type = eventTypes[
        Math.floor(Math.random() * eventTypes.length)
      ] as any;
      const category =
        categories[Math.floor(Math.random() * categories.length)];

      events.push({
        id: `event_${i}`,
        date: date.toISOString().split("T")[0],
        title: `${category}专利${
          type === "application"
            ? "申请"
            : type === "approval"
            ? "授权"
            : type === "rejection"
            ? "驳回"
            : type === "expiry"
            ? "到期"
            : "里程碑"
        }`,
        description: `关于${category}的专利相关事件`,
        type,
        category,
        importance: ["low", "medium", "high"][
          Math.floor(Math.random() * 3)
        ] as any,
        patentId: Math.floor(Math.random() * 1000) + 1,
      });
    }

    timelineEvents.value = events;
    saveToStorage();
  };

  const generateTechnologyTree = () => {
    const categories = [
      "人工智能",
      "通信技术",
      "生物技术",
      "新能源",
      "材料科学",
    ];
    const nodes: TechnologyNode[] = [];
    const relations: TechnologyRelation[] = [];

    // 生成根节点
    categories.forEach((category, index) => {
      nodes.push({
        id: `cat_${index}`,
        name: category,
        category,
        level: 0,
        patentCount: Math.floor(Math.random() * 1000) + 100,
        keywords: [category],
        relatedTechnologies: [],
        status: "mature",
      });

      // 生成子技术
      for (let i = 0; i < 3; i++) {
        const subTechId = `${category}_sub_${i}`;
        nodes.push({
          id: subTechId,
          name: `${category}子技术${i + 1}`,
          category,
          level: 1,
          parentId: `cat_${index}`,
          patentCount: Math.floor(Math.random() * 200) + 20,
          keywords: [category, `子技术${i + 1}`],
          relatedTechnologies: [],
          evolutionYear: 2015 + Math.floor(Math.random() * 8),
          status: ["emerging", "developing", "mature"][
            Math.floor(Math.random() * 3)
          ] as any,
        });

        // 添加关系
        relations.push({
          id: `rel_${category}_${i}`,
          source: `cat_${index}`,
          target: subTechId,
          type: "evolution",
          strength: 0.8 + Math.random() * 0.2,
          patentExamples: [1, 2, 3],
        });
      }
    });

    technologyNodes.value = nodes;
    technologyRelations.value = relations;
    saveToStorage();
  };

  const initializeDefaultData = () => {
    // 创建默认仪表板
    const defaultDashboard = createDashboard("默认仪表板", "系统默认仪表板");

    // 添加默认组件
    addWidget(defaultDashboard.id, {
      type: "chart",
      title: "专利申请趋势",
      position: { x: 0, y: 0, w: 6, h: 4 },
      config: { chartType: "line" },
    });

    addWidget(defaultDashboard.id, {
      type: "metric",
      title: "总专利数",
      position: { x: 6, y: 0, w: 3, h: 2 },
      config: { value: 1234, unit: "件" },
    });

    generateTimelineData();
    generateTechnologyTree();
    initializeDefaultThemes();
  };

  const initializeDefaultThemes = () => {
    const defaultThemes: VisualizationTheme[] = [
      {
        id: "default",
        name: "默认主题",
        colors: {
          primary: ["#409EFF", "#67C23A", "#E6A23C", "#F56C6C", "#909399"],
          secondary: ["#F0F9FF", "#F0F9F5", "#FDF6EC", "#FEF0F0", "#F5F5F6"],
          background: "#FFFFFF",
          text: "#303133",
          border: "#DCDFE6",
        },
        fonts: {
          title: "PingFang SC, Microsoft YaHei, sans-serif",
          body: "PingFang SC, Microsoft YaHei, sans-serif",
          code: "Monaco, Consolas, monospace",
        },
        spacing: {
          small: 8,
          medium: 16,
          large: 24,
        },
      },
      {
        id: "dark",
        name: "深色主题",
        colors: {
          primary: ["#409EFF", "#67C23A", "#E6A23C", "#F56C6C", "#909399"],
          secondary: ["#1F2937", "#065F46", "#92400E", "#991B1B", "#374151"],
          background: "#1F2937",
          text: "#F9FAFB",
          border: "#4B5563",
        },
        fonts: {
          title: "PingFang SC, Microsoft YaHei, sans-serif",
          body: "PingFang SC, Microsoft YaHei, sans-serif",
          code: "Monaco, Consolas, monospace",
        },
        spacing: {
          small: 8,
          medium: 16,
          large: 24,
        },
      },
    ];

    themes.value = defaultThemes;
    saveToStorage();
  };

  const getDefaultTheme = (): VisualizationTheme => {
    return {
      id: "default",
      name: "默认主题",
      colors: {
        primary: ["#409EFF", "#67C23A", "#E6A23C", "#F56C6C", "#909399"],
        secondary: ["#F0F9FF", "#F0F9F5", "#FDF6EC", "#FEF0F0", "#F5F5F6"],
        background: "#FFFFFF",
        text: "#303133",
        border: "#DCDFE6",
      },
      fonts: {
        title: "PingFang SC, Microsoft YaHei, sans-serif",
        body: "PingFang SC, Microsoft YaHei, sans-serif",
        code: "Monaco, Consolas, monospace",
      },
      spacing: {
        small: 8,
        medium: 16,
        large: 24,
      },
    };
  };

  // 初始化
  loadFromStorage();
  if (dashboards.value.length === 0) {
    initializeDefaultData();
  }

  return {
    // 状态
    dashboards,
    currentDashboard,
    timelineEvents,
    timelineConfig,
    technologyNodes,
    technologyRelations,
    techTreeConfig,
    themes,
    currentTheme,
    globalFilters,
    dataSources,
    loading,

    // 计算属性
    activeDashboard,
    filteredTimelineEvents,
    activeTheme,

    // 方法
    loadFromStorage,
    saveToStorage,
    createDashboard,
    updateDashboard,
    deleteDashboard,
    setCurrentDashboard,
    addWidget,
    updateWidget,
    removeWidget,
    addTimelineEvent,
    updateTimelineEvent,
    deleteTimelineEvent,
    updateTimelineConfig,
    addTechnologyNode,
    updateTechnologyNode,
    deleteTechnologyNode,
    addTechnologyRelation,
    updateTechTreeConfig,
    setTheme,
    addTheme,
    addFilter,
    updateFilter,
    removeFilter,
    clearFilters,
    generateTimelineData,
    generateTechnologyTree,
    initializeDefaultData,
  };
});
