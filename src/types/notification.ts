export interface Notification {
  id: number;
  title: string;
  content: string;
  type: "info" | "success" | "warning" | "error" | "patent" | "task" | "system";
  read: boolean;
  createdAt: string;
  userId: number;
  targetId?: number;
  targetType?: "patent" | "task" | "system" | "user";
  action?: {
    text: string;
    url?: string;
    callback?: () => void;
  };
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  patentUpdates: boolean;
  systemMessages: boolean;
}
