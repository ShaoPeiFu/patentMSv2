import { createRouter, createWebHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";
import { useUserStore } from "@/stores/user";
import { hasPermission, PERMISSION_MESSAGES } from "@/utils/permissions";
import { ElMessage } from "element-plus";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/Home.vue"),
    meta: { title: "首页" },
  },
  {
    path: "/login",
    name: "Login",
    component: () => import("@/views/Login.vue"),
    meta: { title: "登录" },
  },
  {
    path: "/register",
    name: "Register",
    component: () => import("@/views/Register.vue"),
    meta: { title: "注册" },
  },

  {
    path: "/dashboard",
    name: "Dashboard",
    component: () => import("@/components/AppleLayout.vue"),
    meta: { title: "控制台", requiresAuth: true },
    children: [
      {
        path: "",
        name: "DashboardHome",
        component: () => import("@/views/AppleDashboard.vue"),
        meta: { title: "控制台" },
      },
      {
        path: "patents",
        name: "PatentList",
        component: () => import("@/views/patents/PatentList.vue"),
        meta: { title: "专利列表" },
      },
      {
        path: "patents/add",
        name: "PatentAdd",
        component: () => import("@/views/patents/PatentAdd.vue"),
        meta: { title: "添加专利" },
      },
      {
        path: "patents/:id",
        name: "PatentDetail",
        component: () => import("@/views/patents/PatentDetail.vue"),
        meta: { title: "专利详情" },
      },
      {
        path: "patents/:id/edit",
        name: "PatentEdit",
        component: () => import("@/views/patents/PatentEdit.vue"),
        meta: { title: "编辑专利" },
      },

      {
        path: "users",
        name: "UserList",
        component: () => import("@/views/users/UserList.vue"),
        meta: { title: "用户管理" },
      },
      {
        path: "users/add",
        name: "UserAdd",
        component: () => import("@/views/users/UserAdd.vue"),
        meta: { title: "添加用户" },
      },

      {
        path: "users/:id",
        name: "UserDetail",
        component: () => import("@/views/users/UserDetail.vue"),
        meta: { title: "用户详情" },
      },
      {
        path: "users/:id/edit",
        name: "UserEdit",
        component: () => import("@/views/users/UserEdit.vue"),
        meta: { title: "编辑用户" },
      },
      {
        path: "password/change",
        name: "PasswordChange",
        component: () => import("@/views/users/PasswordChange.vue"),
        meta: { title: "修改密码" },
      },

      {
        path: "review",
        name: "ReviewCenter",
        component: () => import("@/views/review/ReviewCenter.vue"),
        meta: { title: "审核中心" },
      },
      {
        path: "data-security",
        name: "DataSecurity",
        component: () => import("@/views/DataSecurity.vue"),
        meta: { title: "数据安全管理" },
      },

      {
        path: "personalization",
        name: "PersonalizationSettings",
        component: () => import("@/views/PersonalizationSettings.vue"),
        meta: { title: "个性化设置" },
      },
      {
        path: "profile",
        name: "Profile",
        component: () => import("@/views/Profile.vue"),
        meta: { title: "个人资料" },
      },
      {
        path: "settings",
        name: "SystemSettings",
        component: () => import("@/views/SystemSettings.vue"),
        meta: { title: "系统设置" },
      },
      {
        path: "notifications",
        name: "NotificationPage",
        component: () => import("@/views/NotificationPage.vue"),
        meta: { title: "通知中心" },
      },

      {
        path: "workflows",
        name: "WorkflowManagement",
        component: () => import("@/views/WorkflowManagement.vue"),
        meta: { title: "工作流管理" },
      },

      {
        path: "fees",
        name: "FeeManagement",
        component: () => import("@/views/FeeManagement.vue"),
        meta: { title: "费用管理" },
      },
      {
        path: "deadlines",
        name: "DeadlineManagement",
        component: () => import("@/views/DeadlineManagement.vue"),
        meta: { title: "期限管理" },
      },
      {
        path: "contracts",
        name: "ContractManagement",
        component: () => import("@/views/AppleContractManagement.vue"),
        meta: { title: "合同管理" },
      },

      {
        path: "collaboration",
        name: "CollaborationSpace",
        component: () => import("@/views/collaboration/CollaborationSpace.vue"),
        meta: { title: "协作空间", requiresAuth: true },
      },
      {
        path: "tasks",
        name: "TaskManagement",
        component: () => import("@/views/collaboration/TaskManagement.vue"),
        meta: { title: "任务管理", requiresAuth: true },
      },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// 路由权限检查函数
const checkRoutePermission = (path: string, userRole: string): boolean => {
  // 路径与权限的映射
  const routePermissions: Record<string, string> = {
    "/dashboard/patents": "canViewPatents",
    "/dashboard/patents/add": "canAddPatents",
    "/dashboard/patents/edit": "canEditPatents",
    "/dashboard/review": "canAccessReviewCenter",

    "/dashboard/users": "canViewUsers",
    "/dashboard/users/edit": "canEditUsers",
    "/dashboard/settings": "canManageSystem",

    "/dashboard/personalization": "canManagePersonalization",

    // 协作相关
    "/dashboard/collaboration": "canCollaborate",
    "/dashboard/tasks": "canManageTasks",
  };

  // 检查路径是否需要特殊权限
  for (const [routePath, permission] of Object.entries(routePermissions)) {
    if (path.startsWith(routePath) || path.includes(routePath)) {
      return hasPermission(userRole as any, permission as any);
    }
  }

  // 默认路径（如控制台）允许所有已登录用户访问
  return true;
};

// 路由守卫
router.beforeEach(async (to, from, next) => {
  // 设置页面标题
  document.title = `专利管理系统 - ${to.meta.title || "首页"}`;

  // 路由切换时的清理工作
  if (from.path !== to.path) {
    // 给Vue更多时间来清理组件
    setTimeout(() => {
      // 强制垃圾回收（如果浏览器支持）
      if ((window as any).gc) {
        (window as any).gc();
      }

      // 清理可能的内存泄漏
      if (
        typeof window !== "undefined" &&
        window.performance &&
        (window.performance as any).memory
      ) {
        console.log("内存使用情况:", (window.performance as any).memory);
      }
    }, 200);
  }

  // 检查是否需要登录
  if (to.meta.requiresAuth) {
    const userStore = useUserStore();
    // 确保在鉴权前完成用户初始化（避免刷新时误判未登录）
    await userStore.ensureInitialized?.();
    if (!userStore.isLoggedIn) {
      next("/login");
      return;
    }

    // 检查用户权限
    const userRole = userStore.currentUser?.role || "user";
    const hasRoutePermission = checkRoutePermission(to.path, userRole);

    if (!hasRoutePermission) {
      ElMessage.error("您没有访问此页面的权限");

      // 根据用户角色重定向到合适的页面
      if (userRole === "reviewer") {
        next("/dashboard/review");
      } else {
        next("/dashboard");
      }
      return;
    }

    // 特殊路由权限检查
    if (to.path.includes("/users/") && to.path.includes("/edit")) {
      // 用户编辑页面权限检查
      const userId = parseInt(to.params.id as string);
      const currentUserId = userStore.currentUser?.id || 0;

      // 检查是否可以编辑该用户
      if (userRole !== "admin" && userId !== currentUserId) {
        ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_USER);
        next("/dashboard/users");
        return;
      }
    }

    if (to.path.includes("/patents/") && to.path.includes("/edit")) {
      // 专利编辑页面权限检查
      if (!hasPermission(userRole as any, "canEditPatents")) {
        ElMessage.error(PERMISSION_MESSAGES.NO_EDIT_PATENT);
        next("/dashboard/patents");
        return;
      }
    }
  }

  next();
});

export default router;
