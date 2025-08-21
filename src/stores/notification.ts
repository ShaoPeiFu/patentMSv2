import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { notificationAPI } from "@/utils/api";
import type { Notification, NotificationSettings } from "@/types/notification";

export const useNotificationStore = defineStore("notification", () => {
  // 通知列表
  const notifications = ref<Notification[]>([]);

  // 通知设置
  const settings = ref<NotificationSettings>({
    emailNotifications: true,
    pushNotifications: true,
    patentUpdates: true,
    systemMessages: true,
  });

  // 加载状态
  const loading = ref(false);
  const total = ref(0);

  // 计算属性
  const unreadCount = computed(
    () => notifications.value.filter((n) => !n.read).length
  );

  const recentNotifications = computed(() =>
    notifications.value
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      )
      .slice(0, 10)
  );

  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => !n.read)
  );

  // 从localStorage加载通知数据
  const loadFromStorage = () => {
    try {
      const savedNotifications = localStorage.getItem("notifications");
      const savedSettings = localStorage.getItem("notificationSettings");

      if (savedNotifications) {
        notifications.value = JSON.parse(savedNotifications);
        total.value = notifications.value.length;
      }

      if (savedSettings) {
        settings.value = { ...settings.value, ...JSON.parse(savedSettings) };
      }
    } catch (error) {
      console.error("加载通知数据失败:", error);
    }
  };

  // 保存到localStorage
  const saveToStorage = () => {
    try {
      localStorage.setItem(
        "notifications",
        JSON.stringify(notifications.value)
      );
      localStorage.setItem(
        "notificationSettings",
        JSON.stringify(settings.value)
      );
    } catch (error) {
      console.error("保存通知数据失败:", error);
    }
  };

  // 获取通知列表
  const fetchNotifications = async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }) => {
    loading.value = true;
    try {
      const apiResponse = await notificationAPI.getNotifications(params);

      if (apiResponse && apiResponse.notifications) {
        notifications.value = apiResponse.notifications;
        total.value =
          apiResponse.pagination?.total || notifications.value.length;
      } else {
        // Fallback to localStorage if API fails
        loadFromStorage();
      }
    } catch (error) {
      console.warn("API获取通知失败，使用本地存储:", error);
      loadFromStorage();
    } finally {
      loading.value = false;
    }
  };

  // 添加通知
  const addNotification = async (
    notification: Omit<Notification, "id" | "createdAt" | "read">
  ) => {
    try {
      const newNotification: Notification = {
        ...notification,
        id: Date.now(),
        createdAt: new Date().toISOString(),
        read: false,
      };

      // 尝试通过API创建通知
      try {
        const apiResponse = await notificationAPI.createNotification(
          notification
        );
        if (apiResponse && apiResponse.id) {
          newNotification.id = apiResponse.id;
          newNotification.createdAt = apiResponse.createdAt;
        }
      } catch (apiError) {
        console.warn("API创建通知失败，使用本地存储:", apiError);
      }

      notifications.value.unshift(newNotification);
      total.value = notifications.value.length;
      saveToStorage();

      return newNotification;
    } catch (error) {
      console.error("添加通知失败:", error);
      throw error;
    }
  };

  // 标记为已读
  const markAsRead = async (notificationId: number) => {
    try {
      const notification = notifications.value.find(
        (n) => n.id === notificationId
      );
      if (notification) {
        // 尝试通过API标记为已读
        try {
          await notificationAPI.markAsRead(notificationId);
        } catch (apiError) {
          console.warn("API标记通知为已读失败:", apiError);
        }

        notification.read = true;
        saveToStorage();
      }
    } catch (error) {
      console.error("标记通知为已读失败:", error);
      throw error;
    }
  };

  // 标记所有为已读
  const markAllAsRead = async () => {
    try {
      // 尝试通过API标记所有为已读
      try {
        await notificationAPI.markAllAsRead();
      } catch (apiError) {
        console.warn("API标记所有通知为已读失败:", apiError);
      }

      notifications.value.forEach((n) => (n.read = true));
      saveToStorage();
    } catch (error) {
      console.error("标记所有通知为已读失败:", error);
      throw error;
    }
  };

  // 删除通知
  const deleteNotification = (notificationId: number) => {
    const index = notifications.value.findIndex((n) => n.id === notificationId);
    if (index !== -1) {
      notifications.value.splice(index, 1);
      total.value = notifications.value.length;
      saveToStorage();
    }
  };

  // 清空所有通知
  const clearAllNotifications = () => {
    notifications.value = [];
    total.value = 0;
    saveToStorage();
  };

  // 更新通知设置
  const updateSettings = (newSettings: Partial<NotificationSettings>) => {
    settings.value = { ...settings.value, ...newSettings };
    saveToStorage();
  };

  // 创建系统通知
  const createSystemNotification = async (
    title: string,
    content: string,
    type: Notification["type"] = "info"
  ) => {
    return await addNotification({
      title,
      content,
      type,
      userId: 1, // 系统用户ID
      targetId: undefined,
      targetType: "system",
    });
  };

  // 创建专利相关通知
  const createPatentNotification = async (
    patentTitle: string,
    action: string,
    userId: number,
    patentId?: number
  ) => {
    const title = `专利${action}通知`;
    const content = `专利"${patentTitle}"已${action}`;

    return await addNotification({
      title,
      content,
      type: "patent",
      userId,
      targetId: patentId,
      targetType: "patent",
    });
  };

  // 初始化示例通知
  const initializeExampleNotifications = () => {
    if (notifications.value.length === 0) {
      const exampleNotifications: Notification[] = [
        {
          id: 1,
          title: "系统通知",
          content: "欢迎使用专利管理系统",
          type: "info",
          userId: 1,
          targetId: undefined,
          targetType: "system",
          read: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 2,
          title: "专利更新",
          content: '专利"智能家居控制系统"状态已更新',
          type: "patent",
          userId: 1,
          targetId: 1,
          targetType: "patent",
          read: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: 3,
          title: "任务提醒",
          content: "您有一个新的专利审核任务",
          type: "task",
          userId: 1,
          targetId: 1,
          targetType: "task",
          read: true,
          createdAt: new Date(Date.now() - 7200000).toISOString(),
        },
      ];

      notifications.value = exampleNotifications;
      total.value = notifications.value.length;
      saveToStorage();
    }
  };

  // 初始化
  const initialize = () => {
    loadFromStorage();
    if (notifications.value.length === 0) {
      initializeExampleNotifications();
    }
  };

  return {
    // 状态
    notifications,
    settings,
    loading,
    total,

    // 计算属性
    unreadCount,
    recentNotifications,
    unreadNotifications,

    // 方法
    fetchNotifications,
    addNotification,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    updateSettings,
    createSystemNotification,
    createPatentNotification,
    initializeExampleNotifications,
    loadFromStorage,
    initialize,
  };
});
