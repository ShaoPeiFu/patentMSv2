# 用户活动系统更新

## 概述

本次更新删除了用户详情页面中的文件管理功能，并将最近活动部分改为使用真实的 API 数据而不是模拟数据。

## 主要更改

### 1. 删除的功能

- **文件管理部分**：完全移除了文件上传、下载、预览、删除等功能
- **文件上传对话框**：删除了文件上传相关的所有 UI 组件
- **文件预览对话框**：删除了文件预览功能
- **文件操作按钮**：删除了文件相关的所有操作按钮

### 2. 新增的功能

- **真实 API 集成**：最近活动现在从后端 API 获取真实数据
- **活动记录 API**：新增了用户活动记录的 CRUD API 接口
- **数据库模型更新**：更新了 ActivityLog 模型结构
- **活动类型支持**：支持多种活动类型（登录、密码修改、通知查看、个人信息更新、专利查看、专利编辑等）

### 3. 技术实现

#### 后端 API (`server/routes/users.ts`)

- `GET /api/users/:id/activities` - 获取用户活动记录
- `POST /api/users/:id/activities` - 创建用户活动记录
- `GET /api/users/:id` - 获取用户基本信息
- `PUT /api/users/:id` - 更新用户信息

#### 数据库模型更新

```prisma
model ActivityLog {
  id         Int      @id @default(autoincrement())
  userId     Int
  type       String   // 活动类型
  title      String   // 活动标题
  status     String   @default("success") // 活动状态
  details    String?  // 活动详情
  ipAddress  String?  // IP地址
  userAgent  String?  // 用户代理
  timestamp  DateTime @default(now()) // 活动时间戳
  user       User     @relation("ActivityLogger", fields: [userId], references: [id])

  @@map("activity_logs")
}
```

#### 前端组件更新 (`src/views/users/UserDetail.vue`)

- 删除了所有文件管理相关的模板代码
- 更新了最近活动部分，使用真实 API 数据
- 添加了加载状态和错误处理
- 支持活动记录的刷新功能

### 4. 活动类型和状态

#### 活动类型

- `login` - 用户登录
- `password` - 密码修改
- `notification` - 通知查看
- `profile` - 个人信息更新
- `view` - 内容查看
- `edit` - 内容编辑
- `delete` - 内容删除

#### 活动状态

- `success` - 成功
- `failed` - 失败
- `pending` - 进行中
- `completed` - 已完成
- `viewed` - 已查看
- `modified` - 已修改
- `updated` - 已更新
- `deleted` - 已删除

### 5. 数据示例

系统已预置了示例活动数据，包括：

- 用户登录记录
- 密码修改记录
- 通知查看记录
- 个人信息更新记录
- 专利查看记录
- 专利编辑记录

### 6. 使用方法

#### 查看用户活动

1. 导航到用户详情页面
2. 在"最近活动"部分查看用户的活动记录
3. 点击"刷新"按钮更新活动记录

#### 创建活动记录

```javascript
// 前端调用示例
const response = await fetch(`/api/users/${userId}/activities`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    type: "login",
    title: "用户登录系统",
    status: "success",
    details: "用户成功登录系统",
  }),
});
```

### 7. 安全特性

- 所有 API 接口都需要 JWT 认证
- 用户只能查看自己的活动记录
- 管理员可以查看所有用户的活动记录
- 活动记录包含 IP 地址和用户代理信息，便于安全审计

### 8. 性能优化

- 活动记录分页加载（默认 20 条）
- 按时间倒序排列，最新的活动在前
- 支持活动记录的增量更新

## 文件变更清单

### 新增文件

- `server/routes/users.ts` - 用户 API 路由
- `USER_ACTIVITY_SYSTEM_UPDATE.md` - 本更新文档

### 修改文件

- `src/views/users/UserDetail.vue` - 用户详情页面
- `prisma/schema.prisma` - 数据库模型
- `server/index.ts` - 服务器主文件

### 数据库迁移

- `20250820033207_update_activity_log_schema` - 更新 ActivityLog 表结构

## 测试验证

- ✅ 用户活动 API 接口测试通过
- ✅ 数据库模型更新成功
- ✅ 前端组件编译无错误
- ✅ 示例数据创建成功
- ✅ 完全移除模拟数据，只使用真实 API 数据

## 注意事项

1. 确保在部署前运行数据库迁移
2. 前端需要有效的 JWT 令牌才能访问 API
3. 活动记录会自动记录 IP 地址和用户代理信息
4. 建议定期清理过期的活动记录以优化性能

## 后续优化建议

1. 添加活动记录的搜索和筛选功能
2. 实现活动记录的导出功能
3. 添加活动统计图表
4. 实现活动通知功能
5. 添加活动记录的批量操作功能
