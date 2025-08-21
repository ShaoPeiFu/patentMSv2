# 用户更新 API 修复

## 问题描述

用户尝试编辑个人信息时遇到以下错误：

```
更新用户信息失败: PrismaClientKnownRequestError:
Invalid `prisma.user.update()` invocation
Unique constraint failed on the fields: (`email`)
```

## 问题原因

1. **邮箱唯一性约束冲突**：数据库中 `email` 字段设置了唯一约束 (`@unique`)
2. **缺少重复检查**：API 没有在更新前检查新邮箱是否已被其他用户使用
3. **重复路由冲突**：主服务器文件和用户路由文件都有用户更新路由，造成冲突
4. **错误处理不完善**：没有针对 Prisma 错误的专门处理

## 解决方案

### 1. 修复用户路由文件 (`server/routes/users.ts`)

#### 添加邮箱重复检查

```javascript
// 检查邮箱是否已被其他用户使用
if (email) {
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email,
      id: { not: userId }, // 排除当前用户
    },
  });

  if (existingUser) {
    return res.status(400).json({
      error: "该邮箱地址已被其他用户使用",
      existingUser: {
        id: existingUser.id,
        username: existingUser.username,
      },
    });
  }
}
```

#### 添加数据验证

```javascript
// 验证必填字段
if (!realName || !email || !phone || !department) {
  return res.status(400).json({
    error: "所有字段都是必填的",
    missing: {
      realName: !realName,
      email: !email,
      phone: !phone,
      department: !department,
    },
  });
}

// 验证邮箱格式
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
if (!emailRegex.test(email)) {
  return res.status(400).json({ error: "邮箱格式不正确" });
}

// 验证手机号格式
const phoneRegex = /^1[3-9]\d{9}$/;
if (!phoneRegex.test(phone)) {
  return res.status(400).json({ error: "手机号格式不正确" });
}
```

#### 改进错误处理

```javascript
// 处理Prisma错误
if (error.code === "P2002") {
  const field = error.meta?.target?.[0];
  if (field === "email") {
    return res.status(400).json({
      error: "该邮箱地址已被其他用户使用",
      field: "email",
    });
  } else if (field === "username") {
    return res.status(400).json({
      error: "该用户名已被其他用户使用",
      field: "username",
    });
  }
}
```

#### 数据清理

```javascript
data: {
  realName: realName.trim(),
  email: email.trim().toLowerCase(),
  phone: phone.trim(),
  department: department.trim(),
  updatedAt: new Date(),
}
```

### 2. 删除重复路由

从主服务器文件 (`server/index.ts`) 中删除了重复的用户更新路由，避免冲突。

### 3. 统一路由管理

所有用户相关的 API 现在都通过 `server/routes/users.ts` 统一管理。

## 修复后的功能特性

### ✅ 数据验证

- **必填字段检查**：确保所有必要字段都有值
- **邮箱格式验证**：使用正则表达式验证邮箱格式
- **手机号格式验证**：验证中国手机号格式
- **数据清理**：自动去除首尾空格，邮箱转小写

### ✅ 重复性检查

- **邮箱唯一性**：更新前检查邮箱是否被其他用户使用
- **智能排除**：检查时排除当前用户，允许用户保持原邮箱

### ✅ 错误处理

- **Prisma 错误处理**：专门处理数据库约束错误
- **友好错误消息**：提供清晰的错误说明
- **字段标识**：明确指出哪个字段出现问题

### ✅ 安全性

- **JWT 认证**：所有 API 都需要有效令牌
- **权限控制**：用户只能更新自己的信息
- **数据过滤**：防止恶意数据注入

## API 响应示例

### 成功响应

```json
{
  "message": "用户信息更新成功",
  "user": {
    "id": 2,
    "username": "shaopei",
    "realName": "测试用户",
    "email": "test@example.com",
    "phone": "13800138000",
    "department": "tech",
    "role": "admin",
    "createdAt": "2025-08-18T06:01:10.000Z",
    "updatedAt": "2025-08-20T03:45:00.000Z"
  }
}
```

### 邮箱重复错误

```json
{
  "error": "该邮箱地址已被其他用户使用",
  "existingUser": {
    "id": 9,
    "username": "user1"
  }
}
```

### 格式错误

```json
{
  "error": "邮箱格式不正确"
}
```

### 必填字段错误

```json
{
  "error": "所有字段都是必填的",
  "missing": {
    "realName": false,
    "email": true,
    "phone": true,
    "department": false
  }
}
```

## 测试验证

### 编译检查

- ✅ 用户路由文件无编译错误
- ✅ 主服务器文件无编译错误
- ✅ 路由注册正常

### 功能验证

- ✅ 邮箱重复检查正常工作
- ✅ 数据格式验证正常
- ✅ 必填字段验证正常
- ✅ 错误处理完善
- ✅ 认证机制正常

## 使用说明

### 前端调用示例

```javascript
const response = await fetch(`/api/users/${userId}`, {
  method: "PUT",
  headers: {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({
    realName: "新姓名",
    email: "newemail@example.com",
    phone: "13800138000",
    department: "tech",
  }),
});

if (response.ok) {
  const result = await response.json();
  console.log("更新成功:", result);
} else {
  const error = await response.json();
  console.error("更新失败:", error.error);
}
```

### 注意事项

1. **必须提供 JWT 认证令牌**
2. **所有字段都是必填的**
3. **邮箱地址必须唯一**
4. **邮箱和手机号格式必须正确**
5. **数据会自动清理（去除空格、邮箱转小写）**

## 总结

通过这次修复，用户更新 API 现在具备了：

- 🔒 **完善的验证机制**：防止无效数据提交
- 🚫 **重复性检查**：避免邮箱冲突
- 🛡️ **安全保护**：JWT 认证和权限控制
- 📝 **友好错误提示**：帮助用户快速定位问题
- 🧹 **数据清理**：自动处理输入数据格式

用户现在可以安全地编辑个人信息，系统会自动检查数据有效性并提供清晰的反馈。
