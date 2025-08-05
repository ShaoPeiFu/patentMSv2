import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { 
  AdvancedSearchParams, 
  SearchHistory, 
  SearchSuggestion, 
  SearchCondition,
  SearchFieldConfig,

} from '@/types/search'

export const useSearchStore = defineStore('search', () => {
  // 搜索历史
  const searchHistory = ref<SearchHistory[]>([])
  
  // 保存的搜索条件
  const savedSearches = ref<AdvancedSearchParams[]>([])
  
  // 搜索建议
  const searchSuggestions = ref<SearchSuggestion[]>([])
  
  // 当前搜索条件
  const currentSearchConditions = ref<SearchCondition[]>([])
  
  // 搜索字段配置
  const searchFields = ref<SearchFieldConfig[]>([
    {
      key: 'title',
      label: '专利标题',
      type: 'text',
      operators: ['contains', 'startsWith', 'endsWith', 'eq'],
      placeholder: '请输入专利标题'
    },
    {
      key: 'patentNumber',
      label: '专利号',
      type: 'text',
      operators: ['eq', 'contains', 'startsWith'],
      placeholder: '请输入专利号'
    },
    {
      key: 'status',
      label: '专利状态',
      type: 'select',
      operators: ['eq', 'ne', 'in'],
      options: [
        { label: '待审核', value: 'pending' },
        { label: '已批准', value: 'approved' },
        { label: '已拒绝', value: 'rejected' },
        { label: '已过期', value: 'expired' },
        { label: '维护中', value: 'maintained' }
      ]
    },
    {
      key: 'type',
      label: '专利类型',
      type: 'select',
      operators: ['eq', 'ne', 'in'],
      options: [
        { label: '发明专利', value: 'invention' },
        { label: '实用新型', value: 'utility_model' },
        { label: '外观设计', value: 'design' },
        { label: '软件专利', value: 'software' }
      ]
    },
    {
      key: 'applicants',
      label: '申请人',
      type: 'text',
      operators: ['contains', 'eq'],
      placeholder: '请输入申请人姓名'
    },
    {
      key: 'inventors',
      label: '发明人',
      type: 'text',
      operators: ['contains', 'eq'],
      placeholder: '请输入发明人姓名'
    },
    {
      key: 'applicationDate',
      label: '申请日期',
      type: 'date',
      operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
      format: 'YYYY-MM-DD'
    },
    {
      key: 'expirationDate',
      label: '到期日期',
      type: 'date',
      operators: ['eq', 'gt', 'gte', 'lt', 'lte', 'between'],
      format: 'YYYY-MM-DD'
    },
    {
      key: 'categoryId',
      label: '专利分类',
      type: 'select',
      operators: ['eq', 'ne', 'in'],
      options: [] // 动态加载
    }
  ])

  // 计算属性
  const recentSearchHistory = computed(() => 
    searchHistory.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10)
  )

  const popularKeywords = computed(() => {
    const keywordCount: Record<string, number> = {}
    
    searchHistory.value.forEach(history => {
      const words = history.query.toLowerCase().split(/\s+/).filter(word => word.length > 1)
      words.forEach(word => {
        keywordCount[word] = (keywordCount[word] || 0) + 1
      })
    })

    return Object.entries(keywordCount)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([keyword, count]) => ({ keyword, count }))
  })

  const frequentSuggestions = computed(() =>
    searchSuggestions.value
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 20)
  )

  // 添加搜索历史
  const addSearchHistory = (query: string, resultCount: number, conditions?: SearchCondition[]) => {
    const history: SearchHistory = {
      id: Date.now().toString(),
      query,
      conditions,
      timestamp: new Date().toISOString(),
      resultCount,
      userId: 1 // 当前用户ID
    }

    // 检查是否已存在相同查询
    const existingIndex = searchHistory.value.findIndex(h => 
      h.query === query && JSON.stringify(h.conditions) === JSON.stringify(conditions)
    )

    if (existingIndex !== -1) {
      // 更新现有记录
      searchHistory.value[existingIndex].timestamp = history.timestamp
      searchHistory.value[existingIndex].resultCount = resultCount
    } else {
      // 添加新记录
      searchHistory.value.unshift(history)
      
      // 限制历史记录数量
      if (searchHistory.value.length > 100) {
        searchHistory.value = searchHistory.value.slice(0, 100)
      }
    }

    saveToStorage()
    updateSearchSuggestions(query)
  }

  // 保存搜索条件
  const saveSearchConditions = (params: Omit<AdvancedSearchParams, 'id' | 'createdAt' | 'useCount'>) => {
    const savedSearch: AdvancedSearchParams = {
      ...params,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      useCount: 0
    }

    savedSearches.value.push(savedSearch)
    saveToStorage()
    
    return savedSearch
  }

  // 使用保存的搜索条件
  const useSavedSearch = (searchId: string) => {
    const search = savedSearches.value.find(s => s.id === searchId)
    if (search) {
      search.lastUsed = new Date().toISOString()
      search.useCount += 1
      currentSearchConditions.value = [...search.conditions]
      saveToStorage()
      return search
    }
    return null
  }

  // 删除保存的搜索
  const deleteSavedSearch = (searchId: string) => {
    const index = savedSearches.value.findIndex(s => s.id === searchId)
    if (index !== -1) {
      savedSearches.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 更新保存的搜索
  const updateSavedSearch = (searchId: string, updates: Partial<AdvancedSearchParams>) => {
    const search = savedSearches.value.find(s => s.id === searchId)
    if (search) {
      Object.assign(search, updates)
      saveToStorage()
    }
  }

  // 清空搜索历史
  const clearSearchHistory = () => {
    searchHistory.value = []
    saveToStorage()
  }

  // 删除单个搜索历史
  const deleteSearchHistory = (historyId: string) => {
    const index = searchHistory.value.findIndex(h => h.id === historyId)
    if (index !== -1) {
      searchHistory.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 更新搜索建议
  const updateSearchSuggestions = (query: string) => {
    const words = query.toLowerCase().split(/\s+/).filter(word => word.length > 1)
    
    words.forEach(word => {
      const existing = searchSuggestions.value.find(s => s.value === word)
      if (existing) {
        existing.frequency += 1
      } else {
        searchSuggestions.value.push({
          id: Date.now().toString() + Math.random(),
          text: word,
          type: 'keyword',
          value: word,
          frequency: 1
        })
      }
    })

    // 限制建议数量
    if (searchSuggestions.value.length > 500) {
      searchSuggestions.value = searchSuggestions.value
        .sort((a, b) => b.frequency - a.frequency)
        .slice(0, 500)
    }

    saveToStorage()
  }

  // 获取搜索建议
  const getSearchSuggestions = (query: string, limit = 10): SearchSuggestion[] => {
    if (!query || query.length < 2) return []

    const lowerQuery = query.toLowerCase()
    
    return searchSuggestions.value
      .filter(s => s.value.toLowerCase().includes(lowerQuery))
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, limit)
  }

  // 执行搜索条件
  const executeSearch = (data: any[], conditions: SearchCondition[]): any[] => {
    if (!conditions.length) return data

    return data.filter(item => {
      let result = true
      let currentLogic: 'and' | 'or' = 'and'

      for (let i = 0; i < conditions.length; i++) {
        const condition = conditions[i]
        const fieldValue = getNestedValue(item, condition.field)
        const conditionResult = evaluateCondition(fieldValue, condition)

        if (i === 0) {
          result = conditionResult
        } else {
          if (currentLogic === 'and') {
            result = result && conditionResult
          } else {
            result = result || conditionResult
          }
        }

        // 为下一次迭代设置逻辑运算符
        if (condition.logic) {
          currentLogic = condition.logic
        }
      }

      return result
    })
  }

  // 获取嵌套对象值
  const getNestedValue = (obj: any, path: string): any => {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  // 评估单个条件
  const evaluateCondition = (fieldValue: any, condition: SearchCondition): boolean => {
    const { operator, value, value2 } = condition

    // 处理空值
    if (fieldValue == null) {
      return operator === 'ne' ? value != null : false
    }

    // 转换为字符串进行比较（对于contains等操作）
    const fieldStr = String(fieldValue).toLowerCase()
    const valueStr = String(value).toLowerCase()

    switch (operator) {
      case 'eq':
        return fieldValue === value
      case 'ne':
        return fieldValue !== value
      case 'contains':
        return fieldStr.includes(valueStr)
      case 'startsWith':
        return fieldStr.startsWith(valueStr)
      case 'endsWith':
        return fieldStr.endsWith(valueStr)
      case 'gt':
        return fieldValue > value
      case 'gte':
        return fieldValue >= value
      case 'lt':
        return fieldValue < value
      case 'lte':
        return fieldValue <= value
      case 'between':
        return fieldValue >= value && fieldValue <= value2
      case 'in':
        return Array.isArray(value) ? value.includes(fieldValue) : false
      case 'notIn':
        return Array.isArray(value) ? !value.includes(fieldValue) : true
      default:
        return false
    }
  }

  // 导出搜索历史
  const exportSearchHistory = (): string => {
    return JSON.stringify({
      searchHistory: searchHistory.value,
      savedSearches: savedSearches.value,
      exportDate: new Date().toISOString()
    }, null, 2)
  }

  // 导入搜索历史
  const importSearchHistory = (data: string): boolean => {
    try {
      const parsed = JSON.parse(data)
      if (parsed.searchHistory && Array.isArray(parsed.searchHistory)) {
        searchHistory.value = parsed.searchHistory
      }
      if (parsed.savedSearches && Array.isArray(parsed.savedSearches)) {
        savedSearches.value = parsed.savedSearches
      }
      saveToStorage()
      return true
    } catch (error) {
      console.error('导入搜索数据失败:', error)
      return false
    }
  }

  // 保存到本地存储
  const saveToStorage = () => {
    try {
      localStorage.setItem('searchHistory', JSON.stringify(searchHistory.value))
      localStorage.setItem('savedSearches', JSON.stringify(savedSearches.value))
      localStorage.setItem('searchSuggestions', JSON.stringify(searchSuggestions.value))
    } catch (error) {
      console.error('保存搜索数据失败:', error)
    }
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const history = localStorage.getItem('searchHistory')
      const saved = localStorage.getItem('savedSearches')
      const suggestions = localStorage.getItem('searchSuggestions')

      if (history) {
        searchHistory.value = JSON.parse(history)
      }
      if (saved) {
        savedSearches.value = JSON.parse(saved)
      }
      if (suggestions) {
        searchSuggestions.value = JSON.parse(suggestions)
      }
    } catch (error) {
      console.error('加载搜索数据失败:', error)
    }
  }

  // 更新分类选项
  const updateCategoryOptions = (categories: Array<{ id: number; name: string }>) => {
    const categoryField = searchFields.value.find(f => f.key === 'categoryId')
    if (categoryField) {
      categoryField.options = categories.map(cat => ({
        label: cat.name,
        value: cat.id
      }))
    }
  }

  // 初始化
  loadFromStorage()

  return {
    // 状态
    searchHistory,
    savedSearches,
    searchSuggestions,
    currentSearchConditions,
    searchFields,

    // 计算属性
    recentSearchHistory,
    popularKeywords,
    frequentSuggestions,

    // 方法
    addSearchHistory,
    saveSearchConditions,
    useSavedSearch,
    deleteSavedSearch,
    updateSavedSearch,
    clearSearchHistory,
    deleteSearchHistory,
    updateSearchSuggestions,
    getSearchSuggestions,
    executeSearch,
    exportSearchHistory,
    importSearchHistory,
    updateCategoryOptions,
    loadFromStorage,
  }
})