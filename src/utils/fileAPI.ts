import axios from "axios";

// 创建axios实例
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 请求拦截器 - 添加认证token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 文件信息接口
export interface FileInfo {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  lastModified: Date;
  permissions: {
    canRead: boolean;
    canWrite: boolean;
    canDelete: boolean;
  };
}

// 文件上传响应接口
export interface UploadResponse {
  success: boolean;
  fileName: string;
  totalChunks: number;
  fileSize: number;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: Date;
  message: string;
}

// 分片上传响应接口
export interface ChunkUploadResponse {
  success: boolean;
  chunkIndex: number;
  totalChunks: number;
  fileName: string;
  fileSize: number;
  chunkSize: number;
  message: string;
}

// 文件列表响应接口
export interface FileListResponse {
  files: FileInfo[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// 文件搜索响应接口
export interface FileSearchResponse {
  success: boolean;
  query: string;
  results: FileInfo[];
  total: number;
}

// 文件分享响应接口
export interface FileShareResponse {
  success: boolean;
  shareResult: any;
  message: string;
}

// 文件管理API
export const fileAPI = {
  // 获取文件列表
  getFileList: async (
    params: {
      page?: number;
      limit?: number;
      type?: string;
      search?: string;
    } = {}
  ): Promise<FileListResponse> => {
    const response = await api.get("/files", { params });
    return response.data;
  },

  // 获取文件信息
  getFileInfo: async (fileId: string): Promise<FileInfo> => {
    const response = await api.get(`/files/${fileId}`);
    return response.data;
  },

  // 上传文件分片
  uploadChunk: async (data: {
    file: Blob;
    chunkIndex: number;
    totalChunks: number;
    fileName: string;
    fileSize: number;
    chunkSize: number;
  }): Promise<ChunkUploadResponse> => {
    const formData = new FormData();
    formData.append("file", data.file);
    formData.append("chunkIndex", data.chunkIndex.toString());
    formData.append("totalChunks", data.totalChunks.toString());
    formData.append("fileName", data.fileName);
    formData.append("fileSize", data.fileSize.toString());
    formData.append("chunkSize", data.chunkSize.toString());

    const response = await api.post("/upload/chunk", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // 合并文件分片
  mergeChunks: async (data: {
    fileName: string;
    totalChunks: number;
    fileSize: number;
  }): Promise<UploadResponse> => {
    const response = await api.post("/upload/merge", data);
    return response.data;
  },

  // 下载文件
  downloadFile: async (fileId: string): Promise<Blob> => {
    const response = await api.get(`/download/${fileId}`, {
      responseType: "blob",
    });
    return response.data;
  },

  // 获取文件预览信息
  getFilePreview: async (
    fileId: string
  ): Promise<{
    id: string;
    fileName: string;
    fileSize: number;
    fileType: string;
    fileUrl: string;
    canPreview: boolean;
    previewUrl: string;
  }> => {
    const response = await api.get(`/preview/${fileId}`);
    return response.data;
  },

  // 删除文件
  deleteFile: async (
    fileId: string
  ): Promise<{ success: boolean; message: string }> => {
    const response = await api.delete(`/files/${fileId}`);
    return response.data;
  },

  // 分享文件
  shareFile: async (
    fileId: string,
    shareType: string,
    shareData?: any
  ): Promise<FileShareResponse> => {
    const response = await api.post(`/files/${fileId}/share`, {
      shareType,
      shareData,
    });
    return response.data;
  },

  // 搜索文件
  searchFiles: async (params: {
    q: string;
    type?: string;
    size?: string;
    date?: string;
  }): Promise<FileSearchResponse> => {
    const response = await api.get("/files/search", { params });
    return response.data;
  },

  // 获取文件下载链接
  getDownloadUrl: (fileId: string): string => {
    return `${api.defaults.baseURL}/download/${fileId}`;
  },

  // 获取文件预览链接
  getPreviewUrl: (fileId: string): string => {
    return `${api.defaults.baseURL}/preview/${fileId}`;
  },
};

// 文件工具函数
export const fileUtils = {
  // 格式化文件大小
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  },

  // 获取文件扩展名
  getFileExtension: (fileName: string): string => {
    return fileName.split(".").pop()?.toLowerCase() || "";
  },

  // 获取文件类型图标
  getFileTypeIcon: (fileType: string): string => {
    if (fileType.startsWith("image/")) return "Picture";
    if (fileType === "application/pdf") return "Document";
    if (fileType.startsWith("video/")) return "VideoPlay";
    if (fileType.startsWith("audio/")) return "Headphone";
    if (fileType.startsWith("text/")) return "Document";
    if (
      fileType.includes("word") ||
      fileType.includes("excel") ||
      fileType.includes("powerpoint")
    ) {
      return "Files";
    }
    return "Document";
  },

  // 判断是否为图片文件
  isImageFile: (fileType: string): boolean => {
    return fileType.startsWith("image/");
  },

  // 判断是否为PDF文件
  isPDFFile: (fileType: string): boolean => {
    return fileType === "application/pdf";
  },

  // 判断是否为视频文件
  isVideoFile: (fileType: string): boolean => {
    return fileType.startsWith("video/");
  },

  // 判断是否为音频文件
  isAudioFile: (fileType: string): boolean => {
    return fileType.startsWith("audio/");
  },

  // 判断是否为文本文件
  isTextFile: (fileType: string): boolean => {
    return (
      fileType.startsWith("text/") ||
      fileType === "application/json" ||
      fileType === "application/xml" ||
      fileType === "application/javascript"
    );
  },

  // 判断是否为Office文档
  isOfficeFile: (fileType: string): boolean => {
    return (
      fileType.includes("word") ||
      fileType.includes("excel") ||
      fileType.includes("powerpoint") ||
      fileType.includes("officedocument")
    );
  },

  // 判断文件是否可以预览
  canPreview: (fileType: string): boolean => {
    return (
      fileUtils.isImageFile(fileType) ||
      fileUtils.isPDFFile(fileType) ||
      fileUtils.isVideoFile(fileType) ||
      fileUtils.isAudioFile(fileType) ||
      fileUtils.isTextFile(fileType)
    );
  },

  // 验证文件类型
  validateFileType: (file: File, allowedTypes: string[]): boolean => {
    if (allowedTypes.includes("*/*")) return true;

    return allowedTypes.some((type) => {
      if (type.startsWith(".")) {
        // 扩展名匹配
        const extension = fileUtils.getFileExtension(file.name);
        return extension === type.substring(1);
      } else {
        // MIME类型匹配
        return file.type === type;
      }
    });
  },

  // 验证文件大小
  validateFileSize: (file: File, maxSize: number): boolean => {
    return file.size <= maxSize;
  },

  // 创建文件对象URL
  createObjectURL: (file: File): string => {
    return URL.createObjectURL(file);
  },

  // 释放文件对象URL
  revokeObjectURL: (url: string): void => {
    URL.revokeObjectURL(url);
  },

  // 下载文件
  downloadFile: (url: string, fileName: string): void => {
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  // 复制文件链接到剪贴板
  copyFileLink: async (url: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(url);
      return true;
    } catch (error) {
      console.error("复制文件链接失败:", error);
      return false;
    }
  },

  // 生成文件缩略图
  generateThumbnail: async (
    file: File,
    maxWidth: number = 200,
    maxHeight: number = 200
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (!fileUtils.isImageFile(file.type)) {
        reject(new Error("不是图片文件"));
        return;
      }

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        // 计算缩略图尺寸
        let { width, height } = img;
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 绘制缩略图
        ctx?.drawImage(img, 0, 0, width, height);

        // 转换为base64
        const thumbnail = canvas.toDataURL("image/jpeg", 0.8);
        resolve(thumbnail);
      };

      img.onerror = () => {
        reject(new Error("图片加载失败"));
      };

      img.src = fileUtils.createObjectURL(file);
    });
  },
};

// 文件上传配置
export const uploadConfig = {
  // 默认分片大小 (1MB)
  defaultChunkSize: 1024 * 1024,

  // 最大文件大小 (100MB)
  maxFileSize: 100 * 1024 * 1024,

  // 支持的文件类型
  supportedTypes: [
    "image/*",
    "application/pdf",
    "text/*",
    "application/json",
    "application/xml",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-powerpoint",
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  ],

  // 最大并发上传数
  maxConcurrent: 3,

  // 重试次数
  maxRetries: 3,

  // 重试延迟 (毫秒)
  retryDelay: 1000,
};

export default fileAPI;
