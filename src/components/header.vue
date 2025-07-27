<template>
    <div class="header">
        <!-- 固定的左侧图标和名称 -->
        <div class="header-left">
            <div class="logo-container">
                <span class="logo-text">CP</span>
            </div>
            <div class="web-title">VITE</div>
            <!-- 保留折叠按钮 -->
            <div class="collapse-btn" @click="collapseChage">
                <el-icon v-if="sidebar.collapse">
                    <Expand />
                </el-icon>
                <el-icon v-else>
                    <Fold />
                </el-icon>
            </div>
        </div>
        <div class="header-right">
            <div class="header-user-con">
                <!-- 未登录状态显示登录/注册按钮 -->
                <!-- 未登录状态显示登录/注册按钮 -->
                <div v-if="!isLoggedIn" class="auth-buttons">
                    <el-button type="default" @click="router.push('/login')">登录</el-button>
                    <el-button type="primary" @click="router.push('/register')">注册</el-button>
                </div>
                
                <!-- 登录用户显示导航链接 -->
                <div v-else-if="userRole === 'user'" class="role-nav">
                    <el-button type="text" class="nav-button" @click="router.push('/user/orders')">我的订单</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/user/lobby')">陪玩大厅</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/user/notifications')">我的消息</el-button>
                </div>
                
                <!-- 陪玩师和管理员导航保持不变 -->
                <div v-else-if="userRole === 'companion'" class="role-nav">
                    <el-button type="text" class="nav-button" @click="router.push('/companion/dashboard')">工作台</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/companion/orders')">订单管理</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/companion/profile')">个人资料</el-button>
                </div>
                <div v-else-if="userRole === 'admin'" class="role-nav">
                    <el-button type="text" class="nav-button" @click="router.push('/admin/dashboard')">管理首页</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/admin/users')">用户管理</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/admin/companions')">陪玩师管理</el-button>
                    <el-button type="text" class="nav-button" @click="router.push('/admin/orders')">订单管理</el-button>
                </div>
                
                <!-- 主题切换按钮和浮窗 - 始终显示 -->
                <div class="theme-switch-container">
                    <el-dropdown trigger="click" @visible-change="handleThemeDropdownVisibleChange">
                        <div class="btn-icon theme-btn" >
                            <el-tooltip effect="dark" content="设置主题" placement="bottom">
                                <i class="el-icon-lx-skin"></i>
                            </el-tooltip>
                        </div>
                        <template #dropdown>
                            <!-- 主题下拉内容保持不变 -->
                            <div class="theme-dropdown-content">
                                <h4 class="theme-title">主题颜色</h4>
                                <div class="theme-colors">
                                    <div class="theme-color-item" :style="{ backgroundColor: '#409EFF' }" @click="changeTheme('#409EFF')"></div>
                                    <div class="theme-color-item" :style="{ backgroundColor: '#9c27b0' }" @click="changeTheme('#9c27b0')"></div>
                                    <div class="theme-color-item" :style="{ backgroundColor: '#e91e63' }" @click="changeTheme('#e91e63')"></div>
                                    <div class="theme-color-item" :style="{ backgroundColor: '#ff9800' }" @click="changeTheme('#ff9800')"></div>
                                    <div class="theme-color-item" :style="{ backgroundColor: '#4caf50' }" @click="changeTheme('#4caf50')"></div>
                                    <div class="theme-color-item" :style="{ backgroundColor: '#00bcd4' }" @click="changeTheme('#00bcd4')"></div>
                                </div>
                                <!-- 新增调色盘 -->
                                <div class="color-picker-container">
                                    <el-color-picker
                                        v-model="customColor"
                                        show-alpha
                                        size="small"
                                        @change="handleColorChange"
                                        class="custom-color-picker"
                                    />
                                    <el-button size="small" @click="applyCustomColor" :disabled="!customColor">应用颜色</el-button>
                                </div>
                                <!-- 新增最近使用的颜色 -->
                                <h4 class="theme-title" v-if="themeStore.recentColors.length > 0">最近使用</h4>
                                <div class="theme-colors" v-if="themeStore.recentColors.length > 0">
                                    <div v-for="color in themeStore.recentColors" :key="color"
                                        class="theme-color-item" :style="{ backgroundColor: color }"
                                        @click="changeTheme(color)"></div>
                                </div>
                                <!-- 新增背景颜色设置 -->
                                <h4 class="theme-title">背景颜色</h4>
                                <div class="background-color-options">
                                    <div class="bg-color-item" :style="{ backgroundColor: '#f5f7fa' }" @click="changeBgColor('#f5f7fa')"></div>
                                    <div class="bg-color-item" :style="{ backgroundColor: '#ffffff' }" @click="changeBgColor('#ffffff')"></div>
                                    <div class="bg-color-item" :style="{ backgroundColor: '#f0f2f5' }" @click="changeBgColor('#f0f2f5')"></div>
                                    <el-color-picker
                                        v-model="customBgColor"
                                        show-alpha
                                        size="small"
                                        @change="handleBgColorChange"
                                        class="bg-color-picker"
                                    />
                                </div>
                                <h4 class="theme-title">头部样式</h4>
                                <div class="header-style-options">
                                    <div class="header-style-item" @click="changeHeaderStyle('light')">
                                        <div class="header-style-preview light"></div>
                                        <span>浅色</span>
                                    </div>
                                    <div class="header-style-item" @click="changeHeaderStyle('dark')">
                                        <div class="header-style-preview dark"></div>
                                        <span>深色</span>
                                    </div>
                                </div>
                                <div class="theme-actions">
                                    <el-button size="small" type="text" @click="resetTheme">重置主题</el-button>
                                </div>
                            </div>
                        </template>
                    </el-dropdown>
                </div>
                <!-- 消息通知按钮 - 仅登录用户显示 -->
                <div v-if="isLoggedIn" class="btn-icon" @click="router.push('/user/notifications')">
                    <el-tooltip
                        effect="dark"
                        :content="message ? `有${message}条未读消息` : `消息中心`"
                        placement="bottom"
                    >
                        <i class="el-icon-lx-notice"></i>
                    </el-tooltip>
                    <span class="btn-bell-badge" v-if="message"></span>
                </div>
                <!-- 用户头像和下拉菜单 - 仅登录用户显示 -->
                <div v-if="isLoggedIn">
                    <el-avatar class="user-avator" :size="30" :src="imgurl" />
                    <el-dropdown class="user-name" trigger="click" @command="handleCommand">
                        <span class="el-dropdown-link">
                            {{ username }}
                            <el-icon class="el-icon--right">
                                <arrow-down />
                            </el-icon>
                        </span>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <el-dropdown-item command="user">个人中心</el-dropdown-item>
                                <el-dropdown-item divided command="loginout">退出登录</el-dropdown-item>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
            </div>
        </div>
    </div>
</template>
<script setup lang="ts">
import { useSidebarStore } from '@/store/sidebar';
import { useThemeStore } from '@/store/theme';
import { useRouter } from 'vue-router';
import imgurl from '/src/assets/img/img.jpg';
// 导入需要的图标
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue';
import { ElButton, ElDropdown, ElTooltip, ElColorPicker, ElAvatar } from 'element-plus';

// 修改: 将const改为ref，使其可响应式修改
const username = ref<string | null>(localStorage.getItem('vuems_name'));
const userRole = ref<string | null>(localStorage.getItem('vuems_role') || 'user'); // 默认普通用户
// 修改: 显式声明isLoggedIn的类型
const isLoggedIn = computed<boolean>(() => !!username.value);
const message: number = 2;
const showThemeDropdown = ref(false);
const customColor = ref('');
const customBgColor = ref('');

const sidebar = useSidebarStore();
const themeStore = useThemeStore();
const router = useRouter();

// 侧边栏折叠
const collapseChage = () => {
    sidebar.handleCollapse();
};

// 处理主题下拉菜单显示/隐藏
const handleThemeDropdownVisibleChange = (visible: boolean) => {
    showThemeDropdown.value = visible;
};

// 切换主题颜色
const changeTheme = (color: string) => {
    themeStore.setPropertyColor(color, 'primary');
    customColor.value = color;
};

// 处理调色盘颜色变化
const handleColorChange = (color: string) => {
    customColor.value = color;
};

// 应用自定义颜色
const applyCustomColor = () => {
    if (customColor.value) {
        changeTheme(customColor.value);
    }
};

// 切换背景颜色
const changeBgColor = (color: string) => {
    themeStore.setBodyBgColor(color);
    customBgColor.value = color;
};

// 处理背景颜色选择器变化
const handleBgColorChange = (color: string) => {
    customBgColor.value = color;
};

// 切换头部样式
const changeHeaderStyle = (style: 'light' | 'dark') => {
    if (style === 'light') {
        themeStore.setHeaderBgColor('#ffffff');
        themeStore.setHeaderTextColor('#333333');
    } else {
        themeStore.setHeaderBgColor('#242f42');
        themeStore.setHeaderTextColor('#ffffff');
    }
};

// 重置主题
const resetTheme = () => {
    themeStore.resetTheme();
    customColor.value = '';
    customBgColor.value = '';
};

onMounted(() => {
    if (document.body.clientWidth < 1500) {
        collapseChage();
    }
    // 初始化主题
    themeStore.initTheme();
    // 设置初始背景颜色
    document.body.style.backgroundColor = themeStore.bodyBgColor;
});

// 用户名下拉菜单选择事件
const handleCommand = (command: string) => {
    if (command == 'loginout') {
        localStorage.removeItem('vuems_name');
        localStorage.removeItem('vuems_role');
        router.push('/login');
    } else if (command == 'user') {
        router.push('/ucenter');
    }
};

// 模拟登录函数
const simulateLogin = () => {
    // 设置本地存储，模拟登录状态
    localStorage.setItem('vuems_name', '测试用户');
    localStorage.setItem('vuems_role', 'user');
    // 删除: 不能直接修改computed属性
    // isLoggedIn.value = true;  // 这行代码是错误的，应该删除
    // 修改: 正确更新ref的值
    username.value = '测试用户';
    userRole.value = 'user';
    // 登录后直接跳转到我的订单页面
    router.push('/user/orders');
};
</script>
<style scoped>
/* 添加未登录状态按钮样式 */
.auth-buttons {
    display: flex;
    gap: 10px;
    margin-right: 20px;
}

.header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    box-sizing: border-box;
    width: 100%;
    height: 70px;
    color: var(--header-text-color);
    background-color: var(--header-bg-color);
    border-bottom: 1px solid #ddd;
    position: fixed; /* 固定在顶部 */
    top: 0; /* 顶部对齐 */
    left: 0; /* 左侧对齐 */
    z-index: 1000; /* 确保在其他内容之上 */
}

.header-left {
    display: flex;
    align-items: center;
    padding-left: 20px;
    height: 100%;
}

.logo-container {
    width: 40px;
    height: 40px;
    background-color: var(--el-color-primary);
    border-radius: 8px;
    display: flex;
    justify-content: center;
    align-items: center;
    color: white;
    font-weight: bold;
    font-size: 18px;
}

.web-title {
    margin: 0 40px 0 10px;
    font-size: 22px;
    color: var(--el-color-primary);
    font-weight: bold;
}

.collapse-btn {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    padding: 0 10px;
    cursor: pointer;
    opacity: 0.8;
    font-size: 22px;
}

.collapse-btn:hover {
    opacity: 1;
}

.header-right {
    float: right;
    padding-right: 20px;
}

.header-user-con {
    display: flex;
    height: 70px;
    align-items: center;
}

.role-nav {
    display: flex;
    margin-right: 20px;
}

.nav-button {
    margin: 0 15px;
    font-size: 16px;
    padding: 5px 10px;
    color: var(--header-text-color);
}

.btn-icon {
    position: relative;
    width: 30px;
    height: 30px;
    text-align: center;
    cursor: pointer;
    display: flex;
    align-items: center;
    color: var(--header-text-color);
    margin: 0 5px;
    font-size: 20px;
}

.btn-bell-badge {
    position: absolute;
    right: 4px;
    top: 0px;
    width: 8px;
    height: 8px;
    border-radius: 4px;
    background: #f56c6c;
    color: var(--header-text-color);
}

.user-avator {
    margin: 0 10px 0 20px;
}

.el-dropdown-link {
    color: var(--header-text-color);
    cursor: pointer;
    display: flex;
    align-items: center;
}

/* 主题切换相关样式 */
.theme-dropdown-content {
    width: 240px;
    padding: 15px;
}

.theme-title {
    font-size: 14px;
    color: #606266;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 1px solid #eee;
}

.theme-colors {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 20px;
}

.theme-color-item {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.theme-color-item:hover {
    transform: scale(1.1);
    border-color: #ccc;
}

.header-style-options {
    display: flex;
    gap: 15px;
    margin-bottom: 20px;
}

.header-style-item {
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
}

.header-style-preview {
    width: 60px;
    height: 30px;
    border-radius: 4px;
    margin-bottom: 5px;
}

.header-style-preview.light {
    background-color: #ffffff;
    border: 1px solid #ddd;
}

.header-style-preview.dark {
    background-color: #242f42;
}

.theme-actions {
    display: flex;
    justify-content: flex-end;
}

/* 新增的调色盘和背景颜色样式 */
.color-picker-container {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    gap: 10px;
}

.custom-color-picker {
    width: 150px;
}

.background-color-options {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 20px;
}

.bg-color-item {
    width: 30px;
    height: 30px;
    border-radius: 50%;
    cursor: pointer;
    border: 2px solid transparent;
    transition: all 0.2s;
}

.bg-color-item:hover {
    transform: scale(1.1);
    border-color: #ccc;
}

.bg-color-picker {
    width: 100px;
}
</style>
