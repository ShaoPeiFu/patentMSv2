# 基于角色的权限管理系统实现指南

## 🎯 系统概述

本权限管理系统基于用户角色实现细粒度的功能控制，支持三种角色：

- **普通用户 (user)**: 只读权限 + 专利添加
- **管理员 (admin)**: 用户管理 + 系统管理
- **审核员 (reviewer)**: 专利审核 + 查看权限

## 📋 权限矩阵

### 普通用户权限

- ✅ 查看用户列表
- ✅ 查看专利列表
- ✅ 添加专利（提交审核）
- ✅ 编辑自己的个人信息
- ✅ 修改自己的密码
- ❌ 编辑/删除专利
- ❌ 编辑/删除其他用户
- ❌ 访问审核中心
- ❌ 管理分类和系统设置

### 管理员权限

- ✅ 所有用户管理功能
- ✅ 所有专利管理功能
- ✅ 系统配置和分类管理
- ✅ 查看统计报表
- ✅ 编辑其他用户（仅限部门和角色）
- ⚠️ 只能修改自己的密码
- ❌ 访问审核中心（不参与审核流程）

### 审核员权限

- ✅ 查看用户和专利
- ✅ 添加专利
- ✅ 访问审核中心
- ✅ 审核/批准/拒绝专利
- ✅ 查看统计报表
- ✅ 编辑自己的个人信息
- ❌ 编辑/删除用户
- ❌ 编辑/删除专利
- ❌ 管理分类

## 🏗️ 系统架构

### 核心文件结构

```
patentMS/src/
├── utils/
│   ├── permissions.ts          # 权限管理核心
│   └── tagTypes.ts            # 统一标签类型
├── components/
│   ├── PasswordVerification.vue  # 密码验证组件
│   ├── AvatarUpload.vue          # 头像上传组件
│   └── Layout.vue               # 主布局（权限菜单）
├── views/
│   ├── users/UserEdit.vue       # 用户编辑（权限控制）
│   └── review/ReviewCenter.vue  # 审核中心
├── stores/
│   └── user.ts                 # 用户状态管理
└── router/
    └── index.ts               # 路由权限守卫
```

## 🔧 核心实现

### 1. 权限管理工具 (`utils/permissions.ts`)

```typescript
// 角色类型定义
export type UserRole = "user" | "admin" | "reviewer";

// 权限接口定义
export interface Permission {
  canViewUsers: boolean;
  canEditUsers: boolean;
  canDeleteUsers: boolean;
  canAddUsers: boolean;
  canEditUserDepartmentAndRole: boolean;
  canEditOwnProfile: boolean;
  canChangePassword: boolean;
  // ... 更多权限
}

// 根据角色获取权限
export function getPermissionsByRole(role: UserRole): Permission;

// 检查用户是否有指定权限
export function hasPermission(
  userRole: UserRole,
  permission: keyof Permission
): boolean;

// 检查是否可以编辑指定用户
export function canEditUser(
  currentUserRole: UserRole,
  currentUserId: number,
  targetUserId: number
): boolean;

// 检查是否可以修改密码
export function canChangeUserPassword(
  currentUserRole: UserRole,
  currentUserId: number,
  targetUserId: number
): boolean;
```

### 2. 密码验证组件 (`components/PasswordVerification.vue`)

**功能特点:**

- 修改密码前验证当前密码
- 支持自定义用户 ID 验证
- 模态对话框形式
- 密码强度验证

**使用方式:**

```vue
<PasswordVerification
  v-model="passwordVerificationVisible"
  :user-id="targetUserId"
  @verified="handlePasswordVerified"
  @cancel="handlePasswordVerificationCancel"
/>
```

### 3. 用户编辑权限控制 (`views/users/UserEdit.vue`)

**管理员编辑其他用户限制:**

- 只能修改部门和角色
- 个人信息（姓名、邮箱、手机、头像）禁用
- 显示权限提示信息

**字段禁用逻辑:**

```typescript
const isFieldDisabled = computed(() => ({
  username: true, // 用户名始终不可编辑
  realName: isAdminEditingOthers.value,
  email: isAdminEditingOthers.value,
  phone: isAdminEditingOthers.value,
  avatar: isAdminEditingOthers.value,
  department: false, // 部门可以编辑
  role: !hasPermission(currentUserRole.value, "canEditUserDepartmentAndRole"),
  password: !canChangePassword.value, // 只能改自己的密码
}));
```

### 4. 审核中心 (`views/review/ReviewCenter.vue`)

**核心功能:**

- 专利审核队列管理
- 审核状态跟踪
- 审核意见记录
- 审核历史查看
- 批量操作支持

**权限控制:**

```typescript
const canReview = computed(() => {
  return hasPermission(
    userStore.currentUser?.role || "user",
    "canAccessReviewCenter"
  );
});

onMounted(() => {
  if (!canReview.value) {
    ElMessage.error("您没有访问审核中心的权限");
    router.push("/dashboard");
  }
});
```

### 5. 菜单权限控制 (`components/Layout.vue`)

**动态菜单生成:**

```typescript
const menuItems = computed(() => {
  const userRole = userStore.currentUser?.role || "user";

  return allMenuItems.filter((item) => {
    if (!item.permission) {
      return true; // 无权限要求的菜单对所有用户可见
    }

    return hasPermission(userRole, item.permission as any);
  });
});
```

### 6. 路由权限守卫 (`router/index.ts`)

**多层权限检查:**

```typescript
router.beforeEach((to, from, next) => {
  // 1. 登录检查
  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    next("/login");
    return;
  }

  // 2. 路由权限检查
  const hasRoutePermission = checkRoutePermission(to.path, userRole);
  if (!hasRoutePermission) {
    ElMessage.error("您没有访问此页面的权限");
    // 根据角色重定向
    next(userRole === "reviewer" ? "/dashboard/review" : "/dashboard");
    return;
  }

  // 3. 特殊路由权限检查（如用户编辑）
  if (to.path.includes("/users/") && to.path.includes("/edit")) {
    // 检查编辑权限
  }

  next();
});
```

## 🎨 UI 权限控制模式

### 1. 条件渲染

```vue
<!-- 只有管理员可以看到添加用户按钮 -->
<el-button v-if="hasPermission(userRole, 'canAddUsers')" @click="addUser">
  添加用户
</el-button>
```

### 2. 字段禁用

```vue
<!-- 根据权限禁用字段 -->
<el-input
  v-model="form.realName"
  :disabled="isFieldDisabled.realName"
  placeholder="请输入真实姓名"
/>
```

### 3. 权限提示

```vue
<!-- 显示权限限制说明 -->
<el-alert
  v-if="isAdminEditingOthers"
  title="权限提示"
  description="作为管理员，您只能修改其他用户的部门和角色信息。"
  type="info"
  show-icon
  :closable="false"
/>
```

## 🔐 安全特性

### 1. 密码验证机制

- 修改密码需要验证当前密码
- 支持密码强度检查
- 密码加密存储（生产环境需要后端支持）

### 2. 数据隔离

- 用户只能编辑自己的个人信息
- 管理员对其他用户的编辑权限受限
- 审核员无法进行数据管理操作

### 3. 路由安全

- 前端路由守卫阻止未授权访问
- 后端 API 需要进行二次权限验证
- 敏感操作需要额外确认

## 📊 用户角色对比

| 功能模块 | 普通用户 | 审核员 | 管理员     |
| -------- | -------- | ------ | ---------- |
| 查看专利 | ✅       | ✅     | ✅         |
| 添加专利 | ✅       | ✅     | ✅         |
| 编辑专利 | ❌       | ❌     | ✅         |
| 删除专利 | ❌       | ❌     | ✅         |
| 审核专利 | ❌       | ✅     | ❌         |
| 查看用户 | ✅       | ✅     | ✅         |
| 添加用户 | ❌       | ❌     | ✅         |
| 编辑用户 | 仅自己   | 仅自己 | 所有用户\* |
| 删除用户 | ❌       | ❌     | ✅         |
| 分类管理 | ❌       | ❌     | ✅         |
| 统计报表 | ❌       | ✅     | ✅         |
| 审核中心 | ❌       | ✅     | ❌         |

> \*管理员编辑其他用户时仅限部门和角色，个人信息需用户自己修改

## 🚀 扩展建议

### 1. 更细粒度的权限控制

- 部门级权限隔离
- 数据范围权限（如只能查看自己部门的专利）
- 时间范围权限（如临时权限）

### 2. 审计日志

- 记录所有权限相关操作
- 追踪权限变更历史
- 敏感操作告警

### 3. 权限管理界面

- 可视化权限配置
- 批量权限操作
- 权限模板管理

### 4. 集成外部认证

- LDAP/AD 集成
- OAuth 2.0 支持
- 单点登录(SSO)

## 🧪 测试建议

### 1. 角色权限测试

- 创建不同角色的测试用户
- 验证每个角色的权限边界
- 测试权限切换场景

### 2. 安全测试

- 尝试绕过前端权限检查
- 测试密码验证机制
- 验证敏感操作的权限控制

### 3. 用户体验测试

- 权限提示是否友好
- 无权限时的引导是否清晰
- 权限变更后的用户感知

---

**实现时间**: 2025 年 1 月 29 日  
**系统版本**: v1.0.0  
**维护状态**: ✅ 活跃维护
