import api from "@/utils/api";
import type { User } from "@/types/user";

export const userAPI = {
  // 获取用户列表
  async getUsers(params?: {
    page?: number;
    limit?: number;
    role?: string;
    search?: string;
    department?: string;
  }): Promise<{ users: User[]; total: number; page: number; limit: number }> {
    const response = await api.get("/users", { params });
    return response.data;
  },

  // 获取单个用户
  async getUserById(id: number): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  // 获取当前用户信息
  async getCurrentUser(): Promise<User> {
    const response = await api.get("/users/me");
    return response.data;
  },

  // 创建新用户
  async createUser(userData: {
    username: string;
    email: string;
    password: string;
    realName: string;
    phone?: string;
    department: string;
    role: string;
  }): Promise<User> {
    const response = await api.post("/users", userData);
    return response.data;
  },

  // 更新用户信息
  async updateUser(id: number, userData: Partial<User>): Promise<User> {
    console.log("userAPI - 发送PUT请求:", {
      id,
      userData: JSON.stringify(userData),
      userDataObj: userData,
      url: `/users/${id}`,
    });
    const response = await api.put(`/users/${id}`, userData);
    console.log("userAPI - 响应:", response.data);
    return response.data;
  },

  // 删除用户
  async deleteUser(id: number): Promise<{ success: boolean; message: string }> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  // 修改密码
  async changePassword(
    id: number,
    data: { oldPassword: string; newPassword: string }
  ): Promise<{ success: boolean; message: string }> {
    const response = await api.put(`/users/${id}/password`, data);
    return response.data;
  },

  // 更新用户头像
  async updateAvatar(
    userId: number,
    avatar: string
  ): Promise<{ success: boolean; avatar: string }> {
    const response = await api.put(`/users/${userId}/avatar`, { avatar });
    return response.data;
  },

  // 搜索用户
  async searchUsers(query: string): Promise<User[]> {
    const response = await api.get("/users/search", { params: { q: query } });
    return response.data;
  },

  // 获取用户统计
  async getUserStats(): Promise<{
    totalUsers: number;
    activeUsers: number;
    adminUsers: number;
    regularUsers: number;
  }> {
    const response = await api.get("/users/stats");
    return response.data;
  },

  // 检查用户名是否存在
  async isUsernameExists(username: string): Promise<boolean> {
    try {
      const response = await api.get("/users", {
        params: { search: username },
      });
      return response.data.users.some(
        (user: User) => user.username === username
      );
    } catch (error) {
      console.error("检查用户名是否存在失败:", error);
      return false;
    }
  },

  // 检查邮箱是否存在
  async isEmailExists(email: string): Promise<boolean> {
    try {
      const response = await api.get("/users", { params: { search: email } });
      return response.data.users.some((user: User) => user.email === email);
    } catch (error) {
      console.error("检查邮箱是否存在失败:", error);
      return false;
    }
  },
};

export default userAPI;
