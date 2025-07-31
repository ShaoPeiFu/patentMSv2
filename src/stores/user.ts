import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useActivityStore } from './activity'

export interface User {
  id: number
  username: string
  email: string
  realName: string
  phone: string
  department: string
  role: 'user' | 'admin' | 'reviewer'
  avatar?: string
  createdAt: string
  lastLoginAt?: string
  password: string // 添加密码字段用于验证
}

// 会话用户类型（不包含密码）
export interface SessionUser {
  id: number
  username: string
  email: string
  realName: string
  phone: string
  department: string
  role: 'user' | 'admin' | 'reviewer'
  avatar?: string
  createdAt: string
  lastLoginAt?: string
}

export interface RegisterForm {
  username: string
  email: string
  password: string
  confirmPassword: string
  realName: string
  phone: string
  department: string
  role: string
  agreeTerms: boolean
}

export const useUserStore = defineStore('user', () => {
  // 状态
  const currentUser = ref<SessionUser | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))
  const loading = ref(false)
  
  // 用户数据存储 - 模拟数据库
  const users = ref<User[]>([
    {
      id: 1,
      username: 'admin',
      email: 'admin@sina.com',
      realName: '系统管理员',
      phone: '13800138000',
      department: 'admin',
      role: 'admin',
      password: '123456', // 默认密码
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: '2024-01-15T10:30:00Z'
    }
  ])

  // 计算属性
  const isLoggedIn = computed(() => !!token.value)
  const isAdmin = computed(() => currentUser.value?.role === 'admin')
  const isReviewer = computed(() => currentUser.value?.role === 'reviewer')

  // 从localStorage加载用户数据
  const loadUsersFromStorage = () => {
    const storedUsers = localStorage.getItem('users')
    if (storedUsers) {
      try {
        users.value = JSON.parse(storedUsers)
      } catch (error) {
        console.error('解析用户数据失败:', error)
      }
    }
  }

  // 保存用户数据到localStorage
  const saveUsersToStorage = () => {
    localStorage.setItem('users', JSON.stringify(users.value))
  }

  // 检查用户名是否已存在
  const isUsernameExists = (username: string) => {
    return users.value.some(user => user.username === username)
  }

  // 检查邮箱是否已存在
  const isEmailExists = (email: string) => {
    return users.value.some(user => user.email === email)
  }

  // 方法
  const login = async (username: string, password: string) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 查找用户
      const user = users.value.find(u => u.username === username)
      
      if (!user) {
        throw new Error('用户名不存在')
      }
      
      if (user.password !== password) {
        throw new Error('密码错误')
      }
      
      // 更新最后登录时间
      user.lastLoginAt = new Date().toISOString()
      saveUsersToStorage()
      
      // 创建用户会话（不包含密码）
      const sessionUser: SessionUser = {
        id: user.id,
        username: user.username,
        email: user.email,
        realName: user.realName,
        phone: user.phone,
        department: user.department,
        role: user.role,
        avatar: user.avatar,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt
      }
      
      const userToken = `token-${user.id}-${Date.now()}`
      
      currentUser.value = sessionUser
      token.value = userToken
      
      localStorage.setItem('token', userToken)
      localStorage.setItem('user', JSON.stringify(sessionUser))
      
      return { success: true, user: sessionUser }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const register = async (form: RegisterForm) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      // 验证用户名是否已存在
      if (isUsernameExists(form.username)) {
        throw new Error('用户名已存在')
      }
      
      // 验证邮箱是否已存在
      if (isEmailExists(form.email)) {
        throw new Error('邮箱已被注册')
      }
      
      // 创建新用户
      const newUser: User = {
        id: Date.now(),
        username: form.username,
        email: form.email,
        realName: form.realName,
        phone: form.phone,
        department: form.department,
        role: form.role as 'user' | 'admin' | 'reviewer',
        password: form.password, // 保存密码用于登录验证
        createdAt: new Date().toISOString()
      }
      
      // 添加到用户列表
      users.value.push(newUser)
      saveUsersToStorage()
      
      // 记录活动
      const activityStore = useActivityStore()
      activityStore.addActivity({
        type: 'user_register',
        title: '用户注册',
        description: newUser.realName,
        userId: newUser.id,
        userName: newUser.realName,
        targetId: newUser.id,
        targetName: newUser.realName,
        status: 'success',
        statusText: '已注册'
      })
      
      console.log('注册成功:', { ...newUser, password: '***' })
      
      return { success: true, user: newUser }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  const logout = () => {
    currentUser.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }

  const loadUserFromStorage = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser && token.value) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch (error) {
        console.error('解析用户信息失败:', error)
        logout()
      }
    }
  }

  const updateProfile = async (updates: Partial<User>) => {
    if (!currentUser.value) return
    
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 更新当前用户信息
      currentUser.value = { ...currentUser.value, ...updates }
      
      // 同时更新用户列表中的信息
      const userIndex = users.value.findIndex(u => u.id === currentUser.value!.id)
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...updates }
        saveUsersToStorage()
      }
      
      localStorage.setItem('user', JSON.stringify(currentUser.value))
      
      return { success: true, user: currentUser.value }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 验证密码
  const verifyPassword = async (password: string) => {
    if (!currentUser.value) return false
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 验证密码
      const user = users.value.find(u => u.id === currentUser.value!.id)
      return user ? user.password === password : false
    } catch (error) {
      console.error('密码验证失败:', error)
      return false
    }
  }

  const changePassword = async (oldPassword: string, newPassword: string) => {
    if (!currentUser.value) return
    
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 验证原密码
      const user = users.value.find(u => u.id === currentUser.value!.id)
      if (!user || user.password !== oldPassword) {
        throw new Error('原密码错误')
      }
      
      // 更新密码
      user.password = newPassword
      saveUsersToStorage()
      
      console.log('密码修改成功')
      return { success: true }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 获取所有用户（用于用户管理）
  const getAllUsers = () => {
    return users.value.map(user => ({
      ...user,
      password: '***' // 隐藏密码
    }))
  }

  // 删除用户
  const deleteUser = (userId: number) => {
    const index = users.value.findIndex(u => u.id === userId)
    if (index !== -1) {
      users.value.splice(index, 1)
      saveUsersToStorage()
      return true
    }
    return false
  }

  // 添加用户
  const addUser = async (userData: Omit<User, 'id' | 'createdAt' | 'lastLoginAt'>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 验证用户名是否已存在
      if (isUsernameExists(userData.username)) {
        throw new Error('用户名已存在')
      }
      
      // 验证邮箱是否已存在
      if (isEmailExists(userData.email)) {
        throw new Error('邮箱已被注册')
      }
      
      // 创建新用户
      const newUser: User = {
        id: Date.now(),
        username: userData.username,
        email: userData.email,
        realName: userData.realName,
        phone: userData.phone,
        department: userData.department,
        role: userData.role,
        password: userData.password,
        createdAt: new Date().toISOString()
      }
      
      // 添加到用户列表
      users.value.push(newUser)
      saveUsersToStorage()
      
      console.log('添加用户成功:', { ...newUser, password: '***' })
      
      return { success: true, user: newUser }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 更新用户
  const updateUser = async (userId: number, updateData: Partial<User>) => {
    loading.value = true
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // 查找用户
      const userIndex = users.value.findIndex(u => u.id === userId)
      if (userIndex === -1) {
        throw new Error('用户不存在')
      }
      
      // 检查邮箱是否被其他用户使用
      if (updateData.email) {
        const existingUser = users.value.find(u => u.id !== userId && u.email === updateData.email)
        if (existingUser) {
          throw new Error('邮箱已被其他用户使用')
        }
      }
      
      // 更新用户信息
      users.value[userIndex] = {
        ...users.value[userIndex],
        ...updateData
      }
      
      // 如果更新的是当前登录用户，也更新currentUser
      if (currentUser.value && currentUser.value.id === userId) {
        currentUser.value = {
          ...currentUser.value,
          ...updateData
        }
        // 同时更新localStorage中的当前用户信息
        localStorage.setItem('currentUser', JSON.stringify(currentUser.value))
      }
      
      saveUsersToStorage()
      
      console.log('更新用户成功:', { ...users.value[userIndex], password: '***' })
      
      return { success: true, user: users.value[userIndex] }
    } catch (error) {
      throw error
    } finally {
      loading.value = false
    }
  }

  // 初始化时加载用户数据
  loadUsersFromStorage()
  loadUserFromStorage()

  return {
    // 状态
    currentUser,
    token,
    loading,
    users,
    
    // 计算属性
    isLoggedIn,
    isAdmin,
    isReviewer,
    
    // 方法
    login,
    register,
    logout,
    updateProfile,
    verifyPassword,
    changePassword,
    loadUserFromStorage,
    getAllUsers,
    deleteUser,
    addUser,
    updateUser,
    isUsernameExists,
    isEmailExists
  }
}) 