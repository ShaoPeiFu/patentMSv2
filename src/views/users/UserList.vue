<template>
  <div class="user-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户管理</h1>
      <el-button type="primary" @click="handleAddUser" v-if="canAddUsers">
        <el-icon><Plus /></el-icon>
        添加用户
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索用户名、姓名、邮箱"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="部门">
            <el-select
              v-model="searchForm.department"
              placeholder="选择部门"
              clearable
            >
              <el-option label="技术部" value="tech" />
              <el-option label="法务部" value="legal" />
              <el-option label="管理部" value="admin" />
              <el-option label="其他" value="other" />
            </el-select>
          </el-form-item>

          <el-form-item label="角色">
            <el-select
              v-model="searchForm.role"
              placeholder="选择角色"
              clearable
            >
              <el-option label="普通用户" value="user" />
              <el-option label="管理员" value="admin" />
              <el-option label="审核员" value="reviewer" />
            </el-select>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="handleReset">重置</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>

    <!-- 用户列表 -->
    <div class="list-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户列表</span>
            <div class="header-actions">
              <el-button size="small" @click="handleExport">导出</el-button>
              <el-button size="small" @click="handleRefresh">刷新</el-button>
            </div>
          </div>
        </template>

        <el-table :data="filteredUsers" v-loading="loading" stripe>
          <el-table-column prop="id" label="ID" width="80" />

          <el-table-column label="头像" width="80">
            <template #default="{ row }">
              <el-avatar
                :src="
                  row.avatar ||
                  'https://cube.elemecdn.com/0/88/03b0d39583f48206768a7534e55bcpng.png'
                "
              />
            </template>
          </el-table-column>

          <el-table-column prop="username" label="用户名" width="120" />

          <el-table-column prop="realName" label="真实姓名" width="120" />

          <el-table-column prop="email" label="邮箱" min-width="200" />

          <el-table-column prop="phone" label="手机号码" width="130" />

          <el-table-column prop="department" label="部门" width="100">
            <template #default="{ row }">
              <el-tag size="small">{{
                getDepartmentText(row.department)
              }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="role" label="角色" width="100">
            <template #default="{ row }">
              <el-tag :type="getRoleTagType(row.role)" size="small">
                {{ getRoleText(row.role) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="createdAt" label="注册时间" width="160">
            <template #default="{ row }">
              {{ formatDate(row.createdAt) }}
            </template>
          </el-table-column>

          <el-table-column prop="lastLoginAt" label="最后登录" width="160">
            <template #default="{ row }">
              {{ formatDate(row.lastLoginAt) }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewUser(row.id)">查看</el-button>
              <el-button size="small" type="primary" @click="editUser(row.id)"
                >编辑</el-button
              >
              <el-button size="small" type="danger" @click="deleteUser(row.id)"
                >删除</el-button
              >
            </template>
          </el-table-column>
        </el-table>

        <!-- 分页 -->
        <div class="pagination-wrapper">
          <el-pagination
            v-model:current-page="currentPage"
            v-model:page-size="pageSize"
            :page-sizes="[10, 20, 50, 100]"
            :total="total"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
          />
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import { useRouter } from "vue-router";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import { useUserStore } from "@/stores/user";
import { hasPermission } from "@/utils/permissions";
import { getRoleTagType } from "@/utils/tagTypes";

const router = useRouter();
const userStore = useUserStore();

// 权限检查
const canAddUsers = computed(() => {
  const currentUser = userStore.currentUser;
  return currentUser ? hasPermission(currentUser.role, "canAddUsers") : false;
});

// 响应式数据
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);

// 搜索表单
const searchForm = reactive({
  keyword: "",
  department: "",
  role: "",
});

// 计算属性 - 使用store中的真实用户数据
const users = computed(() => userStore.getAllUsers());

const filteredUsers = computed(() => {
  let result = users.value;

  if (searchForm.keyword) {
    const keyword = searchForm.keyword.toLowerCase();
    result = result.filter(
      (user) =>
        user.username.toLowerCase().includes(keyword) ||
        user.realName.toLowerCase().includes(keyword) ||
        user.email.toLowerCase().includes(keyword)
    );
  }

  if (searchForm.department) {
    result = result.filter((user) => user.department === searchForm.department);
  }

  if (searchForm.role) {
    result = result.filter((user) => user.role === searchForm.role);
  }

  return result;
});

// 方法
const handleSearch = () => {
  currentPage.value = 1;
  total.value = filteredUsers.value.length;
};

const handleReset = () => {
  Object.assign(searchForm, {
    keyword: "",
    department: "",
    role: "",
  });
  handleSearch();
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  currentPage.value = 1;
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
};

const handleRefresh = () => {
  handleSearch();
};

const handleExport = () => {
  ElMessage.success("导出功能开发中...");
};

const handleAddUser = () => {
  router.push("/dashboard/users/add");
};

const viewUser = (id: number) => {
  router.push(`/dashboard/users/${id}`);
};

const editUser = (id: number) => {
  router.push(`/dashboard/users/${id}/edit`);
};

const deleteUser = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个用户吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    userStore.deleteUser(id);
    ElMessage.success("删除成功");
    handleSearch();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const getDepartmentText = (department: string) => {
  const texts: Record<string, string> = {
    tech: "技术部",
    legal: "法务部",
    admin: "管理部",
    other: "其他",
  };
  return texts[department] || department;
};

const getRoleText = (role: string) => {
  const texts: Record<string, string> = {
    user: "普通用户",
    admin: "管理员",
    reviewer: "审核员",
  };
  return texts[role] || role;
};

// 使用统一的getRoleTagType函数

const formatDate = (dateString: string) => {
  if (!dateString) return "未登录";
  return new Date(dateString).toLocaleString("zh-CN");
};

// 生命周期
onMounted(() => {
  handleSearch();
});
</script>

<style scoped>
.user-list {
  padding: 20px;
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

.search-section {
  margin-bottom: 20px;
}

.list-section {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 10px;
}

.pagination-wrapper {
  margin-top: 20px;
  text-align: center;
}
</style>
