# 专利状态权限修复说明

## 🎯 问题描述

在添加专利页面中，申请人可以自己设定专利状态（如"已批准"、"已拒绝"等），这导致了严重的逻辑问题：

1. **权限混乱**: 申请人可以绕过审核流程直接设定专利状态
2. **审核流程失效**: 审核员的存在变得没有意义
3. **数据不一致**: 状态可能被错误设定

## ✅ 修复方案

### 1. 添加专利页面修复

**修改前:**

```vue
<el-form-item label="专利状态" prop="status">
  <el-select v-model="form.status" placeholder="选择专利状态">
    <el-option label="待审核" value="pending" />
    <el-option label="已批准" value="approved" />
    <el-option label="已拒绝" value="rejected" />
    <el-option label="已过期" value="expired" />
    <el-option label="维护中" value="maintained" />
  </el-select>
</el-form-item>
```

**修改后:**

```vue
<el-form-item label="分类" prop="categoryId">
  <el-select v-model="form.categoryId" placeholder="选择专利分类">
    <el-option
      v-for="category in categories"
      :key="category.id"
      :label="category.name"
      :value="category.id"
    />
  </el-select>
</el-form-item>
```

### 2. 专利编辑页面权限控制

**添加权限控制:**

```vue
<el-form-item label="专利状态" prop="status">
  <el-select
    v-model="form.status"
    placeholder="选择专利状态"
    :disabled="!canEditStatus"
  >
    <el-option label="待审核" value="pending" />
    <el-option label="已批准" value="approved" />
    <el-option label="已拒绝" value="rejected" />
    <el-option label="已过期" value="expired" />
    <el-option label="维护中" value="maintained" />
  </el-select>
  <div v-if="!canEditStatus" class="field-tip">
    只有管理员和审核员可以修改专利状态
  </div>
</el-form-item>
```

**权限逻辑:**

```typescript
const canEditStatus = computed(() => {
  return (
    hasPermission(currentUserRole.value, "canEditPatents") ||
    hasPermission(currentUserRole.value, "canAccessReviewCenter")
  );
});
```

## 🔄 工作流程修正

### 正确的专利生命周期

1. **申请人提交专利**

   - 状态自动设为 "pending"（待审核）
   - 申请人无法修改状态
   - 只能填写专利基本信息

2. **审核员审核**

   - 在审核中心查看待审核专利
   - 可以批准（approved）或拒绝（rejected）
   - 添加审核意见和记录

3. **管理员管理**
   - 可以编辑所有专利信息
   - 可以修改专利状态
   - 负责专利的长期维护

## 📋 权限矩阵更新

| 角色         | 添加专利                | 编辑专利信息 | 修改专利状态      | 审核专利 |
| ------------ | ----------------------- | ------------ | ----------------- | -------- |
| **普通用户** | ✅ (状态固定为 pending) | ❌           | ❌                | ❌       |
| **审核员**   | ✅ (状态固定为 pending) | ❌           | ✅ (通过审核中心) | ✅       |
| **管理员**   | ✅ (状态固定为 pending) | ✅           | ✅                | ❌       |

## 🎯 核心改进

### 1. 状态自动设定

```typescript
// 新添加的专利默认为待审核状态
status: "pending" as const,
legalStatus: "pending", // 新专利默认为待审核
```

### 2. 分类选择替代状态选择

- 移除了状态选择下拉框
- 添加了专利分类选择
- 更符合业务逻辑

### 3. 权限验证

- 只有管理员和审核员可以修改专利状态
- 普通用户无法编辑任何专利
- 审核员只能通过审核中心修改状态

## 🚀 用户体验改进

### 1. 清晰的权限提示

```vue
<div v-if="!canEditStatus" class="field-tip">
  只有管理员和审核员可以修改专利状态
</div>
```

### 2. 字段禁用状态

- 无权限用户看到禁用状态
- 提供明确的权限说明
- 避免用户困惑

### 3. 工作流程引导

- 申请人提交后自动进入审核队列
- 审核员在审核中心处理
- 状态变更有完整记录

## 🔒 安全增强

### 1. 前端权限控制

- 表单字段根据权限动态禁用
- 路由守卫防止未授权访问
- 清晰的权限提示信息

### 2. 数据一致性

- 新专利状态统一为 "pending"
- 状态变更有审核记录
- 防止数据混乱

### 3. 业务逻辑正确性

- 申请人 → 审核员 → 管理员 的清晰流程
- 每个角色职责明确
- 避免权限越界

## 📊 影响范围

### 修改的文件

- `patentMS/src/views/patents/PatentAdd.vue` - 移除状态选择，添加分类选择
- `patentMS/src/views/patents/PatentEdit.vue` - 添加状态编辑权限控制

### 新增功能

- 专利分类选择
- 状态编辑权限控制
- 权限提示信息

### 移除功能

- 申请人状态选择
- 无权限状态编辑

---

**修复时间**: 2025 年 1 月 29 日  
**修复状态**: ✅ 已完成  
**测试状态**: ✅ 通过  
**影响范围**: 专利添加和编辑功能
