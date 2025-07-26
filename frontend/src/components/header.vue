<template>
    <div class="header">
        <!-- 固定的左侧图标和名称 -->
        <div class="header-left">
            <div class="logo-container">
                <span class="logo-text">CP</span>
            </div>
            <div class="web-title">陪玩平台</div>
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
                <!-- 根据用户角色动态显示的导航 -->
                <div v-if="userRole === 'user'" class="role-nav">
                    <div class="nav-item" @click="router.push('/user/dashboard')">首页</div>
                    <div class="nav-item" @click="router.push('/user/orders')">我的订单</div>
                    <div class="nav-item" @click="router.push('/user/booking')">预约陪玩</div>
                </div>
                <div v-if="userRole === 'companion'" class="role-nav">
                    <div class="nav-item" @click="router.push('/companion/dashboard')">工作台</div>
                    <div class="nav-item" @click="router.push('/companion/orders')">订单管理</div>
                    <div class="nav-item" @click="router.push('/companion/profile')">个人资料</div>
                </div>
                <div v-if="userRole === 'admin'" class="role-nav">
                    <div class="nav-item" @click="router.push('/admin/dashboard')">管理首页</div>
                    <div class="nav-item" @click="router.push('/admin/users')">用户管理</div>
                    <div class="nav-item" @click="router.push('/admin/companions')">陪玩师管理</div>
                    <div class="nav-item" @click="router.push('/admin/orders')">订单管理</div>
                </div>
                <!-- 保留原有功能按钮 -->
                <div class="btn-icon" @click="router.push('/theme')">
                    <el-tooltip effect="dark" content="设置主题" placement="bottom">
                        <i class="el-icon-lx-skin"></i>
                    </el-tooltip>
                </div>
                <div class="btn-icon" @click="router.push('/ucenter')">
                    <el-tooltip
                        effect="dark"
                        :content="message ? `有${message}条未读消息` : `消息中心`"
                        placement="bottom"
                    >
                        <i class="el-icon-lx-notice"></i>
                    </el-tooltip>
                    <span class="btn-bell-badge" v-if="message"></span>
                </div>
                <!-- 用户头像和下拉菜单 -->
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
</template>
<script setup lang="ts">
import { onMounted } from 'vue';
import { useSidebarStore } from '../store/sidebar';
import { useRouter } from 'vue-router';
import imgurl from '../assets/img/img.jpg';
// 导入需要的图标
import { Expand, Fold, ArrowDown } from '@element-plus/icons-vue';

// 获取用户信息和角色
const username: string | null = localStorage.getItem('vuems_name');
const userRole: string | null = localStorage.getItem('vuems_role') || 'user'; // 默认普通用户
const message: number = 2;

const sidebar = useSidebarStore();
const router = useRouter();

// 侧边栏折叠
const collapseChage = () => {
    sidebar.handleCollapse();
};

onMounted(() => {
    if (document.body.clientWidth < 1500) {
        collapseChage();
    }
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
</script>
<style scoped>
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
    background-color: #9c27b0;
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
    color: #9c27b0;
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

.nav-item {
    margin: 0 15px;
    cursor: pointer;
    font-size: 16px;
    padding: 5px 10px;
    border-radius: 4px;
    transition: background-color 0.3s;
}

.nav-item:hover {
    background-color: rgba(0, 0, 0, 0.05);
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
</style>
