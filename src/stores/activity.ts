import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { activityAPI } from "@/utils/api";
import type { Activity } from "@/types/activity";

export const useActivityStore = defineStore("activity", () => {
  // 状态
  const activities = ref<Activity[]>([]);
  const loading = ref(false);
  const total = ref(0);

  // 计算属性
  const recentActivities = computed(() =>
    activities.value
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 10)
  );

  const activitiesByType = computed(
    () => (type: string) =>
      activities.value.filter((activity) => activity.type === type)
  );

  // 初始化空的活动列表
  const initializeActivities = () => {
    activities.value = [];
    total.value = 0;
  };

  // 获取活动列表
  const fetchActivities = async (params?: {
    page?: number;
    limit?: number;
    type?: string;
  }) => {
    loading.value = true;
    try {
      const apiResponse = await activityAPI.getActivities(params);

      if (apiResponse && apiResponse.activities) {
        activities.value = apiResponse.activities;
        total.value = apiResponse.pagination?.total || activities.value.length;
      } else {
        // API 返回数据格式不正确，初始化为空
        initializeActivities();
      }
    } catch (error) {
      console.error("API获取活动失败:", error);
      // 初始化空列表，不依赖本地存储
      initializeActivities();
    } finally {
      loading.value = false;
    }
  };

  // 添加活动
  const addActivity = async (activity: Omit<Activity, "id" | "createdAt">) => {
    try {
      const newActivity: Activity = {
        ...activity,
        id: Date.now(),
        timestamp: new Date().toISOString(),
      };

      // 通过API创建活动
      const apiResponse = await activityAPI.createActivity(activity);
      if (apiResponse && apiResponse.id) {
        newActivity.id = apiResponse.id;
        newActivity.timestamp = apiResponse.timestamp;
      }

      // 添加到本地状态
      activities.value.unshift(newActivity);
      total.value = activities.value.length;

      return newActivity;
    } catch (error) {
      console.error("添加活动失败:", error);
      throw error;
    }
  };

  // 更新活动
  const updateActivity = async (id: number, updates: Partial<Activity>) => {
    try {
      const activityIndex = activities.value.findIndex((a) => a.id === id);
      if (activityIndex === -1) {
        throw new Error("活动不存在");
      }

      // 通过API更新活动
      await activityAPI.updateActivity(id, updates);

      // 更新本地状态
      activities.value[activityIndex] = {
        ...activities.value[activityIndex],
        ...updates,
      };

      return activities.value[activityIndex];
    } catch (error) {
      console.error("更新活动失败:", error);
      throw error;
    }
  };

  // 删除活动
  const deleteActivity = async (id: number) => {
    try {
      const activityIndex = activities.value.findIndex((a) => a.id === id);
      if (activityIndex === -1) {
        throw new Error("活动不存在");
      }

      // 通过API删除活动
      await activityAPI.deleteActivity(id);

      // 更新本地状态
      activities.value.splice(activityIndex, 1);
      total.value = activities.value.length;

      return { success: true };
    } catch (error) {
      console.error("删除活动失败:", error);
      throw error;
    }
  };

  // 获取活动详情
  const getActivity = async (id: number) => {
    try {
      const apiResponse = await activityAPI.getActivity(id);
      if (apiResponse && apiResponse.id) {
        return apiResponse;
      }
    } catch (apiError) {
      console.warn("API获取活动详情失败:", apiError);
    }

    // Fallback to local data
    return activities.value.find((a) => a.id === id) || null;
  };

  // 初始化
  const initialize = () => {
    // 直接获取活动数据，不依赖本地存储
    fetchActivities();
  };

  return {
    // 状态
    activities,
    loading,
    total,

    // 计算属性
    recentActivities,
    activitiesByType,

    // 方法
    fetchActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    getActivity,
    initialize,
  };
});
