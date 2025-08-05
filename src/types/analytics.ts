// 分析数据类型定义

// 趋势分析相关
export interface TrendData {
  date: string
  value: number
  type: string
  label: string
}

export interface PatentTrend {
  period: 'month' | 'quarter' | 'year'
  applications: TrendData[]
  approvals: TrendData[]
  rejections: TrendData[]
  growth: {
    applications: number
    approvals: number
    rejections: number
  }
}

// 技术领域分布
export interface TechFieldData {
  field: string
  count: number
  percentage: number
  trend: 'up' | 'down' | 'stable'
  avgProcessingTime: number
  successRate: number
}

export interface TechFieldDistribution {
  fields: TechFieldData[]
  totalPatents: number
  topFields: string[]
  emergingFields: string[]
}

// 竞争对手分析
export interface CompetitorData {
  name: string
  patentCount: number
  marketShare: number
  avgQuality: number
  recentActivity: number
  techFocus: string[]
  strengths: string[]
  weaknesses: string[]
}

export interface CompetitorAnalysis {
  competitors: CompetitorData[]
  marketPosition: {
    rank: number
    percentile: number
    category: 'leader' | 'challenger' | 'follower' | 'niche'
  }
  competitiveGaps: string[]
  opportunities: string[]
  threats: string[]
}

// ROI投资回报分析
export interface ROIData {
  year: number
  investment: number
  revenue: number
  costs: number
  patents: number
  roi: number
  cumulative: number
}

export interface PatentValue {
  patentId: number
  title: string
  estimatedValue: number
  revenue: number
  maintenanceCosts: number
  licensingIncome: number
  litigationCosts: number
  netValue: number
}

export interface ROIAnalysis {
  totalInvestment: number
  totalRevenue: number
  totalROI: number
  yearlyData: ROIData[]
  topPatents: PatentValue[]
  portfolioValue: number
  riskAssessment: {
    level: 'low' | 'medium' | 'high'
    factors: string[]
    recommendations: string[]
  }
}

// 综合分析报告
export interface AnalyticsReport {
  id: string
  title: string
  generatedAt: string
  period: {
    start: string
    end: string
  }
  summary: {
    totalPatents: number
    totalValue: number
    avgROI: number
    topTechField: string
    marketPosition: string
  }
  trends: PatentTrend
  techFields: TechFieldDistribution
  competitors: CompetitorAnalysis
  roi: ROIAnalysis
  insights: string[]
  recommendations: string[]
}

// 分析配置
export interface AnalyticsConfig {
  timeRange: {
    start: string
    end: string
  }
  granularity: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'
  includeCompetitors: boolean
  competitorList: string[]
  techFieldCategories: string[]
  roiCalculationMethod: 'simple' | 'npv' | 'irr'
  confidenceLevel: number
}

// 图表数据
export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    borderColor?: string
    backgroundColor?: string
    fill?: boolean
    tension?: number
  }[]
}

export interface PieChartData {
  labels: string[]
  data: number[]
  backgroundColor: string[]
  borderColor: string[]
}

// 分析指标
export interface KPIMetric {
  name: string
  value: number | string
  unit: string
  trend: 'up' | 'down' | 'stable'
  trendValue: number
  target?: number
  status: 'good' | 'warning' | 'danger'
  description: string
}

// 预测数据
export interface ForecastData {
  metric: string
  historical: number[]
  predicted: number[]
  confidence: number[]
  accuracy: number
  method: string
}

export interface AnalyticsForecast {
  patents: ForecastData
  revenue: ForecastData
  costs: ForecastData
  marketShare: ForecastData
  period: string
  disclaimer: string
}