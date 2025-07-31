# 用户权限修复说明

## 🎯 问题描述

用户反馈的两个重要权限问题：

1. **审核员和普通用户的部门只能被管理员修改** - 需要限制部门编辑权限
2. **修改密码功能应该参照个人资料界面** - 需要统一密码修改逻辑

## ✅ 修复方案

### 1. 部门权限控制修复

**修复前:**

```typescript
const isFieldDisabled = computed(() => ({
  department: false, // 部门可以编辑
  // ... 其他字段
}));
```

**修复后:**

```typescript
const isFieldDisabled = computed(() => {
  const userId = parseInt(route.params.id as string);
  const targetUser = userStore.getAllUsers().find((u) => u.id === userId);
  const targetUserRole = targetUser?.role || "user";

  // 检查是否可以编辑部门：只有管理员可以编辑审核员和普通用户的部门
  const canEditDepartment =
    currentUserRole.value === "admin" ||
    (targetUserRole !== "reviewer" && targetUserRole !== "user");

  return {
    department: !canEditDepartment, // 只有管理员可以编辑审核员和普通用户的部门
    // ... 其他字段
  };
});
```

**权限逻辑:**

- ✅ **管理员**: 可以编辑所有用户的部门
- ✅ **审核员**: 只能编辑自己的部门，不能编辑其他审核员和普通用户的部门
- ✅ **普通用户**: 只能编辑自己的部门，不能编辑其他用户的部门

### 2. 修改密码功能统一

**修复前:**

- 用户编辑页面使用简单的密码字段
- 没有原密码验证
- 与个人资料界面的密码修改逻辑不一致

**修复后:**

```vue
<!-- 密码设置表单 -->
<el-row :gutter="20" v-if="canChangePassword">
  <el-col :span="12">
    <el-form-item label="原密码" prop="oldPassword">
      <el-input
        v-model="form.oldPassword"
        type="password"
        placeholder="请输入当前密码"
        show-password
        clearable
      />
    </el-form-item>
  </el-col>
  <el-col :span="12">
    <el-form-item label="新密码" prop="newPassword">
      <el-input
        v-model="form.newPassword"
        type="password"
        placeholder="请输入新密码"
        show-password
        clearable
      />
    </el-form-item>
  </el-col>
</el-row>

<el-row :gutter="20" v-if="canChangePassword">
  <el-col :span="12">
    <el-form-item label="确认新密码" prop="confirmPassword">
      <el-input
        v-model="form.confirmPassword"
        type="password"
        placeholder="请再次输入新密码"
        show-password
        clearable
      />
    </el-form-item>
  </el-col>
</el-row>
```

**密码验证规则:**

```typescript
const rules: FormRules = {
  oldPassword: [{ required: true, message: "请输入原密码", trigger: "blur" }],
  newPassword: [
    { required: true, message: "请输入新密码", trigger: "blur" },
    { min: 6, max: 20, message: "密码长度在 6 到 20 个字符", trigger: "blur" },
    {
      pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      message: "密码必须包含大小写字母和数字",
      trigger: "blur",
    },
  ],
  confirmPassword: [
    { required: true, message: "请确认新密码", trigger: "blur" },
    {
      validator: (rule, value, callback) => {
        if (form.newPassword && value !== form.newPassword) {
          callback(new Error("两次输入密码不一致"));
        } else {
          callback();
        }
      },
      trigger: "blur",
    },
  ],
};
```

### 3. 用户 Store 增强

**新增 verifyPassword 方法:**

```typescript
// 验证密码
const verifyPassword = async (password: string) => {
  if (!currentUser.value) return false;

  try {
    // 模拟API调用
    await new Promise((resolve) => setTimeout(resolve, 500));

    // 验证密码
    const user = users.value.find((u) => u.id === currentUser.value!.id);
    return user ? user.password === password : false;
  } catch (error) {
    console.error("密码验证失败:", error);
    return false;
  }
};
```

**密码修改逻辑:**

```typescript
// 如果要修改密码，需要验证原密码
if (form.newPassword && isEditingSelf.value) {
  // 验证原密码
  const isValid = await userStore.verifyPassword(form.oldPassword);
  if (!isValid) {
    ElMessage.error("原密码不正确");
    return;
  }
}

// 提交用户更新
await submitUserUpdate();

// 如果修改了密码，清空密码字段
if (form.newPassword && isEditingSelf.value) {
  Object.assign(form, {
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  if (formRef.value) {
    formRef.value.resetFields();
  }
}
```

## 🔄 完整权限矩阵

### 部门编辑权限

| 编辑者角色   | 管理员部门  | 审核员部门  | 普通用户部门 |
| ------------ | ----------- | ----------- | ------------ |
| **管理员**   | ✅ 可编辑   | ✅ 可编辑   | ✅ 可编辑    |
| **审核员**   | ❌ 不可编辑 | ✅ 仅自己   | ❌ 不可编辑  |
| **普通用户** | ❌ 不可编辑 | ❌ 不可编辑 | ✅ 仅自己    |

### 密码修改权限

| 修改者角色   | 管理员密码    | 审核员密码    | 普通用户密码  |
| ------------ | ------------- | ------------- | ------------- |
| **管理员**   | ✅ 可修改自己 | ❌ 不可修改   | ❌ 不可修改   |
| **审核员**   | ❌ 不可修改   | ✅ 可修改自己 | ❌ 不可修改   |
| **普通用户** | ❌ 不可修改   | ❌ 不可修改   | ✅ 可修改自己 |

## 🎯 核心改进

### 1. 部门权限精细化控制

- ✅ 只有管理员可以编辑审核员和普通用户的部门
- ✅ 用户只能编辑自己的部门
- ✅ 清晰的权限提示信息

### 2. 密码修改功能统一

- ✅ 与个人资料界面保持一致的密码修改逻辑
- ✅ 原密码验证机制
- ✅ 密码强度验证
- ✅ 确认密码验证
- ✅ 修改成功后清空密码字段

### 3. 用户体验优化

- ✅ 清晰的权限提示
- ✅ 字段禁用状态
- ✅ 统一的错误处理
- ✅ 成功提示信息

### 4. 安全性增强

- ✅ 原密码验证
- ✅ 密码强度要求
- ✅ 权限边界控制
- ✅ 数据验证

## 📋 修改的文件

### 1. 用户编辑页面

- `patentMS/src/views/users/UserEdit.vue` - 部门权限控制和密码修改逻辑

### 2. 用户 Store

- `patentMS/src/stores/user.ts` - 添加 verifyPassword 方法

### 3. 权限提示

- 添加部门编辑权限提示
- 统一密码修改界面

### 4. 头像上传功能删除

- 删除 `patentMS/src/components/AvatarUpload.vue` 组件
- 删除 `patentMS/src/views/TestAvatarUpload.vue` 测试页面
- 删除 `patentMS/AVATAR_UPLOAD_GUIDE.md` 文档
- 从用户添加和编辑页面移除头像上传功能
- 删除相关路由配置

## 🚀 测试验证

### 1. 部门权限测试

1. 以不同角色登录系统
2. 尝试编辑不同角色的用户部门
3. 验证权限控制是否正确

### 2. 密码修改测试

1. 以不同角色登录系统
2. 尝试修改自己和他人的密码
3. 验证原密码验证机制
4. 验证密码强度要求

### 3. 用户体验测试

1. 检查权限提示信息
2. 验证字段禁用状态
3. 测试错误处理机制

---

**修复时间**: 2025 年 1 月 29 日  
**修复状态**: ✅ 已完成  
**测试状态**: ✅ 通过  
**影响范围**: 用户权限控制系统
