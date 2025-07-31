<template>
  <div class="patent-list">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>专利管理</h1>
      <el-button type="primary" @click="$router.push('/dashboard/patents/add')">
        <el-icon><Plus /></el-icon>
        专利申请
      </el-button>
    </div>

    <!-- 搜索和筛选 -->
    <div class="search-section">
      <el-card>
        <el-form :model="searchForm" inline>
          <el-form-item label="关键词">
            <el-input
              v-model="searchForm.keyword"
              placeholder="搜索专利标题、描述、专利号"
              clearable
              @keyup.enter="handleSearch"
            />
          </el-form-item>

          <el-form-item label="状态">
            <el-select
              v-model="searchForm.status"
              placeholder="选择状态"
              clearable
            >
              <el-option label="待审核" value="pending" />
              <el-option label="已批准" value="approved" />
              <el-option label="已拒绝" value="rejected" />
              <el-option label="已过期" value="expired" />
              <el-option label="维护中" value="maintained" />
            </el-select>
          </el-form-item>

          <el-form-item label="类型">
            <el-select
              v-model="searchForm.type"
              placeholder="选择类型"
              clearable
            >
              <el-option label="发明专利" value="invention" />
              <el-option label="实用新型" value="utility_model" />
              <el-option label="外观设计" value="design" />
              <el-option label="软件专利" value="software" />
            </el-select>
          </el-form-item>

          <el-form-item label="分类">
            <el-select
              v-model="searchForm.categoryId"
              placeholder="选择分类"
              clearable
            >
              <el-option
                v-for="category in categories"
                :key="category.id"
                :label="category.name"
                :value="category.id.toString()"
              />
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

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ localStatistics.total }}</div>
              <div class="stat-label">总专利数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">
                {{ localStatistics.byStatus.pending || 0 }}
              </div>
              <div class="stat-label">待审核</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ localStatistics.expiringSoon }}</div>
              <div class="stat-label">即将过期</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">
                {{ localStatistics.maintenanceDue }}
              </div>
              <div class="stat-label">维护费到期</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 专利列表 -->
    <div class="list-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>专利列表 (共 {{ filteredPatents.length }} 条记录)</span>
            <div class="header-actions">
              <el-button size="small" @click="handleExport">导出</el-button>
              <el-button size="small" @click="handleRefresh">刷新</el-button>
            </div>
          </div>
        </template>

        <el-table
          :data="filteredPatents"
          v-loading="loading"
          stripe
          @selection-change="handleSelectionChange"
        >
          <el-table-column type="selection" width="55" />

          <el-table-column prop="patentNumber" label="专利号" width="150" />

          <el-table-column prop="title" label="专利标题" min-width="200">
            <template #default="{ row }">
              <el-link @click="viewPatent(row.id)">{{ row.title }}</el-link>
            </template>
          </el-table-column>

          <el-table-column prop="status" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)">
                {{ getStatusText(row.status) }}
              </el-tag>
            </template>
          </el-table-column>

          <el-table-column prop="type" label="类型" width="120">
            <template #default="{ row }">
              <el-tag size="small">{{ getTypeText(row.type) }}</el-tag>
            </template>
          </el-table-column>

          <el-table-column
            prop="applicationDate"
            label="申请日期"
            width="120"
          />

          <el-table-column prop="expirationDate" label="到期日期" width="120" />

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click="viewPatent(row.id)"
                >查看</el-button
              >
              <el-button size="small" type="primary" @click="editPatent(row.id)"
                >编辑</el-button
              >
              <el-button
                size="small"
                type="danger"
                @click="deletePatent(row.id)"
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
import { usePatentStore } from "@/stores/patent";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Search } from "@element-plus/icons-vue";
import type {
  PatentSearchParams,
  PatentStatistics,
  PatentTableSelection,
} from "@/types/patent";
import { debounce } from "@/utils/performance";

const router = useRouter();
const patentStore = usePatentStore();

// 响应式数据
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedPatents = ref<number[]>([]);

// 搜索表单
const searchForm = ref({
  keyword: "",
  status: "",
  type: "",
  categoryId: "",
});

// 本地统计信息（用于显示）
const localStatistics = reactive<PatentStatistics>({
  total: 0,
  byStatus: {} as any,
  byType: {} as any,
  byCategory: {} as any,
  byYear: {} as any,
  recentApplications: 0,
  expiringSoon: 0,
  maintenanceDue: 0,
});

// 计算属性
const categories = computed(() => patentStore.categories);
const filteredPatents = computed(() => patentStore.filteredPatents);
const statistics = computed(() => patentStore.statistics);

// 搜索处理函数
const handleSearch = () => {
  debouncedSearch();
};

// 防抖搜索函数
const debouncedSearch = debounce(() => {
  performSearch();
}, 300);

// 实际搜索执行
const performSearch = () => {
  currentPage.value = 1;

  // 清除之前的筛选
  patentStore.clearFilters();

  // 应用关键词搜索
  if (searchForm.value.keyword && searchForm.value.keyword.trim()) {
    patentStore.searchPatents(searchForm.value.keyword.trim());
    console.log("搜索关键词:", searchForm.value.keyword.trim());
  }

  // 应用状态筛选
  if (searchForm.value.status) {
    patentStore.filterByStatus(searchForm.value.status as any);
    console.log("筛选状态:", searchForm.value.status);
  }

  // 应用类型筛选
  if (searchForm.value.type) {
    patentStore.filterByType(searchForm.value.type as any);
    console.log("筛选类型:", searchForm.value.type);
  }

  // 应用分类筛选
  if (searchForm.value.categoryId) {
    patentStore.filterByCategory(parseInt(searchForm.value.categoryId));
    console.log("筛选分类:", searchForm.value.categoryId);
  }

  // 更新本地统计信息
  updateLocalStatistics();

  console.log("筛选后的专利数量:", filteredPatents.value.length);

  // 显示搜索结果提示
  const hasFilters =
    searchForm.value.keyword ||
    searchForm.value.status ||
    searchForm.value.type ||
    searchForm.value.categoryId;
  if (hasFilters) {
    ElMessage.success(`搜索完成，找到 ${filteredPatents.value.length} 条记录`);
  }
};

const handleReset = () => {
  // 重置表单
  Object.assign(searchForm.value, {
    keyword: "",
    status: "",
    type: "",
    categoryId: "",
  });

  // 清除所有过滤器
  patentStore.clearFilters();

  // 更新统计信息
  updateLocalStatistics();

  console.log("已重置所有筛选条件");
  ElMessage.success("已重置所有筛选条件");
};

// 更新本地统计信息
const updateLocalStatistics = () => {
  const stats = patentStore.statistics;
  localStatistics.total = stats.total;
  localStatistics.byStatus = stats.byStatus;
  localStatistics.byType = stats.byType;
  localStatistics.byCategory = stats.byCategory;
  localStatistics.byYear = stats.byYear;
  localStatistics.recentApplications = stats.recentApplications;
  localStatistics.expiringSoon = stats.expiringSoon;
  localStatistics.maintenanceDue = stats.maintenanceDue;
};

const handleSelectionChange = (selection: PatentTableSelection[]) => {
  selectedPatents.value = selection.map((item) => item.id);
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  fetchPatents();
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  fetchPatents();
};

const handleRefresh = () => {
  fetchPatents();
};

const handleExport = () => {
  ElMessage.success("导出功能开发中...");
};

const viewPatent = (id: number) => {
  router.push(`/dashboard/patents/${id}`);
};

const editPatent = (id: number) => {
  router.push(`/dashboard/patents/${id}/edit`);
};

const deletePatent = async (id: number) => {
  try {
    await ElMessageBox.confirm("确定要删除这个专利吗？", "确认删除", {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
    });

    await patentStore.deletePatent(id);
    ElMessage.success("删除成功");
    fetchPatents();
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("删除失败");
    }
  }
};

const fetchPatents = async () => {
  loading.value = true;
  try {
    await patentStore.fetchPatents();
    await patentStore.fetchCategories();
    // 更新统计信息
    updateLocalStatistics();
  } catch (error) {
    ElMessage.error("获取数据失败");
  } finally {
    loading.value = false;
  }
};

const getStatusType = (status: string) => {
  const types: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    expired: "info",
    maintained: "primary",
  };
  return types[status] || "info";
};

const getStatusText = (status: string) => {
  const texts: Record<string, string> = {
    pending: "待审核",
    approved: "已批准",
    rejected: "已拒绝",
    expired: "已过期",
    maintained: "维护中",
  };
  return texts[status] || status;
};

const getTypeText = (type: string) => {
  const texts: Record<string, string> = {
    invention: "发明专利",
    utility_model: "实用新型",
    design: "外观设计",
    software: "软件专利",
  };
  return texts[type] || type;
};

// 生命周期

onMounted(() => {
  fetchPatents();
});
</script>

<style scoped>
.patent-list {
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

.stats-section {
  margin-bottom: 20px;
}

.stat-card {
  text-align: center;
}

.stat-content {
  padding: 20px;
}

.stat-number {
  font-size: 2em;
  font-weight: bold;
  color: #409eff;
  margin-bottom: 5px;
}

.stat-label {
  color: #666;
  font-size: 0.9em;
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
