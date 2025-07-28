import { mix, setProperty } from '@/utils';
import { defineStore } from 'pinia';

export const useThemeStore = defineStore('theme', {
    state: () => {
        return {
            primary: '',
            success: '',
            warning: '',
            danger: '',
            info: '',
            headerBgColor: '#242f42',
            headerTextColor: '#fff',
            bodyBgColor: '#f5f7fa', // 新增背景颜色
            recentColors: [] as string[] // 新增最近使用的颜色数组
        };
    },
    getters: {},
    actions: {
        initTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                const color = localStorage.getItem(`theme-${type}`) || '';
                if (color) {
                    this.setPropertyColor(color, type); // 设置主题色
                }
            });
            const headerBgColor = localStorage.getItem('header-bg-color');
            headerBgColor && this.setHeaderBgColor(headerBgColor);
            const headerTextColor = localStorage.getItem('header-text-color');
            headerTextColor && this.setHeaderTextColor(headerTextColor);
            // 初始化背景颜色
            const bodyBgColor = localStorage.getItem('body-bg-color');
            bodyBgColor && this.setBodyBgColor(bodyBgColor);
            // 初始化最近使用的颜色
            const recentColors = localStorage.getItem('recent-colors');
            if (recentColors) {
                this.recentColors = JSON.parse(recentColors);
            }
        },
        resetTheme() {
            ['primary', 'success', 'warning', 'danger', 'info'].forEach((type) => {
                this.setPropertyColor('', type); // 重置主题色
            });
            this.setHeaderBgColor('#242f42');
            this.setHeaderTextColor('#fff');
            this.setBodyBgColor('#f5f7fa'); // 重置背景颜色
        },
        setPropertyColor(color: string, type: string = 'primary') {
            this[type] = color;
            setProperty(`--el-color-${type}`, color);
            localStorage.setItem(`theme-${type}`, color);
            this.setThemeLight(type);
            // 添加到最近使用的颜色
            this.addToRecentColors(color);
        },
        setThemeLight(type: string = 'primary') {
            [3, 5, 7, 8, 9].forEach((v) => {
                setProperty(`--el-color-${type}-light-${v}`, mix('#ffffff', this[type], v / 10));
            });
            setProperty(`--el-color-${type}-dark-2`, mix('#ffffff', this[type], 0.2));
        },
        setHeaderBgColor(color: string) {
            this.headerBgColor = color;
            setProperty('--header-bg-color', color);
            localStorage.setItem(`header-bg-color`, color);
        },
        setHeaderTextColor(color: string) {
            this.headerTextColor = color;
            setProperty('--header-text-color', color);
            localStorage.setItem(`header-text-color`, color);
        },
        // 新增设置背景颜色的方法
        setBodyBgColor(color: string) {
            this.bodyBgColor = color;
            setProperty('--body-bg-color', color);
            document.body.style.backgroundColor = color;
            localStorage.setItem(`body-bg-color`, color);
        },
        // 新增添加到最近使用颜色的方法
        addToRecentColors(color: string) {
            // 避免重复颜色
            if (!this.recentColors.includes(color)) {
                // 限制最近颜色数量为8个
                if (this.recentColors.length >= 8) {
                    this.recentColors.pop();
                }
                // 添加到数组开头
                this.recentColors.unshift(color);
                // 保存到本地存储
                localStorage.setItem('recent-colors', JSON.stringify(this.recentColors));
            }
        }
    }
});