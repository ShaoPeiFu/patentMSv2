import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useUserStore } from "./user";
import { useActivityStore } from "./activity";
import type {
  DocumentVersion,
  DocumentVersionHistory,
  DocumentApproval,
  ApprovalWorkflow,
  DocumentApprovalProcess,
  ElectronicSignature,
  DocumentVersionComparisonResult,
  DocumentTemplate,
  DocumentAccess,
  DocumentActivityLog,
  DocumentStats,
  DocumentSearchParams,
  DocumentSearchResult,
  DocumentDifference,
  DocumentAction,
  ApprovalDelegation,
  ApprovalTimeout,
  ApprovalEscalation,
  WorkflowTemplate,
  ApprovalStatistics,
} from "@/types/document";

export const useDocumentStore = defineStore("document", () => {
  // 文档版本
  const documentVersions = ref<DocumentVersion[]>([]);

  // 版本历史
  const versionHistories = ref<DocumentVersionHistory[]>([]);

  // 审批流程
  const approvalWorkflows = ref<ApprovalWorkflow[]>([]);

  // 审批过程
  const approvalProcesses = ref<DocumentApprovalProcess[]>([]);

  // 文档模板
  const documentTemplates = ref<DocumentTemplate[]>([]);

  // 访问权限
  const documentAccess = ref<DocumentAccess[]>([]);

  // 活动日志
  const activityLogs = ref<DocumentActivityLog[]>([]);

  // 电子签名
  const signatures = ref<ElectronicSignature[]>([]);

  // 审批委托
  const approvalDelegations = ref<ApprovalDelegation[]>([]);

  // 审批超时
  const approvalTimeouts = ref<ApprovalTimeout[]>([]);

  // 审批升级
  const approvalEscalations = ref<ApprovalEscalation[]>([]);

  // 工作流模板
  const workflowTemplates = ref<WorkflowTemplate[]>([]);

  // 计算属性
  const documentStats = computed((): DocumentStats => {
    const stats: DocumentStats = {
      totalDocuments: new Set(documentVersions.value.map((v) => v.documentId))
        .size,
      totalVersions: documentVersions.value.length,
      pendingApprovals: approvalProcesses.value.filter(
        (p) => p.status === "pending"
      ).length,
      recentActivity: activityLogs.value.filter((log) => {
        const logDate = new Date(log.timestamp);
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return logDate > weekAgo;
      }).length,
      storageUsed: documentVersions.value.reduce(
        (total, doc) => total + doc.fileSize,
        0
      ),
      storageLimit: 10 * 1024 * 1024 * 1024, // 10GB
      byStatus: {
        pending: 0,
        approved: 0,
        rejected: 0,
        draft: 0,
        archived: 0,
        obsolete: 0,
      },
      byType: {},
    };

    // 按状态统计
    documentVersions.value.forEach((doc) => {
      stats.byStatus[doc.status] = (stats.byStatus[doc.status] || 0) + 1;
    });

    // 按类型统计
    documentVersions.value.forEach((doc) => {
      stats.byType[doc.fileType] = (stats.byType[doc.fileType] || 0) + 1;
    });

    return stats;
  });

  const latestVersions = computed(() => {
    return documentVersions.value.filter((v) => v.isLatest);
  });

  const pendingApprovals = computed(() => {
    return approvalProcesses.value.filter((p) => p.status === "pending");
  });

  // 文档版本管理方法
  const uploadDocumentVersion = async (
    documentId: string,
    file: File,
    description?: string,
    changeLog?: string,
    parentVersionId?: string
  ): Promise<DocumentVersion> => {
    const userStore = useUserStore();
    const currentUser = userStore.currentUser;

    if (!currentUser) {
      throw new Error("用户未登录");
    }

    // 计算版本号
    const existingVersions = documentVersions.value.filter(
      (v) => v.documentId === documentId
    );
    const latestVersion = existingVersions.find((v) => v.isLatest);
    let newVersionNumber = "1.0";

    if (latestVersion) {
      const versionParts = latestVersion.version.split(".").map(Number);
      if (changeLog && changeLog.includes("[major]")) {
        // 主版本更新
        newVersionNumber = `${versionParts[0] + 1}.0`;
      } else {
        // 次版本更新
        newVersionNumber = `${versionParts[0]}.${versionParts[1] + 1}`;
      }
    }
    // 模拟文件上传和校验和计算
    const fileUrl = URL.createObjectURL(file);
    const checksum = await calculateChecksum(file);

    const newVersion: DocumentVersion = {
      id: Date.now().toString(),
      documentId,
      version: newVersionNumber,
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type || getFileTypeFromName(file.name),
      fileUrl,
      uploadedBy: currentUser.id,
      uploadedByName: currentUser.realName,
      uploadedAt: new Date().toISOString(),
      description,
      changeLog,
      status: "draft",
      isLatest: true,
      parentVersionId,
      checksum,
    };

    // 将之前的最新版本标记为非最新
    if (latestVersion) {
      latestVersion.isLatest = false;
    }

    documentVersions.value.push(newVersion);

    // 更新版本历史
    updateVersionHistory(documentId, newVersion);

    // 记录活动日志
    logActivity(
      documentId,
      newVersion.id,
      "upload",
      `上传了新版本 ${newVersionNumber}`
    );

    saveToStorage();
    return newVersion;
  };

  // 版本对比
  const compareVersions = async (
    documentId: string,
    oldVersionId: string,
    newVersionId: string
  ): Promise<DocumentVersionComparisonResult> => {
    const oldVersion = documentVersions.value.find(
      (v) => v.id === oldVersionId
    );
    const newVersion = documentVersions.value.find(
      (v) => v.id === newVersionId
    );

    if (!oldVersion || !newVersion) {
      throw new Error("版本不存在");
    }

    // 模拟版本对比逻辑
    const differences: DocumentDifference[] = [];

    // 文件名对比
    if (oldVersion.fileName !== newVersion.fileName) {
      differences.push({
        type: "modified",
        location: "fileName",
        oldContent: oldVersion.fileName,
        newContent: newVersion.fileName,
        description: "文件名已更改",
      });
    }

    // 文件大小对比
    if (oldVersion.fileSize !== newVersion.fileSize) {
      differences.push({
        type: "modified",
        location: "fileSize",
        oldContent: oldVersion.fileSize.toString(),
        newContent: newVersion.fileSize.toString(),
        description: "文件大小已更改",
      });
    }

    // 校验和对比
    const identical = oldVersion.checksum === newVersion.checksum;

    // 计算相似度分数（简化版）
    let similarityScore = 100;
    if (!identical) {
      const sizeDiff = Math.abs(oldVersion.fileSize - newVersion.fileSize);
      const maxSize = Math.max(oldVersion.fileSize, newVersion.fileSize);
      similarityScore = Math.max(0, 100 - (sizeDiff / maxSize) * 100);
    }

    const result: DocumentVersionComparisonResult = {
      identical,
      similarityScore: Math.round(similarityScore),
      totalChanges: differences.length,
      additions: differences.filter((d) => d.type === "added").length,
      deletions: differences.filter((d) => d.type === "removed").length,
      modifications: differences.filter((d) => d.type === "modified").length,
      differences,
    };

    logActivity(
      documentId,
      newVersionId,
      "view",
      `对比版本 ${oldVersion.version} 和 ${newVersion.version}`
    );

    return result;
  };

  // 审批流程管理
  const createApprovalWorkflow = async (
    workflow: Omit<ApprovalWorkflow, "id" | "createdAt">
  ): Promise<ApprovalWorkflow> => {
    try {
      const { workflowAPI } = await import("@/services/workflowAPI");
      const response = await workflowAPI.createWorkflow(workflow);

      if (response.success && response.workflow) {
        // 确保新工作流包含所有必要字段
        const newWorkflow: ApprovalWorkflow = {
          ...response.workflow,
          // 确保默认值存在
          type: response.workflow.type || "sequential",
          priority: response.workflow.priority || "medium",
          category: response.workflow.category || "文档",
          version: response.workflow.version || "1.0",
          isActive:
            response.workflow.isActive !== undefined
              ? response.workflow.isActive
              : true,
          tags: response.workflow.tags || [],
        };

        // 更新本地状态
        approvalWorkflows.value.unshift(newWorkflow); // 使用unshift确保新工作流显示在列表顶部
        console.log("✅ 新工作流已添加到本地状态:", newWorkflow);
        return newWorkflow;
      } else {
        throw new Error(response.message || "创建工作流失败");
      }
    } catch (error) {
      console.error("创建工作流失败:", error);
      throw error;
    }
  };

  const startApprovalProcess = async (
    documentVersionId: string,
    workflowId: string
  ): Promise<DocumentApprovalProcess> => {
    const workflow = approvalWorkflows.value.find((w) => w.id === workflowId);
    const documentVersion = documentVersions.value.find(
      (v) => v.id === documentVersionId
    );

    if (!workflow) {
      throw new Error("审批流程不存在");
    }

    if (!documentVersion) {
      throw new Error("文档版本不存在");
    }

    const process: DocumentApprovalProcess = {
      id: Date.now().toString(),
      documentVersionId,
      workflowId,
      currentStep: 1,
      status: "pending",
      startedAt: new Date().toISOString(),
      approvals: [],
      rejections: [],
      comments: [],
      priority: "medium",
      delegations: [],
      timeouts: [],
      escalations: [],
      lastActivityAt: new Date().toISOString(),
    };

    approvalProcesses.value.push(process);

    // 更新文档状态
    documentVersion.status = "pending";

    logActivity(
      documentVersion.documentId,
      documentVersionId,
      "approve",
      `启动审批流程: ${workflow.name}`
    );

    saveToStorage();
    return process;
  };

  const approveDocument = async (
    processId: string,
    userId: number,
    comment?: string,
    signature?: ElectronicSignature
  ): Promise<void> => {
    const process = approvalProcesses.value.find((p) => p.id === processId);
    const user = useUserStore().currentUser;

    if (!process) {
      throw new Error("审批流程不存在");
    }

    if (!user) {
      throw new Error("用户不存在");
    }

    const workflow = approvalWorkflows.value.find(
      (w) => w.id === process.workflowId
    );
    if (!workflow) {
      throw new Error("审批流程配置不存在");
    }

    const currentStep = workflow.steps.find(
      (s) => s.stepNumber === process.currentStep
    );
    if (!currentStep) {
      throw new Error("当前审批步骤不存在");
    }

    // 检查用户是否有权限审批
    const canApprove =
      currentStep.approverRoles.includes(user.role) ||
      currentStep.approverUsers?.includes(userId);

    if (!canApprove) {
      throw new Error("用户没有审批权限");
    }

    const approval: DocumentApproval = {
      id: Date.now().toString(),
      documentVersionId: process.documentVersionId,
      approverUserId: userId,
      approverName: user.realName,
      action: "approve",
      comment,
      approvedAt: new Date().toISOString(),
      signature,
    };

    process.approvals.push(approval);

    // 如果有电子签名，保存到签名列表
    if (signature) {
      signatures.value.push(signature);
    }

    // 检查是否可以进入下一步
    const nextStep = workflow.steps.find(
      (s) => s.stepNumber === process.currentStep + 1
    );
    if (nextStep) {
      process.currentStep += 1;
    } else {
      // 审批完成
      process.status = "approved";
      process.completedAt = new Date().toISOString();

      // 更新文档状态
      const documentVersion = documentVersions.value.find(
        (v) => v.id === process.documentVersionId
      );
      if (documentVersion) {
        documentVersion.status = "approved";
      }
    }

    const documentVersion = documentVersions.value.find(
      (v) => v.id === process.documentVersionId
    );
    if (documentVersion) {
      logActivity(
        documentVersion.documentId,
        process.documentVersionId,
        "approve",
        `${user.realName} 批准了文档${comment ? ": " + comment : ""}`
      );
    }

    saveToStorage();
  };

  const rejectDocument = async (
    processId: string,
    userId: number,
    comment: string
  ): Promise<void> => {
    const process = approvalProcesses.value.find((p) => p.id === processId);
    const user = useUserStore().currentUser;

    if (!process) {
      throw new Error("审批流程不存在");
    }

    if (!user) {
      throw new Error("用户不存在");
    }

    const rejection: DocumentApproval = {
      id: Date.now().toString(),
      documentVersionId: process.documentVersionId,
      approverUserId: userId,
      approverName: user.realName,
      action: "reject",
      comment,
      approvedAt: new Date().toISOString(),
    };

    process.rejections.push(rejection);
    process.status = "rejected";
    process.completedAt = new Date().toISOString();

    // 更新文档状态
    const documentVersion = documentVersions.value.find(
      (v) => v.id === process.documentVersionId
    );
    if (documentVersion) {
      documentVersion.status = "rejected";
      logActivity(
        documentVersion.documentId,
        process.documentVersionId,
        "reject",
        `${user.realName} 拒绝了文档: ${comment}`
      );
    }

    saveToStorage();
  };

  // 电子签名
  const signDocument = async (
    documentVersionId: string,
    signatureData: string,
    signatureType: ElectronicSignature["signatureType"]
  ): Promise<ElectronicSignature> => {
    const userStore = useUserStore();
    const currentUser = userStore.currentUser;

    if (!currentUser) {
      throw new Error("用户未登录");
    }

    const signature: ElectronicSignature = {
      id: Date.now().toString(),
      signerId: currentUser.id,
      signerName: currentUser.realName,
      signerEmail: currentUser.email,
      signatureData,
      signatureType,
      signedAt: new Date().toISOString(),
      ipAddress: "127.0.0.1", // 模拟IP地址
      userAgent: navigator.userAgent,
      isValid: true,
    };

    signatures.value.push(signature);

    const documentVersion = documentVersions.value.find(
      (v) => v.id === documentVersionId
    );
    if (documentVersion) {
      logActivity(
        documentVersion.documentId,
        documentVersionId,
        "sign",
        `${currentUser.realName} 对文档进行了电子签名`
      );
    }

    saveToStorage();
    return signature;
  };

  // 版本恢复
  const restoreVersion = async (
    documentVersionId: string
  ): Promise<DocumentVersion> => {
    const version = documentVersions.value.find(
      (v) => v.id === documentVersionId
    );

    if (!version) {
      throw new Error("版本不存在");
    }

    // 将当前最新版本标记为非最新
    const currentLatest = documentVersions.value.find(
      (v) => v.documentId === version.documentId && v.isLatest
    );
    if (currentLatest) {
      currentLatest.isLatest = false;
    }

    // 创建恢复版本
    const restoredVersion: DocumentVersion = {
      ...version,
      id: Date.now().toString(),
      version: generateNextVersion(version.documentId),
      uploadedAt: new Date().toISOString(),
      uploadedBy: useUserStore().currentUser?.id || 0,
      uploadedByName: useUserStore().currentUser?.realName || "",
      status: "draft",
      isLatest: true,
      parentVersionId: version.id,
      changeLog: `恢复自版本 ${version.version}`,
    };

    documentVersions.value.push(restoredVersion);
    updateVersionHistory(version.documentId, restoredVersion);

    logActivity(
      version.documentId,
      restoredVersion.id,
      "restore",
      `恢复文档版本 ${version.version}`
    );

    saveToStorage();
    return restoredVersion;
  };

  // 删除版本
  const deleteVersion = async (documentVersionId: string): Promise<void> => {
    const index = documentVersions.value.findIndex(
      (v) => v.id === documentVersionId
    );

    if (index === -1) {
      throw new Error("版本不存在");
    }

    const version = documentVersions.value[index];

    // 如果是最新版本，需要将前一个版本标记为最新
    if (version.isLatest) {
      const previousVersion = documentVersions.value
        .filter(
          (v) => v.documentId === version.documentId && v.id !== version.id
        )
        .sort(
          (a, b) =>
            new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
        )[0];

      if (previousVersion) {
        previousVersion.isLatest = true;
      }
    }

    documentVersions.value.splice(index, 1);

    logActivity(
      version.documentId,
      documentVersionId,
      "delete",
      `删除文档版本 ${version.version}`
    );

    saveToStorage();
  };

  // 搜索文档
  const searchDocuments = (
    params: DocumentSearchParams
  ): DocumentSearchResult => {
    let filtered = documentVersions.value;

    // 应用筛选条件
    if (params.query) {
      const query = params.query.toLowerCase();
      filtered = filtered.filter(
        (doc) =>
          doc.fileName.toLowerCase().includes(query) ||
          doc.description?.toLowerCase().includes(query)
      );
    }

    if (params.documentId) {
      filtered = filtered.filter((doc) => doc.documentId === params.documentId);
    }

    if (params.fileType) {
      filtered = filtered.filter((doc) => doc.fileType === params.fileType);
    }

    if (params.status) {
      filtered = filtered.filter((doc) => doc.status === params.status);
    }

    if (params.uploadedBy) {
      filtered = filtered.filter((doc) => doc.uploadedBy === params.uploadedBy);
    }

    if (params.dateFrom) {
      filtered = filtered.filter((doc) => doc.uploadedAt >= params.dateFrom!);
    }

    if (params.dateTo) {
      filtered = filtered.filter((doc) => doc.uploadedAt <= params.dateTo!);
    }

    // 计算分面统计
    const facets = {
      fileTypes: Array.from(new Set(filtered.map((d) => d.fileType))).map(
        (type) => ({
          type,
          count: filtered.filter((d) => d.fileType === type).length,
        })
      ),
      statuses: Array.from(new Set(filtered.map((d) => d.status))).map(
        (status) => ({
          status,
          count: filtered.filter((d) => d.status === status).length,
        })
      ),
      uploaders: Array.from(new Set(filtered.map((d) => d.uploadedBy))).map(
        (userId) => {
          const user = useUserStore().currentUser;
          return {
            userId,
            name: user?.realName || "未知",
            count: filtered.filter((d) => d.uploadedBy === userId).length,
          };
        }
      ),
    };

    return {
      documents: filtered,
      total: filtered.length,
      page: 1,
      pageSize: filtered.length,
      facets,
    };
  };

  // 工具方法
  const updateVersionHistory = (
    documentId: string,
    version: DocumentVersion
  ) => {
    let history = versionHistories.value.find(
      (h) => h.documentId === documentId
    );

    if (!history) {
      history = {
        id: Date.now().toString(),
        documentId,
        versions: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      versionHistories.value.push(history);
    }

    history.versions.push(version);
    history.updatedAt = new Date().toISOString();
  };

  const generateNextVersion = (documentId: string): string => {
    const versions = documentVersions.value
      .filter((v) => v.documentId === documentId)
      .map((v) => v.version)
      .sort((a, b) => {
        const aParts = a.split(".").map(Number);
        const bParts = b.split(".").map(Number);
        if (aParts[0] !== bParts[0]) return bParts[0] - aParts[0];
        return bParts[1] - aParts[1];
      });

    if (versions.length === 0) return "1.0";

    const latest = versions[0];
    const parts = latest.split(".").map(Number);
    return `${parts[0]}.${parts[1] + 1}`;
  };

  const calculateChecksum = async (file: File): Promise<string> => {
    // 简化版校验和计算
    const text = await file.text();
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(16);
  };

  const getFileTypeFromName = (fileName: string): string => {
    const ext = fileName.split(".").pop()?.toLowerCase();
    const typeMap: Record<string, string> = {
      pdf: "application/pdf",
      doc: "application/msword",
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      txt: "text/plain",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      png: "image/png",
      gif: "image/gif",
    };
    return typeMap[ext || ""] || "application/octet-stream";
  };

  const logActivity = (
    documentId: string,
    documentVersionId: string | undefined,
    action: DocumentAction,
    description: string
  ) => {
    const userStore = useUserStore();
    const currentUser = userStore.currentUser;

    if (!currentUser) return;

    const log: DocumentActivityLog = {
      id: Date.now().toString(),
      documentId,
      documentVersionId,
      userId: currentUser.id,
      userName: currentUser.realName,
      action,
      description,
      timestamp: new Date().toISOString(),
    };

    activityLogs.value.unshift(log);

    // 限制日志数量
    if (activityLogs.value.length > 1000) {
      activityLogs.value = activityLogs.value.slice(0, 1000);
    }

    // 同时记录到全局活动
    const activityStore = useActivityStore();
    activityStore.addActivity({
      type: "patent_add", // 临时使用现有类型
      title: "文档活动",
      description,
      userId: currentUser.id,
      userName: currentUser.realName,
      targetId: parseInt(documentVersionId || documentId),
      targetName: description,
      timestamp: new Date().toISOString(),
      status: "success",
      statusText: "完成",
    });
  };

  const saveToStorage = () => {
    try {
      localStorage.setItem(
        "documentVersions",
        JSON.stringify(documentVersions.value)
      );
      localStorage.setItem(
        "versionHistories",
        JSON.stringify(versionHistories.value)
      );
      localStorage.setItem(
        "approvalWorkflows",
        JSON.stringify(approvalWorkflows.value)
      );
      localStorage.setItem(
        "approvalProcesses",
        JSON.stringify(approvalProcesses.value)
      );
      localStorage.setItem(
        "documentTemplates",
        JSON.stringify(documentTemplates.value)
      );
      localStorage.setItem(
        "documentAccess",
        JSON.stringify(documentAccess.value)
      );
      localStorage.setItem("activityLogs", JSON.stringify(activityLogs.value));
      localStorage.setItem("signatures", JSON.stringify(signatures.value));
      localStorage.setItem(
        "approvalDelegations",
        JSON.stringify(approvalDelegations.value)
      );
      localStorage.setItem(
        "approvalTimeouts",
        JSON.stringify(approvalTimeouts.value)
      );
      localStorage.setItem(
        "approvalEscalations",
        JSON.stringify(approvalEscalations.value)
      );
      localStorage.setItem(
        "workflowTemplates",
        JSON.stringify(workflowTemplates.value)
      );
    } catch (error) {
      console.error("保存文档数据失败:", error);
    }
  };

  const loadFromStorage = () => {
    try {
      const versions = localStorage.getItem("documentVersions");
      const histories = localStorage.getItem("versionHistories");
      const workflows = localStorage.getItem("approvalWorkflows");
      const processes = localStorage.getItem("approvalProcesses");
      const templates = localStorage.getItem("documentTemplates");
      const access = localStorage.getItem("documentAccess");
      const logs = localStorage.getItem("activityLogs");
      const sigs = localStorage.getItem("signatures");
      const delegations = localStorage.getItem("approvalDelegations");
      const timeouts = localStorage.getItem("approvalTimeouts");
      const escalations = localStorage.getItem("approvalEscalations");
      const workflowTmps = localStorage.getItem("workflowTemplates");

      if (versions) documentVersions.value = JSON.parse(versions);
      if (histories) versionHistories.value = JSON.parse(histories);
      if (workflows) approvalWorkflows.value = JSON.parse(workflows);
      if (processes) approvalProcesses.value = JSON.parse(processes);
      if (templates) documentTemplates.value = JSON.parse(templates);
      if (access) documentAccess.value = JSON.parse(access);
      if (logs) activityLogs.value = JSON.parse(logs);
      if (sigs) signatures.value = JSON.parse(sigs);
      if (delegations) approvalDelegations.value = JSON.parse(delegations);
      if (timeouts) approvalTimeouts.value = JSON.parse(timeouts);
      if (escalations) approvalEscalations.value = JSON.parse(escalations);
      if (workflowTmps) workflowTemplates.value = JSON.parse(workflowTmps);
    } catch (error) {
      console.error("加载文档数据失败:", error);
    }
  };

  // 初始化默认审批流程
  const initializeDefaultWorkflows = () => {
    if (approvalWorkflows.value.length === 0) {
      const defaultWorkflow: ApprovalWorkflow = {
        id: "default-workflow",
        name: "标准文档审批流程",
        description: "适用于大多数文档的标准审批流程",
        type: "sequential",
        priority: "medium",
        category: "文档",
        version: "1.0",
        steps: [
          {
            id: "step-1",
            stepNumber: 1,
            name: "初审",
            description: "文档初步审查",
            approverRoles: ["reviewer"],
            isRequired: true,
            allowParallel: false,
            timeLimit: 24,
            minApprovals: 1,
            autoApprove: false,
            delegationAllowed: true,
          },
          {
            id: "step-2",
            stepNumber: 2,
            name: "终审",
            description: "文档最终审批",
            approverRoles: ["admin"],
            isRequired: true,
            allowParallel: false,
            timeLimit: 48,
            minApprovals: 1,
            autoApprove: false,
            delegationAllowed: true,
          },
        ],
        isActive: true,
        createdBy: 1,
        createdAt: new Date().toISOString(),
        tags: ["默认", "标准"],
      };

      approvalWorkflows.value.push(defaultWorkflow);
      saveToStorage();
    }
  };

  // 初始化示例审批流程和超时数据
  const initializeSampleData = () => {
    // 如果没有审批流程，创建一个示例流程
    if (approvalProcesses.value.length === 0) {
      const sampleProcess: DocumentApprovalProcess = {
        id: "sample-process-1",
        documentVersionId: "sample-doc-1",
        workflowId: "default-workflow",
        currentStep: 1,
        status: "pending",
        startedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3天前
        approvals: [],
        rejections: [],
        comments: [],
        priority: "medium",
        estimatedCompletionTime: new Date(
          Date.now() - 1 * 24 * 60 * 60 * 1000
        ).toISOString(), // 1天前
        delegations: [],
        timeouts: [],
        escalations: [],
        lastActivityAt: new Date(
          Date.now() - 2 * 24 * 60 * 60 * 1000
        ).toISOString(),
      };

      approvalProcesses.value.push(sampleProcess);
      saveToStorage();
    }

    // 如果没有超时记录，创建一些示例超时记录
    if (approvalTimeouts.value.length === 0) {
      const sampleTimeouts: ApprovalTimeout[] = [
        {
          id: "timeout-1",
          processId: "sample-process-1",
          stepId: "step-1",
          expectedCompletionTime: new Date(
            Date.now() - 1 * 24 * 60 * 60 * 1000
          ).toISOString(),
          actualTimeoutTime: new Date(
            Date.now() - 0.5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          action: "notify",
          notificationsSent: 1,
          isResolved: false,
        },
        {
          id: "timeout-2",
          processId: "sample-process-1",
          stepId: "step-2",
          expectedCompletionTime: new Date(
            Date.now() - 2 * 24 * 60 * 60 * 1000
          ).toISOString(),
          actualTimeoutTime: new Date(
            Date.now() - 1.5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          action: "escalate",
          notificationsSent: 2,
          isResolved: false,
        },
        {
          id: "timeout-3",
          processId: "sample-process-1",
          stepId: "step-1",
          expectedCompletionTime: new Date(
            Date.now() - 3 * 24 * 60 * 60 * 1000
          ).toISOString(),
          actualTimeoutTime: new Date(
            Date.now() - 2.5 * 24 * 60 * 60 * 1000
          ).toISOString(),
          action: "auto_approve",
          notificationsSent: 0,
          isResolved: true,
        },
      ];

      approvalTimeouts.value.push(...sampleTimeouts);
      saveToStorage();
    }
  };

  // 审批委托管理
  const createDelegation = (
    delegation: Omit<ApprovalDelegation, "id" | "createdAt">
  ) => {
    const newDelegation: ApprovalDelegation = {
      ...delegation,
      id: `delegation-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    approvalDelegations.value.push(newDelegation);
    saveToStorage();
    return newDelegation;
  };

  const updateDelegation = (
    id: string,
    updates: Partial<ApprovalDelegation>
  ) => {
    const index = approvalDelegations.value.findIndex((d) => d.id === id);
    if (index !== -1) {
      approvalDelegations.value[index] = {
        ...approvalDelegations.value[index],
        ...updates,
      };
      saveToStorage();
    }
  };

  const deleteDelegation = (id: string) => {
    const index = approvalDelegations.value.findIndex((d) => d.id === id);
    if (index !== -1) {
      approvalDelegations.value.splice(index, 1);
      saveToStorage();
    }
  };

  const getActiveDelegations = (userId: number, workflowId?: string) => {
    const now = new Date();
    return approvalDelegations.value.filter(
      (d) =>
        d.delegatorId === userId &&
        d.isActive &&
        new Date(d.startDate) <= now &&
        new Date(d.endDate) >= now &&
        (!workflowId || !d.workflowId || d.workflowId === workflowId)
    );
  };

  // 审批超时管理
  const createTimeout = (timeout: Omit<ApprovalTimeout, "id">) => {
    const newTimeout: ApprovalTimeout = {
      ...timeout,
      id: `timeout-${Date.now()}`,
    };
    approvalTimeouts.value.push(newTimeout);
    saveToStorage();
    return newTimeout;
  };

  const resolveTimeout = (id: string) => {
    const index = approvalTimeouts.value.findIndex((t) => t.id === id);
    if (index !== -1) {
      approvalTimeouts.value[index].isResolved = true;
      saveToStorage();
    }
  };

  const checkOverdueProcesses = () => {
    const now = new Date();
    const overdueProcesses: DocumentApprovalProcess[] = [];

    approvalProcesses.value.forEach((process) => {
      if (process.status === "pending" && process.estimatedCompletionTime) {
        const expectedTime = new Date(process.estimatedCompletionTime);
        if (now > expectedTime) {
          overdueProcesses.push(process);

          // 创建超时记录
          const workflow = approvalWorkflows.value.find(
            (w) => w.id === process.workflowId
          );
          const currentStep = workflow?.steps.find(
            (s) => s.stepNumber === process.currentStep
          );

          if (
            currentStep &&
            !approvalTimeouts.value.some(
              (t) =>
                t.processId === process.id &&
                t.stepId === currentStep.id &&
                !t.isResolved
            )
          ) {
            createTimeout({
              processId: process.id,
              stepId: currentStep.id,
              expectedCompletionTime: process.estimatedCompletionTime,
              actualTimeoutTime: now.toISOString(),
              action: currentStep.autoApprove ? "auto_approve" : "notify",
              notificationsSent: 0,
              isResolved: false,
            });
          }
        }
      }
    });

    return overdueProcesses;
  };

  // 审批升级管理
  const escalateApproval = (
    processId: string,
    fromUserId: number,
    toUserId: number,
    reason: string
  ) => {
    const escalation: ApprovalEscalation = {
      id: `escalation-${Date.now()}`,
      processId,
      fromUserId,
      toUserId,
      reason,
      escalatedAt: new Date().toISOString(),
      isResolved: false,
    };

    approvalEscalations.value.push(escalation);

    // 更新审批流程
    const processIndex = approvalProcesses.value.findIndex(
      (p) => p.id === processId
    );
    if (processIndex !== -1) {
      approvalProcesses.value[processIndex].escalations.push(escalation);
      approvalProcesses.value[processIndex].lastActivityAt =
        new Date().toISOString();
    }

    saveToStorage();
    return escalation;
  };

  // 工作流模板管理
  const createWorkflowTemplate = (
    template: Omit<WorkflowTemplate, "id" | "usage" | "createdAt" | "updatedAt">
  ) => {
    const newTemplate: WorkflowTemplate = {
      ...template,
      id: `template-${Date.now()}`,
      usage: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    workflowTemplates.value.push(newTemplate);
    saveToStorage();
    return newTemplate;
  };

  const createWorkflowFromTemplate = (
    templateId: string,
    customData: Partial<ApprovalWorkflow>
  ) => {
    const template = workflowTemplates.value.find((t) => t.id === templateId);
    if (!template) throw new Error("工作流模板不存在");

    const newWorkflow: ApprovalWorkflow = {
      id: `workflow-${Date.now()}`,
      name: customData.name || template.name,
      description: customData.description || template.description,
      type: "sequential",
      priority: "medium",
      category: template.category,
      version: "1.0",
      steps: template.steps.map((step, index) => ({
        ...step,
        id: `step-${Date.now()}-${index}`,
        stepNumber: index + 1,
      })),
      isActive: true,
      createdBy: customData.createdBy || 1,
      createdAt: new Date().toISOString(),
      tags: customData.tags,
    };

    approvalWorkflows.value.push(newWorkflow);

    // 增加模板使用次数
    const templateIndex = workflowTemplates.value.findIndex(
      (t) => t.id === templateId
    );
    if (templateIndex !== -1) {
      workflowTemplates.value[templateIndex].usage++;
      workflowTemplates.value[templateIndex].updatedAt =
        new Date().toISOString();
    }

    saveToStorage();
    return newWorkflow;
  };

  // 审批统计
  const getApprovalStatistics = (): ApprovalStatistics => {
    const now = new Date();

    const totalProcesses = approvalProcesses.value.length;
    const pendingProcesses = approvalProcesses.value.filter(
      (p) => p.status === "pending"
    ).length;
    const approvedProcesses = approvalProcesses.value.filter(
      (p) => p.status === "approved"
    ).length;
    const rejectedProcesses = approvalProcesses.value.filter(
      (p) => p.status === "rejected"
    ).length;

    const overdueProcesses = approvalProcesses.value.filter(
      (p) =>
        p.status === "pending" &&
        p.estimatedCompletionTime &&
        now.getTime() - new Date(p.estimatedCompletionTime).getTime() > 0
    ).length;

    const completedProcesses = approvalProcesses.value.filter(
      (p) => p.status !== "pending" && p.completedAt
    );

    const averageProcessingTime =
      completedProcesses.length > 0
        ? completedProcesses.reduce((total, process) => {
            const startTime = new Date(process.startedAt).getTime();
            const endTime = new Date(process.completedAt!).getTime();
            return total + (endTime - startTime) / (1000 * 60 * 60); // 转换为小时
          }, 0) / completedProcesses.length
        : 0;

    // 按工作流统计
    const byWorkflow: Record<string, any> = {};
    approvalWorkflows.value.forEach((workflow) => {
      const workflowProcesses = approvalProcesses.value.filter(
        (p) => p.workflowId === workflow.id
      );
      const workflowCompleted = workflowProcesses.filter(
        (p) => p.status !== "pending" && p.completedAt
      );

      byWorkflow[workflow.id] = {
        total: workflowProcesses.length,
        approved: workflowProcesses.filter((p) => p.status === "approved")
          .length,
        rejected: workflowProcesses.filter((p) => p.status === "rejected")
          .length,
        pending: workflowProcesses.filter((p) => p.status === "pending").length,
        averageTime:
          workflowCompleted.length > 0
            ? workflowCompleted.reduce((total, process) => {
                const startTime = new Date(process.startedAt).getTime();
                const endTime = new Date(process.completedAt!).getTime();
                return total + (endTime - startTime) / (1000 * 60 * 60);
              }, 0) / workflowCompleted.length
            : 0,
      };
    });

    // 按用户统计（这里简化处理，实际应该根据用户参与的审批来统计）
    const byUser: Record<number, any> = {};

    return {
      totalProcesses,
      pendingProcesses,
      approvedProcesses,
      rejectedProcesses,
      overdueProcesses,
      averageProcessingTime,
      byWorkflow,
      byUser,
    };
  };

  // 工作流API方法
  const fetchWorkflows = async (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const { workflowAPI } = await import("@/services/workflowAPI");
      const response = await workflowAPI.getWorkflows(params);

      if (response.success && response.workflows) {
        approvalWorkflows.value = response.workflows;
        return response;
      } else {
        throw new Error(response.message || "获取工作流列表失败");
      }
    } catch (error) {
      console.error("获取工作流列表失败:", error);
      throw error;
    }
  };

  const updateWorkflow = async (
    id: number,
    updates: Partial<ApprovalWorkflow>
  ) => {
    try {
      const { workflowAPI } = await import("@/services/workflowAPI");
      const response = await workflowAPI.updateWorkflow(id, updates);

      if (response.success && response.workflow) {
        // 确保更新后的工作流包含所有必要字段
        const updatedWorkflow: ApprovalWorkflow = {
          ...response.workflow,
          // 确保默认值存在
          type: response.workflow.type || "sequential",
          priority: response.workflow.priority || "medium",
          category: response.workflow.category || "文档",
          version: response.workflow.version || "1.0",
          isActive:
            response.workflow.isActive !== undefined
              ? response.workflow.isActive
              : true,
          tags: response.workflow.tags || [],
        };

        // 更新本地状态 - 修复ID类型匹配问题
        const index = approvalWorkflows.value.findIndex(
          (w) => parseInt(w.id) === id
        );
        if (index !== -1) {
          approvalWorkflows.value[index] = updatedWorkflow;
          console.log(`✅ 本地状态更新成功: 工作流 ID: ${id}`, updatedWorkflow);
        } else {
          console.log(`⚠️ 未在本地状态中找到工作流 ID: ${id}`);
        }
        return updatedWorkflow;
      } else {
        throw new Error(response.message || "更新工作流失败");
      }
    } catch (error) {
      console.error("更新工作流失败:", error);
      throw error;
    }
  };

  const deleteWorkflow = async (id: number) => {
    try {
      const { workflowAPI } = await import("@/services/workflowAPI");
      const response = await workflowAPI.deleteWorkflow(id);

      if (response.success) {
        // 从本地状态中移除 - 修复ID类型匹配问题
        const index = approvalWorkflows.value.findIndex(
          (w) => parseInt(w.id) === id
        );
        if (index !== -1) {
          approvalWorkflows.value.splice(index, 1);
          console.log(`✅ 从本地状态中移除工作流 ID: ${id}`);
        } else {
          console.log(`⚠️ 未在本地状态中找到工作流 ID: ${id}`);
        }
        return true;
      } else {
        throw new Error(response.message || "删除工作流失败");
      }
    } catch (error) {
      console.error("删除工作流失败:", error);
      throw error;
    }
  };

  const toggleWorkflowStatus = async (
    id: number,
    status: "active" | "inactive"
  ) => {
    try {
      const { workflowAPI } = await import("@/services/workflowAPI");
      const response = await workflowAPI.toggleWorkflowStatus(id, status);

      if (response.success && response.workflow) {
        // 确保更新后的工作流包含所有必要字段
        const updatedWorkflow: ApprovalWorkflow = {
          ...response.workflow,
          // 确保默认值存在
          type: response.workflow.type || "sequential",
          priority: response.workflow.priority || "medium",
          category: response.workflow.category || "文档",
          version: response.workflow.version || "1.0",
          isActive:
            response.workflow.isActive !== undefined
              ? response.workflow.isActive
              : true,
          tags: response.workflow.tags || [],
        };

        // 更新本地状态 - 修复ID类型匹配问题
        const index = approvalWorkflows.value.findIndex(
          (w) => parseInt(w.id) === id
        );
        if (index !== -1) {
          approvalWorkflows.value[index] = updatedWorkflow;
          console.log(
            `✅ 本地状态更新成功: 工作流状态切换 ID: ${id}`,
            updatedWorkflow
          );
        } else {
          console.log(`⚠️ 未在本地状态中找到工作流 ID: ${id}`);
        }
        return updatedWorkflow;
      } else {
        throw new Error(response.message || "切换工作流状态失败");
      }
    } catch (error) {
      console.error("切换工作流状态失败:", error);
      throw error;
    }
  };

  const fetchWorkflowTemplates = async (params?: {
    category?: string;
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    try {
      const { workflowTemplateAPI } = await import("@/services/workflowAPI");
      const response = await workflowTemplateAPI.getTemplates(params);

      if (response.success && response.templates) {
        workflowTemplates.value = response.templates;
        return response;
      } else {
        throw new Error(response.message || "获取模板列表失败");
      }
    } catch (error) {
      console.error("获取模板列表失败:", error);
      throw error;
    }
  };

  const createWorkflowTemplateAPI = async (
    template: Omit<WorkflowTemplate, "id" | "createdAt" | "updatedAt">
  ) => {
    try {
      const { workflowTemplateAPI } = await import("@/services/workflowAPI");
      const response = await workflowTemplateAPI.createTemplate(template);

      if (response.success && response.template) {
        // 确保新模板包含所有必要字段
        const newTemplate: WorkflowTemplate = {
          ...response.template,
          // 确保默认值存在
          category: response.template.category || "文档",
          // version: response.template.version || "1.0",
          // isActive:
          //   response.template.isActive !== undefined
          //     ? response.template.isActive
          //     : true,
          // tags: response.template.tags || [],
        };

        // 更新本地状态
        workflowTemplates.value.unshift(newTemplate); // 使用unshift确保新模板显示在列表顶部
        console.log("✅ 新工作流模板已添加到本地状态:", newTemplate);
        return newTemplate;
      } else {
        throw new Error(response.message || "创建模板失败");
      }
    } catch (error) {
      console.error("创建模板失败:", error);
      throw error;
    }
  };

  const updateWorkflowTemplate = async (
    id: number,
    updates: Partial<WorkflowTemplate>
  ) => {
    try {
      const { workflowTemplateAPI } = await import("@/services/workflowAPI");
      const response = await workflowTemplateAPI.updateTemplate(id, updates);

      if (response.success && response.template) {
        // 确保更新后的模板包含所有必要字段
        const updatedTemplate: WorkflowTemplate = {
          ...response.template,
          // 确保默认值存在
          category: response.template.category || "文档",
          // version: response.template.version || "1.0",
          // isActive:
          //   response.template.isActive !== undefined
          //     ? response.template.isActive
          //     : true,
          // tags: response.template.tags || [],
        };

        // 更新本地状态
        const index = workflowTemplates.value.findIndex(
          (t) => t.id === id.toString()
        );
        if (index !== -1) {
          workflowTemplates.value[index] = updatedTemplate;
          console.log(
            `✅ 本地状态更新成功: 工作流模板 ID: ${id}`,
            updatedTemplate
          );
        } else {
          console.log(`⚠️ 未在本地状态中找到工作流模板 ID: ${id}`);
        }
        return updatedTemplate;
      } else {
        throw new Error(response.message || "更新模板失败");
      }
    } catch (error) {
      console.error("更新模板失败:", error);
      throw error;
    }
  };

  const deleteWorkflowTemplate = async (id: number) => {
    try {
      const { workflowTemplateAPI } = await import("@/services/workflowAPI");
      const response = await workflowTemplateAPI.deleteTemplate(id);

      if (response.success) {
        // 从本地状态中移除
        const index = workflowTemplates.value.findIndex(
          (t) => t.id === id.toString()
        );
        if (index !== -1) {
          workflowTemplates.value.splice(index, 1);
        }
        return true;
      } else {
        throw new Error(response.message || "删除模板失败");
      }
    } catch (error) {
      console.error("删除模板失败:", error);
      throw error;
    }
  };

  // 初始化
  loadFromStorage();
  initializeDefaultWorkflows();
  initializeSampleData();

  return {
    // 状态
    documentVersions,
    versionHistories,
    approvalWorkflows,
    approvalProcesses,
    documentTemplates,
    documentAccess,
    activityLogs,
    signatures,
    approvalDelegations,
    approvalTimeouts,
    approvalEscalations,
    workflowTemplates,

    // 计算属性
    documentStats,
    latestVersions,
    pendingApprovals,

    // 原有方法
    uploadDocumentVersion,
    compareVersions,
    createApprovalWorkflow,
    startApprovalProcess,
    approveDocument,
    rejectDocument,
    signDocument,
    restoreVersion,
    deleteVersion,
    searchDocuments,
    loadFromStorage,
    saveToStorage,

    // 新增方法
    createDelegation,
    updateDelegation,
    deleteDelegation,
    getActiveDelegations,
    createTimeout,
    resolveTimeout,
    checkOverdueProcesses,
    escalateApproval,
    createWorkflowTemplate,
    createWorkflowFromTemplate,
    getApprovalStatistics,
    initializeSampleData,

    // 工作流API方法
    fetchWorkflows,
    updateWorkflow,
    deleteWorkflow,
    toggleWorkflowStatus,
    fetchWorkflowTemplates,
    createWorkflowTemplateAPI,
    updateWorkflowTemplate,
    deleteWorkflowTemplate,
  };
});
