import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Activity, ActivityFilter } from '@/types/activity'
import { safeJsonParse } from '@/utils/performance'

export const useActivityStore = defineStore('activity', () => {
  // 状态
  const activities = ref<Activity[]>([])
  const loading = ref(false)
  
  // 确保store在创建时立即初始化
  const initializeStore = () => {
    loadActivitiesFromStorage()
    initializeSampleData()
  }

  // 计算属性
  const recentActivities = computed(() => {
    return activities.value
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 10) // 只返回最近10条活动
  })

  const activitiesByType = computed(() => {
    return activities.value.reduce((acc, activity) => {
      if (!acc[activity.type]) {
        acc[activity.type] = []
      }
      acc[activity.type].push(activity)
      return acc
    }, {} as Record<Activity['type'], Activity[]>)
  })

  // 从localStorage加载活动数据
  const loadActivitiesFromStorage = () => {
    const storedActivities = localStorage.getItem('activities')
    if (storedActivities) {
      activities.value = safeJsonParse(storedActivities, [])
    }
  }

  // 保存活动数据到localStorage
  const saveActivitiesToStorage = () => {
    localStorage.setItem('activities', JSON.stringify(activities.value))
  }

  // 添加活动记录
  const addActivity = (activity: Omit<Activity, 'id' | 'timestamp'>) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now(),
      timestamp: new Date().toISOString()
    }
    
    activities.value.unshift(newActivity) // 添加到开头
    saveActivitiesToStorage()
    
    console.log('添加活动记录:', newActivity)
    console.log('当前活动总数:', activities.value.length)
    return newActivity
  }

  // 批量添加活动记录
  const addActivities = (activitiesList: Omit<Activity, 'id' | 'timestamp'>[]) => {
    const newActivities: Activity[] = activitiesList.map((activity, index) => ({
      ...activity,
      id: Date.now() + index,
      timestamp: new Date().toISOString()
    }))
    
    activities.value.unshift(...newActivities)
    saveActivitiesToStorage()
    
    console.log('批量添加活动记录:', newActivities.length, '条')
    return newActivities
  }

  // 获取活动记录
  const getActivities = (filter?: ActivityFilter) => {
    let filtered = activities.value

    if (filter?.type) {
      filtered = filtered.filter(a => a.type === filter.type)
    }

    if (filter?.userId) {
      filtered = filtered.filter(a => a.userId === filter.userId)
    }

    if (filter?.status) {
      filtered = filtered.filter(a => a.status === filter.status)
    }

    if (filter?.startDate) {
      filtered = filtered.filter(a => new Date(a.timestamp) >= new Date(filter.startDate!))
    }

    if (filter?.endDate) {
      filtered = filtered.filter(a => new Date(a.timestamp) <= new Date(filter.endDate!))
    }

    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  }

  // 删除活动记录
  const deleteActivity = (id: number) => {
    const index = activities.value.findIndex(a => a.id === id)
    if (index !== -1) {
      activities.value.splice(index, 1)
      saveActivitiesToStorage()
      return true
    }
    return false
  }

  // 清空活动记录
  const clearActivities = () => {
    activities.value = []
    saveActivitiesToStorage()
  }

  // 初始化示例数据（如果没有数据）
  const initializeSampleData = () => {
    if (activities.value.length === 0) {
      const sampleActivities: Omit<Activity, 'id' | 'timestamp'>[] = [
        {
          type: 'patent_add',
          title: '新增专利',
          description: '人工智能算法优化',
          userId: 1,
          userName: '系统管理员',
          targetId: 1,
          targetName: '基于深度学习的图像识别方法及系统',
          status: 'success',
          statusText: '已完成'
        },
        {
          type: 'patent_approve',
          title: '专利授权',
          description: '区块链技术应用',
          userId: 1,
          userName: '系统管理员',
          targetId: 2,
          targetName: '区块链技术在供应链管理中的应用方法',
          status: 'success',
          statusText: '已授权'
        },
        {
          type: 'patent_review',
          title: '专利审核',
          description: '物联网设备管理',
          userId: 1,
          userName: '系统管理员',
          targetId: 3,
          targetName: '物联网设备管理系统',
          status: 'pending',
          statusText: '审核中'
        },
        {
          type: 'patent_expire',
          title: '专利即将过期',
          description: '移动应用开发',
          userId: 1,
          userName: '系统管理员',
          targetId: 4,
          targetName: '移动应用开发框架',
          status: 'warning',
          statusText: '需处理'
        },
        {
          type: 'user_register',
          title: '用户注册',
          description: '张三',
          userId: 2,
          userName: '张三',
          targetId: 2,
          targetName: '张三',
          status: 'success',
          statusText: '已注册'
        }
      ]

      addActivities(sampleActivities)
    }
  }

  // 立即初始化store
  initializeStore()

  return {
    // 状态
    activities,
    loading,
    
    // 计算属性
    recentActivities,
    activitiesByType,
    
    // 方法
    addActivity,
    addActivities,
    getActivities,
    deleteActivity,
    clearActivities,
    loadActivitiesFromStorage,
    saveActivitiesToStorage,
    initializeSampleData
  }
}) 