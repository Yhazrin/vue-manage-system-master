<template>
  <div class="user-dashboard">
    <div class="dashboard-header">
      <h1>用户中心</h1>
      <div class="user-info">
        <img src="/assets/img/avatar-default.png" alt="用户头像" class="avatar">
        <div class="user-details">
          <p class="username">{{ userInfo.username }}</p>
          <p class="user-id">ID: {{ userInfo.id }}</p>
        </div>
      </div>
    </div>

    <div class="dashboard-stats">
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
        </div>
        <div class="stat-content">
          <p class="stat-title">已完成订单</p>
          <p class="stat-value">{{ stats.completedOrders }}</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"></path><path d="M12 8v4l3 3"></path></svg>
        </div>
        <div class="stat-content">
          <p class="stat-title">账户余额</p>
          <p class="stat-value">{{ stats.balance }}元</p>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
        </div>
        <div class="stat-content">
          <p class="stat-title">我的评分</p>
          <p class="stat-value">{{ stats.rating }}分</p>
        </div>
      </div>
    </div>

    <div class="dashboard-content">
      <div class="section-title">
        <h2>推荐陪玩师</h2>
        <a href="#" class="view-all">查看全部</a>
      </div>

      <div class="companion-list">
        <div class="companion-card" v-for="companion in recommendedCompanions" :key="companion.id">
          <img :src="companion.avatar" alt="{{ companion.name }}" class="companion-avatar">
          <div class="companion-info">
            <div class="companion-name-rating">
              <h3>{{ companion.name }}</h3>
              <div class="rating">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                <span>{{ companion.rating }}</span>
              </div>
            </div>
            <p class="companion-price">{{ companion.price }}元/小时</p>
            <p class="companion-skills">{{ companion.skills.join(' · ') }}</p>
            <button class="book-btn" @click="goToBooking(companion.id)">立即预约</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 模拟用户信息
const userInfo = ref({
  id: 'U123456',
  username: '游戏爱好者',
  avatar: '/assets/img/avatar-default.png'
});

// 模拟统计数据
const stats = ref({
  completedOrders: 12,
  balance: 258,
  rating: 4.8
});

// 模拟推荐陪玩师数据
const recommendedCompanions = ref([
  {
    id: 1,
    name: '游戏高手小王',
    avatar: '/assets/img/companion1.jpg',
    rating: 4.9,
    price: 90,
    skills: ['英雄联盟', '绝地求生', '王者荣耀']
  },
  {
    id: 2,
    name: '娱乐陪玩小姐姐',
    avatar: '/assets/img/companion2.jpg',
    rating: 4.8,
    price: 120,
    skills: ['和平精英', 'QQ飞车', '聊天陪伴']
  },
  {
    id: 3,
    name: '专业电竞教学',
    avatar: '/assets/img/companion3.jpg',
    rating: 4.7,
    price: 150,
    skills: ['DOTA2', 'CS:GO', '电竞教学']
  }
]);

// 跳转到预约页面
const goToBooking = (id: number) => {
  router.push(`/user/booking/${id}`);
};
</script>

<style scoped>
.user-dashboard {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 15px;
}

.avatar {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  object-fit: cover;
}

.user-details {
  text-align: right;
}

.username {
  font-size: 18px;
  font-weight: 600;
  margin: 0;
}

.user-id {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.dashboard-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
}

.stat-card {
  flex: 1;
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  gap: 15px;
}

.stat-icon {
  width: 40px;
  height: 40px;
  background: #f5f7fa;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #7b61ff;
}

.stat-title {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
  margin: 5px 0 0;
}

.section-title {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.view-all {
  color: #7b61ff;
  text-decoration: none;
  font-size: 14px;
}

.companion-list {
  display: flex;
  gap: 20px;
  overflow-x: auto;
  padding-bottom: 10px;
}

.companion-card {
  min-width: 280px;
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.companion-avatar {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.companion-info {
  padding: 15px;
}

.companion-name-rating {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.companion-name-rating h3 {
  margin: 0;
  font-size: 16px;
}

.rating {
  display: flex;
  align-items: center;
  color: #ff9800;
  font-size: 14px;
}

.rating svg {
  margin-right: 5px;
}

.companion-price {
  font-size: 18px;
  font-weight: 600;
  color: #7b61ff;
  margin: 0 0 10px;
}

.companion-skills {
  font-size: 14px;
  color: #666;
  margin: 0 0 15px;
}

.book-btn {
  width: 100%;
  padding: 10px;
  background: #7b61ff;
  color: white;
  border: none;
  border-radius: 5px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.3s;
}

.book-btn:hover {
  background: #6a52d9;
}
</style>