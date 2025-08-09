// 图片URL工具函数
import { API_BASE_URL } from '@/config/api';

/**
 * 构建完整的图片URL
 * @param imagePath 图片路径（可能是相对路径或完整URL）
 * @param defaultImage 默认图片路径
 * @returns 完整的图片URL
 */
export function buildImageUrl(imagePath: string | null | undefined, defaultImage?: string): string {
  // 如果没有图片路径，返回默认图片
  if (!imagePath) {
    return defaultImage || '/default-avatar.svg';
  }

  // 如果已经是完整的URL（http或https开头），直接返回
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // 如果是绝对路径（以/uploads开头），需要拼接后端基础URL
  if (imagePath.startsWith('/uploads/')) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${imagePath}`;
  }

  // 如果是其他绝对路径（以/开头），直接返回
  if (imagePath.startsWith('/')) {
    return imagePath;
  }

  // 如果是相对路径（uploads/或uploads\开头），拼接后端基础URL
  if (imagePath.startsWith('uploads/') || imagePath.startsWith('uploads\\')) {
    // 移除API_BASE_URL中的/api部分，只保留基础URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    // 标准化路径分隔符，将反斜杠替换为正斜杠
    const normalizedPath = imagePath.replace(/\\/g, '/');
    // 去掉imagePath中的uploads/前缀，因为后端静态文件服务已经映射了/uploads路径
    const pathWithoutUploads = normalizedPath.substring('uploads/'.length);
    return `${baseUrl}/uploads/${pathWithoutUploads}`;
  }

  // 其他情况，尝试拼接uploads前缀
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}/uploads/${imagePath}`;
}

/**
 * 构建头像URL
 * @param avatarPath 头像路径
 * @param avatarId 头像ID（用于回退到预设头像）
 * @returns 完整的头像URL
 */
export function buildAvatarUrl(avatarPath: string | null | undefined, avatarId?: number): string {
  // 如果有头像路径，使用头像路径
  if (avatarPath) {
    return buildImageUrl(avatarPath, '/default-avatar.svg');
  }
  
  // 如果没有头像路径但有avatarId，使用预设头像
  if (avatarId) {
    const avatarSources: { [key: number]: string } = {
      1: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/1.jpeg",
      2: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/2.jpeg",
      3: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/3.jpeg",
      4: "https://lf-code-agent.coze.cn/obj/x-ai-cn/63685843202/image/region_images/supplies_images/FindGameCompanionPage/4.jpeg"
    };
    
    return avatarSources[avatarId] || '/default-avatar.svg';
  }
  
  // 默认头像
  return '/default-avatar.svg';
}

/**
 * 构建游戏图片URL
 * @param imagePath 游戏图片路径
 * @returns 完整的游戏图片URL
 */
export function buildGameImageUrl(imagePath: string | null | undefined): string {
  return buildImageUrl(imagePath, '/default-game.svg');
}

/**
 * 构建录音文件URL
 * @param voicePath 录音文件路径
 * @returns 完整的录音文件URL
 */
export function buildVoiceUrl(voicePath: string | null | undefined): string {
  // 如果没有录音路径，返回空字符串
  if (!voicePath) {
    return '';
  }

  // 如果已经是完整的URL（http或https开头），直接返回
  if (voicePath.startsWith('http://') || voicePath.startsWith('https://')) {
    return voicePath;
  }

  // 如果是绝对路径（以/uploads开头），需要拼接后端基础URL
  if (voicePath.startsWith('/uploads/')) {
    const baseUrl = API_BASE_URL.replace('/api', '');
    return `${baseUrl}${voicePath}`;
  }

  // 如果是其他绝对路径（以/开头），直接返回
  if (voicePath.startsWith('/')) {
    return voicePath;
  }

  // 如果是相对路径（uploads/或uploads\开头），拼接后端基础URL
  if (voicePath.startsWith('uploads/') || voicePath.startsWith('uploads\\')) {
    // 移除API_BASE_URL中的/api部分，只保留基础URL
    const baseUrl = API_BASE_URL.replace('/api', '');
    // 标准化路径分隔符，将反斜杠替换为正斜杠
    const normalizedPath = voicePath.replace(/\\/g, '/');
    // 去掉voicePath中的uploads/前缀，因为后端静态文件服务已经映射了/uploads路径
    const pathWithoutUploads = normalizedPath.substring('uploads/'.length);
    return `${baseUrl}/uploads/${pathWithoutUploads}`;
  }

  // 其他情况，尝试拼接uploads前缀
  const baseUrl = API_BASE_URL.replace('/api', '');
  return `${baseUrl}/uploads/${voicePath}`;
}