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

    <!-- 简化的搜索区域 -->
    <div class="search-section">
      <el-card>
        <!-- 主搜索栏 -->
        <div class="main-search-bar">
          <div class="search-input-wrapper">
            <SearchSuggestions
              v-model="quickSearchQuery"
              placeholder="搜索专利标题、专利号、描述..."
              @search="handleQuickSearch"
              @suggestion-select="handleSuggestionSelect"
              @history-select="handleHistorySelect"
              class="main-search-input"
            />
          </div>
          <div class="search-actions">
            <el-button
              type="primary"
              @click="toggleAdvancedSearch"
              :class="{ 'is-active': showAdvancedSearch }"
            >
              <el-icon><Tools /></el-icon>
              高级搜索
            </el-button>
            <el-button @click="handleReset" v-if="hasActiveFilters">
              <el-icon><RefreshLeft /></el-icon>
              重置
            </el-button>
          </div>
        </div>

        <!-- 高级搜索（隐藏状态） -->
        <div class="advanced-search-wrapper" v-show="showAdvancedSearch">
          <el-divider content-position="left">
            <span class="advanced-search-title">
              <el-icon><Tools /></el-icon>
              高级搜索条件
            </span>
          </el-divider>
          <AdvancedSearch
            v-model="showAdvancedSearch"
            @search="handleAdvancedSearch"
          />
        </div>

        <!-- 搜索结果信息 -->
        <div class="search-info" v-if="currentSearchInfo">
          <el-tag type="info" closable @close="clearSearch">
            {{ currentSearchInfo }}
          </el-tag>
        </div>
      </el-card>
    </div>

    <!-- 统计信息 -->
    <div class="stats-section">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">{{ localStatistics?.total || 0 }}</div>
              <div class="stat-label">总专利数</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">
                {{ localStatistics?.byStatus?.pending || 0 }}
              </div>
              <div class="stat-label">待审核</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">
                {{ localStatistics?.expiringSoon || 0 }}
              </div>
              <div class="stat-label">即将过期</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-number">
                {{ localStatistics?.maintenanceDue || 0 }}
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
            <span>专利列表 (共 {{ filteredPatents?.length || 0 }} 条记录)</span>
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

          <el-table-column prop="applicationDate" label="申请日期" width="120">
            <template #default="{ row }">
              {{ formatDate(row.applicationDate) }}
            </template>
          </el-table-column>

          <el-table-column prop="expirationDate" label="到期日期" width="120">
            <template #default="{ row }">
              {{ row.expirationDate ? formatDate(row.expirationDate) : "-" }}
            </template>
          </el-table-column>

          <el-table-column label="操作" width="200" fixed="right">
            <template #default="{ row }">
              <div class="action-buttons">
                <el-button size="small" @click="viewPatent(row.id)"
                  >查看</el-button
                >
                <el-button
                  size="small"
                  type="primary"
                  @click="editPatent(row.id)"
                  >编辑</el-button
                >
                <el-button
                  size="small"
                  type="danger"
                  @click="deletePatent(row.id)"
                  >删除</el-button
                >
              </div>
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
import { ref, reactive, computed, onMounted, unref } from "vue";
import { useRouter } from "vue-router";
import { usePatentStore } from "@/stores/patent";
import { useSearchStore } from "@/stores/search";
import { ElMessage, ElMessageBox } from "element-plus";
import { Plus, Tools, RefreshLeft } from "@element-plus/icons-vue";
import type { PatentStatistics, PatentTableSelection } from "@/types/patent";
import type {
  SearchCondition,
  SearchSuggestion,
  SearchHistory,
} from "@/types/search";
import { debounce } from "@/utils/performance";
import { formatDate } from "@/utils/dateUtils";
import SearchSuggestions from "@/components/SearchSuggestions.vue";
import AdvancedSearch from "@/components/AdvancedSearch.vue";

const router = useRouter();
const patentStore = usePatentStore();
const searchStore = useSearchStore();

// 响应式数据
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const total = ref(0);
const selectedPatents = ref<number[]>([]);

// 搜索相关状态
const showAdvancedSearch = ref(false);
const quickSearchQuery = ref("");
const currentSearchConditions = ref<SearchCondition[]>([]);
const currentSearchInfo = ref("");

// 简化的搜索状态
const hasActiveFilters = computed(() => {
  return (
    quickSearchQuery.value.trim() ||
    currentSearchConditions.value.length > 0 ||
    currentSearchInfo.value
  );
});

// 本地统计信息（用于显示）
const localStatistics = reactive<PatentStatistics>({
  total: 0,
  byStatus: {
    pending: 0,
    approved: 0,
    rejected: 0,
    expired: 0,
    maintained: 0,
  } as any,
  byType: {
    invention: 0,
    utility_model: 0,
    design: 0,
    software: 0,
  } as any,
  byCategory: {} as any,
  byYear: {} as any,
  recentApplications: 0,
  expiringSoon: 0,
  maintenanceDue: 0,
});

const filteredPatents = computed(() => {
  const base = unref(patentStore.patents) || [];

  if (currentSearchConditions.value.length > 0) {
    return searchStore.executeSearch(base, currentSearchConditions.value);
  }

  return unref(patentStore.filteredPatents) || [];
});

// 简化的搜索处理函数
const debouncedQuickSearch = debounce((query: string) => {
  if (query.trim()) {
    performQuickSearch(query.trim());
  } else {
    clearAllFilters();
  }
}, 300);

// 快速搜索执行
const performQuickSearch = (query: string) => {
  currentPage.value = 1;
  patentStore.clearFilters();
  patentStore.searchPatents(query);
  currentSearchInfo.value = `搜索: "${query}"`;
  updateLocalStatistics();

  // 记录搜索历史
  searchStore.addSearchHistory(query, filteredPatents.value.length);

  console.log(`快速搜索完成，找到 ${filteredPatents.value.length} 条记录`);
};

// 清除所有筛选
const clearAllFilters = () => {
  patentStore.clearFilters();
  currentSearchConditions.value = [];
  currentSearchInfo.value = "";
  updateLocalStatistics();
};

const handleReset = () => {
  // 重置所有搜索状态
  quickSearchQuery.value = "";
  showAdvancedSearch.value = false;
  clearAllFilters();

  console.log("已重置所有筛选条件");
  ElMessage.success("已重置所有筛选条件");
};

// 切换高级搜索显示状态
const toggleAdvancedSearch = () => {
  showAdvancedSearch.value = !showAdvancedSearch.value;
  if (showAdvancedSearch.value) {
    // 打开高级搜索时清除快速搜索
    quickSearchQuery.value = "";
    clearAllFilters();
  }
};

const handleQuickSearch = (query: string) => {
  console.log("快速搜索:", query);
  // 关闭高级搜索
  showAdvancedSearch.value = false;
  // 清除高级搜索条件
  currentSearchConditions.value = [];

  // 执行防抖搜索
  debouncedQuickSearch(query);
};

const handleAdvancedSearch = (conditions: SearchCondition[]) => {
  // 清除传统搜索
  patentStore.clearFilters();
  // Object.assign(searchForm.value, {
  //   keyword: "",
  //   status: "",
  //   type: "",
  //   categoryId: "",
  // });
  quickSearchQuery.value = "";

  // 设置高级搜索条件
  currentSearchConditions.value = conditions;

  // 生成搜索信息描述
  const conditionTexts = conditions.map((c) => {
    const field = searchStore.searchFields.find((f) => f.key === c.field);
    const fieldLabel = field?.label || c.field;
    const operatorLabel = getOperatorLabel(c.operator);
    return `${fieldLabel} ${operatorLabel} ${c.value}`;
  });

  currentSearchInfo.value = `高级搜索: ${conditionTexts.join(", ")}`;

  // 记录搜索历史
  const queryText = conditionTexts.join(" AND ");
  searchStore.addSearchHistory(
    queryText,
    filteredPatents.value.length,
    conditions
  );

  updateLocalStatistics();
  ElMessage.success(
    `高级搜索完成，找到 ${filteredPatents.value.length} 条记录`
  );
};

const handleSuggestionSelect = (suggestion: SearchSuggestion) => {
  console.log("选择建议:", suggestion);
};

const handleHistorySelect = (history: SearchHistory) => {
  if (history.conditions && history.conditions.length > 0) {
    // 使用高级搜索条件
    handleAdvancedSearch(history.conditions);
    showAdvancedSearch.value = true;
  } else {
    // 使用简单搜索
    handleQuickSearch(history.query);
  }
};

const clearSearch = () => {
  currentSearchConditions.value = [];
  currentSearchInfo.value = "";
  quickSearchQuery.value = "";
  patentStore.clearFilters();
  updateLocalStatistics();
  ElMessage.success("已清除搜索条件");
};

const getOperatorLabel = (operator: string): string => {
  const labels: Record<string, string> = {
    eq: "等于",
    ne: "不等于",
    contains: "包含",
    startsWith: "开始于",
    endsWith: "结束于",
    gt: "大于",
    gte: "大于等于",
    lt: "小于",
    lte: "小于等于",
    between: "介于",
    in: "包含于",
    notIn: "不包含于",
  };
  return labels[operator] || operator;
};

// 更新本地统计信息
const updateLocalStatistics = () => {
  const stats = unref(patentStore.statistics);
  if (stats) {
    localStatistics.total = stats.total || 0;
    localStatistics.byStatus = stats.byStatus || ({} as any);
    localStatistics.byType = stats.byType || ({} as any);
    localStatistics.byCategory = stats.byCategory || ({} as any);
    localStatistics.byYear = (stats as any).byYear || ({} as any);
    localStatistics.recentApplications = stats.recentApplications || 0;
    localStatistics.expiringSoon = stats.expiringSoon || 0;
    localStatistics.maintenanceDue = stats.maintenanceDue || 0;
  } else {
    localStatistics.total = 0;
    localStatistics.byStatus = {} as any;
    localStatistics.byType = {} as any;
    localStatistics.byCategory = {} as any;
    localStatistics.byYear = {} as any;
    localStatistics.recentApplications = 0;
    localStatistics.expiringSoon = 0;
    localStatistics.maintenanceDue = 0;
  }
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
    // 获取所有状态的专利，不限制状态
    await patentStore.fetchPatents();

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
  // 先获取专利数据，再更新统计信息
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

/* 新增样式 */
.main-search-bar {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-bottom: 16px;
}

.search-input-wrapper {
  flex: 1;
}

.main-search-input {
  width: 100%;
}

.search-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}

.search-actions .el-button.is-active {
  background-color: #409eff;
  border-color: #409eff;
  color: white;
}

.advanced-search-title {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  color: #409eff;
  font-weight: 500;
}

.advanced-search-wrapper {
  margin-top: 16px;
  border-top: 1px solid #e4e7ed;
  padding-top: 16px;
}

.traditional-search {
  margin-top: 8px;
}

.search-info {
  margin-top: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.search-info .el-tag {
  margin: 0;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .main-search-bar {
    flex-direction: column;
    gap: 8px;
  }

  .search-actions {
    justify-content: center;
  }
}

.action-buttons {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}

.action-buttons .el-button {
  margin: 0;
  flex-shrink: 0;
}

.action-buttons .el-button + .el-button {
  margin-left: 0;
}
</style>
