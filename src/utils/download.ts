// 文档下载工具函数

export interface DownloadOptions {
  filename?: string;
  contentType?: string;
  showProgress?: boolean;
}

// 获取文件扩展名
const getFileExtension = (type: string): string => {
  switch (type) {
    case "application":
      return ".doc";
    case "publication":
      return ".pdf";
    case "grant":
      return ".pdf";
    case "amendment":
      return ".doc";
    default:
      return ".txt";
  }
};


// 获取内容类型
const getContentType = (type: string): string => {
  switch (type) {
    case "application":
      return "application/msword";
    case "publication":
      return "application/pdf";
    case "grant":
      return "application/pdf";
    case "amendment":
      return "application/msword";
    default:
      return "text/plain;charset=utf-8";
  }
};

// 生成文件内容
export const generateFileContent = (document: any, type: string): string => {
  switch (type) {
    case "application":
      return generateApplicationDocument(document);
    case "publication":
      return generatePublicationDocument(document);
    case "grant":
      return generateGrantDocument(document);
    case "amendment":
      return generateAmendmentDocument(document);
    default:
      return generateGenericDocument(document);
  }
};

// 生成申请文件内容
const generateApplicationDocument = (document: any): string => {
  return `
专利申请文件

专利标题: ${document.title || "未知"}
专利号: ${document.patentNumber || "未知"}
申请日期: ${document.applicationDate || "未知"}

申请人: ${document.applicants?.join(", ") || "未知"}
发明人: ${document.inventors?.join(", ") || "未知"}

专利摘要:
${document.abstract || "暂无摘要"}

权利要求:
${
  document.claims
    ?.map((claim: string, index: number) => `${index + 1}. ${claim}`)
    .join("\n") || "暂无权利要求"
}

关键词: ${document.keywords?.join(", ") || "无"}

技术领域: ${document.technicalField || "未知"}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
文件类型: 申请文件
  `.trim();
};

// 生成公开文件内容
const generatePublicationDocument = (document: any): string => {
  return `
专利公开文件

专利标题: ${document.title || "未知"}
专利号: ${document.patentNumber || "未知"}
公开日期: ${document.publicationDate || "未知"}

公开号: ${document.publicationNumber || "未知"}

专利摘要:
${document.abstract || "暂无摘要"}

权利要求:
${
  document.claims
    ?.map((claim: string, index: number) => `${index + 1}. ${claim}`)
    .join("\n") || "暂无权利要求"
}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
文件类型: 公开文件
  `.trim();
};

// 生成授权文件内容
const generateGrantDocument = (document: any): string => {
  return `
专利授权文件

专利标题: ${document.title || "未知"}
专利号: ${document.patentNumber || "未知"}
授权日期: ${document.grantDate || "未知"}

授权号: ${document.grantNumber || "未知"}

专利摘要:
${document.abstract || "暂无摘要"}

权利要求:
${
  document.claims
    ?.map((claim: string, index: number) => `${index + 1}. ${claim}`)
    .join("\n") || "暂无权利要求"
}

保护期限: ${document.expirationDate || "未知"}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
文件类型: 授权文件
  `.trim();
};

// 生成修改文件内容
const generateAmendmentDocument = (document: any): string => {
  return `
专利修改文件

专利标题: ${document.title || "未知"}
专利号: ${document.patentNumber || "未知"}
修改日期: ${document.amendmentDate || "未知"}

修改内容:
${document.amendmentContent || "暂无修改内容"}

修改原因: ${document.amendmentReason || "未知"}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
文件类型: 修改文件
  `.trim();
};

// 生成通用文件内容
const generateGenericDocument = (document: any): string => {
  return `
专利文档

专利标题: ${document.title || "未知"}
专利号: ${document.patentNumber || "未知"}
文档类型: ${document.type || "未知"}

文档内容:
${document.content || "暂无内容"}

---
生成时间: ${new Date().toLocaleString("zh-CN")}
文件类型: 其他文件
  `.trim();
};

// 下载文件
export const downloadFile = (
  content: string,
  filename: string,
  options: DownloadOptions = {}
): void => {
  const { contentType = "text/plain;charset=utf-8", showProgress = true } =
    options;

  try {
    // 创建 Blob
    const blob = new Blob([content], { type: contentType });

    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // 添加到 DOM 并触发下载
    window.document.body.appendChild(link);
    link.click();

    // 延迟清理，确保下载开始
    setTimeout(() => {
      window.document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    if (showProgress) {
      console.log(`文件 ${filename} 下载成功`);
    }
  } catch (error) {
    console.error("下载文件失败:", error);
    throw new Error("下载文件失败");
  }
};

// 下载专利文档
export const downloadPatentDocument = async (
  document: any,
  patent: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    // 检查是否有真实文件URL
    if (document.fileUrl && document.fileUrl !== "/documents/") {
      // 下载真实文件
      await downloadRealFile(document, options);
    } else {
      // 生成模拟文件内容
      const content = generateFileContent(
        { ...patent, ...document },
        document.type
      );

      // 根据文档类型选择文件格式
      const fileExtension = getFileExtension(document.type);
      const timestamp = new Date().toISOString().split("T")[0];
      const filename =
        options.filename ||
        `${patent.patentNumber}_${document.name}_${timestamp}${fileExtension}`;

      // 设置内容类型
      const contentType = getContentType(document.type);

      // 下载文件
      downloadFile(content, filename, {
        ...options,
        contentType,
      });
    }
  } catch (error) {
    console.error("下载专利文档失败:", error);
    throw error;
  }
};

// 下载多个文档
export const downloadMultipleDocuments = async (
  documents: any[],
  patent: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    const timestamp = new Date().toISOString().split("T")[0];

    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];

      // 检查是否有真实文件URL
      if (document.fileUrl && document.fileUrl !== "/documents/") {
        // 下载真实文件
        await downloadRealFile(document, {
          ...options,
          filename: `${patent.patentNumber}_${document.name}_${timestamp}_${
            i + 1
          }`,
        });
      } else {
        // 生成模拟文件内容
        const content = generateFileContent(
          { ...patent, ...document },
          document.type
        );
        const fileExtension = getFileExtension(document.type);
        const filename = `${patent.patentNumber}_${
          document.name
        }_${timestamp}_${i + 1}${fileExtension}`;

        // 延迟下载，避免浏览器阻止多个下载
        await new Promise((resolve) => setTimeout(resolve, 100));
        downloadFile(content, filename, options);
      }
    }
  } catch (error) {
    console.error("批量下载文档失败:", error);
    throw error;
  }
};

// 生成 PDF 内容（模拟）
export const generatePDFContent = (document: any, patent: any): string => {
  // 这里可以集成真实的 PDF 生成库
  return `
PDF 文档内容
专利: ${patent.title}
文档: ${document.name}
类型: ${document.type}
  `.trim();
};

// 下载真实文件
export const downloadRealFile = async (
  documentObj: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    const filename = options.filename || documentObj.name;

    console.log("🔍 开始下载文件:", {
      name: documentObj.name,
      fileUrl: documentObj.fileUrl,
      fileSize: documentObj.fileSize,
      type: documentObj.type,
    });

    // 检查是否是blob URL（本地文件）
    if (documentObj.fileUrl && documentObj.fileUrl.startsWith("blob:")) {
      console.log("📁 检测到blob URL，开始下载本地文件...");

      // 直接使用blob URL下载
      const link = window.document.createElement("a");
      link.href = documentObj.fileUrl;
      link.download = filename;
      link.style.display = "none";

      // 添加到 DOM 并触发下载
      window.document.body.appendChild(link);
      link.click();

      // 延迟清理
      setTimeout(() => {
        window.document.body.removeChild(link);
      }, 100);

      if (options.showProgress) {
        console.log(`✅ 文件 ${filename} 下载成功 (blob URL)`);
      }
      return;
    }

    // 检查是否是data URL
    if (documentObj.fileUrl && documentObj.fileUrl.startsWith("data:")) {
      console.log("📁 检测到data URL，开始下载内联文件...");

      // 直接使用data URL下载
      const link = window.document.createElement("a");
      link.href = documentObj.fileUrl;
      link.download = filename;
      link.style.display = "none";

      // 添加到 DOM 并触发下载
      window.document.body.appendChild(link);
      link.click();

      // 延迟清理
      setTimeout(() => {
        window.document.body.removeChild(link);
      }, 100);

      if (options.showProgress) {
        console.log(`✅ 文件 ${filename} 下载成功 (data URL)`);
      }
      return;
    }

    // 如果是HTTP URL，使用fetch
    if (
      documentObj.fileUrl &&
      (documentObj.fileUrl.startsWith("http://") ||
        documentObj.fileUrl.startsWith("https://"))
    ) {
      console.log("🌐 检测到HTTP URL，开始下载远程文件...");

      try {
        const response = await fetch(documentObj.fileUrl, {
          method: "GET",
          mode: "cors",
          credentials: "same-origin",
          headers: {
            Accept: "*/*",
          },
        });

        if (!response.ok) {
          throw new Error(
            `HTTP error! status: ${response.status} - ${response.statusText}`
          );
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        // 添加到 DOM 并触发下载
        window.document.body.appendChild(link);
        link.click();

        // 延迟清理
        setTimeout(() => {
          window.document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        if (options.showProgress) {
          console.log(`✅ 文件 ${filename} 下载成功 (HTTP URL)`);
        }
        return;
      } catch (fetchError: any) {
        console.error("❌ HTTP下载失败:", fetchError);
        throw new Error(`网络下载失败: ${fetchError.message || "未知错误"}`);
      }
    }

    // 检查是否是相对路径
    if (documentObj.fileUrl && documentObj.fileUrl.startsWith("/")) {
      console.log("⚠️ 检测到相对路径，尝试构建完整URL...");

      // 构建完整的URL
      const baseUrl = window.location.origin;
      const fullUrl = `${baseUrl}${documentObj.fileUrl}`;

      console.log("🔗 构建的完整URL:", fullUrl);

      try {
        const response = await fetch(fullUrl, {
          method: "GET",
          credentials: "same-origin",
          headers: {
            Accept: "*/*",
          },
        });

        if (!response.ok) {
          throw new Error(
            `相对路径访问失败: ${response.status} - ${response.statusText}`
          );
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = window.document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";

        // 添加到 DOM 并触发下载
        window.document.body.appendChild(link);
        link.click();

        // 延迟清理
        setTimeout(() => {
          window.document.body.removeChild(link);
          URL.revokeObjectURL(url);
        }, 100);

        if (options.showProgress) {
          console.log(`✅ 文件 ${filename} 下载成功 (相对路径)`);
        }
        return;
      } catch (relativeError: any) {
        console.error("❌ 相对路径下载失败:", relativeError);
        throw new Error(
          `相对路径访问失败: ${relativeError.message || "未知错误"}`
        );
      }
    }

    // 如果没有有效的URL，抛出详细错误
    console.error("❌ 不支持的文件URL格式:", documentObj.fileUrl);
    throw new Error(
      `不支持的文件URL格式: ${documentObj.fileUrl || "undefined"}`
    );
  } catch (error: any) {
    console.error("❌ 下载真实文件失败:", error);

    // 提供更友好的错误信息
    if (error.message && error.message.includes("网络下载失败")) {
      throw new Error("网络连接失败，请检查互联网连接状况");
    } else if (error.message && error.message.includes("相对路径访问失败")) {
      throw new Error("文件路径无效，请联系管理员");
    } else if (error.message && error.message.includes("不支持的文件URL格式")) {
      throw new Error("文件格式不支持，请检查文件配置");
    } else {
      throw new Error(`文件下载失败: ${error.message || "未知错误"}`);
    }
  }
};

// 下载为 PDF（模拟）
export const downloadAsPDF = async (
  document: any,
  patent: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    const content = generatePDFContent(document, patent);
    const timestamp = new Date().toISOString().split("T")[0];
    const filename = `${patent.patentNumber}_${document.name}_${timestamp}.pdf`;

    // 模拟 PDF 下载
    downloadFile(content, filename, {
      ...options,
      contentType: "application/pdf",
    });
  } catch (error) {
    console.error("PDF 下载失败:", error);
    throw error;
  }
};
