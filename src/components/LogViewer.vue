<template>
  <el-card class="log-viewer">
    <template #header>
      <div class="feature-header">
        <el-icon><Document /></el-icon>
        <span>日志查看器</span>
        <el-button
          size="small"
          type="primary"
          @click="refreshLogs"
          :loading="isLoading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </template>

    <div class="log-content">
      <!-- 日志过滤器 -->
      <el-row :gutter="20" class="log-filters">
        <el-col :span="24">
          <el-card class="filter-card">
            <template #header>
              <div class="filter-header">
                <span>日志过滤器</span>
              </div>
            </template>
            <div class="filter-content">
              <el-row :gutter="20">
                <el-col :span="6">
                  <el-select
                    v-model="filters.level"
                    placeholder="日志级别"
                    clearable
                  >
                    <el-option label="DEBUG" value="debug" />
                    <el-option label="INFO" value="info" />
                    <el-option label="WARN" value="warn" />
                    <el-option label="ERROR" value="error" />
                    <el-option label="FATAL" value="fatal" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-select
                    v-model="filters.module"
                    placeholder="模块"
                    clearable
                  >
                    <el-option label="系统" value="system" />
                    <el-option label="安全" value="security" />
                    <el-option label="备份" value="backup" />
                    <el-option label="用户" value="user" />
                    <el-option label="数据库" value="database" />
                  </el-select>
                </el-col>
                <el-col :span="6">
                  <el-date-picker
                    v-model="filters.dateRange"
                    type="datetimerange"
                    range-separator="至"
                    start-placeholder="开始时间"
                    end-placeholder="结束时间"
                    format="YYYY-MM-DD HH:mm:ss"
                    value-format="YYYY-MM-DD HH:mm:ss"
                  />
                </el-col>
                <el-col :span="6">
                  <el-input
                    v-model="filters.keyword"
                    placeholder="关键词搜索"
                    clearable
                  />
                </el-col>
              </el-row>
              <el-row :gutter="20" style="margin-top: 15px">
                <el-col :span="24">
                  <el-button type="primary" @click="applyFilters">
                    应用过滤
                  </el-button>
                  <el-button @click="clearFilters">清除过滤</el-button>
                  <el-button type="success" @click="exportLogs">
                    导出日志
                  </el-button>
                  <el-button type="warning" @click="clearLogs">
                    清空日志
                  </el-button>
                </el-col>
              </el-row>
            </div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 日志统计 -->
      <el-row :gutter="20" class="log-stats">
        <el-col :span="6">
          <div class="stat-item total">
            <div class="stat-number">{{ logStats.total }}</div>
            <div class="stat-label">总日志数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item error">
            <div class="stat-number">{{ logStats.error }}</div>
            <div class="stat-label">错误日志</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item warning">
            <div class="stat-number">{{ logStats.warning }}</div>
            <div class="stat-label">警告日志</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item info">
            <div class="stat-number">{{ logStats.info }}</div>
            <div class="stat-label">信息日志</div>
          </div>
        </el-col>
      </el-row>

      <!-- 日志列表 -->
      <el-row :gutter="20" class="log-list">
        <el-col :span="24">
          <el-card class="list-card">
            <template #header>
              <div class="list-header">
                <span>日志列表</span>
                <div class="list-actions">
                  <el-switch
                    v-model="autoRefresh"
                    active-text="自动刷新"
                    inactive-text="手动刷新"
                  />
                  <span class="refresh-interval" v-if="autoRefresh">
                    间隔: {{ refreshInterval }}秒
                  </span>
                </div>
              </div>
            </template>
            <div class="list-content">
              <el-table
                :data="filteredLogs"
                style="width: 100%"
                max-height="500"
              >
                <el-table-column prop="timestamp" label="时间" width="180">
                  <template #default="scope">
                    {{ formatTimestamp(scope.row.timestamp) }}
                  </template>
                </el-table-column>
                <el-table-column prop="level" label="级别" width="100">
                  <template #default="scope">
                    <el-tag
                      :type="getLogLevelType(scope.row.level)"
                      size="small"
                    >
                      {{ scope.row.level }}
                    </el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="module" label="模块" width="100" />
                <el-table-column prop="message" label="消息" />
                <el-table-column prop="user" label="用户" width="120" />
                <el-table-column prop="ip" label="IP地址" width="140" />
                <el-table-column label="操作" width="150">
                  <template #default="scope">
                    <div class="action-buttons">
                      <el-button size="small" @click="viewLogDetail(scope.row)">
                        详情
                      </el-button>
                    </div>
                  </template>
                </el-table-column>
              </el-table>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 日志详情对话框 -->
    <el-dialog v-model="showLogDetail" title="日志详情" width="70%">
      <div v-if="selectedLog" class="log-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="时间">
            {{ formatTimestamp(selectedLog.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getLogLevelType(selectedLog.level)">
              {{ selectedLog.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="模块">
            {{ selectedLog.module }}
          </el-descriptions-item>
          <el-descriptions-item label="用户">
            {{ selectedLog.user }}
          </el-descriptions-item>
          <el-descriptions-item label="IP地址">
            {{ selectedLog.ip }}
          </el-descriptions-item>
          <el-descriptions-item label="会话ID">
            {{ selectedLog.sessionId }}
          </el-descriptions-item>
        </el-descriptions>

        <div class="log-message">
          <h4>日志消息</h4>
          <p>{{ selectedLog.message }}</p>
        </div>

        <div v-if="selectedLog.details" class="log-details">
          <h4>详细信息</h4>
          <pre>{{ JSON.stringify(selectedLog.details, null, 2) }}</pre>
        </div>

        <div v-if="selectedLog.stackTrace" class="log-stack">
          <h4>堆栈跟踪</h4>
          <pre>{{ selectedLog.stackTrace }}</pre>
        </div>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from "vue";
import { ElMessage, ElMessageBox } from "element-plus";
import { Document, Refresh } from "@element-plus/icons-vue";
import { dataSecurityAPI } from "@/utils/api";

// 日志统计数据 - 从API获取真实数据
const logStats = reactive({
  total: 0,
  error: 0,
  warning: 0,
  info: 0,
});

// 筛选条件
const filters = reactive({
  level: "",
  module: "",
  dateRange: [] as string[],
  keyword: "",
});

// 日志列表 - 从API获取真实数据
const logList = ref([]);

// 加载状态
const isLoading = ref(false);

// 自动刷新
const autoRefresh = ref(false);
const refreshInterval = ref(30);
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 对话框状态
const showLogDetail = ref(false);
const selectedLog = ref<any>(null);

// 筛选后的日志列表
const filteredLogs = computed(() => {
  let logs = logList.value;

  // 按级别筛选
  if (filters.level) {
    logs = logs.filter((log: any) => (log as any).level.toLowerCase() === filters.level);
  }

  // 按模块筛选
  if (filters.module) {
    logs = logs.filter((log: any) => (log as any).module.toLowerCase() === filters.module);
  }

  // 按日期范围筛选
  if (filters.dateRange && filters.dateRange.length === 2) {
    const startDate = new Date(filters.dateRange[0]);
    const endDate = new Date(filters.dateRange[1]);
    logs = logs.filter((log) => {
      const logDate = new Date((log as any).timestamp);
      return logDate >= startDate && logDate <= endDate;
    });
  }

  // 按关键词筛选
  if (filters.keyword) {
    const keyword = filters.keyword.toLowerCase();
    logs = logs.filter(
      (log) =>
        (log as any).message.toLowerCase().includes(keyword) ||
        (log as any).user.toLowerCase().includes(keyword) ||
        (log as any).ip.toLowerCase().includes(keyword)
    );
  }

  return logs;
});

// 获取日志级别类型
const getLogLevelType = (level: string) => {
  switch (level) {
    case "ERROR":
    case "FATAL":
      return "danger";
    case "WARN":
      return "warning";
    case "INFO":
      return "info";
    case "DEBUG":
      return "success";
    default:
      return "info";
  }
};

// 格式化时间戳
const formatTimestamp = (timestamp: Date | string) => {
  try {
    // 如果是字符串，先转换为Date对象
    const date = timestamp instanceof Date ? timestamp : new Date(timestamp);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return "无效时间";
    }

    // 返回本地化的时间字符串
    return date.toLocaleString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  } catch (error) {
    console.error("时间格式化错误:", error);
    return "时间格式错误";
  }
};

// 应用过滤器
const applyFilters = () => {
  ElMessage.success("过滤器已应用");
};

// 清除过滤器
const clearFilters = () => {
  filters.level = "";
  filters.module = "";
  filters.dateRange = [];
  filters.keyword = "";
  ElMessage.success("过滤器已清除");
};

// 导出日志
const exportLogs = () => {
  try {
    const logs = filteredLogs.value;
    const csvContent = generateCSV(logs);
    downloadCSV(csvContent, "system-logs.csv");
    ElMessage.success("日志已导出");
  } catch (error) {
    ElMessage.error("导出失败");
  }
};

// 清空日志
const clearLogs = async () => {
  try {
    await ElMessageBox.confirm(
      "确定要清空所有日志吗？此操作不可恢复。",
      "确认清空",
      {
        confirmButtonText: "确定",
        cancelButtonText: "取消",
        type: "warning",
      }
    );

    logList.value = [];
    logStats.total = 0;
    logStats.error = 0;
    logStats.warning = 0;
    logStats.info = 0;
    ElMessage.success("日志已清空");
  } catch (error) {
    if (error !== "cancel") {
      ElMessage.error("清空失败");
    }
  }
};

// 查看日志详情
const viewLogDetail = (log: any) => {
  selectedLog.value = log;
  showLogDetail.value = true;
};

// 刷新日志
const refreshLogs = async () => {
  try {
    isLoading.value = true;
    await loadLogs();
    ElMessage.success("日志已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  } finally {
    isLoading.value = false;
  }
};

// 加载日志数据
const loadLogs = async () => {
  try {
    // 使用专门的系统日志API
    const response = await dataSecurityAPI.getSystemLogs({
      page: 1,
      limit: 100,
    });

    if (response.logs) {
      logList.value = response.logs;

      // 计算统计数据
      logStats.total = logList.value.length;
      logStats.error = logList.value.filter(
        (log: any) => (log as any).level === "ERROR"
      ).length;
      logStats.warning = logList.value.filter(
        (log: any) => (log as any).level === "WARN"
      ).length;
      logStats.info = logList.value.filter(
        (log: any) => (log as any).level === "INFO"
      ).length;
    }
  } catch (error) {
    console.error("加载日志数据失败:", error);
    ElMessage.error("加载日志数据失败");
  }
};

// 生成CSV内容
const generateCSV = (logs: any[]) => {
  const headers = ["时间", "级别", "模块", "消息", "用户", "IP地址"];
  const rows = logs.map((log) => [
    formatTimestamp(log.timestamp),
    log.level,
    log.module,
    log.message,
    log.user,
    log.ip,
  ]);

  return [headers, ...rows]
    .map((row) => row.map((cell) => `"${cell}"`).join(","))
    .join("\n");
};

// 下载CSV文件
const downloadCSV = (content: string, filename: string) => {
  const blob = new Blob(["\ufeff" + content], {
    type: "text/csv;charset=utf-8;",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
};

// 自动刷新定时器
const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
  }
  refreshTimer = setInterval(() => {
    refreshLogs();
  }, refreshInterval.value * 1000);
};

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
};

// 监听自动刷新开关
watch(autoRefresh, (newVal) => {
  if (newVal) {
    startAutoRefresh();
  } else {
    stopAutoRefresh();
  }
});

onMounted(async () => {
  console.log("日志查看器组件已加载");
  await loadLogs();
});

onUnmounted(() => {
  stopAutoRefresh();
});
</script>

<style scoped>
.log-viewer {
  margin-bottom: 20px;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.log-content {
  padding: 10px 0;
}

.log-filters {
  margin-bottom: 20px;
}

.filter-card {
  height: 100%;
}

.filter-header {
  font-weight: 600;
  color: #303133;
}

.filter-content {
  padding: 10px 0;
}

.log-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.stat-item.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.stat-item.error {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.stat-item.warning {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.stat-item.info {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 5px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.9;
}

.log-list {
  margin-bottom: 20px;
}

.list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.list-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.refresh-interval {
  font-size: 12px;
  color: #909399;
}

.list-content {
  padding: 10px 0;
}

.log-detail {
  padding: 20px 0;
}

.log-message,
.log-details,
.log-stack {
  margin: 20px 0;
}

.log-message h4,
.log-details h4,
.log-stack h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.log-message p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.log-details pre,
.log-stack pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
  margin: 0;
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}

:deep(.el-form-item) {
  margin-bottom: 15px;
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
