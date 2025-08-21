import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { ElMessage } from "element-plus";
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

export const useTaskStore = defineStore("task", () => {
  // 状态
  const tasks = ref<Task[]>([]);
  const loading = ref(false);
  const total = ref(0);

  // 计算属性
  const pendingTasks = computed(() =>
    tasks.value.filter((task) => task.status === "todo")
  );

  const completedTasks = computed(() =>
    tasks.value.filter((task) => task.status === "done")
  );

  const overdueTasks = computed(() => {
    const now = new Date();
    return tasks.value.filter((task) => {
      if (task.dueDate && task.status !== "done") {
        return new Date(task.dueDate) < now;
      }
      return false;
    });
  });

  const tasksByAssignee = computed(
    () => (assigneeId: number) =>
      tasks.value.filter((task) => task.assigneeId === assigneeId)
  );

  const tasksByPriority = computed(
    () => (priority: string) =>
      tasks.value.filter((task) => task.priority === priority)
  );

  // 获取任务列表
  const fetchTasks = async (params?: {
    assigneeId?: number;
    status?: string;
    priority?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      loading.value = true;
      const queryParams = new URLSearchParams();

      if (params?.assigneeId)
        queryParams.append("assigneeId", params.assigneeId.toString());
      if (params?.status) queryParams.append("status", params.status);
      if (params?.priority) queryParams.append("priority", params.priority);
      if (params?.page) queryParams.append("page", params.page.toString());
      if (params?.limit) queryParams.append("limit", params.limit.toString());

      const response = await fetch(`/api/tasks?${queryParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          tasks.value = data.tasks;
          total.value = data.pagination?.total || tasks.value.length;
        } else {
          ElMessage.error("获取任务列表失败");
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("获取任务列表失败:", error);
      ElMessage.error("获取任务列表失败");
    } finally {
      loading.value = false;
    }
  };

  // 获取任务详情
  const getTask = async (id: number) => {
    try {
      const response = await fetch(`/api/tasks/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          return data.task;
        }
      }
      return null;
    } catch (error) {
      console.error("获取任务详情失败:", error);
      return null;
    }
  };

  // 创建任务
  const createTask = async (
    task: Omit<Task, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      loading.value = true;
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(task),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const newTask = data.task;
          tasks.value.unshift(newTask);
          total.value = tasks.value.length;
          ElMessage.success(data.message);
          return newTask;
        } else {
          ElMessage.error("创建任务失败");
          return null;
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      ElMessage.error("创建任务失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 更新任务
  const updateTask = async (id: number, updates: Partial<Task>) => {
    try {
      loading.value = true;
      const response = await fetch(`/api/tasks/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedTask = data.task;
          const taskIndex = tasks.value.findIndex(
            (t) => t.id === updatedTask.id
          );
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = updatedTask;
          }
          ElMessage.success(data.message);
          return updatedTask;
        } else {
          ElMessage.error("更新任务失败");
          return null;
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("更新任务失败:", error);
      ElMessage.error("更新任务失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 删除任务
  const deleteTask = async (id: number) => {
    try {
      loading.value = true;
      const response = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const taskIndex = tasks.value.findIndex((t) => t.id === id);
          if (taskIndex !== -1) {
            tasks.value.splice(taskIndex, 1);
            total.value = tasks.value.length;
          }
          ElMessage.success(data.message);
          return { success: true };
        } else {
          ElMessage.error("删除任务失败");
          return { success: false };
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("删除任务失败:", error);
      ElMessage.error("删除任务失败");
      return { success: false };
    } finally {
      loading.value = false;
    }
  };

  // 更新任务状态
  const updateTaskStatus = async (
    id: number,
    status: string,
    assigneeId?: number
  ) => {
    try {
      loading.value = true;
      const response = await fetch(`/api/tasks/${id}/status`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status, assigneeId }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const updatedTask = data.task;
          const taskIndex = tasks.value.findIndex(
            (t) => t.id === updatedTask.id
          );
          if (taskIndex !== -1) {
            tasks.value[taskIndex] = updatedTask;
          }
          ElMessage.success(data.message);
          return updatedTask;
        } else {
          ElMessage.error("更新任务状态失败");
          return null;
        }
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error("更新任务状态失败:", error);
      ElMessage.error("更新任务状态失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // 分配任务
  const assignTask = async (id: number, assigneeId: number) => {
    return await updateTaskStatus(id, "assigned", assigneeId);
  };

  // 完成任务
  const completeTask = async (id: number) => {
    return await updateTaskStatus(id, "completed");
  };

  // 初始化
  const initialize = async () => {
    await fetchTasks();
  };

  return {
    // 状态
    tasks,
    loading,
    total,

    // 计算属性
    pendingTasks,
    completedTasks,
    overdueTasks,
    tasksByAssignee,
    tasksByPriority,

    // 方法
    fetchTasks,
    getTask,
    createTask,
    updateTask,
    deleteTask,
    updateTaskStatus,
    assignTask,
    completeTask,
    initialize,
  };
});
