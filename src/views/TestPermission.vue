<template>
  <div class="test-permission">
    <div class="page-header">
      <h1>权限测试页面</h1>
      <el-button @click="$router.go(-1)">
        <el-icon><ArrowLeft /></el-icon>
        返回
      </el-button>
    </div>

    <el-card>
      <template #header>
        <div class="card-header">
          <span>当前用户权限信息</span>
        </div>
      </template>

      <div class="user-info">
        <h3>用户信息</h3>
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户名">
            {{ userStore.currentUser?.username || "未登录" }}
          </el-descriptions-item>
          <el-descriptions-item label="真实姓名">
            {{ userStore.currentUser?.realName || "未登录" }}
          </el-descriptions-item>
          <el-descriptions-item label="角色">
            <el-tag :type="getRoleTagType(userStore.currentUser?.role)">
              {{ getRoleText(userStore.currentUser?.role) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="部门">
            {{ getDepartmentText(userStore.currentUser?.department) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>

      <el-divider />

      <div class="permission-test">
        <h3>权限测试</h3>

        <div class="permission-grid">
          <el-card
            v-for="(permission, key) in permissions"
            :key="key"
            class="permission-card"
            :class="{ 'has-permission': permission.hasPermission }"
          >
            <template #header>
              <div class="permission-header">
                <span>{{ permission.name }}</span>
                <el-tag
                  :type="permission.hasPermission ? 'success' : 'danger'"
                  size="small"
                >
                  {{ permission.hasPermission ? "有权限" : "无权限" }}
                </el-tag>
              </div>
            </template>
            <p>{{ permission.description }}</p>
          </el-card>
        </div>
      </div>

      <el-divider />

      <div class="action-test">
        <h3>功能测试</h3>

        <div class="action-buttons">
          <el-button
            type="primary"
            @click="testAddUser"
            :disabled="!hasPermission('canAddUsers')"
          >
            测试添加用户
          </el-button>

          <el-button
            type="success"
            @click="testViewUsers"
            :disabled="!hasPermission('canViewUsers')"
          >
            测试查看用户
          </el-button>

          <el-button
            type="warning"
            @click="testAddPatent"
            :disabled="!hasPermission('canAddPatents')"
          >
            测试添加专利
          </el-button>

          <el-button
            type="info"
            @click="testReviewCenter"
            :disabled="!hasPermission('canAccessReviewCenter')"
          >
            测试审核中心
          </el-button>
        </div>
      </div>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRouter } from "vue-router";
import { useUserStore } from "@/stores/user";
import { ElMessage } from "element-plus";
import { hasPermission } from "@/utils/permissions";
import { getRoleTagType } from "@/utils/tagTypes";
import { ArrowLeft } from "@element-plus/icons-vue";

const router = useRouter();
const userStore = useUserStore();

// 权限检查函数
const hasPermissionLocal = (permission: string) => {
  const currentUser = userStore.currentUser;
  return currentUser
    ? hasPermission(currentUser.role, permission as any)
    : false;
};

// 获取角色文本
const getRoleText = (role?: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role || ""] || "未知";
};

// 获取部门文本
const getDepartmentText = (department?: string) => {
  const texts: Record<string, string> = {
    tech: "技术部",
    legal: "法务部",
    admin: "管理部",
    other: "其他",
  };
  return texts[department || ""] || department || "未知";
};

// 权限列表
const permissions = computed(() => ({
  canAddUsers: {
    name: "添加用户",
    description: "可以添加新用户到系统",
    hasPermission: hasPermissionLocal("canAddUsers"),
  },
  canViewUsers: {
    name: "查看用户",
    description: "可以查看用户列表和详情",
    hasPermission: hasPermissionLocal("canViewUsers"),
  },
  canEditUsers: {
    name: "编辑用户",
    description: "可以编辑用户信息",
    hasPermission: hasPermissionLocal("canEditUsers"),
  },
  canDeleteUsers: {
    name: "删除用户",
    description: "可以删除用户",
    hasPermission: hasPermissionLocal("canDeleteUsers"),
  },
  canAddPatents: {
    name: "添加专利",
    description: "可以添加新专利",
    hasPermission: hasPermissionLocal("canAddPatents"),
  },
  canViewPatents: {
    name: "查看专利",
    description: "可以查看专利列表和详情",
    hasPermission: hasPermissionLocal("canViewPatents"),
  },
  canEditPatents: {
    name: "编辑专利",
    description: "可以编辑专利信息",
    hasPermission: hasPermissionLocal("canEditPatents"),
  },
  canDeletePatents: {
    name: "删除专利",
    description: "可以删除专利",
    hasPermission: hasPermissionLocal("canDeletePatents"),
  },
  canAccessReviewCenter: {
    name: "审核中心",
    description: "可以访问审核中心",
    hasPermission: hasPermissionLocal("canAccessReviewCenter"),
  },
  canManageCategories: {
    name: "分类管理",
    description: "可以管理专利分类",
    hasPermission: hasPermissionLocal("canManageCategories"),
  },
  canViewReports: {
    name: "查看报表",
    description: "可以查看统计报表",
    hasPermission: hasPermissionLocal("canViewReports"),
  },
}));

// 测试功能
const testAddUser = () => {
  if (hasPermissionLocal("canAddUsers")) {
    ElMessage.success("有添加用户权限，正在跳转...");
    router.push("/dashboard/users/add");
  } else {
    ElMessage.error("没有添加用户权限");
  }
};

const testViewUsers = () => {
  if (hasPermissionLocal("canViewUsers")) {
    ElMessage.success("有查看用户权限，正在跳转...");
    router.push("/dashboard/users");
  } else {
    ElMessage.error("没有查看用户权限");
  }
};

const testAddPatent = () => {
  if (hasPermissionLocal("canAddPatents")) {
    ElMessage.success("有添加专利权限，正在跳转...");
    router.push("/dashboard/patents/add");
  } else {
    ElMessage.error("没有添加专利权限");
  }
};

const testReviewCenter = () => {
  if (hasPermissionLocal("canAccessReviewCenter")) {
    ElMessage.success("有审核中心权限，正在跳转...");
    router.push("/dashboard/review");
  } else {
    ElMessage.error("没有审核中心权限");
  }
};
</script>

<style scoped>
.test-permission {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;
  color: #2c3e50;
}

.user-info,
.permission-test,
.action-test {
  margin-bottom: 20px;
}

.user-info h3,
.permission-test h3,
.action-test h3 {
  margin-bottom: 15px;
  color: #2c3e50;
}

.permission-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 15px;
}

.permission-card {
  transition: all 0.3s ease;
}

.permission-card.has-permission {
  border-color: #67c23a;
  background-color: rgba(103, 194, 58, 0.05);
}

.permission-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.permission-header span {
  font-weight: 600;
}

.action-buttons {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .permission-grid {
    grid-template-columns: 1fr;
  }

  .action-buttons {
    flex-direction: column;
  }
}
</style>
