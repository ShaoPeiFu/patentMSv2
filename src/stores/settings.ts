import { defineStore } from 'pinia';
import { reactive } from 'vue';

export interface SystemSettings {
  // 基本设置
  basic: {
    systemName: string;
    version: string;
    adminEmail: string;
    description: string;
  };
  
  // 安全设置
  security: {
    minPasswordLength: number;
    passwordRequirements: string[];
    sessionTimeout: string;
    loginLockEnabled: boolean;
    maxLoginAttempts: number;
  };
  
  // 专利设置
  patent: {
    patentNumberPrefix: string;
    patentNumberLength: number;
    autoReviewEnabled: boolean;
    expirationReminderDays: number;
    allowedPatentTypes: string[];
  };
  
  // 通知设置
  notification: {
    emailEnabled: boolean;
    systemNotificationEnabled: boolean;
    notificationTypes: string[];
  };
  
  // 备份设置
  backup: {
    autoBackupEnabled: boolean;
    backupFrequency: string;
    maxBackupCount: number;
  };
}

export const useSettingsStore = defineStore('settings', () => {
  // 默认设置
  const defaultSettings: SystemSettings = {
    basic: {
      systemName: "专利管理系统",
      version: "1.0.0",
      adminEmail: "admin@sina.com",
      description: "新浪科技专利管理系统，提供专利申请、审核、管理等功能。",
    },
    security: {
      minPasswordLength: 8,
      passwordRequirements: ["uppercase", "lowercase", "numbers"],
      sessionTimeout: "120",
      loginLockEnabled: true,
      maxLoginAttempts: 5,
    },
    patent: {
      patentNumberPrefix: "SINA",
      patentNumberLength: 8,
      autoReviewEnabled: true,
      expirationReminderDays: 30,
      allowedPatentTypes: ["invention", "utility_model", "design", "software"],
    },
    notification: {
      emailEnabled: true,
      systemNotificationEnabled: true,
      notificationTypes: ["patent_approved", "patent_rejected", "patent_expiring"],
    },
    backup: {
      autoBackupEnabled: true,
      backupFrequency: "weekly",
      maxBackupCount: 10,
    },
  };

  // 当前设置
  const settings = reactive<SystemSettings>({ ...defaultSettings });

  // 加载设置
  const loadSettings = () => {
    try {
      const savedSettings = localStorage.getItem('systemSettings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        Object.assign(settings, parsedSettings);
      }
    } catch (error) {
      console.error('加载系统设置失败:', error);
    }
  };

  // 保存设置
  const saveSettings = async (newSettings: Partial<SystemSettings>) => {
    try {
      Object.assign(settings, newSettings);
      localStorage.setItem('systemSettings', JSON.stringify(settings));
      return true;
    } catch (error) {
      console.error('保存系统设置失败:', error);
      return false;
    }
  };

  // 重置设置
  const resetSettings = () => {
    Object.assign(settings, defaultSettings);
    localStorage.removeItem('systemSettings');
  };

  // 获取设置
  const getSettings = () => {
    return settings;
  };

  // 获取特定设置
  const getSetting = (path: string) => {
    const keys = path.split('.');
    let value: any = settings;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  };

  // 更新特定设置
  const updateSetting = (path: string, value: any) => {
    const keys = path.split('.');
    let current: any = settings;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current)) {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
  };

  // 导出设置
  const exportSettings = () => {
    const dataStr = JSON.stringify(settings, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `system-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  // 导入设置
  const importSettings = async (file: File): Promise<boolean> => {
    try {
      const text = await file.text();
      const importedSettings = JSON.parse(text);
      
      // 验证设置格式
      if (typeof importedSettings === 'object' && importedSettings !== null) {
        Object.assign(settings, importedSettings);
        localStorage.setItem('systemSettings', JSON.stringify(settings));
        return true;
      }
      return false;
    } catch (error) {
      console.error('导入设置失败:', error);
      return false;
    }
  };

  // 检查密码是否符合设置要求
  const validatePassword = (password: string): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    const security = settings.security;
    
    if (password.length < security.minPasswordLength) {
      errors.push(`密码长度至少为${security.minPasswordLength}个字符`);
    }
    
    if (security.passwordRequirements.includes('uppercase') && !/[A-Z]/.test(password)) {
      errors.push('密码必须包含大写字母');
    }
    
    if (security.passwordRequirements.includes('lowercase') && !/[a-z]/.test(password)) {
      errors.push('密码必须包含小写字母');
    }
    
    if (security.passwordRequirements.includes('numbers') && !/\d/.test(password)) {
      errors.push('密码必须包含数字');
    }
    
    if (security.passwordRequirements.includes('special') && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push('密码必须包含特殊字符');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  // 生成专利号
  const generatePatentNumber = (): string => {
    const prefix = settings.patent.patentNumberPrefix;
    const length = settings.patent.patentNumberLength;
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // 组合前缀、时间戳和随机字符
    const combined = `${prefix}${timestamp}${random}`;
    
    // 截取到指定长度
    return combined.substring(0, length);
  };

  // 检查专利类型是否允许
  const isPatentTypeAllowed = (type: string): boolean => {
    return settings.patent.allowedPatentTypes.includes(type);
  };

  // 获取会话超时时间（分钟）
  const getSessionTimeoutMinutes = (): number => {
    return parseInt(settings.security.sessionTimeout) || 120;
  };

  // 初始化
  loadSettings();

  return {
    settings,
    loadSettings,
    saveSettings,
    resetSettings,
    getSettings,
    getSetting,
    updateSetting,
    exportSettings,
    importSettings,
    validatePassword,
    generatePatentNumber,
    isPatentTypeAllowed,
    getSessionTimeoutMinutes,
  };
}); 