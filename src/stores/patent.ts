import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Patent, PatentCategory, PatentStatus, PatentType, PatentStatistics } from '@/types/patent'
import { useActivityStore } from './activity'
import { useUserStore } from './user'

// 专利申请接口
export interface PatentApplication {
  id: number
  patentId: number
  patentNumber: string
  title: string
  type: PatentType
  applicant: string
  submitDate: string
  status: 'pending' | 'approved' | 'rejected'
  priority: 'high' | 'medium' | 'low'
  reviewHistory: ReviewHistoryItem[]
  description: string
  technicalField: string
  keywords: string[]
  applicants: string[]
  inventors: string[]
  categoryId: number
}

// 审核历史项
export interface ReviewHistoryItem {
  id: number
  reviewer: string
  action: string
  comment?: string
  time: string
}

export const usePatentStore = defineStore('patent', () => {
  // 状态
  const patents = ref<Patent[]>([])
  const categories = ref<PatentCategory[]>([])
  const applications = ref<PatentApplication[]>([]) // 专利申请列表
  const loading = ref(false)
  const currentPatent = ref<Patent | null>(null)
  const searchKeyword = ref('')
  const filterStatus = ref<PatentStatus | ''>('')
  const filterType = ref<PatentType | ''>('')
  const filterCategory = ref<number | ''>('')

  // 计算属性
  const totalPatents = computed(() => patents.value.length)
  
  const patentsByStatus = computed(() => {
    const grouped = patents.value.reduce((acc, patent) => {
      const status = patent.status
      if (!acc[status]) {
        acc[status] = []
      }
      acc[status].push(patent)
      return acc
    }, {} as Record<PatentStatus, Patent[]>)
    return grouped
  })

  const patentsByCategory = computed(() => {
    return patents.value.reduce((acc, patent) => {
      const categoryId = patent.categoryId
      if (!acc[categoryId]) {
        acc[categoryId] = []
      }
      acc[categoryId].push(patent)
      return acc
    }, {} as Record<number, Patent[]>)
  })

  // 真实统计数据计算
  const statistics = computed((): PatentStatistics => {
    const now = new Date()
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const sixMonthsFromNow = new Date(now.getTime() + 6 * 30 * 24 * 60 * 60 * 1000)

    const expiringSoon = patents.value.filter(patent => {
      if (!patent.expirationDate) return false
      const expirationDate = new Date(patent.expirationDate)
      return expirationDate <= thirtyDaysFromNow && expirationDate > now
    }).length

    const maintenanceDue = patents.value.filter(patent => {
      // 检查是否有即将到期的维护费
      const hasMaintenanceFee = patent.fees.some(fee => {
        const dueDate = new Date(fee.dueDate)
        return dueDate <= sixMonthsFromNow && dueDate > now && fee.type === 'maintenance'
      })
      return hasMaintenanceFee
    }).length

    const recentApplications = patents.value.filter(patent => {
      const applicationDate = new Date(patent.applicationDate)
      const sixMonthsAgo = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
      return applicationDate >= sixMonthsAgo
    }).length

    return {
      total: patents.value.length,
      byStatus: Object.keys(patentsByStatus.value).reduce((acc, status) => {
        acc[status as PatentStatus] = patentsByStatus.value[status as PatentStatus]?.length || 0
        return acc
      }, {} as Record<PatentStatus, number>),
      byType: patents.value.reduce((acc, patent) => {
        acc[patent.type] = (acc[patent.type] || 0) + 1
        return acc
      }, {} as Record<PatentType, number>),
      byCategory: Object.keys(patentsByCategory.value).reduce((acc, categoryId) => {
        acc[parseInt(categoryId)] = patentsByCategory.value[parseInt(categoryId)]?.length || 0
        return acc
      }, {} as Record<number, number>),
      byYear: patents.value.reduce((acc, patent) => {
        const year = new Date(patent.applicationDate).getFullYear()
        acc[year] = (acc[year] || 0) + 1
        return acc
      }, {} as Record<number, number>),
      recentApplications,
      expiringSoon,
      maintenanceDue
    }
  })

  // 过滤后的专利列表
  const filteredPatents = computed(() => {
    let filtered = patents.value

    // 关键词搜索
    if (searchKeyword.value.trim()) {
      const keyword = searchKeyword.value.toLowerCase()
      filtered = filtered.filter(patent => 
        patent.title.toLowerCase().includes(keyword) ||
        patent.description.toLowerCase().includes(keyword) ||
        patent.patentNumber.toLowerCase().includes(keyword) ||
        patent.abstract.toLowerCase().includes(keyword) ||
        patent.keywords.some(k => k.toLowerCase().includes(keyword)) ||
        patent.applicants.some(a => a.toLowerCase().includes(keyword)) ||
        patent.inventors.some(i => i.toLowerCase().includes(keyword))
      )
    }

    // 状态过滤
    if (filterStatus.value) {
      filtered = filtered.filter(patent => patent.status === filterStatus.value)
    }

    // 类型过滤
    if (filterType.value) {
      filtered = filtered.filter(patent => patent.type === filterType.value)
    }

    // 分类过滤
    if (filterCategory.value) {
      filtered = filtered.filter(patent => patent.categoryId === filterCategory.value)
    }

    return filtered
  })

  // 数据验证
  const validatePatent = (patent: Partial<Patent>): string[] => {
    const errors: string[] = []
    
    if (!patent.title?.trim()) {
      errors.push('专利标题不能为空')
    }
    
    if (!patent.patentNumber?.trim()) {
      errors.push('专利号不能为空')
    }
    
    if (!patent.applicationDate) {
      errors.push('申请日期不能为空')
    }
    
    if (!patent.type) {
      errors.push('专利类型不能为空')
    }
    
    if (!patent.status) {
      errors.push('专利状态不能为空')
    }
    
    // 申请人验证 - 如果为空数组，使用默认值
    if (!patent.applicants || patent.applicants.length === 0) {
      patent.applicants = ["新浪科技有限公司"]
    }
    
    // 发明人验证 - 如果为空数组，使用默认值
    if (!patent.inventors || patent.inventors.length === 0) {
      patent.inventors = ["系统管理员"]
    }
    
    // 检查专利号是否重复（编辑时排除自身）
    if (patent.patentNumber && patent.patentNumber.trim()) {
      const duplicatePatent = patents.value.find(p => 
        p.patentNumber === patent.patentNumber && p.id !== patent.id
      )
      
      if (duplicatePatent) {
        errors.push('专利号已存在')
      }
    }
    
    return errors
  }

  // 方法
  const fetchPatents = async () => {
    loading.value = true
    try {
      // 从localStorage加载数据，如果没有则使用真实示例数据
      const storedPatents = localStorage.getItem('patents')
      if (storedPatents) {
        patents.value = JSON.parse(storedPatents)
      } else {
        // 使用真实的示例数据
        patents.value = [
          {
            id: 1,
            title: "基于深度学习的图像识别方法及系统",
            description: "本发明公开了一种基于深度学习的图像识别方法及系统，包括图像预处理模块、特征提取模块、分类识别模块等。该方法能够有效提高图像识别的准确率和处理速度。",
            patentNumber: "CN202310123456.7",
            applicationNumber: "CN202310123456.7",
            applicationDate: "2023-01-15",
            publicationDate: "2023-07-15",
            grantDate: "2023-12-01",
            expirationDate: "2043-01-15",
            status: "approved",
            type: "invention",
            categoryId: 1,
            applicants: ["新浪科技有限公司", "北京新浪网络技术有限公司"],
            inventors: ["张三", "李四", "王五"],
            priorityDate: "2023-01-15",
            priorityCountry: "CN",
            legalStatus: "active",
            abstract: "本发明涉及计算机视觉技术领域，具体涉及一种基于深度学习的图像识别方法及系统。该方法通过改进的卷积神经网络结构，结合注意力机制和多尺度特征融合技术，实现了高精度的图像识别。",
            claims: [
              "1. 一种基于深度学习的图像识别方法，其特征在于，包括以下步骤：",
              "2. 根据权利要求1所述的方法，其特征在于，所述特征提取模块采用改进的ResNet网络结构。",
              "3. 根据权利要求1所述的方法，其特征在于，所述分类识别模块采用Softmax分类器。"
            ],
            technicalField: "计算机视觉、人工智能",
            keywords: ["深度学习", "图像识别", "卷积神经网络", "计算机视觉"],
            documents: [
              { id: 1, patentId: 1, name: "说明书", type: "application", fileUrl: "/documents/1.pdf", fileSize: 1024000, uploadedAt: "2023-01-15T00:00:00Z", uploadedBy: 1 },
              { id: 2, patentId: 1, name: "权利要求书", type: "application", fileUrl: "/documents/2.pdf", fileSize: 512000, uploadedAt: "2023-01-15T00:00:00Z", uploadedBy: 1 },
              { id: 3, patentId: 1, name: "摘要附图", type: "application", fileUrl: "/documents/3.pdf", fileSize: 2048000, uploadedAt: "2023-01-15T00:00:00Z", uploadedBy: 1 }
            ],
            fees: [
              { id: 1, patentId: 1, type: "application", amount: 500, currency: "CNY", dueDate: "2023-01-15", status: "paid", paidDate: "2023-01-15" },
              { id: 2, patentId: 1, type: "maintenance", amount: 1200, currency: "CNY", dueDate: "2024-01-15", status: "pending" }
            ],
            timeline: [
              { id: 1, patentId: 1, type: "application", title: "申请提交", description: "专利申请正式提交", date: "2023-01-15" },
              { id: 2, patentId: 1, type: "publication", title: "公开", description: "专利申请公开", date: "2023-07-15" },
              { id: 3, patentId: 1, type: "grant", title: "授权", description: "专利获得授权", date: "2023-12-01" }
            ],
            createdAt: "2023-01-15T00:00:00Z",
            updatedAt: "2023-12-01T00:00:00Z",
            createdBy: 1,
            updatedBy: 1,
          },
          {
            id: 2,
            title: "区块链技术在供应链管理中的应用方法",
            description: "本发明公开了一种区块链技术在供应链管理中的应用方法，通过智能合约实现供应链各环节的自动化管理和数据共享。",
            patentNumber: "CN202310234567.8",
            applicationNumber: "CN202310234567.8",
            applicationDate: "2023-02-20",
            publicationDate: "2023-08-20",
            grantDate: "2023-12-15",
            expirationDate: "2043-02-20",
            status: "approved",
            type: "invention",
            categoryId: 2,
            applicants: ["新浪科技有限公司"],
            inventors: ["赵六", "钱七", "孙八"],
            priorityDate: "2023-02-20",
            priorityCountry: "CN",
            legalStatus: "active",
            abstract: "本发明涉及区块链技术领域，具体涉及一种区块链技术在供应链管理中的应用方法。该方法通过构建分布式账本和智能合约，实现了供应链各环节的透明化管理和自动化执行。",
            claims: [
              "1. 一种区块链技术在供应链管理中的应用方法，其特征在于，包括以下步骤：",
              "2. 根据权利要求1所述的方法，其特征在于，所述智能合约采用Solidity语言编写。",
              "3. 根据权利要求1所述的方法，其特征在于，所述分布式账本采用联盟链架构。"
            ],
            technicalField: "区块链、供应链管理",
            keywords: ["区块链", "供应链管理", "智能合约", "分布式账本"],
            documents: [
              { id: 4, patentId: 2, name: "说明书", type: "application", fileUrl: "/documents/4.pdf", fileSize: 1024000, uploadedAt: "2023-02-20T00:00:00Z", uploadedBy: 1 },
              { id: 5, patentId: 2, name: "权利要求书", type: "application", fileUrl: "/documents/5.pdf", fileSize: 512000, uploadedAt: "2023-02-20T00:00:00Z", uploadedBy: 1 }
            ],
            fees: [
              { id: 3, patentId: 2, type: "application", amount: 500, currency: "CNY", dueDate: "2023-02-20", status: "paid", paidDate: "2023-02-20" },
              { id: 4, patentId: 2, type: "maintenance", amount: 1200, currency: "CNY", dueDate: "2024-02-20", status: "pending" }
            ],
            timeline: [
              { id: 4, patentId: 2, type: "application", title: "申请提交", description: "专利申请正式提交", date: "2023-02-20" },
              { id: 5, patentId: 2, type: "publication", title: "公开", description: "专利申请公开", date: "2023-08-20" },
              { id: 6, patentId: 2, type: "grant", title: "授权", description: "专利获得授权", date: "2023-12-15" }
            ],
            createdAt: "2023-02-20T00:00:00Z",
            updatedAt: "2023-12-15T00:00:00Z",
            createdBy: 1,
            updatedBy: 1,
          },
          {
            id: 3,
            title: "移动端用户界面交互优化方法",
            description: "本发明公开了一种移动端用户界面交互优化方法，通过改进的触摸响应算法和界面布局优化，提升用户体验。",
            patentNumber: "CN202310345678.9",
            applicationNumber: "CN202310345678.9",
            applicationDate: "2023-03-10",
            publicationDate: "2023-09-10",
            grantDate: undefined,
            expirationDate: undefined,
            status: "pending",
            type: "invention",
            categoryId: 3,
            applicants: ["新浪科技有限公司"],
            inventors: ["周九", "吴十"],
            priorityDate: "2023-03-10",
            priorityCountry: "CN",
            legalStatus: "pending",
            abstract: "本发明涉及移动应用开发技术领域，具体涉及一种移动端用户界面交互优化方法。该方法通过改进的触摸响应算法和界面布局优化，实现了更流畅的用户交互体验。",
            claims: [
              "1. 一种移动端用户界面交互优化方法，其特征在于，包括以下步骤：",
              "2. 根据权利要求1所述的方法，其特征在于，所述触摸响应算法采用多点触控技术。"
            ],
            technicalField: "移动应用开发、用户界面",
            keywords: ["移动端", "用户界面", "交互优化", "触摸响应"],
            documents: [
              { id: 6, patentId: 3, name: "说明书", type: "application", fileUrl: "/documents/6.pdf", fileSize: 1024000, uploadedAt: "2023-03-10T00:00:00Z", uploadedBy: 1 },
              { id: 7, patentId: 3, name: "权利要求书", type: "application", fileUrl: "/documents/7.pdf", fileSize: 512000, uploadedAt: "2023-03-10T00:00:00Z", uploadedBy: 1 }
            ],
            fees: [
              { id: 5, patentId: 3, type: "application", amount: 500, currency: "CNY", dueDate: "2023-03-10", status: "paid", paidDate: "2023-03-10" }
            ],
            timeline: [
              { id: 7, patentId: 3, type: "application", title: "申请提交", description: "专利申请正式提交", date: "2023-03-10" },
              { id: 8, patentId: 3, type: "publication", title: "公开", description: "专利申请公开", date: "2023-09-10" }
            ],
            createdAt: "2023-03-10T00:00:00Z",
            updatedAt: "2023-09-10T00:00:00Z",
            createdBy: 1,
            updatedBy: 1,
          }
        ]
        // 保存真实数据到localStorage
        localStorage.setItem('patents', JSON.stringify(patents.value))
      }
    } catch (error) {
      console.error('获取专利列表失败:', error)
    } finally {
      loading.value = false
    }
  }

  const addPatent = async (patent: Omit<Patent, 'id'>) => {
    try {
      // 数据验证
      const errors = validatePatent(patent)
      if (errors.length > 0) {
        throw new Error(errors.join('; '))
      }

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 创建新专利对象，生成ID
      const newPatent: Patent = {
        ...patent,
        id: Date.now(), // 使用时间戳作为临时ID
      }
      
      // 添加到本地数组
      patents.value.push(newPatent)
      
      // 保存到localStorage
      localStorage.setItem('patents', JSON.stringify(patents.value))
      
      // 记录活动
      const activityStore = useActivityStore()
      activityStore.addActivity({
        type: 'patent_add',
        title: '新增专利',
        description: newPatent.title,
        userId: 1, // 当前用户ID
        userName: '系统管理员',
        targetId: newPatent.id,
        targetName: newPatent.title,
        status: 'success',
        statusText: '已完成'
      })
      
      return newPatent
    } catch (error) {
      console.error('添加专利失败:', error)
      throw error
    }
  }

  const updatePatent = async (id: number, updates: Partial<Patent>) => {
    try {
      // 为更新数据添加id，用于验证时排除自身
      const updatesWithId = { ...updates, id }
      const errors = validatePatent(updatesWithId)
      
      if (errors.length > 0) {
        throw new Error(errors.join('; '))
      }

      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      const index = patents.value.findIndex(p => p.id === id)
      if (index !== -1) {
        patents.value[index] = {
          ...patents.value[index],
          ...updates,
          updatedAt: new Date().toISOString(),
          updatedBy: 1, // 当前用户ID
        }
        // 保存到localStorage
        localStorage.setItem('patents', JSON.stringify(patents.value))
        
        // 记录编辑活动
        const activityStore = useActivityStore()
        activityStore.addActivity({
          type: 'patent_review',
          title: '编辑专利',
          description: patents.value[index].title,
          userId: 1, // 当前用户ID
          userName: '系统管理员',
          targetId: patents.value[index].id,
          targetName: patents.value[index].title,
          status: 'success',
          statusText: '已更新'
        })
        
        return patents.value[index]
      }
      throw new Error('专利不存在')
    } catch (error) {
      console.error('更新专利失败:', error)
      throw error
    }
  }

  const deletePatent = async (id: number) => {
    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 500))
      
      patents.value = patents.value.filter(p => p.id !== id)
      // 保存到localStorage
      localStorage.setItem('patents', JSON.stringify(patents.value))
    } catch (error) {
      console.error('删除专利失败:', error)
      throw error
    }
  }

  const fetchCategories = async () => {
    try {
      // 从localStorage加载分类数据，如果没有则使用默认数据
      const storedCategories = localStorage.getItem('patentCategories')
      if (storedCategories) {
        categories.value = JSON.parse(storedCategories)
      } else {
        // 使用真实的分类数据
        categories.value = [
          { id: 1, name: "人工智能", description: "人工智能相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 2, name: "区块链", description: "区块链技术相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 3, name: "移动应用", description: "移动应用开发相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 4, name: "网络安全", description: "网络安全相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 5, name: "大数据", description: "大数据处理相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 6, name: "云计算", description: "云计算技术相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 7, name: "物联网", description: "物联网技术相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" },
          { id: 8, name: "5G通信", description: "5G通信技术相关专利", parentId: undefined, createdAt: "2023-01-01T00:00:00Z", updatedAt: "2023-01-01T00:00:00Z" }
        ]
        localStorage.setItem('patentCategories', JSON.stringify(categories.value))
      }
    } catch (error) {
      console.error('获取分类列表失败:', error)
    }
  }

  const searchPatents = (keyword: string) => {
    searchKeyword.value = keyword
    return filteredPatents.value
  }

  const filterByStatus = (status: PatentStatus | '') => {
    filterStatus.value = status
  }

  const filterByType = (type: PatentType | '') => {
    filterType.value = type
  }

  const filterByCategory = (categoryId: number | '') => {
    filterCategory.value = categoryId
  }

  const clearFilters = () => {
    searchKeyword.value = ''
    filterStatus.value = ''
    filterType.value = ''
    filterCategory.value = ''
  }

  const getPatentById = (id: number) => {
    return patents.value.find(p => p.id === id) || null
  }

  const getPatentsByStatus = (status: PatentStatus) => {
    return patents.value.filter(p => p.status === status)
  }

  const getPatentsByType = (type: PatentType) => {
    return patents.value.filter(p => p.type === type)
  }

  const getPatentsByCategory = (categoryId: number) => {
    return patents.value.filter(p => p.categoryId === categoryId)
  }

  const getExpiringPatents = (days: number = 30) => {
    const now = new Date()
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return patents.value.filter(patent => {
      if (!patent.expirationDate) return false
      const expirationDate = new Date(patent.expirationDate)
      return expirationDate <= targetDate && expirationDate > now
    })
  }

  const getMaintenanceDuePatents = (days: number = 180) => {
    const now = new Date()
    const targetDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000)
    
    return patents.value.filter(patent => {
      return patent.fees.some(fee => {
        const dueDate = new Date(fee.dueDate)
        return dueDate <= targetDate && dueDate > now && fee.type === 'maintenance'
      })
    })
  }

  // 专利申请相关方法
  const submitApplication = async (applicationData: Omit<PatentApplication, 'id' | 'patentId' | 'status' | 'reviewHistory'>) => {
    const userStore = useUserStore()
    const activityStore = useActivityStore()
    
    try {
      // 生成申请ID
      const applicationId = applications.value.length > 0 
        ? Math.max(...applications.value.map(app => app.id)) + 1 
        : 1
      
      // 创建专利申请
      const newApplication: PatentApplication = {
        ...applicationData,
        id: applicationId,
        patentId: 0, // 暂时为0，审核通过后会创建真正的专利
        status: 'pending',
        reviewHistory: [{
          id: 1,
          reviewer: userStore.currentUser?.realName || '申请人',
          action: '提交专利申请',
          time: new Date().toLocaleString(),
        }]
      }
      
      // 添加到申请列表
      applications.value.push(newApplication)
      
      // 保存到localStorage
      localStorage.setItem('patentApplications', JSON.stringify(applications.value))
      
      // 记录活动
      activityStore.addActivity({
        type: 'patent_application',
        title: '专利申请提交',
        description: `提交专利申请：${applicationData.title}`,
        userId: userStore.currentUser?.id || 0,
        userName: userStore.currentUser?.realName || '申请人',
        targetId: applicationId,
        targetName: applicationData.title,
        status: 'pending',
        statusText: '待审核'
      })
      
      return newApplication
    } catch (error) {
      console.error('提交专利申请失败:', error)
      throw error
    }
  }

  // 获取所有专利申请
  const getApplications = () => {
    return applications.value
  }

  // 获取待审核的专利申请
  const getPendingApplications = () => {
    return applications.value.filter(app => app.status === 'pending')
  }

  // 审核专利申请
  const reviewApplication = async (applicationId: number, result: 'approved' | 'rejected', comment?: string) => {
    const userStore = useUserStore()
    const activityStore = useActivityStore()
    
    try {
      const applicationIndex = applications.value.findIndex(app => app.id === applicationId)
      if (applicationIndex === -1) {
        throw new Error('专利申请不存在')
      }
      
      const application = applications.value[applicationIndex]
      const reviewer = userStore.currentUser?.realName || '审核员'
      
      // 更新申请状态
      application.status = result
      application.reviewHistory.push({
        id: application.reviewHistory.length + 1,
        reviewer,
        action: result === 'approved' ? '审核通过' : '审核拒绝',
        comment,
        time: new Date().toLocaleString(),
      })
      
      // 如果审核通过，创建真正的专利
      if (result === 'approved') {
        const patentId = patents.value.length > 0 
          ? Math.max(...patents.value.map(p => p.id)) + 1 
          : 1
        
        const newPatent: Patent = {
          id: patentId,
          title: application.title,
          description: application.description,
          patentNumber: application.patentNumber,
          applicationNumber: application.patentNumber, // 使用专利号作为申请号
          applicationDate: application.submitDate,
          type: application.type,
          status: 'approved' as PatentStatus,
          categoryId: application.categoryId,
          applicants: application.applicants,
          inventors: application.inventors,
          technicalField: application.technicalField,
          keywords: application.keywords,
          abstract: application.description,
          claims: [],
          documents: [],
          fees: [],
          timeline: [],
          legalStatus: 'approved',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: userStore.currentUser?.id || 1,
          updatedBy: userStore.currentUser?.id || 1,
        }
        
        // 添加到专利列表
        patents.value.push(newPatent)
        localStorage.setItem('patents', JSON.stringify(patents.value))
        
        // 更新申请的patentId
        application.patentId = patentId
      }
      
      // 保存更新后的申请列表
      localStorage.setItem('patentApplications', JSON.stringify(applications.value))
      
      // 记录活动
      activityStore.addActivity({
        type: 'patent_review',
        title: `专利申请${result === 'approved' ? '通过' : '拒绝'}`,
        description: `${result === 'approved' ? '通过' : '拒绝'}专利申请：${application.title}`,
        userId: userStore.currentUser?.id || 0,
        userName: userStore.currentUser?.realName || '审核员',
        targetId: applicationId,
        targetName: application.title,
        status: result === 'approved' ? 'success' : 'warning',
        statusText: result === 'approved' ? '已通过' : '已拒绝'
      })
      
      return application
    } catch (error) {
      console.error('审核专利申请失败:', error)
      throw error
    }
  }

  // 加载专利申请数据
  const loadApplications = () => {
    try {
      const stored = localStorage.getItem('patentApplications')
      if (stored) {
        applications.value = JSON.parse(stored)
      }
    } catch (error) {
      console.error('加载专利申请数据失败:', error)
    }
  }

  // 初始化时加载数据
  fetchPatents()
  fetchCategories()
  loadApplications()

  return {
    // 状态
    patents,
    categories,
    loading,
    currentPatent,
    searchKeyword,
    filterStatus,
    filterType,
    filterCategory,
    
    // 计算属性
    totalPatents,
    patentsByStatus,
    patentsByCategory,
    statistics,
    filteredPatents,
    
    // 方法
    fetchPatents,
    addPatent,
    updatePatent,
    deletePatent,
    fetchCategories,
    searchPatents,
    filterByStatus,
    filterByType,
    filterByCategory,
    clearFilters,
    getPatentById,
    getPatentsByStatus,
    getPatentsByType,
    getPatentsByCategory,
    getExpiringPatents,
    getMaintenanceDuePatents,
    validatePatent,
    
    // 专利申请相关方法
    submitApplication,
    getApplications,
    getPendingApplications,
    reviewApplication,
    loadApplications,
  }
}) 