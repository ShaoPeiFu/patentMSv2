<template>
  <div class="task-management">
    <el-card>
      <template #header>
        <div class="header">
          <span>任务分配管理</span>
          <div class="ops">
            <el-button @click="refreshTasks" :loading="taskStore.loading">
              刷新
            </el-button>
            <el-button type="primary" @click="openCreate">新建任务</el-button>
          </div>
        </div>
      </template>

      <el-table :data="tasks" v-loading="taskStore.loading" style="width: 100%">
        <el-table-column prop="id" label="ID" width="80" />
        <el-table-column prop="title" label="标题" min-width="200" />
        <el-table-column label="责任人" width="150">
          <template #default="{ row }">
            {{ row.assigneeName || "-" }}
          </template>
        </el-table-column>
        <el-table-column prop="dueDate" label="截止日期" width="180">
          <template #default="{ row }">{{ formatTime(row.dueDate) }}</template>
        </el-table-column>
        <el-table-column label="优先级" width="120">
          <template #default="{ row }">
            <el-tag :type="priorityType(row.priority)">{{
              getPriorityText(row.priority)
            }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="150">
          <template #default="{ row }">
            <el-select
              v-model="row.status"
              @change="(v: 'todo' | 'in_progress' | 'done') => updateStatus(row.id.toString(), v)"
            >
              <el-option label="待办" value="todo" />
              <el-option label="进行中" value="in_progress" />
              <el-option label="已完成" value="done" />
            </el-select>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button size="small" @click="openEdit(row)">编辑</el-button>
            <el-button
              size="small"
              type="danger"
              @click="remove(row.id.toString())"
              >删除</el-button
            >
          </template>
        </el-table-column>
      </el-table>

      <!-- 空状态 -->
      <div v-if="!taskStore.loading && tasks.length === 0" class="empty-state">
        <el-empty description="暂无任务数据">
          <el-button type="primary" @click="refreshTasks">刷新</el-button>
        </el-empty>
      </div>
    </el-card>

    <el-dialog v-model="showDialog" :title="dialogTitle" width="600px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入任务标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="负责人">
          <el-select
            v-model="form.assigneeId"
            placeholder="选择负责人"
            @change="syncAssigneeName"
          >
            <el-option
              v-for="user in members"
              :key="user.id"
              :label="`${user.realName || user.username} (${
                user.department || '未知部门'
              })`"
              :value="user.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="form.dueDate"
            type="datetime"
            value-format="YYYY-MM-DDTHH:mm:ss.SSSZ"
          />
        </el-form-item>
        
        <el-form-item label="优先级">
          <el-select v-model="form.priority">
            <el-option label="低" value="low" />
            <el-option label="中" value="medium" />
            <el-option label="高" value="high" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDialog = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, onMounted } from "vue";
import { useTaskStore } from "@/stores/task";
import { useUserStore } from "@/stores/user";

// 定义任务类型 - 与数据库模型匹配
interface Task {
  id: number;
  title: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  dueDate?: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt?: string;
  updatedAt?: string;
}

const taskStore = useTaskStore();
const userStore = useUserStore();
const tasks = computed(() => taskStore.tasks);
const members = computed(() => userStore.users || []);

const showDialog = ref(false);
const dialogTitle = ref("新建任务");
const editingId = ref<string | null>(null);

const form = reactive<Partial<Task>>({
  title: "",
  description: "",
  assigneeId: undefined,
  assigneeName: "",
  dueDate: "",
  status: "todo",
  priority: "medium",
});

const formatTime = (iso?: string) =>
  iso ? new Date(iso).toLocaleString() : "-";
const priorityType = (p: string) =>
  p === "high" ? "danger" : p === "medium" ? "warning" : "info";

const getPriorityText = (priority: string) => {
  const texts: Record<string, string> = {
    low: "低",
    medium: "中",
    high: "高",
  };
  return texts[priority] || priority;
};

const openCreate = () => {
  dialogTitle.value = "新建任务";
  editingId.value = null;
  Object.assign(form, {
    title: "",
    description: "",
    assigneeId: undefined,
    assigneeName: "",
    dueDate: "",
    status: "todo",
    priority: "medium",
  });
  showDialog.value = true;
};

const openEdit = (row: Task) => {
  dialogTitle.value = "编辑任务";
  editingId.value = row.id.toString();
  Object.assign(form, row);
  showDialog.value = true;
};

const syncAssigneeName = () => {
  const user = members.value.find((x) => x.id === form.assigneeId);
  form.assigneeName = user ? user.realName || user.username : "";
};

const submit = async () => {
  if (!form.title?.trim()) return;
  syncAssigneeName();

  try {
    // 确保必填字段有值
    const taskData = {
      title: form.title!.trim(),
      description: form.description || "",
      assigneeId: form.assigneeId,
      assigneeName: form.assigneeName || "",
      dueDate: form.dueDate,
      status: form.status || "todo",
      priority: form.priority || "medium",
    };

    if (editingId.value) {
      await taskStore.updateTask(parseInt(editingId.value), taskData);
    } else {
      await taskStore.createTask(taskData);
    }
    showDialog.value = false;
    // 重新加载任务列表
    await taskStore.fetchTasks();
  } catch (error) {
    console.error("操作失败:", error);
  }
};

const updateStatus = async (id: string, status: string) => {
  try {
    await taskStore.updateTask(parseInt(id), {
      status: status as "todo" | "in_progress" | "done",
    });
    // 重新加载任务列表
    await taskStore.fetchTasks();
  } catch (error) {
    console.error("更新状态失败:", error);
  }
};

const remove = async (id: string) => {
  try {
    await taskStore.deleteTask(parseInt(id));
    // 重新加载任务列表
    await taskStore.fetchTasks();
  } catch (error) {
    console.error("删除失败:", error);
  }
};

// 刷新任务列表
const refreshTasks = async () => {
  try {
    await taskStore.fetchTasks();
  } catch (error) {
    console.error("刷新失败:", error);
  }
};

// 初始化数据
onMounted(async () => {
  try {
    console.log("🚀 任务管理页面初始化...");
    // 并行加载任务和用户数据
    await Promise.all([taskStore.fetchTasks(), userStore.fetchUsers()]);
    console.log("✅ 初始化完成");
    console.log("任务数量:", tasks.value.length);
    console.log("用户数量:", members.value.length);
  } catch (error) {
    console.error("初始化失败:", error);
  }
});
</script>

<style scoped>
.task-management {
  padding: 16px;
}
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}
</style>
