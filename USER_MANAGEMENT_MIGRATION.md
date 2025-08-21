# 用户管理模块迁移指南

## 概述

本文档描述了用户管理模块从本地存储（localStorage）迁移到 API 服务的过程。迁移完成后，所有用户相关的数据操作都将通过后端 API 进行，提高了数据安全性和一致性。

## 迁移内容

### 1. 后端 API 完善

#### 新增的 API 端点

- `GET /api/users` - 获取用户列表（支持分页、搜索、筛选）
- `POST /api/users` - 创建新用户
- `PUT /api/users/:id` - 更新用户信息
- `DELETE /api/users/:id` - 删除用户
- `PUT /api/users/:id/password` - 修改密码
- `PUT /api/users/:id/avatar` - 更新用户头像
- `GET /api/users/search` - 搜索用户
- `GET /api/users/stats` - 获取用户统计

#### 权限控制

- 用户列表、创建、更新、删除操作需要管理员权限
- 用户详情查看需要登录认证
- 密码修改需要用户本人或管理员权限

### 2. 前端 Store 重构

#### 移除的 localStorage 依赖

- ❌ `localStorage.setItem("user", JSON.stringify(user))`
- ❌ `localStorage.getItem("user")`
- ❌ `localStorage.removeItem("user")`

#### 保留的 localStorage 使用

- ✅ `localStorage.setItem("token", token)` - 仅存储 JWT token
- ✅ `localStorage.getItem("token")` - 恢复认证状态
- ✅ `localStorage.removeItem("token")` - 清除认证状态

#### 新的数据流

1. 用户登录后，token 存储在 localStorage 中
2. 用户信息存储在内存中（Pinia store）
3. 页面刷新时，从 localStorage 恢复 token
4. 使用 token 调用 API 获取用户信息
5. 所有用户数据操作通过 API 进行

### 3. 前端组件更新

#### 更新的组件

- `UserList.vue` - 用户列表页面
- `UserForm.vue` - 用户表单组件
- `UserAdd.vue` - 新增用户页面
- `UserEdit.vue` - 编辑用户页面
- `UserDetail.vue` - 用户详情页面

#### 新增功能

- 用户创建表单
- 用户编辑表单
- 权限控制（基于用户角色）
- 实时数据同步

## 技术实现

### 1. API 服务层

```typescript
// src/services/userAPI.ts
export const userAPI = {
  // 获取用户列表
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    department?: string;
  }): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const response = await api.get("/users", { params });
    return response.data;
  },

  // 创建新用户
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    realName: string;
    phone?: string;
    department: string;
    role: string;
  }): Promise<User> {
    const response = await api.post("/users", userData);
    return response.data;
  },

  // 其他方法...
};
```

### 2. Store 状态管理

```typescript
// src/stores/user.ts
export const useUserStore = defineStore("user", () => {
  // 状态 - 使用内存存储而不是localStorage
  const currentUser = ref<User | null>(null);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const token = ref<string | null>(null);

  // 从API获取当前用户信息
  const loadCurrentUser = async () => {
    try {
      const user = await userAPI.getCurrentUser();
      currentUser.value = user;
      return user;
    } catch (error) {
      console.error("获取当前用户信息失败:", error);
      currentUser.value = null;
      token.value = null;
      throw error;
    }
  };

  // 其他方法...
});
```

### 3. 权限控制

```typescript
// 权限检查
const hasPermission = (permission: string) => {
  if (!currentUser.value) return false;

  const role = currentUser.value.role;
  const permissions: Record<string, string[]> = {
    admin: [
      "user:view",
      "user:edit",
      "user:delete",
      "user:create",
      "patent:view",
      "patent:edit",
      "patent:delete",
      "system:manage",
    ],
    reviewer: ["patent:view", "patent:edit", "user:view"],
    user: ["patent:view"],
  };

  return permissions[role]?.includes(permission) || false;
};
```

## 使用方法

### 1. 启动后端服务

```bash
cd server
npm install
npm start
```

### 2. 启动前端应用

```bash
npm install
npm run dev
```

### 3. 测试 API

```bash
node test-user-api.js
```

## 数据迁移

### 1. 现有用户数据

如果系统中已有用户数据，需要确保：

- 用户表结构符合新的 schema
- 密码字段已正确加密
- 用户角色和权限设置正确

### 2. 数据库迁移

```bash
cd prisma
npx prisma migrate dev
npx prisma generate
```

### 3. 种子数据

```bash
cd prisma
node seed.cjs
```

## 安全考虑

### 1. 认证

- 使用 JWT token 进行身份验证
- token 有过期时间，需要定期刷新
- 敏感操作需要重新验证密码

### 2. 授权

- 基于角色的访问控制（RBAC）
- API 端点级别的权限验证
- 前端组件级别的权限控制

### 3. 数据验证

- 输入数据验证和清理
- SQL 注入防护
- XSS 攻击防护

## 性能优化

### 1. 缓存策略

- 用户列表分页加载
- 用户详情按需加载
- 减少不必要的 API 调用

### 2. 错误处理

- 统一的错误处理机制
- 用户友好的错误提示
- 网络异常的优雅降级

## 监控和日志

### 1. API 监控

- 请求响应时间监控
- 错误率监控
- 用户行为分析

### 2. 审计日志

- 用户操作记录
- 权限变更记录
- 敏感操作追踪

## 故障排除

### 1. 常见问题

#### API 调用失败

- 检查后端服务是否启动
- 验证 API 端点是否正确
- 检查网络连接和防火墙设置

#### 权限验证失败

- 确认用户角色设置正确
- 检查 JWT token 是否有效
- 验证权限配置是否正确

#### 数据同步问题

- 检查前端 store 状态
- 验证 API 响应数据格式
- 确认错误处理逻辑

### 2. 调试工具

- 浏览器开发者工具
- 后端日志输出
- API 测试工具（Postman 等）

## 总结

通过这次迁移，用户管理模块实现了：

1. **数据安全性提升** - 用户敏感信息不再存储在本地
2. **数据一致性** - 所有操作通过统一的 API 进行
3. **权限控制完善** - 基于角色的细粒度权限管理
4. **用户体验改善** - 实时数据同步和更好的错误处理
5. **系统可维护性** - 清晰的代码结构和 API 设计

迁移完成后，系统将更加稳定、安全和易于维护。
