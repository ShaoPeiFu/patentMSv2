import api from "./api";

export interface Channel {
  id: number;
  name: string;
  description?: string;
  type: string;
  status: string;
  createdBy: number;
  createdAt: string;
  updatedAt: string;
  creator: {
    id: number;
    username: string;
    realName: string;
  };
  memberCount: number;
  members: {
    id: number;
    name: string;
    role: string;
    joinedAt: string;
  }[];
}

export interface Message {
  id: number;
  channelId: number;
  authorId: number;
  authorName: string;
  content: string;
  type: string;
  metadata?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Task {
  id: number;
  title: string;
  description?: string;
  assigneeId?: number;
  assigneeName?: string;
  dueDate?: string;
  status: string;
  priority: string;
  channelId?: number;
  channelName?: string;
  createdBy: number;
  creatorName: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateChannelData {
  name: string;
  description?: string;
  type?: string;
  memberIds?: number[];
}

export interface CreateMessageData {
  content: string;
  type?: string;
  metadata?: any;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  assigneeId?: number;
  dueDate?: string;
  priority?: string;
  channelId?: number;
}

export interface UpdateTaskData {
  status?: string;
  priority?: string;
  assigneeId?: number;
  dueDate?: string;
}

export const collaborationAPI = {
  // 频道相关
  getChannels: async (): Promise<{ success: boolean; channels: Channel[] }> => {
    const response = await api.get("/collaboration/channels");
    return response.data;
  },

  createChannel: async (
    data: CreateChannelData
  ): Promise<{ success: boolean; message: string; channel: Channel }> => {
    const response = await api.post("/collaboration/channels", data);
    return response.data;
  },

  getChannelMembers: async (
    channelId: number
  ): Promise<{ success: boolean; members: any[] }> => {
    const response = await api.get(
      `/collaboration/channels/${channelId}/members`
    );
    return response.data;
  },

  addChannelMembers: async (
    channelId: number,
    data: { userIds: number[]; role?: string }
  ): Promise<{ success: boolean; message: string; addedCount: number }> => {
    const response = await api.post(
      `/collaboration/channels/${channelId}/members`,
      data
    );
    return response.data;
  },

  // 消息相关
  getChannelMessages: async (
    channelId: number,
    page = 1,
    limit = 50
  ): Promise<{ success: boolean; messages: Message[]; pagination: any }> => {
    const response = await api.get(
      `/collaboration/channels/${channelId}/messages`,
      {
        params: { page, limit },
      }
    );
    return response.data;
  },

  sendMessage: async (
    channelId: number,
    data: CreateMessageData
  ): Promise<{ success: boolean; message: string; data: Message }> => {
    const response = await api.post(
      `/collaboration/channels/${channelId}/messages`,
      data
    );
    return response.data;
  },

  // 任务相关
  getTasks: async (filters?: {
    status?: string;
    priority?: string;
    assigneeId?: number;
    channelId?: number;
  }): Promise<{ success: boolean; tasks: Task[] }> => {
    const response = await api.get("/collaboration/tasks", { params: filters });
    return response.data;
  },

  createTask: async (
    data: CreateTaskData
  ): Promise<{ success: boolean; message: string; task: Task }> => {
    const response = await api.post("/collaboration/tasks", data);
    return response.data;
  },

  updateTask: async (
    taskId: number,
    data: UpdateTaskData
  ): Promise<{ success: boolean; message: string; task: Task }> => {
    const response = await api.patch(`/collaboration/tasks/${taskId}`, data);
    return response.data;
  },

  // 用户管理相关
  getAllUsers: async (): Promise<{ success: boolean; users: any[] }> => {
    const response = await api.get("/collaboration/users");
    return response.data;
  },

  removeMember: async (
    channelId: number,
    userId: number
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(
      `/collaboration/channels/${channelId}/members/${userId}`
    );
    return response.data;
  },
};

export default collaborationAPI;
