import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'cyberpunk' | 'pastel';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });
  
  // 新增：记录最后使用的预设主题
  const [lastPresetTheme, setLastPresetTheme] = useState<Exclude<Theme, 'custom'>>('light');
  
  const [customColors, setCustomColors] = useState<ThemeColors>(() => {
    const savedColors = localStorage.getItem('customThemeColors');
    return savedColors ? JSON.parse(savedColors) : {
      primary: '#9333ea',
      secondary: '#6366f1',
      accent: '#ec4899',
      background: '#ffffff',
      surface: '#f9fafb',
      text: '#111827',
      border: '#e5e7eb'
    };
  });
  
  // 新增：当主题变化时更新最后使用的预设主题
  useEffect(() => {
    if (theme !== 'custom') {
      setLastPresetTheme(theme as Exclude<Theme, 'custom'>);
    }
  }, [theme]);

// 预设主题颜色
const themeColors: Record<Exclude<Theme, 'custom'>, ThemeColors> = {
  light: {
    primary: '#7c3aed', // 洋紫荆色，更明亮且专业
    secondary: '#4f46e5', // 靛蓝色，更稳重
    accent: '#ec4899', // 亮粉红色，保持活力
    background: '#f8fafc', // 更柔和的白色背景
    surface: '#f1f5f9', // 更温暖的表面色
    text: '#1e293b', // 更深的灰色，提高可读性
    border: '#e2e8f0' // 更柔和的边框色
  },
  dark: {
    primary: '#8b5cf6', // 洋紫罗兰色，在深色模式下更明亮
    secondary: '#6366f1', // 靛蓝色，保持一致性
    accent: '#f472b6', // 粉红色，更柔和
    background: '#0f172a', // 更深的背景，提高对比度
    surface: '#1e2937', // 表面色稍亮，减少眼睛疲劳
    text: '#f8fafc', // 更亮的白色文本
    border: '#334155' // 更明显的边框
  },
  cyberpunk: {
    primary: '#ff2a6d', // 霓虹粉红，保持冲击力
    secondary: '#00f2ff', // 霓虹蓝，更明亮
    accent: '#ff8a00', // 霓虹橙，增加层次感
    background: '#000000', // 完全黑色背景
    surface: '#121212', // 深灰色表面
    text: '#ffffff', // 纯白文本，最大对比度
    border: '#2a2a2a' // 暗灰色边框
  },
  pastel: {
    primary: '#a8b2d1', // 莫兰迪蓝灰，更和谐
    secondary: '#d0b8a8', // 莫兰迪暖米色
    accent: '#6abf69', // 莫兰迪绿，更清新
    background: '#edf2f0', // 更温暖的米色背景
    surface: '#fdfbf3', // 极浅的米色表面
    text: '#4b5563', // 更深的灰色文本，提高可读性
    border: '#d9d9d9' // 更柔和的边框色
  }
};
	
  // 应用主题
  useEffect(() => {
    const colors = theme === 'custom' ? customColors : themeColors[theme];
    
    // 设置CSS变量
     // 设置CSS变量
    Object.entries(colors).forEach(([key, value]) => {
      document.documentElement.style.setProperty(`--theme-${key}`, value);
    });
    
    // 添加主题类到body以支持更复杂的主题样式
    document.body.className = `theme-${theme}`;
    
    // 保存主题设置
    localStorage.setItem('theme', theme);
    if (theme === 'custom') {
      localStorage.setItem('customThemeColors', JSON.stringify(customColors));
    }
  }, [theme, customColors]);

  // 切换主题
  const setThemeMode = (newTheme: Theme) => {
    setTheme(newTheme);
  };

  // 更新自定义颜色
  const updateCustomColor = (key: keyof ThemeColors, value: string) => {
    setCustomColors(prev => ({
      ...prev,
      [key]: value
    }));
    setTheme('custom'); // 切换到自定义主题
  };

  return {
    theme,
    setThemeMode,
    themeColors: theme === 'custom' ? customColors : themeColors[theme],
    updateCustomColor,
    availableThemes: Object.keys(themeColors) as Exclude<Theme, 'custom'>[],
    // 新增：暴露最后使用的预设主题
    lastPresetTheme
  };
}