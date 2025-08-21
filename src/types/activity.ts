export interface Activity {
  id: number;
  type:
    | "patent_add"
    | "patent_approve"
    | "patent_review"
    | "patent_expire"
    | "patent_application"
    | "user_register"
    | "user_login"
    | "password_change"
    | "profile_update"
    | "document_upload"
    | "workflow_start";
  title: string;
  description: string;
  userId: number;
  userName: string;
  targetId?: number; // 关联的专利ID或用户ID
  targetName?: string; // 关联的专利名称或用户名
  timestamp: string;
  status: "success" | "pending" | "warning" | "info";
  statusText: string;
  metadata?: Record<string, any>; // 额外的元数据
}

export interface ActivityFilter {
  type?: Activity["type"];
  userId?: number;
  startDate?: string;
  endDate?: string;
  status?: Activity["status"];
}
