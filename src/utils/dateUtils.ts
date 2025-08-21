/**
 * 日期格式化工具函数
 */

/**
 * 格式化日期为中文格式
 * @param dateString 日期字符串或Date对象
 * @param includeTime 是否包含时间，默认true
 * @returns 格式化后的日期字符串
 */
export const formatDate = (
  dateString: string | Date | null | undefined,
  includeTime: boolean = true
): string => {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      console.warn("无效的日期:", dateString);
      return String(dateString);
    }

    const options: Intl.DateTimeFormatOptions = {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    };

    if (includeTime) {
      options.hour = "2-digit";
      options.minute = "2-digit";
    }

    return date.toLocaleDateString("zh-CN", options);
  } catch (error) {
    console.error("日期格式化失败:", error, dateString);
    return String(dateString);
  }
};

/**
 * 格式化日期为简短格式（只显示日期）
 * @param dateString 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDateShort = (
  dateString: string | Date | null | undefined
): string => {
  return formatDate(dateString, false);
};

/**
 * 格式化日期为完整格式（包含秒）
 * @param dateString 日期字符串或Date对象
 * @returns 格式化后的日期字符串
 */
export const formatDateTime = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      console.warn("无效的日期:", dateString);
      return String(dateString);
    }

    return date.toLocaleDateString("zh-CN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  } catch (error) {
    console.error("日期格式化失败:", error, dateString);
    return String(dateString);
  }
};

/**
 * 获取相对时间描述（如：3天前、1小时前等）
 * @param dateString 日期字符串或Date对象
 * @returns 相对时间描述
 */
export const getRelativeTime = (
  dateString: string | Date | null | undefined
): string => {
  if (!dateString) return "-";

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;

    if (isNaN(date.getTime())) {
      return String(dateString);
    }

    const now = new Date();
    const diffTime = now.getTime() - date.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
    const diffMinutes = Math.ceil(diffTime / (1000 * 60));

    if (diffDays > 0) {
      if (diffDays === 1) return "昨天";
      if (diffDays <= 7) return `${diffDays}天前`;
      if (diffDays <= 30) return `${Math.floor(diffDays / 7)}周前`;
      if (diffDays <= 365) return `${Math.floor(diffDays / 30)}个月前`;
      return `${Math.floor(diffDays / 365)}年前`;
    } else if (diffHours > 0) {
      return `${diffHours}小时前`;
    } else if (diffMinutes > 0) {
      return `${diffMinutes}分钟前`;
    } else {
      return "刚刚";
    }
  } catch (error) {
    console.error("相对时间计算失败:", error, dateString);
    return String(dateString);
  }
};

/**
 * 检查日期是否有效
 * @param dateString 日期字符串或Date对象
 * @returns 是否有效
 */
export const isValidDate = (
  dateString: string | Date | null | undefined
): boolean => {
  if (!dateString) return false;

  try {
    const date =
      typeof dateString === "string" ? new Date(dateString) : dateString;
    return !isNaN(date.getTime());
  } catch (error) {
    return false;
  }
};

/**
 * 获取日期范围描述
 * @param startDate 开始日期
 * @param endDate 结束日期
 * @returns 日期范围描述
 */
export const getDateRangeText = (
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): string => {
  if (!startDate || !endDate) return "-";

  try {
    const start =
      typeof startDate === "string" ? new Date(startDate) : startDate;
    const end = typeof endDate === "string" ? new Date(endDate) : endDate;

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return "日期无效";
    }

    const startFormatted = formatDate(start, false);
    const endFormatted = formatDate(end, false);

    if (startFormatted === endFormatted) {
      return startFormatted;
    }

    return `${startFormatted} 至 ${endFormatted}`;
  } catch (error) {
    console.error("日期范围格式化失败:", error);
    return "日期范围无效";
  }
};
