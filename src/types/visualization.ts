// 可视化图表相关类型定义

// 仪表板组件类型
export interface DashboardWidget {
  id: string
  type: 'chart' | 'metric' | 'table' | 'timeline'
  title: string
  position: { x: number; y: number; w: number; h: number }
  config: Record<string, any>
  data?: any
}

// 仪表板布局
export interface DashboardLayout {
  id: string
  name: string
  description?: string
  widgets: DashboardWidget[]
  createdAt: string
  updatedAt: string
}

// 时间轴事件
export interface TimelineEvent {
  id: string
  date: string
  title: string
  description: string
  type: 'application' | 'approval' | 'rejection' | 'expiry' | 'milestone'
  patentId?: number
  metadata?: Record<string, any>
  category?: string
  importance: 'low' | 'medium' | 'high'
}

// 时间轴配置
export interface TimelineConfig {
  startDate: string
  endDate: string
  granularity: 'day' | 'week' | 'month' | 'quarter' | 'year'
  eventTypes: string[]
  groupBy?: 'category' | 'type' | 'importance'
  showFilters: boolean
}

// 技术节点
export interface TechnologyNode {
  id: string
  name: string
  category: string
  level: number
  parentId?: string
  children?: string[]
  patentCount: number
  description?: string
  keywords: string[]
  relatedTechnologies: string[]
  evolutionYear?: number
  status: 'emerging' | 'developing' | 'mature' | 'declining'
}

// 技术关系
export interface TechnologyRelation {
  id: string
  source: string
  target: string
  type: 'evolution' | 'combination' | 'dependency' | 'competition'
  strength: number // 0-1
  description?: string
  patentExamples: number[]
}

// 技术族谱配置
export interface TechTreeConfig {
  layout: 'tree' | 'force' | 'radial' | 'circular'
  nodeSize: 'uniform' | 'byPatentCount' | 'byImportance'
  edgeStyle: 'straight' | 'curved' | 'polyline'
  colorScheme: 'category' | 'level' | 'status'
  showLabels: boolean
  showRelations: boolean
  interactionMode: 'explore' | 'edit' | 'readonly'
}

// 图表数据点
export interface ChartDataPoint {
  x: string | number | Date
  y: number
  label?: string
  category?: string
  metadata?: Record<string, any>
}

// 图表系列
export interface ChartSeries {
  name: string
  type: 'line' | 'bar' | 'pie' | 'scatter' | 'area' | 'radar'
  data: ChartDataPoint[]
  color?: string
  config?: Record<string, any>
}

// 图表配置
export interface ChartConfig {
  title: string
  subtitle?: string
  xAxis?: {
    title?: string
    type?: 'category' | 'time' | 'value'
    format?: string
  }
  yAxis?: {
    title?: string
    type?: 'value' | 'log'
    min?: number
    max?: number
  }
  legend?: {
    show?: boolean
    position?: 'top' | 'bottom' | 'left' | 'right'
  }
  tooltip?: {
    show?: boolean
    format?: string
  }
  animation?: boolean
  theme?: string
}

// 可视化数据源
export interface VisualizationDataSource {
  id: string
  name: string
  type: 'patent' | 'user' | 'analytics' | 'external'
  endpoint?: string
  fields: string[]
  filters?: Record<string, any>
  refreshInterval?: number // 分钟
  lastUpdated?: string
}

// 可视化报告
export interface VisualizationReport {
  id: string
  title: string
  description?: string
  dashboards: string[]
  generatedAt: string
  format: 'pdf' | 'png' | 'html' | 'excel'
  settings: {
    includeData: boolean
    includeCharts: boolean
    includeTimeline: boolean
    includeTechTree: boolean
  }
}

// 交互事件
export interface VisualizationEvent {
  type: 'click' | 'hover' | 'select' | 'filter' | 'zoom' | 'drill'
  target: string
  data: any
  timestamp: number
}

// 过滤器
export interface VisualizationFilter {
  id: string
  field: string
  operator: 'eq' | 'ne' | 'gt' | 'lt' | 'gte' | 'lte' | 'in' | 'contains'
  value: any
  label?: string
  active: boolean
}

// 可视化主题
export interface VisualizationTheme {
  id: string
  name: string
  colors: {
    primary: string[]
    secondary: string[]
    background: string
    text: string
    border: string
  }
  fonts: {
    title: string
    body: string
    code: string
  }
  spacing: {
    small: number
    medium: number
    large: number
  }
}

// 动画配置
export interface AnimationConfig {
  enabled: boolean
  duration: number
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out'
  delay?: number
  stagger?: number
}

// 导出配置
export interface ExportConfig {
  format: 'png' | 'svg' | 'pdf' | 'excel' | 'csv'
  quality: 'low' | 'medium' | 'high'
  size: { width: number; height: number }
  includeTitle: boolean
  includeLegend: boolean
  backgroundColor: string
}