<template>
  <div class="recent-patents-widget">
    <div class="widget-header">
      <h3>最近专利</h3>
      <el-button size="small" @click="refreshPatents" :loading="loading">
        <el-icon><Refresh /></el-icon>
        刷新
      </el-button>
    </div>

    <div v-if="loading" class="loading-state">
      <el-skeleton :rows="3" animated />
    </div>

    <div v-else-if="recentPatents.length > 0" class="patents-list">
      <div
        v-for="patent in recentPatents"
        :key="patent.id"
        class="patent-item"
        @click="viewPatent(patent)"
      >
        <div class="patent-info">
          <div class="patent-title">{{ patent.title }}</div>
          <div class="patent-meta">
            <span class="patent-number">{{ patent.patentNumber }}</span>
            <span class="patent-status" :class="patent.status">
              {{ getStatusText(patent.status) }}
            </span>
          </div>
          <div class="patent-date">
            申请日期: {{ formatDate(patent.applicationDate) }}
          </div>
        </div>

        <div class="patent-actions">
          <el-button size="small" @click.stop="editPatent(patent)">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button size="small" @click.stop="viewPatent(patent)">
            <el-icon><View /></el-icon>
          </el-button>
        </div>
      </div>
    </div>

    <div v-else class="empty-state">
      <el-empty description="暂无最近专利">
        <el-button type="primary" @click="addPatent">
          <el-icon><Plus /></el-icon>
          添加专利
        </el-button>
      </el-empty>
    </div>

    <div class="widget-footer">
      <el-button size="small" @click="viewAllPatents"> 查看全部专利 </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { Edit, View, Plus, Refresh } from "@element-plus/icons-vue";
import { ElMessage } from "element-plus";
import { formatDate } from "@/utils/dateUtils";

const router = useRouter();

// 响应式数据
interface Patent {
  id: number;
  title: string;
  patentNumber: string;
  status: string;
  applicationDate: string;
}

const recentPatents = ref<Patent[]>([]);
const loading = ref(false);

// 方法
const loadRecentPatents = async () => {
  try {
    loading.value = true;

    // 从API获取真实数据
    const response = await fetch(
      "/api/patents?limit=5&sort=applicationDate&order=desc",
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (response.ok) {
      const data = await response.json();
      recentPatents.value = data.patents || [];
    } else {
      console.error("获取最近专利失败:", response.statusText);
      ElMessage.error("获取最近专利失败");
    }
  } catch (error) {
    console.error("加载最近专利失败:", error);
    ElMessage.error("加载最近专利失败");
  } finally {
    loading.value = false;
  }
};

const refreshPatents = async () => {
  await loadRecentPatents();
  ElMessage.success("专利数据已刷新");
};

const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    pending: "待审核",
    approved: "已通过",
    rejected: "已拒绝",
    expired: "已过期",
    active: "有效",
    inactive: "无效",
  };
  return statusMap[status] || status;
};

const viewPatent = (patent: Patent) => {
  router.push(`/dashboard/patents/${patent.id}`);
};

const editPatent = (patent: Patent) => {
  router.push(`/dashboard/patents/${patent.id}/edit`);
};

const addPatent = () => {
  router.push("/dashboard/patents/add");
};

const viewAllPatents = () => {
  router.push("/dashboard/patents");
};

// 组件挂载时加载数据
onMounted(() => {
  loadRecentPatents();
});
</script>

<style scoped>
.recent-patents-widget {
  background: white;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  height: 100%;
  display: flex;
  flex-direction: column;
}

.widget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.widget-header h3 {
  margin: 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.loading-state {
  padding: 20px 0;
}

.patents-list {
  flex: 1;
  overflow-y: auto;
}

.patent-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  margin-bottom: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.patent-item:hover {
  border-color: #409eff;
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.1);
  transform: translateY(-2px);
}

.patent-info {
  flex: 1;
  margin-right: 15px;
}

.patent-title {
  font-weight: 600;
  color: #303133;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.patent-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 6px;
}

.patent-number {
  font-size: 12px;
  color: #606266;
  background: #f5f7fa;
  padding: 2px 8px;
  border-radius: 4px;
}

.patent-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 4px;
  font-weight: 500;
}

.patent-status.pending {
  background: #fdf6ec;
  color: #e6a23c;
}

.patent-status.approved {
  background: #f0f9ff;
  color: #409eff;
}

.patent-status.rejected {
  background: #fef0f0;
  color: #f56c6c;
}

.patent-status.expired {
  background: #f4f4f5;
  color: #909399;
}

.patent-status.active {
  background: #f0f9ff;
  color: #67c23a;
}

.patent-status.inactive {
  background: #f4f4f5;
  color: #909399;
}

.patent-date {
  font-size: 12px;
  color: #909399;
}

.patent-actions {
  display: flex;
  gap: 8px;
}

.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 20px;
}

.widget-footer {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
  text-align: center;
}
</style>
