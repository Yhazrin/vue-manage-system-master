import { useState, useEffect } from 'react';

type Theme = 'light' | 'dark' | 'cyberpunk' | 'pastel';
type FontSize = 'small' | 'medium' | 'large' | 'extra-large';

export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  border: string;
}

export interface FontSizeConfig {
  name: string;
  label: string;
  baseSize: string;
  scale: number;
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
  
  // 字体大小状态
  const [fontSize, setFontSize] = useState<FontSize>(() => {
    const savedFontSize = localStorage.getItem('fontSize') as FontSize;
    return savedFontSize || 'medium';
  });
  
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

  // 字体大小配置
  const fontSizeConfigs: Record<FontSize, FontSizeConfig> = {
    small: {
      name: 'small',
      label: '小号字体',
      baseSize: '14px',
      scale: 0.875
    },
    medium: {
      name: 'medium',
      label: '标准字体',
      baseSize: '16px',
      scale: 1
    },
    large: {
      name: 'large',
      label: '大号字体',
      baseSize: '18px',
      scale: 1.125
    },
    'extra-large': {
      name: 'extra-large',
      label: '超大字体',
      baseSize: '20px',
      scale: 1.25
    }
  };
  
  // 新增：当主题变化时更新最后使用的预设主题
  useEffect(() => {
    if (theme !== 'custom') {
      setLastPresetTheme(theme as Exclude<Theme, 'custom'>);
    }
  }, [theme]);

// 预设主题颜色 - 完全重新设计的配色方案
const themeColors: Record<Exclude<Theme, 'custom'>, ThemeColors> = {
  light: {
    primary: '#6366f1', // 现代靛蓝色，专业且友好
    secondary: '#8b5cf6', // 紫色，增加层次感
    accent: '#06b6d4', // 青色，清新活力
    background: '#ffffff', // 纯白背景，最佳可读性
    surface: '#f8fafc', // 极浅灰色表面
    text: '#0f172a', // 深蓝灰色文本，优秀对比度
    border: '#e2e8f0' // 柔和边框色
  },
  dark: {
    primary: '#818cf8', // 明亮靛蓝色，在深色下突出
    secondary: '#a78bfa', // 明亮紫色，保持层次
    accent: '#22d3ee', // 明亮青色，增强视觉效果
    background: '#0f172a', // 深蓝灰背景，护眼
    surface: '#1e293b', // 中等深度表面色
    text: '#f1f5f9', // 浅色文本，高对比度
    border: '#334155' // 中等深度边框
  },
  cyberpunk: {
    primary: '#ff0080', // 霓虹粉红，强烈视觉冲击
    secondary: '#00ffff', // 霓虹青色，科技感
    accent: '#ffff00', // 霓虹黄色，警示色彩
    background: '#000000', // 纯黑背景，极致对比
    surface: '#1a1a1a', // 深灰表面，层次分明
    text: '#ffffff', // 纯白文本，最大对比
    border: '#333333' // 深灰边框，subtle分割
  },
  pastel: {
    primary: '#a855f7', // 柔和紫色，温和优雅
    secondary: '#ec4899', // 柔和粉色，温暖亲和
    accent: '#10b981', // 柔和绿色，自然清新
    background: '#fefefe', // 温暖白色背景
    surface: '#f9fafb', // 极浅表面色
    text: '#374151', // 温和深灰文本
    border: '#d1d5db' // 柔和边框色
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

  // 应用字体大小
  useEffect(() => {
    const config = fontSizeConfigs[fontSize];
    
    // 设置字体大小CSS变量
    document.documentElement.style.setProperty('--font-size-base', config.baseSize);
    document.documentElement.style.setProperty('--font-scale', config.scale.toString());
    
    // 设置各种字体大小
    document.documentElement.style.setProperty('--font-size-xs', `${0.75 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-sm', `${0.875 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-base-rem', `${1 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-lg', `${1.125 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-xl', `${1.25 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-2xl', `${1.5 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-3xl', `${1.875 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-4xl', `${2.25 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-5xl', `${3 * config.scale}rem`);
    document.documentElement.style.setProperty('--font-size-6xl', `${3.75 * config.scale}rem`);
    
    // 添加字体大小类到body
    document.body.classList.remove('font-small', 'font-medium', 'font-large', 'font-extra-large');
    document.body.classList.add(`font-${fontSize}`);
    
    // 保存字体大小设置
    localStorage.setItem('fontSize', fontSize);
  }, [fontSize, fontSizeConfigs]);

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

  // 设置字体大小
  const setFontSizeMode = (newFontSize: FontSize) => {
    setFontSize(newFontSize);
  };

  return {
    theme,
    setThemeMode,
    themeColors: theme === 'custom' ? customColors : themeColors[theme],
    updateCustomColor,
    availableThemes: Object.keys(themeColors) as Exclude<Theme, 'custom'>[],
    // 新增：暴露最后使用的预设主题
    lastPresetTheme,
    // 字体大小相关
    fontSize,
    setFontSizeMode,
    fontSizeConfigs,
    availableFontSizes: Object.keys(fontSizeConfigs) as FontSize[],
    currentFontSizeConfig: fontSizeConfigs[fontSize]
  };
}