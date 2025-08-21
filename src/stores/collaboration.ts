import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { ElMessage } from "element-plus";
import collaborationAPI, {
  type Channel,
  type Message,
  type Task,
  type CreateChannelData,
  type CreateMessageData,
  type CreateTaskData,
  type UpdateTaskData,
} from "@/utils/collaborationAPI";

export type CollaborationPlatform = "zoom" | "dingtalk";

export interface TeamMember {
  id: number;
  name: string;
  email?: string;
  role?: string;
}

export interface CommentMessage {
  id: string;
  channelId: number;
  authorId: number;
  authorName: string;
  content: string;
  createdAt: string; // ISO
}

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  dueDate?: string; // ISO
  status: "todo" | "in_progress" | "done";
  priority: "low" | "medium" | "high";
  createdAt: string;
}

export interface IntegrationConfig {
  zoom?: {
    accountId?: string;
    clientId?: string;
    clientSecret?: string;
    jwtToken?: string; // 兼容服务端颁发的 token
    baseUrl?: string; // 默认 https://api.zoom.us/v2
  };
  dingtalk?: {
    appKey?: string;
    appSecret?: string;
    accessToken?: string;
    baseUrl?: string; // 默认 https://oapi.dingtalk.com
  };
}

export const useCollaborationStore = defineStore("collaboration", () => {
  // 状态
  const channels = ref<Channel[]>([]);
  const messages = ref<Message[]>([]);
  const tasks = ref<Task[]>([]);
  const allUsers = ref<any[]>([]);
  const loading = ref(false);

  // 集成配置（可由设置页或 .env 注入）
  const integrationConfig = reactive<IntegrationConfig>({
    zoom: {
      baseUrl: import.meta.env.VITE_ZOOM_BASE_URL || "https://api.zoom.us/v2",
      jwtToken: import.meta.env.VITE_ZOOM_JWT || "", // 也可运行时设置
      accountId: import.meta.env.VITE_ZOOM_ACCOUNT_ID || "",
      clientId: import.meta.env.VITE_ZOOM_CLIENT_ID || "",
      clientSecret: import.meta.env.VITE_ZOOM_CLIENT_SECRET || "",
    },
    dingtalk: {
      baseUrl:
        import.meta.env.VITE_DINGTALK_BASE_URL || "https://oapi.dingtalk.com",
      accessToken: import.meta.env.VITE_DINGTALK_ACCESS_TOKEN || "",
      appKey: import.meta.env.VITE_DINGTALK_APP_KEY || "",
      appSecret: import.meta.env.VITE_DINGTALK_APP_SECRET || "",
    },
  });

  // ========= 频道管理 =========
  const loadChannels = async () => {
    try {
      loading.value = true;
      const response = await collaborationAPI.getChannels();
      if (response.success) {
        channels.value = response.channels;
      } else {
        ElMessage.error("加载频道列表失败");
      }
    } catch (error) {
      console.error("加载频道列表失败:", error);
      ElMessage.error("加载频道列表失败");
    } finally {
      loading.value = false;
    }
  };

  const createChannel = async (data: CreateChannelData) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.createChannel(data);
      if (response.success) {
        channels.value.unshift(response.channel);
        ElMessage.success(response.message);
        return response.channel;
      } else {
        ElMessage.error("创建频道失败");
        return null;
      }
    } catch (error) {
      console.error("创建频道失败:", error);
      ElMessage.error("创建频道失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // ========= 消息管理 =========
  const loadChannelMessages = async (
    channelId: number,
    page = 1,
    limit = 50
  ) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.getChannelMessages(
        channelId,
        page,
        limit
      );
      if (response.success) {
        if (page === 1) {
          messages.value = response.messages;
        } else {
          messages.value.push(...response.messages);
        }
        return response;
      } else {
        ElMessage.error("加载消息失败");
        return null;
      }
    } catch (error) {
      console.error("加载消息失败:", error);
      ElMessage.error("加载消息失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  const sendMessage = async (channelId: number, data: CreateMessageData) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.sendMessage(channelId, data);
      if (response.success) {
        messages.value.unshift(response.data);
        ElMessage.success(response.message);
        return response.data;
      } else {
        ElMessage.error("发送消息失败");
        return null;
      }
    } catch (error) {
      console.error("发送消息失败:", error);
      ElMessage.error("发送消息失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // ========= 任务管理 =========
  const loadTasks = async (filters?: {
    status?: string;
    priority?: string;
    assigneeId?: number;
    channelId?: number;
  }) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.getTasks(filters);
      if (response.success) {
        tasks.value = response.tasks;
      } else {
        ElMessage.error("加载任务列表失败");
      }
    } catch (error) {
      console.error("加载任务列表失败:", error);
      ElMessage.error("加载任务列表失败");
    } finally {
      loading.value = false;
    }
  };

  const createTask = async (data: CreateTaskData) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.createTask(data);
      if (response.success) {
        tasks.value.unshift(response.task);
        ElMessage.success(response.message);
        return response.task;
      } else {
        ElMessage.error("创建任务失败");
        return null;
      }
    } catch (error) {
      console.error("创建任务失败:", error);
      ElMessage.error("创建任务失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  const updateTask = async (taskId: number, data: UpdateTaskData) => {
    try {
      loading.value = true;
      const response = await collaborationAPI.updateTask(taskId, data);
      if (response.success) {
        const index = tasks.value.findIndex((t) => t.id === taskId);
        if (index !== -1) {
          tasks.value[index] = response.task;
        }
        ElMessage.success(response.message);
        return response.task;
      } else {
        ElMessage.error("更新任务失败");
        return null;
      }
    } catch (error) {
      console.error("更新任务失败:", error);
      ElMessage.error("更新任务失败");
      return null;
    } finally {
      loading.value = false;
    }
  };

  // ========= 集成配置管理 =========
  const setZoomToken = (jwtToken: string) => {
    if (!integrationConfig.zoom) integrationConfig.zoom = {};
    integrationConfig.zoom.jwtToken = jwtToken;
  };

  const setDingTalkAccessToken = (accessToken: string) => {
    if (!integrationConfig.dingtalk) {
      integrationConfig.dingtalk = {
        baseUrl: "https://oapi.dingtalk.com",
        accessToken: "",
      };
    }
    integrationConfig.dingtalk!.accessToken = accessToken;
  };

  // ========= 用户管理 =========
  const loadAllUsers = async () => {
    try {
      const response = await collaborationAPI.getAllUsers();
      if (response.success) {
        allUsers.value = response.users;
      } else {
        ElMessage.error("加载用户列表失败");
      }
    } catch (error) {
      console.error("加载用户列表失败:", error);
      ElMessage.error("加载用户列表失败");
    }
  };

  const addChannelMembers = async (
    channelId: number,
    data: { userIds: number[]; role?: string }
  ) => {
    try {
      const response = await collaborationAPI.addChannelMembers(
        channelId,
        data
      );
      if (response.success) {
        // 重新加载频道列表以更新成员信息
        await loadChannels();
        ElMessage.success(response.message);
        return true;
      } else {
        ElMessage.error("添加成员失败");
        return false;
      }
    } catch (error) {
      console.error("添加成员失败:", error);
      ElMessage.error("添加成员失败");
      return false;
    }
  };

  const removeMember = async (channelId: number, userId: number) => {
    try {
      const response = await collaborationAPI.removeMember(channelId, userId);
      if (response.success) {
        // 重新加载频道列表以更新成员信息
        await loadChannels();
        ElMessage.success(response.message);
        return true;
      } else {
        ElMessage.error("移除成员失败");
        return false;
      }
    } catch (error) {
      console.error("移除成员失败:", error);
      ElMessage.error("移除成员失败");
      return false;
    }
  };

  // 初始化
  const initializeCollaboration = async () => {
    try {
      await Promise.all([loadChannels(), loadTasks(), loadAllUsers()]);
    } catch (error) {
      console.error("初始化协作空间失败:", error);
    }
  };

  return {
    // state
    channels,
    messages,
    tasks,
    allUsers,
    loading,
    integrationConfig,

    // methods
    initializeCollaboration,
    loadChannels,
    createChannel,
    loadChannelMessages,
    sendMessage,
    loadTasks,
    createTask,
    updateTask,
    loadAllUsers,
    addChannelMembers,
    removeMember,
    setZoomToken,
    setDingTalkAccessToken,
  };
});
