<template>
  <div class="table-widget">
    <div class="widget-header">
      <h3 class="widget-title">{{ widget.title }}</h3>
      <div class="widget-actions">
        <el-button-group size="small">
          <el-button @click="refreshData">
            <el-icon><Refresh /></el-icon>
          </el-button>
          <el-button @click="exportTable">
            <el-icon><Download /></el-icon>
          </el-button>
        </el-button-group>
      </div>
    </div>

    <div class="table-container">
      <el-table
        :data="tableData"
        :height="tableHeight"
        stripe
        border
        :loading="loading"
        @selection-change="handleSelectionChange"
      >
        <el-table-column type="selection" width="55" />

        <el-table-column
          v-for="column in displayColumns"
          :key="column.key"
          :prop="column.key"
          :label="column.label"
          :width="column.width"
          :min-width="column.minWidth"
          :sortable="column.sortable"
        >
          <template #default="{ row }">
            <div v-if="column.type === 'tag'">
              <el-tag :type="getTagType(row[column.key])">
                {{ formatValue(row[column.key], column) }}
              </el-tag>
            </div>
            <div v-else-if="column.type === 'link'">
              <el-link @click="handleCellClick(row, column)">
                {{ formatValue(row[column.key], column) }}
              </el-link>
            </div>
            <div v-else-if="column.type === 'number'">
              <span class="number-cell">
                {{ formatValue(row[column.key], column) }}
              </span>
            </div>
            <div v-else-if="column.type === 'date'">
              <span class="date-cell">
                {{ formatValue(row[column.key], column) }}
              </span>
            </div>
            <div v-else>
              {{ formatValue(row[column.key], column) }}
            </div>
          </template>
        </el-table-column>

        <el-table-column
          label="操作"
          width="120"
          fixed="right"
          v-if="showActions"
        >
          <template #default="{ row }">
            <el-button size="small" @click="viewRow(row)">查看</el-button>
            <el-button size="small" type="primary" @click="editRow(row)"
              >编辑</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container" v-if="showPagination">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalCount"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted } from "vue";
import { Refresh, Download } from "@element-plus/icons-vue";
import type {
  DashboardWidget,
  VisualizationTheme,
} from "@/types/visualization";

interface Props {
  widget: DashboardWidget;
  theme: VisualizationTheme;
  editMode: boolean;
}

interface Emits {
  (e: "update", widgetId: string, data: any): void;
}

const props = defineProps<Props>();
const emit = defineEmits<Emits>();

// 响应式数据
const loading = ref(false);
const currentPage = ref(1);
const pageSize = ref(20);
const totalCount = ref(0);
const selectedRows = ref([]);

// 计算属性
const config = computed(() => props.widget.config || {});
const showActions = computed(() => config.value.showActions !== false);
const showPagination = computed(() => config.value.showPagination !== false);
const tableHeight = computed(() => {
  const baseHeight = 200;
  const rowHeight = 40;
  const maxRows = Math.floor(
    ((props.widget.position?.h || 4) * 60) / rowHeight
  );
  return Math.min(baseHeight + maxRows * rowHeight, 400);
});

const displayColumns = computed(() => {
  const defaultColumns = [
    { key: "title", label: "标题", width: 200, sortable: true },
    { key: "type", label: "类型", width: 120, type: "tag" },
    { key: "status", label: "状态", width: 100, type: "tag" },
    { key: "date", label: "日期", width: 120, type: "date", sortable: true },
    { key: "count", label: "数量", width: 100, type: "number", sortable: true },
  ];

  return config.value.columns || defaultColumns;
});

const tableData = computed(() => {
  return generateTableData();
});

// 方法
const generateTableData = () => {
  const dataSource = config.value.dataSource || "patent";
  const count = config.value.pageSize || pageSize.value;

  const data = [];
  for (let i = 0; i < count; i++) {
    const item: any = {
      id: i + 1,
      title: `${dataSource === "patent" ? "专利" : "数据"}项目 ${i + 1}`,
      type: ["发明专利", "实用新型", "外观设计"][i % 3],
      status: ["pending", "approved", "rejected"][i % 3],
      date: new Date(
        2024,
        Math.floor(Math.random() * 12),
        Math.floor(Math.random() * 28) + 1
      ),
      count: Math.floor(Math.random() * 1000) + 1,
      value: Math.floor(Math.random() * 100000) + 1000,
    };

    // 根据数据源添加特定字段
    if (dataSource === "patent") {
      item.patentNumber = `CN${2024}${String(i + 1).padStart(6, "0")}`;
      item.applicant = ["华为", "腾讯", "阿里巴巴", "百度", "字节跳动"][i % 5];
    } else if (dataSource === "user") {
      item.username = `user${i + 1}`;
      item.role = ["admin", "reviewer", "user"][i % 3];
      item.email = `user${i + 1}@example.com`;
    }

    data.push(item);
  }

  totalCount.value = data.length;
  return data;
};

const formatValue = (value: any, column: any) => {
  if (value === null || value === undefined) return "-";

  switch (column.type) {
    case "date":
      return new Date(value).toLocaleDateString("zh-CN");
    case "number":
      return typeof value === "number" ? value.toLocaleString() : value;
    case "tag":
      return getTagLabel(value);
    default:
      return value;
  }
};

const getTagType = (value: string) => {
  const typeMap: Record<string, string> = {
    pending: "warning",
    approved: "success",
    rejected: "danger",
    发明专利: "primary",
    实用新型: "success",
    外观设计: "info",
    admin: "danger",
    reviewer: "warning",
    user: "info",
  };
  return typeMap[value] || "info";
};

const getTagLabel = (value: string) => {
  const labelMap: Record<string, string> = {
    pending: "待审核",
    approved: "已批准",
    rejected: "已驳回",
    admin: "管理员",
    reviewer: "审核员",
    user: "普通用户",
  };
  return labelMap[value] || value;
};

const handleSelectionChange = (selection: any[]) => {
  selectedRows.value = selection as never[];
};

const handleSizeChange = (size: number) => {
  pageSize.value = size;
  refreshData();
};

const handleCurrentChange = (page: number) => {
  currentPage.value = page;
  refreshData();
};

const handleCellClick = (row: any, column: any) => {
  console.log("Cell clicked:", row, column);
  // 可以触发路由跳转或打开详情对话框
};

const viewRow = (row: any) => {
  console.log("View row:", row);
};

const editRow = (row: any) => {
  console.log("Edit row:", row);
};

const refreshData = () => {
  loading.value = true;

  // 模拟数据刷新
  setTimeout(() => {
    const newData = generateTableData();
    emit("update", props.widget.id, newData);
    loading.value = false;
  }, 500);
};

const exportTable = () => {
  const data = tableData.value;
  const headers = displayColumns.value.map((col: any) => col.label);

  // 创建CSV内容
  const csvContent = [
    headers.join(","),
    ...data.map((row) =>
      displayColumns.value
        .map((col: any) => formatValue(row[col.key], col))
        .join(",")
    ),
  ].join("\n");

  // 下载文件
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);
  link.setAttribute("href", url);
  link.setAttribute("download", `${props.widget.title}.csv`);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 监听配置变化
watch(
  () => props.widget.config,
  () => {
    refreshData();
  },
  { deep: true }
);

// 生命周期
onMounted(() => {
  refreshData();
});
</script>

<style scoped>
.table-widget {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 8px;
  border-bottom: 1px solid #eee;
}

.widget-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--theme-text, #333);
}

.widget-actions {
  opacity: 0;
  transition: opacity 0.3s ease;
}

.table-widget:hover .widget-actions {
  opacity: 1;
}

.table-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.number-cell {
  font-family: "Monaco", "Consolas", monospace;
  color: #409eff;
  font-weight: 500;
}

.date-cell {
  color: #666;
  font-size: 0.9em;
}

.pagination-container {
  margin-top: 16px;
  display: flex;
  justify-content: center;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .widget-header {
    flex-direction: column;
    gap: 8px;
  }

  .pagination-container {
    margin-top: 12px;
  }
}
</style>
