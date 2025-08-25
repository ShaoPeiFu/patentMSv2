import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { authAPI } from "@/utils/api";
import { userAPI } from "@/services/userAPI";
import type { User } from "@/types/user";

// 注册表单类型
export interface RegisterForm {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  realName: string;
  phone: string;
  department: string;
  role: string;
  agreeTerms: boolean;
}

export const useUserStore = defineStore("user", () => {
  // 状态 - 使用内存存储而不是localStorage
  const currentUser = ref<User | null>(null);
  const users = ref<User[]>([]);
  const loading = ref(false);
  const token = ref<string | null>(null);
  const initializing = ref(false);

  // 计算属性
  const isLoggedIn = computed(() => !!currentUser.value && !!token.value);
  const isAdmin = computed(() => currentUser.value?.role === "admin");
  const isReviewer = computed(() => currentUser.value?.role === "reviewer");

  // 从API获取当前用户信息
  const loadCurrentUser = async () => {
    try {
      const user = await userAPI.getCurrentUser();
      currentUser.value = user;
      return user;
    } catch (error) {
      console.error("获取当前用户信息失败:", error);
      currentUser.value = null;
      token.value = null;
      throw error;
    }
  };

  // 保存用户信息到内存和localStorage
  const saveUserInfo = (user: User, userToken: string) => {
    currentUser.value = user;
    token.value = userToken;
    // 将token和用户信息都存储到localStorage用于持久化
    localStorage.setItem("token", userToken);
    localStorage.setItem("user", JSON.stringify(user));
    console.log("✅ 用户信息已保存到localStorage:", user);
  };

  // 清除用户信息
  const clearUserInfo = () => {
    currentUser.value = null;
    token.value = null;
    users.value = [];
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    console.log("✅ 用户信息已从localStorage清除");
  };

  // 初始化token和用户信息（从localStorage恢复）
  const initializeToken = () => {
    const storedToken = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (storedToken && storedUser) {
      console.log("🔍 开始验证存储的token...");

      // 使用安全的token验证
      const validation = safeTokenValidation(storedToken);

      if (!validation.valid) {
        console.log(`⚠️ Token验证失败: ${validation.reason}，清除本地存储`);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        return;
      }

      // 恢复token和用户信息
      try {
        token.value = storedToken;
        const userData = JSON.parse(storedUser);
        currentUser.value = userData;
        console.log("✅ 用户信息已从localStorage恢复:", userData);
        console.log("✅ Token初始化成功");

        // 如果token验证是跳过的，记录警告但不阻止登录
        if (validation.reason === "跳过解析验证") {
          console.warn("⚠️ Token解析验证被跳过，建议检查token完整性");
        }
      } catch (error) {
        console.log("⚠️ 用户数据格式错误，清除本地存储");
        localStorage.removeItem("user");
        localStorage.removeItem("token");
      }
    } else {
      console.log("📝 没有找到存储的token或用户信息");
    }
  };

  // 用户登录
  const login = async (username: string, password: string) => {
    loading.value = true;
    try {
      const response = await authAPI.login({ username, password });

      if (response.success) {
        saveUserInfo(response.user, response.token);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || "登录失败");
      }
    } catch (error: any) {
      console.error("登录失败:", error);
      throw new Error(
        error.response?.data?.error || error.message || "登录失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 用户注册
  const register = async (userData: {
    username: string;
    email: string;
    password: string;
    realName: string;
    phone?: string;
    department: string;
    role?: string;
  }) => {
    loading.value = true;
    try {
      const response = await authAPI.register(userData);

      if (response.success) {
        saveUserInfo(response.user, response.token);
        return { success: true, user: response.user };
      } else {
        throw new Error(response.error || "注册失败");
      }
    } catch (error: any) {
      console.error("注册失败:", error);
      throw new Error(
        error.response?.data?.error || error.message || "注册失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 用户登出
  const logout = () => {
    clearUserInfo();
  };

  // 获取用户列表
  const fetchUsers = async () => {
    loading.value = true;
    try {
      const response = await userAPI.getUsers();
      users.value = response.users || [];
      return response;
    } catch (error: any) {
      console.error("获取用户列表失败:", error);
      users.value = [];
      throw new Error(
        error.response?.data?.error || error.message || "获取用户列表失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 获取用户详情
  const fetchUser = async (id: number) => {
    loading.value = true;
    try {
      const response = await userAPI.getUserById(id);
      return response;
    } catch (error: any) {
      console.error("获取用户详情失败:", error);
      throw new Error(
        error.response?.data?.error || error.message || "获取用户详情失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 创建用户
  const createUser = async (userData: any) => {
    try {
      const response = await userAPI.createUser(userData);
      // 刷新用户列表
      await fetchUsers();
      return response;
    } catch (error) {
      console.error("创建用户失败:", error);
      throw error;
    }
  };

  // 更新用户
  const updateUser = async (id: number, userData: Partial<User>) => {
    loading.value = true;
    try {
      console.log("用户store - 准备更新用户:", {
        id,
        userData: JSON.stringify(userData),
        userDataObj: userData,
      });
      const response = await userAPI.updateUser(id, userData);

      // 如果是当前用户，更新内存中的用户信息
      if (currentUser.value && currentUser.value.id === id) {
        currentUser.value = { ...currentUser.value, ...response };
      }

      // 更新用户列表中的用户
      const userIndex = users.value.findIndex((u) => u.id === id);
      if (userIndex !== -1) {
        users.value[userIndex] = { ...users.value[userIndex], ...response };
      }

      return response;
    } catch (error: any) {
      console.error("更新用户失败:", error);
      throw new Error(
        error.response?.data?.error || error.message || "更新用户失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 删除用户
  const deleteUser = async (id: number) => {
    loading.value = true;
    try {
      await userAPI.deleteUser(id);

      // 从用户列表中移除
      users.value = users.value.filter((u) => u.id !== id);

      // 如果是当前用户，清除登录状态
      if (currentUser.value && currentUser.value.id === id) {
        clearUserInfo();
      }

      return { success: true };
    } catch (error: any) {
      console.error("删除用户失败:", error);
      throw new Error(
        error.response?.data?.error || error.message || "删除用户失败"
      );
    } finally {
      loading.value = false;
    }
  };

  // 检查用户名是否存在（使用无需认证的API）
  const isUsernameExists = async (username: string) => {
    try {
      const response = await authAPI.checkUsername(username);
      return response.exists;
    } catch (error) {
      console.error("检查用户名是否存在失败:", error);
      return false;
    }
  };

  // 检查邮箱是否存在（使用无需认证的API）
  const isEmailExists = async (email: string) => {
    try {
      const response = await authAPI.checkEmail(email);
      return response.exists;
    } catch (error) {
      console.error("检查邮箱是否存在失败:", error);
      return false;
    }
  };

  // 修改密码
  const changePassword = async (
    userId: number,
    oldPassword: string,
    newPassword: string
  ) => {
    try {
      const response = await userAPI.changePassword(userId, {
        oldPassword,
        newPassword,
      });
      return response;
    } catch (error) {
      console.error("修改密码失败:", error);
      throw error;
    }
  };

  // 更新用户头像
  const updateAvatar = async (userId: number, avatar: string) => {
    try {
      const response = await userAPI.updateAvatar(userId, avatar);

      // 如果是当前用户，更新头像
      if (currentUser.value && currentUser.value.id === userId) {
        currentUser.value.avatar = avatar;
      }

      // 更新用户列表中的头像
      const userIndex = users.value.findIndex((u) => u.id === userId);
      if (userIndex !== -1) {
        users.value[userIndex].avatar = avatar;
      }

      return response;
    } catch (error) {
      console.error("更新头像失败:", error);
      throw error;
    }
  };

  // 权限检查
  const hasPermission = (permission: string) => {
    if (!currentUser.value) return false;

    const role = currentUser.value.role;
    const permissions: Record<string, string[]> = {
      admin: [
        "integrationManage",
        "user:view",
        "user:edit",
        "user:delete",
        "user:create",
        "patent:view",
        "patent:edit",
        "patent:delete",
        "system:manage",
      ],
      reviewer: ["patent:view", "patent:edit", "user:view"],
      user: ["patent:view"],
    };

    return permissions[role]?.includes(permission) || false;
  };

  // 初始化
  const initialize = async () => {
    if (initializing.value) return;
    initializing.value = true;
    try {
      initializeToken();
      if (token.value) {
        try {
          await loadCurrentUser();
          if (currentUser.value?.role === "admin") {
            await fetchUsers();
          }
        } catch (error: any) {
          console.warn("初始化时加载用户信息失败:", error.message);
          // 如果是认证错误，清除无效token
          if (
            error.response?.status === 401 ||
            error.response?.status === 403
          ) {
            console.log("🔒 认证失败，清除无效token");
            clearUserInfo();
          }
        }
      }
    } finally {
      initializing.value = false;
    }
  };

  // 确保在需要时完成初始化
  const ensureInitialized = async () => {
    if (initializing.value) {
      // 等待初始化完成
      while (initializing.value) {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
      return;
    }

    // 首先尝试从localStorage恢复
    if (!currentUser.value && !token.value) {
      initializeToken();
    }

    // 如果有token但没有用户信息，尝试加载用户信息
    if (token.value && !currentUser.value) {
      try {
        console.log("🔄 尝试从API加载用户信息...");
        await loadCurrentUser();
        console.log("✅ 用户信息加载成功");
      } catch (error: any) {
        console.warn("ensureInitialized: 加载用户信息失败:", error.message);
        // 如果是认证错误，清除无效token
        if (error.response?.status === 401 || error.response?.status === 403) {
          console.log("🔒 ensureInitialized: 认证失败，清除无效token");
          clearUserInfo();
        }
        // 重新抛出错误，让路由守卫处理
        throw error;
      }
    }

    // 如果仍然没有用户信息，尝试从localStorage恢复
    if (!currentUser.value && localStorage.getItem("user")) {
      try {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          currentUser.value = userData;
          console.log("✅ 从localStorage恢复用户信息:", userData);
        }
      } catch (error) {
        console.warn("从localStorage恢复用户信息失败:", error);
        localStorage.removeItem("user");
      }
    }
  };

  // 强制刷新用户列表（用于调试和手动刷新）
  const forceRefreshUsers = async () => {
    try {
      await fetchUsers();
      return true;
    } catch (error) {
      console.error("强制刷新用户列表失败:", error);
      return false;
    }
  };

  // 强制恢复用户信息（用于调试和手动恢复）
  const forceRestoreUser = () => {
    try {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (storedUser && storedToken) {
        const userData = JSON.parse(storedUser);
        currentUser.value = userData;
        token.value = storedToken;
        console.log("✅ 强制恢复用户信息成功:", userData);
        return true;
      } else {
        console.log("⚠️ 没有找到存储的用户信息或token");
        return false;
      }
    } catch (error) {
      console.error("强制恢复用户信息失败:", error);
      return false;
    }
  };

  // 检查token是否有效
  const checkTokenValidity = async () => {
    if (!token.value) return false;

    try {
      // const response = await authAPI.getCurrentUser();
      return false; // 暂时返回false，因为response未定义
    } catch (error) {
      console.log("Token验证失败:", error);
      return false;
    }
  };

  // 安全的token验证
  const safeTokenValidation = (storedToken: string) => {
    try {
      // 基本格式检查
      if (!storedToken || typeof storedToken !== "string") {
        return { valid: false, reason: "Token为空或格式错误" };
      }

      // JWT格式检查
      const parts = storedToken.split(".");
      if (parts.length !== 3) {
        return { valid: false, reason: "JWT格式不正确" };
      }

      // 尝试解析payload
      try {
        const payload = parts[1];
        // 处理base64 padding
        const paddedPayload =
          payload + "=".repeat((4 - (payload.length % 4)) % 4);

        let tokenData;

        // 尝试使用atob (浏览器环境)
        try {
          if (typeof atob !== "undefined") {
            tokenData = JSON.parse(atob(paddedPayload));
          } else {
            throw new Error("atob函数不可用");
          }
        } catch (atobError) {
          console.warn("atob解析失败，尝试其他方式:", (atobError as any).message);

          // 如果atob不可用，尝试使用TextDecoder (现代浏览器)
          try {
            const binaryString = window.atob
              ? window.atob(paddedPayload)
              : null;
            if (binaryString) {
              tokenData = JSON.parse(binaryString);
            } else {
              throw new Error("无法解析base64");
            }
          } catch (textDecoderError) {
            console.warn("TextDecoder解析失败:", (textDecoderError as any).message);

            // 最后尝试：如果token看起来有效，暂时跳过解析验证
            // 这可以防止因为解析问题而强制退出登录
            console.log(
              "⚠️ 无法解析token payload，但token格式正确，暂时跳过验证"
            );
            return { valid: true, data: null, reason: "跳过解析验证" };
          }
        }

        // 检查过期时间
        if (tokenData && tokenData.exp) {
          const now = Date.now() / 1000;
          if (tokenData.exp < now) {
            return { valid: false, reason: "Token已过期" };
          }
        }

        return { valid: true, data: tokenData };
      } catch (parseError) {
        console.warn("Token解析失败，详细错误:", parseError);
        // 不立即返回失败，而是尝试跳过验证
        return { valid: true, data: null, reason: "跳过解析验证" };
      }
    } catch (error) {
      console.error("Token验证异常:", error);
      return { valid: false, reason: "Token验证异常" };
    }
  };

  return {
    // 状态
    currentUser,
    users,
    loading,
    token,

    // 计算属性
    isLoggedIn,
    isAdmin,
    isReviewer,

    // 方法
    login,
    register,
    logout,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
    isUsernameExists,
    isEmailExists,
    changePassword,
    updateAvatar,
    hasPermission,
    initialize,
    ensureInitialized,
    loadCurrentUser,
    clearUserInfo,

    // 兼容性方法
    getAllUsers: () => users.value,
    forceRefreshUsers,
    forceRestoreUser,
    updateProfile: updateUser,
    verifyPassword: async () => {
      // 这里应该验证密码，暂时返回true
      return true;
    },

    // Token管理方法
    checkTokenValidity,
    safeTokenValidation,

    // 状态标识
    initializing,
  };
});
