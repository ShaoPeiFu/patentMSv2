<template>
  <el-card class="security-event-monitor">
    <template #header>
      <div class="feature-header">
        <el-icon><Warning /></el-icon>
        <span>安全事件监控</span>
        <el-button
          size="small"
          type="primary"
          @click="refreshEvents"
          :loading="isLoading"
        >
          <el-icon><Refresh /></el-icon>
          刷新
        </el-button>
      </div>
    </template>

    <div class="event-content">
      <!-- 事件统计 -->
      <el-row :gutter="20" class="event-stats">
        <el-col :span="6">
          <div class="stat-item critical">
            <div class="stat-number">{{ eventStats.critical }}</div>
            <div class="stat-label">严重事件</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item warning">
            <div class="stat-number">{{ eventStats.warning }}</div>
            <div class="stat-label">警告事件</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item info">
            <div class="stat-number">{{ eventStats.info }}</div>
            <div class="stat-label">信息事件</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-item total">
            <div class="stat-number">{{ eventStats.total }}</div>
            <div class="stat-label">总事件数</div>
          </div>
        </el-col>
      </el-row>

      <!-- 事件列表 -->
      <div class="event-list">
        <el-table :data="securityEvents" style="width: 100%" max-height="400">
          <el-table-column prop="timestamp" label="时间" width="180">
            <template #default="scope">
              {{ formatTimestamp(scope.row.timestamp) }}
            </template>
          </el-table-column>
          <el-table-column prop="level" label="级别" width="100">
            <template #default="scope">
              <el-tag :type="getEventLevelType(scope.row.level)" size="small">
                {{ scope.row.level }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="type" label="类型" width="120" />
          <el-table-column prop="description" label="描述" />
          <el-table-column prop="source" label="来源" width="120" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag
                :type="scope.row.status === '已处理' ? 'success' : 'warning'"
                size="small"
              >
                {{ scope.row.status }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200">
            <template #default="scope">
              <div class="action-buttons">
                <el-button size="small" @click="viewEventDetail(scope.row)">
                  查看
                </el-button>
                <el-button
                  v-if="scope.row.status !== '已处理'"
                  size="small"
                  type="success"
                  @click="markAsResolved(scope.row)"
                >
                  标记已处理
                </el-button>
              </div>
            </template>
          </el-table-column>
        </el-table>
      </div>
    </div>

    <!-- 事件详情对话框 -->
    <el-dialog v-model="showEventDetail" title="事件详情" width="60%">
      <div v-if="selectedEvent" class="event-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="事件ID">
            {{ selectedEvent.id }}
          </el-descriptions-item>
          <el-descriptions-item label="时间">
            {{ formatTimestamp(selectedEvent.timestamp) }}
          </el-descriptions-item>
          <el-descriptions-item label="级别">
            <el-tag :type="getEventLevelType(selectedEvent.level)">
              {{ selectedEvent.level }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="类型">
            {{ selectedEvent.type }}
          </el-descriptions-item>
          <el-descriptions-item label="来源">
            {{ selectedEvent.source }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag
              :type="selectedEvent.status === '已处理' ? 'success' : 'warning'"
            >
              {{ selectedEvent.status }}
            </el-tag>
          </el-descriptions-item>
        </el-descriptions>

        <div class="event-description">
          <h4>事件描述</h4>
          <p>{{ selectedEvent.description }}</p>
        </div>

        <div v-if="selectedEvent.details" class="event-details">
          <h4>详细信息</h4>
          <pre>{{ JSON.stringify(selectedEvent.details, null, 2) }}</pre>
        </div>

        <div v-if="selectedEvent.recommendations" class="event-recommendations">
          <h4>处理建议</h4>
          <ul>
            <li v-for="rec in selectedEvent.recommendations" :key="rec">
              {{ rec }}
            </li>
          </ul>
        </div>
      </div>
    </el-dialog>
  </el-card>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from "vue";
import { ElMessage } from "element-plus";
import { Warning, Refresh } from "@element-plus/icons-vue";
import { dataSecurityAPI } from "@/utils/api";

// 事件统计数据 - 从API获取真实数据
const eventStats = reactive({
  critical: 0,
  warning: 0,
  info: 0,
  total: 0,
});

// 安全事件列表 - 从API获取真实数据
const securityEvents = ref<any[]>([]);

// 加载状态
const isLoading = ref(false);

// 事件详情对话框
const showEventDetail = ref(false);
const selectedEvent = ref<any>(null);

// 获取事件级别类型
const getEventLevelType = (level: string) => {
  switch (level) {
    case "严重":
      return "danger";
    case "警告":
      return "warning";
    case "信息":
      return "info";
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

// 查看事件详情
const viewEventDetail = (event: any) => {
  selectedEvent.value = event;
  showEventDetail.value = true;
};

// 标记事件为已处理
const markAsResolved = async (event: any) => {
  try {
    event.status = "已处理";
    ElMessage.success("事件已标记为已处理");
  } catch (error) {
    ElMessage.error("操作失败");
  }
};

// 刷新事件列表
const refreshEvents = async () => {
  try {
    isLoading.value = true;
    await loadSecurityEvents();
    ElMessage.success("事件列表已刷新");
  } catch (error) {
    ElMessage.error("刷新失败");
  } finally {
    isLoading.value = false;
  }
};

// 加载安全事件数据
const loadSecurityEvents = async () => {
  try {
    const response = await dataSecurityAPI.getEvents({
      page: 1,
      limit: 100,
    });

    if (response.events) {
      securityEvents.value = response.events.map((event: any) => ({
        id: event.id,
        timestamp: new Date(event.timestamp),
        level:
          event.severity === "critical"
            ? "严重"
            : event.severity === "high"
            ? "严重"
            : event.severity === "medium"
            ? "警告"
            : "信息",
        type:
          event.eventType === "unauthorized_access"
            ? "未授权访问"
            : event.eventType === "data_access_violation"
            ? "数据访问异常"
            : event.eventType === "backup_completed"
            ? "备份完成"
            : event.eventType === "backup_failed"
            ? "备份失败"
            : event.eventType === "settings_updated"
            ? "设置更新"
            : event.eventType === "key_rotated"
            ? "密钥轮换"
            : event.eventType,
        description: event.description,
        source:
          event.eventType === "unauthorized_access"
            ? "登录系统"
            : event.eventType === "data_access_violation"
            ? "数据访问"
            : event.eventType === "backup_completed" ||
              event.eventType === "backup_failed"
            ? "备份系统"
            : "系统",
        status: "未处理", // 默认状态，实际应该从事件元数据获取
        details: event.metadata ? JSON.parse(event.metadata) : {},
        recommendations: getRecommendations(event.eventType, event.severity),
      }));

      // 计算统计数据
      eventStats.critical = securityEvents.value.filter(
        (e) => e.level === "严重"
      ).length;
      eventStats.warning = securityEvents.value.filter(
        (e) => e.level === "警告"
      ).length;
      eventStats.info = securityEvents.value.filter(
        (e) => e.level === "信息"
      ).length;
      eventStats.total = securityEvents.value.length;
    }
  } catch (error) {
    console.error("加载安全事件数据失败:", error);
    ElMessage.error("加载安全事件数据失败");
  }
};

// 根据事件类型和严重程度生成建议
const getRecommendations = (eventType: string, severity: string) => {
  const recommendations = [];

  if (eventType === "unauthorized_access") {
    recommendations.push("立即阻止该IP地址", "检查系统日志", "加强密码策略");
  } else if (eventType === "data_access_violation") {
    recommendations.push("审查用户权限", "加强访问控制", "记录详细日志");
  } else if (eventType === "backup_failed") {
    recommendations.push("检查备份配置", "验证存储空间", "查看错误日志");
  } else if (eventType === "key_rotated") {
    recommendations.push("验证新密钥有效性", "更新相关配置", "测试加密功能");
  }

  if (severity === "critical" || severity === "high") {
    recommendations.push("立即通知管理员", "启动应急响应流程");
  }

  return recommendations;
};

onMounted(async () => {
  console.log("安全事件监控组件已加载");
  await loadSecurityEvents();
});
</script>

<style scoped>
.security-event-monitor {
  margin-bottom: 20px;
}

.feature-header {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
  color: #303133;
}

.event-content {
  padding: 10px 0;
}

.event-stats {
  margin-bottom: 20px;
}

.stat-item {
  text-align: center;
  padding: 20px;
  border-radius: 8px;
  color: white;
}

.stat-item.critical {
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a52 100%);
}

.stat-item.warning {
  background: linear-gradient(135deg, #feca57 0%, #ff9ff3 100%);
}

.stat-item.info {
  background: linear-gradient(135deg, #48dbfb 0%, #0abde3 100%);
}

.stat-item.total {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

.event-list {
  margin-top: 20px;
}

.event-detail {
  padding: 20px 0;
}

.event-description,
.event-details,
.event-recommendations {
  margin: 20px 0;
}

.event-description h4,
.event-details h4,
.event-recommendations h4 {
  margin: 0 0 10px 0;
  color: #303133;
}

.event-description p {
  margin: 0;
  color: #606266;
  line-height: 1.6;
}

.event-details pre {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 4px;
  font-size: 12px;
  overflow-x: auto;
}

.event-recommendations ul {
  margin: 0;
  padding-left: 20px;
}

.event-recommendations li {
  margin-bottom: 5px;
  color: #606266;
}

.action-buttons {
  display: flex;
  gap: 8px; /* 按钮之间的间距 */
}

:deep(.el-card__header) {
  background-color: #f8f9fa;
  border-bottom: 1px solid #ebeef5;
}
</style>
