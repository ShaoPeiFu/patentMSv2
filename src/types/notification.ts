export interface Notification {
  id: number
  title: string
  content: string
  type: 'info' | 'success' | 'warning' | 'error'
  read: boolean
  createdAt: string
  userId: number
  action?: {
    text: string
    url?: string
    callback?: () => void
  }
}

export interface NotificationSettings {
  emailNotifications: boolean
  pushNotifications: boolean
  patentUpdates: boolean
  systemMessages: boolean
}