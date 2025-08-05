import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Notification, NotificationSettings } from '@/types/notification'

export const useNotificationStore = defineStore('notification', () => {
  // 通知列表
  const notifications = ref<Notification[]>([])
  
  // 通知设置
  const settings = ref<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    patentUpdates: true,
    systemMessages: true,
  })

  // 计算属性
  const unreadCount = computed(() => 
    notifications.value.filter(n => !n.read).length
  )

  const recentNotifications = computed(() => 
    notifications.value
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 10)
  )

  const unreadNotifications = computed(() => 
    notifications.value.filter(n => !n.read)
  )

  // 添加通知
  const addNotification = (notification: Omit<Notification, 'id' | 'createdAt' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: Date.now(),
      createdAt: new Date().toISOString(),
      read: false,
    }
    
    notifications.value.unshift(newNotification)
    saveToStorage()
    
    return newNotification
  }

  // 标记为已读
  const markAsRead = (notificationId: number) => {
    const notification = notifications.value.find(n => n.id === notificationId)
    if (notification) {
      notification.read = true
      saveToStorage()
    }
  }

  // 标记所有为已读
  const markAllAsRead = () => {
    notifications.value.forEach(n => n.read = true)
    saveToStorage()
  }

  // 删除通知
  const deleteNotification = (notificationId: number) => {
    const index = notifications.value.findIndex(n => n.id === notificationId)
    if (index !== -1) {
      notifications.value.splice(index, 1)
      saveToStorage()
    }
  }

  // 清空所有通知
  const clearAllNotifications = () => {
    notifications.value = []
    saveToStorage()
  }

  // 保存到本地存储
  const saveToStorage = () => {
    localStorage.setItem('notifications', JSON.stringify(notifications.value))
    localStorage.setItem('notificationSettings', JSON.stringify(settings.value))
  }

  // 从本地存储加载
  const loadFromStorage = () => {
    try {
      const savedNotifications = localStorage.getItem('notifications')
      const savedSettings = localStorage.getItem('notificationSettings')
      
      if (savedNotifications) {
        notifications.value = JSON.parse(savedNotifications)
      }
      
      if (savedSettings) {
        settings.value = { ...settings.value, ...JSON.parse(savedSettings) }
      }
    } catch (error) {
      console.error('加载通知数据失败:', error)
    }
  }

  // 更新设置
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    settings.value = { ...settings.value, ...newSettings }
    saveToStorage()
  }

  // 创建系统通知的便捷方法
  const createSystemNotification = (title: string, content: string, type: Notification['type'] = 'info') => {
    return addNotification({
      title,
      content,
      type,
      userId: 0, // 系统通知
    })
  }

  // 创建专利相关通知
  const createPatentNotification = (
    patentTitle: string, 
    action: string, 
    userId: number,
    patentId?: number
  ) => {
    const actionMap: Record<string, { title: string; type: Notification['type'] }> = {
      'created': { title: '专利申请已提交', type: 'success' },
      'approved': { title: '专利申请已通过', type: 'success' },
      'rejected': { title: '专利申请被拒绝', type: 'warning' },
      'expired': { title: '专利即将过期', type: 'warning' },
      'renewed': { title: '专利已续费', type: 'success' },
    }

    const config = actionMap[action] || { title: '专利状态更新', type: 'info' }
    
    return addNotification({
      title: config.title,
      content: `专利"${patentTitle}"${config.title.includes('已') ? '' : '，请及时处理'}`,
      type: config.type,
      userId,
      action: patentId ? {
        text: '查看详情',
        url: `/dashboard/patents/${patentId}`
      } : undefined
    })
  }

  // 初始化一些示例通知
  const initializeExampleNotifications = () => {
    if (notifications.value.length === 0) {
      addNotification({
        title: '欢迎使用专利管理系统',
        content: '您已成功登录专利管理系统，开始管理您的专利申请吧！',
        type: 'success',
        userId: 1,
      })

      addNotification({
        title: '系统维护通知',
        content: '系统将于今晚23:00-24:00进行例行维护，期间可能影响部分功能使用。',
        type: 'warning',
        userId: 1,
      })

      addNotification({
        title: '新功能上线',
        content: '专利文档管理功能已上线，现在您可以上传和管理专利相关文档。',
        type: 'info',
        userId: 1,
      })
    }
  }

  // 初始化
  loadFromStorage()

  return {
    // 状态
    notifications,
    settings,
    
    // 计算属性
    unreadCount,
    recentNotifications,
    unreadNotifications,
    
    // 方法
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    createSystemNotification,
    createPatentNotification,
    initializeExampleNotifications,
    loadFromStorage,
  }
})