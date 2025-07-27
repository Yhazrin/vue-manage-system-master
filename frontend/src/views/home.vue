<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="main-header">
      <div class="header-content">
        <div class="logo">
          <img src="/src/assets/img/logo.svg" alt="GameOn" class="logo-img" />
          <span class="logo-text">GameOn</span>
        </div>
        <div class="search-bar">
          <input type="text" placeholder="Search by nickname or game" class="search-input" />
        </div>
        <div class="user-actions">
          <button class="action-btn notification"><i class="bell-icon"></i></button>
          <div class="profile">
            <img src="https://randomuser.me/api/portraits/women/64.jpg" alt="User" class="profile-img" />
          </div>
        </div>
      </div>
    </header>

    <!-- 主内容区 -->
    <main class="main-content">
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
      <div class="section-title">Companions</div>
      <div class="companions-grid">
        <!-- 陪玩卡片 1 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="Sarah" class="companion-img" />
          <div class="companion-name">Sarah</div>
          <div class="companion-status online">Online</div>
        </div>

        <!-- 陪玩卡片 2 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="Emily" class="companion-img" />
          <div class="companion-name">Emily</div>
          <div class="companion-status offline">Offline</div>
        </div>

        <!-- 陪玩卡片 3 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/3.jpg" alt="Jessica" class="companion-img" />
          <div class="companion-name">Jessica</div>
          <div class="companion-status online">Online</div>
        </div>

        <!-- 陪玩卡片 4 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/4.jpg" alt="Olivia" class="companion-img" />
          <div class="companion-name">Olivia</div>
          <div class="companion-status online">Online</div>
        </div>

        <!-- 陪玩卡片 5 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/5.jpg" alt="Sophia" class="companion-img" />
          <div class="companion-name">Sophia</div>
          <div class="companion-status offline">Offline</div>
        </div>

        <!-- 陪玩卡片 6 -->
        <div class="companion-card">
          <img src="https://randomuser.me/api/portraits/women/6.jpg" alt="Ava" class="companion-img" />
          <div class="companion-name">Ava</div>
          <div class="companion-status online">Online</div>
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
    </main>
  </div>
</template>

<style scoped>
/* 全局样式 */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
}

.home-container {
  min-height: 100vh;
  background-color: #ffffff;
}

/* 顶部导航栏 */
.main-header {
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding: 10px 0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.logo {
  display: flex;
  align-items: center;
}

.logo-img {
  width: 24px;
  height: 24px;
  margin-right: 8px;
}

.logo-text {
  font-size: 1.1rem;
  font-weight: 600;
  color: #333333;
}

.search-bar {
  flex: 0 1 400px;
}

.search-input {
  width: 100%;
  padding: 8px 15px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  font-size: 0.9rem;
  background-color: #f8f9fa;
  outline: none;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 20px;
}

.action-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666666;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.2s;
}

.action-btn:hover {
  background-color: #f1f3f5;
}

.profile-img {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  object-fit: cover;
  cursor: pointer;
}

/* 主内容区 */
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
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
  cursor: pointer;
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

/* 分页控件 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 5px;
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
</template>
