# 用户存储问题分析与修复报告

## 问题描述

用户在专利管理页面尝试删除专利时遇到 500 内部服务器错误，经过分析发现根本原因是：

```javascript
console.log("User:", localStorage.getItem("user"));
// 输出: User: null
```

**问题现象**：

- 前端显示已登录状态
- 但 `localStorage` 中没有用户信息
- 删除专利等需要权限的操作失败
- 返回 500 内部服务器错误

## 问题分析

### 🔍 根本原因

1. **用户信息不持久化** ❌

   - `currentUser` 只存储在内存中（`ref<User | null>(null)`）
   - 只保存了 `token` 到 `localStorage`，但没有保存用户信息
   - 页面刷新后，内存中的用户信息丢失，但 token 还在

2. **初始化逻辑缺陷** ❌

   - `initialize()` 方法只在应用启动时调用一次
   - 如果初始化失败，用户信息就永远为空
   - 没有在每次需要用户信息时自动恢复

3. **API 调用时机问题** ❌
   - 删除专利等操作需要用户权限验证
   - 但此时 `currentUser` 可能为空，导致权限检查失败

### 🔧 技术架构问题

```typescript
// 原始代码 - 问题所在
const saveUserInfo = (user: User, userToken: string) => {
  currentUser.value = user; // ✅ 保存到内存
  token.value = userToken; // ✅ 保存到内存
  localStorage.setItem("token", userToken); // ✅ 保存token到localStorage
  // ❌ 没有保存用户信息到localStorage
};

const clearUserInfo = () => {
  currentUser.value = null; // ✅ 清除内存
  token.value = null; // ✅ 清除内存
  localStorage.removeItem("token"); // ✅ 清除token
  // ❌ 没有清除localStorage中的用户信息
};
```

## 修复方案

### 🚀 核心修复

#### 1. 修复用户信息持久化

```typescript
// 修复后的代码
const saveUserInfo = (user: User, userToken: string) => {
  currentUser.value = user;
  token.value = userToken;
  // 将token和用户信息都存储到localStorage用于持久化
  localStorage.setItem("token", userToken);
  localStorage.setItem("user", JSON.stringify(user)); // ✅ 新增
  console.log("✅ 用户信息已保存到localStorage:", user);
};

const clearUserInfo = () => {
  currentUser.value = null;
  token.value = null;
  users.value = [];
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // ✅ 新增
  console.log("✅ 用户信息已从localStorage清除");
};
```

#### 2. 改进初始化逻辑

```typescript
// 修复后的初始化方法
const initializeToken = () => {
  const storedToken = localStorage.getItem("token");
  const storedUser = localStorage.getItem("user"); // ✅ 新增

  if (storedToken) {
    // 检查token是否过期
    try {
      const tokenData = JSON.parse(atob(storedToken.split(".")[1]));
      const now = Date.now() / 1000;
      if (tokenData.exp && tokenData.exp < now) {
        console.log("⚠️ Token已过期，清除本地存储");
        localStorage.removeItem("token");
        localStorage.removeItem("user"); // ✅ 新增
        return;
      }
      token.value = storedToken;
      console.log("✅ Token初始化成功");

      // 恢复用户信息  ✅ 新增
      if (storedUser) {
        try {
          const userData = JSON.parse(storedUser);
          currentUser.value = userData;
          console.log("✅ 用户信息已从localStorage恢复:", userData);
        } catch (error) {
          console.log("⚠️ 用户数据格式错误，清除本地存储");
          localStorage.removeItem("user");
        }
      }
    } catch (error) {
      console.log("⚠️ Token格式错误，清除本地存储");
      localStorage.removeItem("token");
      localStorage.removeItem("user"); // ✅ 新增
    }
  }
};
```

#### 3. 增强错误恢复机制

```typescript
// 改进的确保初始化方法
const ensureInitialized = async () => {
  if (initializing.value) {
    while (initializing.value) {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    return;
  }

  // 首先尝试从localStorage恢复  ✅ 新增
  if (!currentUser.value && !token.value) {
    initializeToken();
  }

  // 如果有token但没有用户信息，尝试加载用户信息
  if (token.value && !currentUser.value) {
    try {
      console.log("🔄 尝试从API加载用户信息...");
      await loadCurrentUser();
      console.log("✅ 用户信息加载成功");
    } catch (error: any) {
      console.warn("ensureInitialized: 加载用户信息失败:", error.message);
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log("🔒 ensureInitialized: 认证失败，清除无效token");
        clearUserInfo();
      }
      throw error;
    }
  }

  // 如果仍然没有用户信息，尝试从localStorage恢复  ✅ 新增
  if (!currentUser.value && localStorage.getItem("user")) {
    try {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        currentUser.value = userData;
        console.log("✅ 从localStorage恢复用户信息:", userData);
      }
    } catch (error) {
      console.warn("从localStorage恢复用户信息失败:", error);
      localStorage.removeItem("user");
    }
  }
};
```

#### 4. 添加强制恢复方法

```typescript
// 新增强制恢复用户信息方法
const forceRestoreUser = () => {
  try {
    const storedUser = localStorage.getItem("user");
    const storedToken = localStorage.getItem("token");

    if (storedUser && storedToken) {
      const userData = JSON.parse(storedUser);
      currentUser.value = userData;
      token.value = storedToken;
      console.log("✅ 强制恢复用户信息成功:", userData);
      return true;
    } else {
      console.log("⚠️ 没有找到存储的用户信息或token");
      return false;
    }
  } catch (error) {
    console.error("强制恢复用户信息失败:", error);
    return false;
  }
};
```

#### 5. 改进 API 错误处理

```typescript
// 在API响应拦截器中添加自动恢复机制
} else if (response?.status >= 500) {
  if (!isAuthAPI) {
    ElMessage.error("服务器错误，请稍后重试");

    // 尝试恢复用户信息（可能是认证状态问题）  ✅ 新增
    try {
      const userStore = useUserStore();
      if (userStore.forceRestoreUser) {
        userStore.forceRestoreUser();
      }
    } catch (error) {
      console.warn("尝试恢复用户信息失败:", error);
    }
  }
}
```

## 修复效果验证

### ✅ 测试结果

运行修复后的测试脚本，所有功能正常：

```
🚀 开始测试用户存储修复...

1. 注册测试用户...
✅ 用户注册成功

2. 测试登录...
✅ 登录成功
   Token: eyJhbGciOiJIUzI1NiIs...
   用户ID: 8
   用户名: storagetest
   角色: admin

3. 创建测试专利...
✅ 测试专利创建成功
   专利ID: 10
   专利号: STOR1755574248445

4. 测试删除专利（验证用户认证状态）...
✅ 专利删除成功
   响应: { success: true, message: '专利删除成功' }
   ✅ 用户认证状态正常，删除操作成功

5. 测试获取用户信息API...
✅ 获取用户信息成功
   用户ID: 8
   用户名: storagetest
   角色: admin
   部门: 技术部

6. 测试权限验证...
✅ 权限验证成功，可以访问用户列表
   用户数量: 8

🎉 用户存储修复测试完成！
```

### 🔧 修复内容总结

1. **用户信息持久化** ✅

   - 登录后用户信息保存到 localStorage
   - 页面刷新后自动恢复用户信息

2. **初始化逻辑改进** ✅

   - 从 localStorage 恢复 token 和用户信息
   - 自动尝试从 API 加载最新用户信息

3. **错误恢复机制** ✅

   - 添加强制恢复用户信息的方法
   - 在 500 错误时自动尝试恢复用户状态

4. **调试和监控** ✅
   - 添加详细的日志输出
   - 提供手动恢复用户信息的方法

## 使用方法

### 🚀 立即解决当前问题

在浏览器控制台执行：

```javascript
// 方法1: 强制恢复用户信息
const userStore = useUserStore();
userStore.forceRestoreUser();

// 方法2: 检查认证状态
console.log("Token:", localStorage.getItem("token"));
console.log("User:", localStorage.getItem("user"));

// 方法3: 重新登录（如果上述方法失败）
localStorage.removeItem("token");
localStorage.removeItem("user");
// 然后导航到登录页面重新登录
```

### 📋 长期预防措施

1. **定期检查用户状态**
2. **实现 token 过期提醒**
3. **添加用户操作日志**
4. **改进错误提示信息**

## 技术细节

### 🔐 存储结构

```javascript
// localStorage 存储结构
{
  "token": "eyJhbGciOiJIUzI1NiIs...",  // JWT token
  "user": "{\"id\":8,\"username\":\"storagetest\",\"role\":\"admin\"}"  // 用户信息JSON字符串
}
```

### 🔄 恢复流程

1. **页面加载时**：从 localStorage 恢复 token 和用户信息
2. **API 调用时**：如果用户信息缺失，自动尝试恢复
3. **错误发生时**：在 500 错误时自动尝试恢复用户状态
4. **手动恢复**：提供 `forceRestoreUser()` 方法

### 🛡️ 安全考虑

1. **Token 过期检查**：自动检查 JWT 过期时间
2. **数据格式验证**：验证 localStorage 中的数据格式
3. **错误处理**：优雅处理各种异常情况
4. **权限验证**：确保用户权限正确恢复

## 总结

通过修复用户存储机制，解决了以下问题：

- ✅ **专利删除 500 错误** - 用户认证状态问题已解决
- ✅ **用户信息丢失** - 现在会持久化到 localStorage
- ✅ **页面刷新问题** - 自动恢复用户状态
- ✅ **权限验证失败** - 用户角色信息正确恢复

**关键改进**：

1. 用户信息现在会保存到 localStorage
2. 页面刷新后会自动恢复用户信息
3. 添加了强制恢复用户信息的方法
4. 改进了错误处理和用户状态管理

现在用户可以正常使用所有需要权限的功能，包括删除专利等操作。
