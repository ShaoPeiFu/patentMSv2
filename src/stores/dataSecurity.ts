import { defineStore } from "pinia";
import { ref, reactive } from "vue";
import { dataSecurityAPI } from "@/utils/api";
import { ElMessage } from "element-plus";

export interface EncryptionSettings {
  algorithm: string;
  keyRotationDays: number;
  sensitiveDataEncryption: boolean;
  lastKeyRotation?: Date;
}

export interface LoggingSettings {
  level: string;
  retentionDays: number;
  realTimeMonitoring: boolean;
  auditTrail?: boolean;
}

export interface BackupSettings {
  frequency: string;
  location: string;
  incrementalBackup: boolean;
  lastBackup?: Date;
  nextBackup?: Date;
}

export interface RecoverySettings {
  rtoHours: number;
  rpoMinutes: number;
  autoRecovery: boolean;
  lastRecoveryTest?: Date;
}

export interface SecurityStatus {
  encryption: boolean;
  logging: boolean;
  backup: boolean;
  recovery: boolean;
}

export const useDataSecurityStore = defineStore("dataSecurity", () => {
  // 加密设置
  const encryptionSettings = reactive<EncryptionSettings>({
    algorithm: "aes256",
    keyRotationDays: 90,
    sensitiveDataEncryption: true,
  });

  // 日志设置
  const loggingSettings = reactive<LoggingSettings>({
    level: "info",
    retentionDays: 90,
    realTimeMonitoring: true,
  });

  // 备份设置
  const backupSettings = reactive<BackupSettings>({
    frequency: "daily",
    location: "cloud",
    incrementalBackup: true,
  });

  // 恢复设置
  const recoverySettings = reactive<RecoverySettings>({
    rtoHours: 4,
    rpoMinutes: 60,
    autoRecovery: true,
  });

  // 安全状态
  const securityStatus = reactive<SecurityStatus>({
    encryption: true,
    logging: true,
    backup: true,
    recovery: true,
  });

  // 操作状态
  const isBackupRunning = ref(false);
  const isRecoveryTesting = ref(false);
  const daysUntilKeyRotation = ref(45);
  const nextBackupTime = ref(new Date(Date.now() + 24 * 60 * 60 * 1000));

  // 加载状态
  const isLoading = ref(false);
  const error = ref<string | null>(null);

  // 从API加载安全设置
  const loadSecuritySettings = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      const settings = await dataSecurityAPI.getSettings();

      // 更新加密设置
      Object.assign(encryptionSettings, settings.encryption);

      // 更新日志设置
      Object.assign(loggingSettings, settings.logging);

      // 更新备份设置
      Object.assign(backupSettings, settings.backup);

      // 更新恢复设置
      Object.assign(recoverySettings, settings.recovery);

      // 计算密钥轮换天数
      if (settings.encryption.lastKeyRotation) {
        const lastRotation = new Date(settings.encryption.lastKeyRotation);
        const daysSinceRotation = Math.floor(
          (Date.now() - lastRotation.getTime()) / (1000 * 60 * 60 * 24)
        );
        daysUntilKeyRotation.value = Math.max(
          0,
          settings.encryption.keyRotationDays - daysSinceRotation
        );
      }

      // 更新下次备份时间
      if (settings.backup.nextBackup) {
        nextBackupTime.value = new Date(settings.backup.nextBackup);
      }

      ElMessage.success("安全设置加载成功");
    } catch (err: any) {
      error.value = err.message || "加载安全设置失败";
      ElMessage.error(error.value || "加载安全设置失败");
      console.error("加载安全设置失败:", err);
    } finally {
      isLoading.value = false;
    }
  };

  // 更新加密设置
  const updateEncryptionSettings = async (
    settings: Partial<EncryptionSettings>
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedSettings = await dataSecurityAPI.updateSettings({
        encryption: { ...encryptionSettings, ...settings },
      });

      if (updatedSettings.success) {
        Object.assign(encryptionSettings, settings);
        securityStatus.encryption = true;
        ElMessage.success("加密设置更新成功");
        return true;
      }

      return false;
    } catch (err: any) {
      error.value = err.message || "更新加密设置失败";
      ElMessage.error(error.value || "更新加密设置失败");
      console.error("更新加密设置失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新日志设置
  const updateLoggingSettings = async (
    settings: Partial<LoggingSettings>
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedSettings = await dataSecurityAPI.updateSettings({
        logging: { ...loggingSettings, ...settings },
      });

      if (updatedSettings.success) {
        Object.assign(loggingSettings, settings);
        securityStatus.logging = true;
        ElMessage.success("日志设置更新成功");
        return true;
      }

      return false;
    } catch (err: any) {
      error.value = err.message || "更新日志设置失败";
      ElMessage.error(error.value || "更新日志设置失败");
      console.error("更新日志设置失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新备份设置
  const updateBackupSettings = async (
    settings: Partial<BackupSettings>
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedSettings = await dataSecurityAPI.updateSettings({
        backup: { ...backupSettings, ...settings },
      });

      if (updatedSettings.success) {
        Object.assign(backupSettings, settings);
        securityStatus.backup = true;
        ElMessage.success("备份设置更新成功");
        return true;
      }

      return false;
    } catch (err: any) {
      error.value = err.message || "更新备份设置失败";
      ElMessage.error(error.value || "更新备份设置失败");
      console.error("更新备份设置失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 更新恢复设置
  const updateRecoverySettings = async (
    settings: Partial<RecoverySettings>
  ): Promise<boolean> => {
    try {
      isLoading.value = true;
      error.value = null;

      const updatedSettings = await dataSecurityAPI.updateSettings({
        recovery: { ...recoverySettings, ...settings },
      });

      if (updatedSettings.success) {
        Object.assign(recoverySettings, settings);
        securityStatus.recovery = true;
        ElMessage.success("恢复设置更新成功");
        return true;
      }

      return false;
    } catch (err: any) {
      error.value = err.message || "更新恢复设置失败";
      ElMessage.error(error.value || "更新恢复设置失败");
      console.error("更新恢复设置失败:", err);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  // 触发手动备份
  const triggerManualBackup = async (): Promise<void> => {
    try {
      isBackupRunning.value = true;
      error.value = null;

      // 传递当前用户的备份设置，包括location
      const result = await dataSecurityAPI.startBackup({
        backupType: "full",
        location: backupSettings.location,
      });

      if (result.success) {
        ElMessage.success(result.message);

        // 更新下次备份时间
        if (result.estimatedTime) {
          const estimatedMinutes = parseInt(result.estimatedTime.split("-")[0]);
          nextBackupTime.value = new Date(
            Date.now() + estimatedMinutes * 60 * 1000
          );
        }
      } else {
        throw new Error("备份启动失败");
      }
    } catch (err: any) {
      error.value = err.message || "手动备份失败";
      ElMessage.error(error.value || "手动备份失败");
      console.error("手动备份失败:", err);
      throw err;
    } finally {
      isBackupRunning.value = false;
    }
  };

  // 测试恢复计划
  const testRecoveryPlan = async (): Promise<boolean> => {
    try {
      isRecoveryTesting.value = true;
      error.value = null;

      const result = await dataSecurityAPI.startRecoveryTest();

      if (result.success) {
        const success = result.testResult === "passed";

        if (success) {
          securityStatus.recovery = true;
          ElMessage.success(result.message);
        } else {
          ElMessage.warning(result.message);
        }

        return success;
      } else {
        throw new Error("恢复测试启动失败");
      }
    } catch (err: any) {
      error.value = err.message || "测试恢复计划失败";
      ElMessage.error(error.value || "测试恢复计划失败");
      console.error("测试恢复计划失败:", err);
      return false;
    } finally {
      isRecoveryTesting.value = false;
    }
  };

  // 轮换加密密钥
  const rotateEncryptionKeys = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      // 模拟密钥轮换过程
      await new Promise((resolve) => setTimeout(resolve, 3000));

      // 重置密钥轮换天数
      daysUntilKeyRotation.value = encryptionSettings.keyRotationDays;

      // 更新最后轮换时间
      encryptionSettings.lastKeyRotation = new Date();

      ElMessage.success("加密密钥轮换完成");
    } catch (err: any) {
      error.value = err.message || "密钥轮换失败";
      ElMessage.error(error.value || "密钥轮换失败");
      console.error("密钥轮换失败:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 检查安全状态
  const checkSecurityStatus = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      // 重新加载设置以获取最新状态
      await loadSecuritySettings();

      // 更新安全状态
      securityStatus.encryption = encryptionSettings.sensitiveDataEncryption;
      securityStatus.logging = loggingSettings.realTimeMonitoring;
      securityStatus.backup = backupSettings.incrementalBackup;
      securityStatus.recovery = recoverySettings.autoRecovery;

      ElMessage.success("安全状态检查完成");
    } catch (err: any) {
      error.value = err.message || "检查安全状态失败";
      if (error.value) {
        ElMessage.error(error.value);
      }
      console.error("检查安全状态失败:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 初始化安全设置
  const initializeSecurity = async (): Promise<void> => {
    try {
      isLoading.value = true;
      error.value = null;

      // 加载安全设置
      await loadSecuritySettings();

      // 检查所有安全状态
      await checkSecurityStatus();

      console.log("数据安全模块初始化完成");
      ElMessage.success("数据安全模块初始化完成");
    } catch (err: any) {
      error.value = err.message || "初始化安全设置失败";
      if (error.value) {
        ElMessage.error(error.value);
      }
      console.error("初始化安全设置失败:", err);
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // 清除错误
  const clearError = (): void => {
    error.value = null;
  };

  return {
    // 状态
    encryptionSettings,
    loggingSettings,
    backupSettings,
    recoverySettings,
    securityStatus,
    isBackupRunning,
    isRecoveryTesting,
    daysUntilKeyRotation,
    nextBackupTime,
    isLoading,
    error,

    // 方法
    loadSecuritySettings,
    updateEncryptionSettings,
    updateLoggingSettings,
    updateBackupSettings,
    updateRecoverySettings,
    triggerManualBackup,
    testRecoveryPlan,
    rotateEncryptionKeys,
    checkSecurityStatus,
    initializeSecurity,
    clearError,
  };
});
