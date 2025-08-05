export interface SearchCondition {
  field: string
  operator: 'eq' | 'ne' | 'contains' | 'startsWith' | 'endsWith' | 'gt' | 'gte' | 'lt' | 'lte' | 'between' | 'in' | 'notIn'
  value: any
  value2?: any // 用于between操作符
  logic?: 'and' | 'or'
}

export interface AdvancedSearchParams {
  id?: string
  name: string
  description?: string
  conditions: SearchCondition[]
  createdAt: string
  lastUsed?: string
  useCount: number
}

export interface SearchHistory {
  id: string
  query: string
  conditions?: SearchCondition[]
  timestamp: string
  resultCount: number
  userId: number
}

export interface SearchSuggestion {
  id: string
  text: string
  type: 'keyword' | 'patentNumber' | 'inventor' | 'applicant' | 'category'
  value: string
  frequency: number
}

export interface SearchStats {
  totalSearches: number
  popularKeywords: Array<{ keyword: string; count: number }>
  recentSearches: SearchHistory[]
  savedSearches: AdvancedSearchParams[]
}

// 搜索字段配置
export interface SearchFieldConfig {
  key: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'multiSelect'
  operators: string[]
  options?: Array<{ label: string; value: any }>
  placeholder?: string
  format?: string
}

// 搜索结果
export interface SearchResult<T = any> {
  data: T[]
  total: number
  page: number
  pageSize: number
  query: string
  conditions?: SearchCondition[]
  executionTime: number
}