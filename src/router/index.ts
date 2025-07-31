import { createRouter, createWebHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { hasPermission, getAccessibleRoutes, PERMISSION_MESSAGES } from '@/utils/permissions'
import { ElMessage } from 'element-plus'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页' }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录' }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('@/views/Register.vue'),
    meta: { title: '注册' }
  },
  {
    path: '/test-auth',
    name: 'TestAuth',
    component: () => import('@/views/TestAuth.vue'),
    meta: { title: '认证测试' }
  },
  {
    path: '/test-activity',
    name: 'TestActivity',
    component: () => import('@/views/TestActivity.vue'),
    meta: { title: '活动测试' }
  },
  {
    path: '/test-patent-edit',
    name: 'TestPatentEdit',
    component: () => import('@/views/TestPatentEdit.vue'),
    meta: { title: '专利编辑测试' }
  },

  {
    path: '/test-performance',
    name: 'TestPerformance',
    component: () => import('@/views/TestPerformance.vue'),
    meta: { title: '性能测试' }
  },
  {
    path: '/test-permission',
    name: 'TestPermission',
    component: () => import('@/views/TestPermission.vue'),
    meta: { title: '权限测试' }
  },
      {
      path: '/test-download',
      name: 'TestDownload',
      component: () => import('@/views/TestDownload.vue'),
      meta: { title: '下载测试' }
    },
    {
      path: '/test-real-file-download',
      name: 'TestRealFileDownload',
      component: () => import('@/views/TestRealFileDownload.vue'),
      meta: { title: '真实文件下载测试' }
    },
    {
      path: '/test-simple-download',
      name: 'TestSimpleDownload',
      component: () => import('@/views/TestSimpleDownload.vue'),
      meta: { title: '简单下载测试' }
    },
  
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/components/Layout.vue'),
    meta: { title: '控制台', requiresAuth: true },
    children: [
      {
        path: '',
        name: 'DashboardHome',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '控制台' }
      },
      {
        path: 'patents',
        name: 'PatentList',
        component: () => import('@/views/patents/PatentList.vue'),
        meta: { title: '专利列表' }
      },
      {
        path: 'patents/add',
        name: 'PatentAdd',
        component: () => import('@/views/patents/PatentAdd.vue'),
        meta: { title: '添加专利' }
      },
      {
        path: 'patents/:id',
        name: 'PatentDetail',
        component: () => import('@/views/patents/PatentDetail.vue'),
        meta: { title: '专利详情' }
      },
      {
        path: 'patents/:id/edit',
        name: 'PatentEdit',
        component: () => import('@/views/patents/PatentEdit.vue'),
        meta: { title: '编辑专利' }
      },
      {
        path: 'categories',
        name: 'CategoryList',
        component: () => import('@/views/categories/CategoryList.vue'),
        meta: { title: '分类管理' }
      },
      {
        path: 'users',
        name: 'UserList',
        component: () => import('@/views/users/UserList.vue'),
        meta: { title: '用户管理' }
      },
      {
        path: 'users/add',
        name: 'UserAdd',
        component: () => import('@/views/users/UserAdd.vue'),
        meta: { title: '添加用户' }
      },
      {
        path: 'users/:id',
        name: 'UserDetail',
        component: () => import('@/views/users/UserDetail.vue'),
        meta: { title: '用户详情' }
      },
      {
        path: 'users/:id/edit',
        name: 'UserEdit',
        component: () => import('@/views/users/UserEdit.vue'),
        meta: { title: '编辑用户' }
      },
      {
        path: 'password/change',
        name: 'PasswordChange',
        component: () => import('@/views/users/PasswordChange.vue'),
        meta: { title: '修改密码' }
      },
      {
        path: 'reports',
        name: 'Reports',
        component: () => import('@/views/reports/Reports.vue'),
        meta: { title: '统计报表' }
      },
      {
        path: 'review',
        name: 'ReviewCenter',
        component: () => import('@/views/review/ReviewCenter.vue'),
        meta: { title: '审核中心' }
      },
      {
        path: 'profile',
        name: 'Profile',
        component: () => import('@/views/Profile.vue'),
        meta: { title: '个人资料' }
      },
      {
        path: 'settings',
        name: 'SystemSettings',
        component: () => import('@/views/SystemSettings.vue'),
        meta: { title: '系统设置' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由权限检查函数
const checkRoutePermission = (path: string, userRole: string): boolean => {
  // 路径与权限的映射
  const routePermissions: Record<string, string> = {
    '/dashboard/patents': 'canViewPatents',
    '/dashboard/patents/add': 'canAddPatents',
    '/dashboard/patents/edit': 'canEditPatents',
    '/dashboard/review': 'canAccessReviewCenter',
    '/dashboard/categories': 'canManageCategories',
    '/dashboard/users': 'canViewUsers',
    '/dashboard/users/add': 'canAddUsers',
      '/dashboard/users/edit': 'canEditUsers',
  '/dashboard/settings': 'canManageSystem',
  '/dashboard/reports': 'canViewReports',
  }

  // 检查路径是否需要特殊权限
  for (const [routePath, permission] of Object.entries(routePermissions)) {
    if (path.startsWith(routePath) || path.includes(routePath)) {
      return hasPermission(userRole as any, permission as any)
    }
  }

  // 默认路径（如控制台）允许所有已登录用户访问
  return true
}

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `专利管理系统 - ${to.meta.title || '首页'}`
  
  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      next('/login')
      return
    }

    // 检查用户权限
    const userRole = userStore.currentUser?.role || 'user'
    const hasRoutePermission = checkRoutePermission(to.path, userRole)

    if (!hasRoutePermission) {
      ElMessage.error('您没有访问此页面的权限')
      
      // 根据用户角色重定向到合适的页面
      if (userRole === 'reviewer') {
        next('/dashboard/review')
      } else {
        next('/dashboard')
      }
      return
    }

    // 特殊路由权限检查
    if (to.path.includes('/users/') && to.path.includes('/edit')) {
      // 用户编辑页面权限检查
      const userId = parseInt(to.params.id as string)
      const currentUserId = userStore.currentUser?.id || 0
      
      // 检查是否可以编辑该用户
      if (userRole !== 'admin' && userId !== currentUserId) {
        ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_USER)
        next('/dashboard/users')
        return
      }
    }

    if (to.path.includes('/patents/') && to.path.includes('/edit')) {
      // 专利编辑页面权限检查
      if (!hasPermission(userRole as any, 'canEditPatents')) {
        ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_PATENT)
        next('/dashboard/patents')
        return
      }
    }
  }
  
  next()
})

export default router 