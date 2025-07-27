<template>
  <div class="companion-dashboard">
    <div class="dashboard-header">
      <h1>陪玩师工作台</h1>
    </div>

    <!-- 个人信息概览 -->
    <div class="profile-overview">
      <div class="profile-card">
        <div class="avatar-container">
          <el-avatar :size="80" :src="userInfo.avatar || defaultAvatar"></el-avatar>
          <div class="status-badge" :class="userInfo.status === 'online' ? 'online' : 'offline'">{{ userInfo.status === 'online' ? '在线' : '离线' }}</div>
        </div>
        <div class="profile-info">
          <h2>{{ userInfo.nickname || '未设置昵称' }}</h2>
          <p>UID: {{ userInfo.uid || '未设置' }}</p>
          <div class="tags-container">
            <el-tag v-for="skill in userInfo.skills" :key="skill" size="small">{{ skill }}</el-tag>
          </div>
        </div>
        <div class="financial-info">
          <div class="financial-item">
            <p class="label">当前余额</p>
            <p class="value">{{ userInfo.balance || 0 }} 元</p>
          </div>
          <div class="financial-item">
            <p class="label">可提现收益</p>
            <p class="value">{{ userInfo.withdrawable || 0 }} 元</p>
          </div>
        </div>
      </div>
    </div>

    <!-- 功能模块入口 -->
    <div class="function-modules">
      <div class="module-card" @click="navigateTo('/companion/profile')">
        <div class="module-icon">
          <i class="el-icon-user"></i>
        </div>
        <div class="module-name">个人主页</div>
      </div>
      <div class="module-card" @click="navigateTo('/companion/orders')">
        <div class="module-icon">
          <i class="el-icon-s-order"></i>
        </div>
        <div class="module-name">订单管理</div>
      </div>
      <div class="module-card" @click="navigateTo('/companion/withdrawals')">
        <div class="module-icon">
          <i class="el-icon-wallet"></i>
        </div>
        <div class="module-name">资金与提现</div>
      </div>
      <div class="module-card" @click="navigateTo('/message')">
        <div class="module-icon">
          <i class="el-icon-bell"></i>
          <span class="notification-badge" v-if="unreadMessages > 0">{{ unreadMessages }}</span>
        </div>
        <div class="module-name">消息通知</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
// 修改图片导入路径为项目中已存在的图片
import defaultAvatar from '/src/assets/img/img.jpg';

// 定义用户信息类型
interface UserInfo {
  nickname: string;
  uid: string;
  avatar: string;
  status: 'online' | 'offline';
  skills: string[];
  balance: number;
  withdrawable: number;
}

// 初始化用户信息
const userInfo = ref<UserInfo>({
  nickname: '游戏达人',
  uid: 'CP12345678',
  avatar: '',
  status: 'online',
  skills: ['英雄联盟', '王者荣耀', '和平精英'],
  balance: 1250.50,
  withdrawable: 1000.00
});

const unreadMessages = ref(2);
const router = useRouter();

// 导航到指定路由
const navigateTo = (path: string) => {
  router.push(path);
};

// 模拟获取用户数据
const fetchUserData = () => {
  // 实际项目中这里会调用API获取用户数据
  setTimeout(() => {
    // 模拟API返回数据
    userInfo.value = {
      nickname: '游戏达人',
      uid: 'CP12345678',
      avatar: '',
      status: 'online',
      skills: ['英雄联盟', '王者荣耀', '和平精英'],
      balance: 1250.50,
      withdrawable: 1000.00
    };
  }, 500);
};

onMounted(() => {
  fetchUserData();
});
</script>

<style scoped>
.companion-dashboard {
  padding: 20px;
  min-height: calc(100vh - 70px);
  background-color: #f5f7fa;
}

.dashboard-header {
  margin-bottom: 20px;
}

.profile-overview {
  margin-bottom: 30px;
}

.profile-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding: 20px;
  display: flex;
  align-items: center;
}

.avatar-container {
  position: relative;
  margin-right: 20px;
}

.status-badge {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.online {
  background-color: #4caf50;
}

.status-badge.offline {
  background-color: #9e9e9e;
}

.profile-info {
  flex: 1;
}

.tags-container {
  margin-top: 10px;
}

.financial-info {
  display: flex;
  gap: 30px;
  padding-left: 20px;
  border-left: 1px solid #eee;
}

.financial-item {
  text-align: center;
}

.financial-item .label {
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
}

.financial-item .value {
  font-size: 20px;
  font-weight: bold;
  color: #333;
}

.function-modules {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.module-card {
  background-color: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
  padding: 30px 0;
  text-align: center;
  cursor: pointer;
  transition: transform 0.3s, box-shadow 0.3s;
}

.module-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 10px 20px 0 rgba(0, 0, 0, 0.1);
}

.module-icon {
  font-size: 40px;
  color: #9c27b0;
  margin-bottom: 15px;
  position: relative;
  display: inline-block;
}

.notification-badge {
  position: absolute;
  top: -10px;
  right: -10px;
  background-color: #f56c6c;
  color: white;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.module-name {
  font-size: 18px;
  color: #333;
}

@media (max-width: 768px) {
  .profile-card {
    flex-direction: column;
    text-align: center;
  }

  .avatar-container {
    margin-right: 0;
    margin-bottom: 15px;
  }

  .financial-info {
    margin-top: 20px;
    border-left: none;
    padding-left: 0;
    justify-content: center;
  }

  .function-modules {
    grid-template-columns: 1fr;
  }
}
</style>