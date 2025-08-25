// 权限管理工具

export type UserRole = "user" | "admin" | "reviewer";

export interface Permission {
  // 用户管理权限
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canEditUserDepartmentAndRole: boolean; // 管理员专用：只能改部门和角色
  canEditOwnProfile: boolean; // 个人信息编辑
  canChangePassword: boolean; // 密码修改权限

  // 专利管理权限
  canViewPatents: boolean;
  canEditPatents: boolean;
  canDeletePatents: boolean;
  canAddPatents: boolean;
  canReviewPatents: boolean; // 审核专利

  // 交底书管理权限
  canViewDisclosures: boolean;
  canCreateDisclosures: boolean;
  canEditDisclosures: boolean;
  canDeleteDisclosures: boolean;
  canEvaluateDisclosures: boolean;
  canAssignAgencies: boolean;

  // 审核权限
  canAccessReviewCenter: boolean;
  canApprovePatents: boolean;
  canRejectPatents: boolean;

  // 系统权限
  canManageSystem: boolean;

  // 集成管理权限
  integrationManage: boolean;

  // 合规管理权限
  canManageCompliance: boolean;
  canManageAuditTrails: boolean;
  canManagePrivacyProtection: boolean;

  // 个性化设置权限
  canManagePersonalization: boolean;

  // 协作模块权限
  canCollaborate: boolean; // 协作空间
  canManageTasks: boolean; // 任务管理
}

// 根据角色获取权限
export function getPermissionsByRole(role: UserRole): Permission {
  const permissions: Record<UserRole, Permission> = {
    // 普通用户权限
    user: {
      // 用户管理 - 只读
      canViewUsers: true,
      canEditUsers: false,
      canDeleteUsers: false,
      canEditUserDepartmentAndRole: false,
      canEditOwnProfile: true, // 可以编辑自己的信息
      canChangePassword: true, // 可以改自己密码

      // 专利管理 - 只读 + 添加
      canViewPatents: true,
      canEditPatents: false,
      canDeletePatents: false,
      canAddPatents: true, // 可以添加专利给别人审核
      canReviewPatents: false,

      // 交底书管理 - 可以查看、创建、编辑自己的
      canViewDisclosures: true,
      canCreateDisclosures: true,
      canEditDisclosures: true, // 只能编辑自己的
      canDeleteDisclosures: false, // 只能删除自己未提交的
      canEvaluateDisclosures: false,
      canAssignAgencies: false,

      // 审核权限 - 无
      canAccessReviewCenter: false,
      canApprovePatents: false,
      canRejectPatents: false,

      // 系统权限 - 无
      canManageSystem: false,

      // 集成管理权限 - 无
      integrationManage: false,

      // 合规管理权限 - 只读
      canManageCompliance: false,
      canManageAuditTrails: false,
      canManagePrivacyProtection: false,

      // 个性化设置权限 - 只读
      canManagePersonalization: false,

      // 协作模块 - 默认开放以便团队使用
      canCollaborate: true,
      canManageTasks: true,
    },

    // 管理员权限
    admin: {
      // 用户管理 - 特殊权限
      canViewUsers: true,
      canEditUsers: true, // 可以编辑其他用户
      canDeleteUsers: true,
      canEditUserDepartmentAndRole: true, // 只能改部门和角色
      canEditOwnProfile: true,
      canChangePassword: true, // 只能改自己密码

      // 专利管理 - 全权限
      canViewPatents: true,
      canEditPatents: true,
      canDeletePatents: true,
      canAddPatents: true,
      canReviewPatents: false, // 管理员不参与审核流程

      // 交底书管理 - 全权限
      canViewDisclosures: true,
      canCreateDisclosures: true,
      canEditDisclosures: true,
      canDeleteDisclosures: true,
      canEvaluateDisclosures: true, // 管理员也可以评估
      canAssignAgencies: true, // 可以分配代理机构

      // 审核权限 - 无（管理员不是审核员）
      canAccessReviewCenter: false,
      canApprovePatents: false,
      canRejectPatents: false,

      // 系统权限 - 全权限
      canManageSystem: true,

      // 集成管理权限 - 全权限
      integrationManage: true,

      // 合规管理权限 - 全权限
      canManageCompliance: true,
      canManageAuditTrails: true,
      canManagePrivacyProtection: true,

      // 个性化设置权限 - 全权限
      canManagePersonalization: true,

      // 协作模块 - 全权限
      canCollaborate: true,
      canManageTasks: true,
    },

    // 审核员权限
    reviewer: {
      // 用户管理 - 只读
      canViewUsers: true,
      canEditUsers: false, // 审核员没有编辑用户权限
      canDeleteUsers: false,
      canEditUserDepartmentAndRole: false,
      canEditOwnProfile: true,
      canChangePassword: true,

      // 专利管理 - 只读 + 审核
      canViewPatents: true,
      canEditPatents: false,
      canDeletePatents: false,
      canAddPatents: true,
      canReviewPatents: true, // 审核专利

      // 交底书管理 - 可以查看、创建、评估
      canViewDisclosures: true,
      canCreateDisclosures: true,
      canEditDisclosures: false, // 不能编辑
      canDeleteDisclosures: false,
      canEvaluateDisclosures: true, // 可以评估
      canAssignAgencies: false,

      // 审核权限 - 全权限
      canAccessReviewCenter: true,
      canApprovePatents: true,
      canRejectPatents: true,

      // 系统权限 - 部分
      canManageSystem: false,

      // 集成管理权限 - 无
      integrationManage: false,

      // 合规管理权限 - 部分权限
      canManageCompliance: false,
      canManageAuditTrails: true,
      canManagePrivacyProtection: false,

      // 个性化设置权限 - 部分权限
      canManagePersonalization: true,

      // 协作模块 - 默认允许
      canCollaborate: true,
      canManageTasks: true,
    },
  };

  return permissions[role];
}

// 检查用户是否有指定权限
export function hasPermission(
  userRole: UserRole,
  permission: keyof Permission
): boolean {
  const permissions = getPermissionsByRole(userRole);
  return permissions[permission];
}

// 检查是否可以编辑指定用户
export function canEditUser(
  currentUserRole: UserRole,
  currentUserId: number,
  targetUserId: number
): boolean {
  // 自己总是可以编辑自己的个人信息（除了部门和角色）
  if (currentUserId === targetUserId) {
    return true;
  }

  // 只有管理员可以编辑其他用户（但只能改部门和角色）
  return currentUserRole === "admin";
}

// 检查是否可以修改密码
export function canChangeUserPassword(
  _currentUserRole: UserRole,
  currentUserId: number,
  targetUserId: number
): boolean {
  // 只能修改自己的密码
  return currentUserId === targetUserId;
}

// 检查是否可以编辑专利
export function canEditPatent(userRole: UserRole): boolean {
  // 管理员可以编辑所有专利
  if (userRole === "admin") {
    return true;
  }

  // 普通用户和审核员不能编辑专利
  return false;
}

// 获取用户可访问的路由
export function getAccessibleRoutes(userRole: UserRole): string[] {
  const routes: Record<UserRole, string[]> = {
    user: [
      "/dashboard",
      "/dashboard/patents", // 查看专利
      "/dashboard/patents/add", // 添加专利
      "/dashboard/users", // 查看用户
      "/dashboard/profile", // 个人设置
    ],
    admin: [
      "/dashboard",
      "/dashboard/patents",
      "/dashboard/patents/add",
      "/dashboard/patents/:id/edit", // 编辑专利
      "/dashboard/users",
      "/dashboard/users/:id/edit", // 编辑用户

      "/dashboard/profile",
    ],
    reviewer: [
      "/dashboard",
      "/dashboard/patents",
      "/dashboard/patents/add",
      "/dashboard/users", // 查看用户
      "/dashboard/review", // 审核中心

      "/dashboard/profile",
    ],
  };

  return routes[userRole] || [];
}

// 权限装饰器 - 用于组件权限控制
export function requirePermission() {
  return function (
    _target: any,
    _propertyName: string,
    descriptor: PropertyDescriptor
  ) {
    const method = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // 这里需要获取当前用户角色
      // 实际使用时可以从 store 或 context 中获取
      return method.apply(this, args);
    };

    return descriptor;
  };
}

// 权限提示消息
export const PERMISSION_MESSAGES = {
  NO_EDIT_USER: "您没有编辑用户的权限",
  NO_DELETE_USER: "您没有删除用户的权限",
  NO_EDIT_PATENT: "您没有编辑专利的权限",
  NO_DELETE_PATENT: "您没有删除专利的权限",
  NO_ACCESS_REVIEW: "您没有访问审核中心的权限",
  NO_ADMIN_FUNCTION: "此功能仅管理员可用",
  ONLY_EDIT_OWN_PASSWORD: "您只能修改自己的密码",
  ONLY_EDIT_DEPARTMENT_ROLE: "管理员只能修改用户的部门和角色",
} as const;
