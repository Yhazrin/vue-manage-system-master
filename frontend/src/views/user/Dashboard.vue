<template>
  <div class="user-dashboard">
    <div class="dashboard-header">
      <h1>用户中心</h1>
      <div class="user-info">
        <img src="/src/assets/img/img.jpg" alt="用户头像" class="avatar">
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

    <!-- 搜索筛选区域 -->
    <div class="search-filters">
      <input type="text" placeholder="Search by nickname or game" class="search-input-large" />
      
      <div class="filter-dropdowns">
        <select class="filter-select">
          <option>Game</option>
          <option>王者荣耀</option>
          <option>英雄联盟</option>
          <option>CS:GO</option>
        </select>
        <select class="filter-select">
          <option>Price</option>
          <option>$0 - $20</option>
          <option>$20 - $50</option>
          <option>$50+</option>
        </select>
        <select class="filter-select">
          <option>Service</option>
          <option>专业指导</option>
          <option>娱乐陪伴</option>
          <option>组队开黑</option>
        </select>
      </div>

      <div class="slider-filter">
        <div class="slider-group">
          <label class="slider-label">Price Range</label>
          <input type="range" min="0" max="100" value="100" class="price-slider" />
          <div class="slider-values">
            <span>$0</span>
            <span>$100</span>
          </div>
        </div>

        <div class="slider-group">
          <label class="slider-label">Rating</label>
          <input type="range" min="0" max="100" value="100" class="rating-slider" />
          <div class="slider-values">
            <span>0</span>
            <span>100</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 陪玩列表 -->
    <div class="section-title">
      <h2>Companions</h2>
    </div>
    <div class="companions-grid">
      <div class="companion-card" v-for="companion in companions" :key="companion.id">
        <img :src="companion.avatar" alt="{{ companion.name }}" class="companion-img" />
        <div class="companion-name">{{ companion.name }}</div>
        <div :class="['companion-status', companion.status]">{{ companion.status === 'online' ? 'Online' : 'Offline' }}</div>
        <button class="book-btn" @click="goToBooking(companion.id)">立即预约</button>
      </div>
    </div>

    <!-- 分页控件 -->
    <div class="pagination">
      <button class="page-btn prev"><</button>
      <button class="page-btn active">1</button>
      <button class="page-btn">2</button>
      <button class="page-btn">3</button>
      <button class="page-btn">4</button>
      <button class="page-btn">5</button>
      <button class="page-btn next">></button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();

// 模拟统计数据
const stats = ref({
  completedOrders: 12,
  balance: 258,
  rating: 4.8
});

// 模拟陪玩师数据
const companions = ref([
  {
    id: 1,
    name: 'Sarah',
    avatar: 'https://randomuser.me/api/portraits/women/1.jpg',
    status: 'online'
  },
  {
    id: 2,
    name: 'Emily',
    avatar: 'https://randomuser.me/api/portraits/women/2.jpg',
    status: 'offline'
  },
  {
    id: 3,
    name: 'Jessica',
    avatar: 'https://randomuser.me/api/portraits/women/3.jpg',
    status: 'online'
  },
  {
    id: 4,
    name: 'Olivia',
    avatar: 'https://randomuser.me/api/portraits/women/4.jpg',
    status: 'online'
  },
  {
    id: 5,
    name: 'Sophia',
    avatar: 'https://randomuser.me/api/portraits/women/5.jpg',
    status: 'offline'
  },
  {
    id: 6,
    name: 'Ava',
    avatar: 'https://randomuser.me/api/portraits/women/6.jpg',
    status: 'online'
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

/* 搜索筛选区域 */
.search-filters {
  background-color: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 30px;
}

.search-input-large {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 1rem;
  margin-bottom: 20px;
  background-color: #ffffff;
  outline: none;
}

.filter-dropdowns {
  display: flex;
  gap: 15px;
  margin-bottom: 20px;
}

.filter-select {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #ffffff;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' fill='%23666' viewBox='0 0 16 16'%3E%3Cpath d='M8 11.5a.5.5 0 0 1-.707 0L3.5 7.793a.5.5 0 1 1 .707-.707L8 10.293l3.793-3.707a.5.5 0 1 1 .707.707L8 11.5z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 10px center;
  background-size: 12px;
}

.slider-filter {
  display: flex;
  gap: 20px;
}

.slider-group {
  flex: 1;
}

.slider-label {
  display: block;
  font-size: 0.9rem;
  color: #666666;
  margin-bottom: 10px;
}

.price-slider, .rating-slider {
  width: 100%;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: #e0e0e0;
  outline: none;
  border-radius: 5px;
}

.price-slider::-webkit-slider-thumb, .rating-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #333333;
  cursor: pointer;
}

.slider-values {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
  color: #666666;
  margin-top: 5px;
}

/* 陪玩列表 */
.section-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #333333;
  margin-bottom: 20px;
}

.companions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
}

.companion-card {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
  display: flex;
  flex-direction: column;
}

.companion-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.companion-img {
  width: 100%;
  height: 220px;
  object-fit: cover;
}

.companion-name {
  padding: 10px;
  font-size: 0.95rem;
  font-weight: 500;
  color: #333333;
  text-align: center;
}

.companion-status {
  font-size: 0.8rem;
  padding: 3px 0;
  text-align: center;
  margin-bottom: 10px;
}

.online {
  color: #4caf50;
}

offline {
  color: #9e9e9e;
}

.book-btn {
  margin: 0 10px 10px;
  padding: 8px;
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

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
  margin-top: 20px;
}

.page-btn {
  width: 36px;
  height: 36px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  transition: all 0.2s;
}

.page-btn:hover:not(.active) {
  border-color: #ccc;
  background-color: #f8f9fa;
}

.page-btn.active {
  background-color: #333333;
  color: #ffffff;
  border-color: #333333;
}

.prev, .next {
  font-weight: bold;
}
</style>