// 文档下载工具函数

export interface DownloadOptions {
  filename?: string;
  contentType?: string;
  showProgress?: boolean;
}

// 获取文件扩展名
const getFileExtension = (type: string): string => {
  switch (type) {
    case 'application':
      return '.doc';
    case 'publication':
      return '.pdf';
    case 'grant':
      return '.pdf';
    case 'amendment':
      return '.doc';
    default:
      return '.txt';
  }
};

// 获取内容类型
const getContentType = (type: string): string => {
  switch (type) {
    case 'application':
      return 'application/msword';
    case 'publication':
      return 'application/pdf';
    case 'grant':
      return 'application/pdf';
    case 'amendment':
      return 'application/msword';
    default:
      return 'text/plain;charset=utf-8';
  }
};

// 生成文件内容
export const generateFileContent = (document: any, type: string): string => {
  switch (type) {
    case 'application':
      return generateApplicationDocument(document);
    case 'publication':
      return generatePublicationDocument(document);
    case 'grant':
      return generateGrantDocument(document);
    case 'amendment':
      return generateAmendmentDocument(document);
    default:
      return generateGenericDocument(document);
  }
};

// 生成申请文件内容
const generateApplicationDocument = (document: any): string => {
  return `
专利申请文件

专利标题: ${document.title || '未知'}
专利号: ${document.patentNumber || '未知'}
申请日期: ${document.applicationDate || '未知'}

申请人: ${document.applicants?.join(', ') || '未知'}
发明人: ${document.inventors?.join(', ') || '未知'}

专利摘要:
${document.abstract || '暂无摘要'}

权利要求:
${document.claims?.map((claim: string, index: number) => `${index + 1}. ${claim}`).join('\n') || '暂无权利要求'}

关键词: ${document.keywords?.join(', ') || '无'}

技术领域: ${document.technicalField || '未知'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
文件类型: 申请文件
  `.trim();
};

// 生成公开文件内容
const generatePublicationDocument = (document: any): string => {
  return `
专利公开文件

专利标题: ${document.title || '未知'}
专利号: ${document.patentNumber || '未知'}
公开日期: ${document.publicationDate || '未知'}

公开号: ${document.publicationNumber || '未知'}

专利摘要:
${document.abstract || '暂无摘要'}

权利要求:
${document.claims?.map((claim: string, index: number) => `${index + 1}. ${claim}`).join('\n') || '暂无权利要求'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
文件类型: 公开文件
  `.trim();
};

// 生成授权文件内容
const generateGrantDocument = (document: any): string => {
  return `
专利授权文件

专利标题: ${document.title || '未知'}
专利号: ${document.patentNumber || '未知'}
授权日期: ${document.grantDate || '未知'}

授权号: ${document.grantNumber || '未知'}

专利摘要:
${document.abstract || '暂无摘要'}

权利要求:
${document.claims?.map((claim: string, index: number) => `${index + 1}. ${claim}`).join('\n') || '暂无权利要求'}

保护期限: ${document.expirationDate || '未知'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
文件类型: 授权文件
  `.trim();
};

// 生成修改文件内容
const generateAmendmentDocument = (document: any): string => {
  return `
专利修改文件

专利标题: ${document.title || '未知'}
专利号: ${document.patentNumber || '未知'}
修改日期: ${document.amendmentDate || '未知'}

修改内容:
${document.amendmentContent || '暂无修改内容'}

修改原因: ${document.amendmentReason || '未知'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
文件类型: 修改文件
  `.trim();
};

// 生成通用文件内容
const generateGenericDocument = (document: any): string => {
  return `
专利文档

专利标题: ${document.title || '未知'}
专利号: ${document.patentNumber || '未知'}
文档类型: ${document.type || '未知'}

文档内容:
${document.content || '暂无内容'}

---
生成时间: ${new Date().toLocaleString('zh-CN')}
文件类型: 其他文件
  `.trim();
};

// 下载文件
export const downloadFile = (
  content: string,
  filename: string,
  options: DownloadOptions = {}
): void => {
  const {
    contentType = 'text/plain;charset=utf-8',
    showProgress = true
  } = options;

  try {
    // 创建 Blob
    const blob = new Blob([content], { type: contentType });
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // 添加到 DOM 并触发下载
    document.body.appendChild(link);
    link.click();
    
    // 延迟清理，确保下载开始
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    if (showProgress) {
      console.log(`文件 ${filename} 下载成功`);
    }
  } catch (error) {
    console.error('下载文件失败:', error);
    throw new Error('下载文件失败');
  }
};

// 下载专利文档
export const downloadPatentDocument = async (
  document: any,
  patent: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    console.log('开始下载文档:', document);
    console.log('文档URL:', document.fileUrl);
    
    // 检查是否有真实文件URL
    if (document.fileUrl && 
        document.fileUrl !== '/documents/' && 
        (document.fileUrl.startsWith('blob:') || 
         document.fileUrl.startsWith('data:') || 
         document.fileUrl.startsWith('http'))) {
      console.log('下载真实文件');
      // 下载真实文件
      await downloadRealFile(document, options);
    } else {
      console.log('生成模拟文件内容');
      // 生成模拟文件内容
      const content = generateFileContent({ ...patent, ...document }, document.type);
      
      // 根据文档类型选择文件格式
      const fileExtension = getFileExtension(document.type);
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = options.filename || `${patent.patentNumber}_${document.name}_${timestamp}${fileExtension}`;
      
      // 设置内容类型
      const contentType = getContentType(document.type);
      
      // 下载文件
      downloadFile(content, filename, {
        ...options,
        contentType
      });
    }
    
  } catch (error) {
    console.error('下载专利文档失败:', error);
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
    const timestamp = new Date().toISOString().split('T')[0];
    
    for (let i = 0; i < documents.length; i++) {
      const document = documents[i];
      
      // 检查是否有真实文件URL
      if (document.fileUrl && document.fileUrl !== '/documents/') {
        // 下载真实文件
        await downloadRealFile(document, {
          ...options,
          filename: `${patent.patentNumber}_${document.name}_${timestamp}_${i + 1}`
        });
      } else {
        // 生成模拟文件内容
        const content = generateFileContent({ ...patent, ...document }, document.type);
        const fileExtension = getFileExtension(document.type);
        const filename = `${patent.patentNumber}_${document.name}_${timestamp}_${i + 1}${fileExtension}`;
        
        // 延迟下载，避免浏览器阻止多个下载
        await new Promise(resolve => setTimeout(resolve, 100));
        downloadFile(content, filename, options);
      }
    }
  } catch (error) {
    console.error('批量下载文档失败:', error);
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
  doc: any,
  options: DownloadOptions = {}
): Promise<void> => {
  try {
    // 如果是 blob URL，直接下载
    if (doc.fileUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = options.filename || doc.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (options.showProgress) {
        console.log(`文件 ${doc.name} 下载成功`);
      }
      return;
    }
    
    // 如果是 data URL，直接下载
    if (doc.fileUrl.startsWith('data:')) {
      const link = document.createElement('a');
      link.href = doc.fileUrl;
      link.download = options.filename || doc.name;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (options.showProgress) {
        console.log(`文件 ${doc.name} 下载成功`);
      }
      return;
    }
    
    // 如果是网络URL，先获取文件
    const response = await fetch(doc.fileUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const blob = await response.blob();
    const filename = options.filename || doc.name;
    
    // 创建下载链接
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';
    
    // 添加到 DOM 并触发下载
    document.body.appendChild(link);
    link.click();
    
    // 延迟清理
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);
    
    if (options.showProgress) {
      console.log(`文件 ${filename} 下载成功`);
    }
  } catch (error) {
    console.error('下载真实文件失败:', error);
    throw new Error('文件下载失败，请检查文件是否存在');
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
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${patent.patentNumber}_${document.name}_${timestamp}.pdf`;
    
    // 模拟 PDF 下载
    downloadFile(content, filename, { ...options, contentType: 'application/pdf' });
  } catch (error) {
    console.error('PDF 下载失败:', error);
    throw error;
  }
}; 