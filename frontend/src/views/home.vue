<template>
  <div class="home-container">
    <!-- 顶部导航栏 -->
    <header class="main-header">
      <div class="header-content">
        <div class="logo">
          <img src="/logo.svg" alt="GameCompanion" class="logo-img" />
          <span class="logo-text">GameCompanion</span>
        </div>
        <div class="search-bar">
          <input type="text" placeholder="搜索陪玩..." class="search-input" />
          <button class="search-btn">
            <i class="search-icon"></i>
          </button>
        </div>
        <div class="user-actions">
          <div class="dropdown">
            <button class="dropdown-btn">玩家 <i class="dropdown-icon"></i></button>
          </div>
          <button class="action-btn"><i class="message-icon"></i></button>
          <button class="action-btn"><i class="booking-icon"></i></button>
          <button class="action-btn"><i class="profile-icon"></i></button>
        </div>
      </div>
    </header>

    <!-- 标签页导航 -->
    <div class="tabs-nav">
      <div class="tabs-container">
        <button class="tab-btn active">发现</button>
        <button class="tab-btn">我的预约</button>
        <button class="tab-btn">收藏</button>
        <button class="tab-btn">个人资料</button>
      </div>
    </div>

    <!-- 主内容区 -->
    <main class="main-content">
      <!-- 标题区域 -->
      <div class="title-section">
        <h1 class="section-title">寻找你的完美游戏陪玩</h1>
        <p class="section-subtitle">搜索和筛选我们的专业游戏陪玩</p>
      </div>

      <!-- 搜索筛选区域 -->
      <div class="search-filters">
        <div class="filter-group">
          <input type="text" placeholder="搜索陪玩或游戏..." class="filter-input" />
          <select class="filter-select">
            <option>所有游戏</option>
            <option>王者荣耀</option>
            <option>英雄联盟</option>
            <option>CS:GO</option>
          </select>
          <select class="filter-select">
            <option>所有服务</option>
            <option>专业指导</option>
            <option>娱乐陪伴</option>
            <option>组队开黑</option>
          </select>
        </div>
        <div class="price-range">
          <span class="price-label">价格范围: $10 - $50/小时</span>
          <input type="range" min="10" max="50" value="50" class="price-slider" />
        </div>
      </div>

      <!-- 陪玩列表 -->
      <div class="companions-grid">
        <!-- 陪玩卡片 1 -->
        <div class="companion-card">
          <div class="card-header">
            <div class="badge">专业</div>
            <img src="https://randomuser.me/api/portraits/men/1.jpg" alt="Alex" class="avatar" />
            <div class="rating">
              <span class="star">★</span> 4.9
              <span class="reviews">(127条评价)</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="name">专业玩家_Alex</h3>
            <p class="description">专业FPS玩家，拥有5年以上经验。专注于战术射击游戏团队协作。</p>
            <div class="info-group">
              <div class="info-item">
                <h4>游戏</h4>
                <div class="tags">
                  <span class="tag">无契约</span>
                  <span class="tag">CS:GO</span>
                  <span class="tag">Apex英雄</span>
                </div>
              </div>
              <div class="info-item">
                <h4>服务</h4>
                <div class="tags">
                  <span class="tag">教学</span>
                  <span class="tag">组队</span>
                  <span class="tag">段位提升</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="price">$25<span class="unit">/小时</span></div>
            <div class="actions">
              <button class="favorite-btn"><i class="heart-icon"></i></button>
              <button class="book-btn">立即预约</button>
            </div>
            <div class="status online">在线</div>
          </div>
        </div>

        <!-- 陪玩卡片 2 -->
        <div class="companion-card">
          <div class="card-header">
            <div class="badge">策略</div>
            <img src="https://randomuser.me/api/portraits/women/1.jpg" alt="Sarah" class="avatar" />
            <div class="rating">
              <span class="star">★</span> 4.8
              <span class="reviews">(89条评价)</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="name">策略大师_Sarah</h3>
            <p class="description">MOBA专家和前锦标赛选手。专注于宏策略和个人技能发展。</p>
            <div class="info-group">
              <div class="info-item">
                <h4>游戏</h4>
                <div class="tags">
                  <span class="tag">英雄联盟</span>
                  <span class="tag">Dota 2</span>
                  <span class="tag">王者荣耀</span>
                </div>
              </div>
              <div class="info-item">
                <h4>服务</h4>
                <div class="tags">
                  <span class="tag">策略教学</span>
                  <span class="tag">位置训练</span>
                  <span class="tag">BP分析</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="price">$30<span class="unit">/小时</span></div>
            <div class="actions">
              <button class="favorite-btn"><i class="heart-icon"></i></button>
              <button class="book-btn">立即预约</button>
            </div>
            <div class="status online">在线</div>
          </div>
        </div>

        <!-- 陪玩卡片 3 -->
        <div class="companion-card">
          <div class="card-header">
            <div class="badge">娱乐</div>
            <img src="https://randomuser.me/api/portraits/men/2.jpg" alt="Mike" class="avatar" />
            <div class="rating">
              <span class="star">★</span> 4.7
              <span class="reviews">(203条评价)</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="name">娱乐玩家_Mike</h3>
            <p class="description">友好的玩家，专注于为各个技能水平的玩家创造有趣和引人入胜的体验。</p>
            <div class="info-group">
              <div class="info-item">
                <h4>游戏</h4>
                <div class="tags">
                  <span class="tag">我的世界</span>
                  <span class="tag">Among Us</span>
                  <span class="tag">糖豆人</span>
                </div>
              </div>
              <div class="info-item">
                <h4>服务</h4>
                <div class="tags">
                  <span class="tag">娱乐对局</span>
                  <span class="tag">团体活动</span>
                  <span class="tag">休闲娱乐</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="price">$15<span class="unit">/小时</span></div>
            <div class="actions">
              <button class="favorite-btn"><i class="heart-icon"></i></button>
              <button class="book-btn">立即预约</button>
            </div>
            <div class="status offline">离线</div>
          </div>
        </div>

        <!-- 陪玩卡片 4 -->
        <div class="companion-card">
          <div class="card-header">
            <div class="badge">RPG</div>
            <img src="https://randomuser.me/api/portraits/women/2.jpg" alt="Lisa" class="avatar" />
            <div class="rating">
              <span class="star">★</span> 4.9
              <span class="reviews">(156条评价)</span>
            </div>
          </div>
          <div class="card-body">
            <h3 class="name">RPG专家_Lisa</h3>
            <p class="description">MMORPG资深玩家，对游戏机制、背景故事和高效升级策略有深入了解。</p>
            <div class="info-group">
              <div class="info-item">
                <h4>游戏</h4>
                <div class="tags">
                  <span class="tag">魔兽世界</span>
                  <span class="tag">最终幻想XIV</span>
                  <span class="tag">上古卷轴Online</span>
                </div>
              </div>
              <div class="info-item">
                <h4>服务</h4>
                <div class="tags">
                  <span class="tag">副本通关</span>
                  <span class="tag">升级</span>
                  <span class="tag">剧情推进</span>
                </div>
              </div>
            </div>
          </div>
          <div class="card-footer">
            <div class="price">$35<span class="unit">/小时</span></div>
            <div class="actions">
              <button class="favorite-btn"><i class="heart-icon"></i></button>
              <button class="book-btn">立即预约</button>
            </div>
            <div class="status busy">忙碌</div>
          </div>
        </div>
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
  background-color: #f8f9fa;
}

/* 顶部导航栏 */
.main-header {
  background-color: #ffffff;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
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
  width: 32px;
  height: 32px;
  margin-right: 10px;
}

.logo-text {
  font-size: 1.2rem;
  font-weight: bold;
  color: #333333;
}

.search-bar {
  display: flex;
  align-items: center;
  background-color: #f1f3f5;
  border-radius: 20px;
  padding: 6px 15px;
  width: 350px;
}

.search-input {
  flex: 1;
  border: none;
  background: transparent;
  outline: none;
  font-size: 0.95rem;
  padding: 5px 0;
}

.search-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #666666;
}

.user-actions {
  display: flex;
  align-items: center;
  gap: 15px;
}

.dropdown {
  position: relative;
}

.dropdown-btn {
  display: flex;
  align-items: center;
  border: none;
  background: transparent;
  font-size: 0.95rem;
  color: #333333;
  cursor: pointer;
  gap: 5px;
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

/* 标签页导航 */
.tabs-nav {
  background-color: #ffffff;
  border-bottom: 1px solid #e9ecef;
}

.tabs-container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 20px;
  display: flex;
}

.tab-btn {
  border: none;
  background: transparent;
  padding: 15px 20px;
  font-size: 0.95rem;
  color: #666666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
}

.tab-btn.active {
  color: #4c6ef5;
  border-bottom-color: #4c6ef5;
  font-weight: 500;
}

.tab-btn:hover:not(.active) {
  color: #333333;
  border-bottom-color: #e9ecef;
}

/* 主内容区 */
.main-content {
  max-width: 1280px;
  margin: 0 auto;
  padding: 20px;
}

.title-section {
  margin-bottom: 25px;
}

.section-title {
  font-size: 1.8rem;
  color: #212529;
  margin-bottom: 8px;
}

.section-subtitle {
  font-size: 1rem;
  color: #6c757d;
}

/* 搜索筛选区域 */
.search-filters {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 25px;
}

.filter-group {
  display: flex;
  gap: 15px;
  margin-bottom: 15px;
}

.filter-input {
  flex: 1;
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
}

.filter-select {
  padding: 10px 15px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.95rem;
  background-color: #ffffff;
  cursor: pointer;
}

.price-range {
  display: flex;
  align-items: center;
  gap: 15px;
}

.price-label {
  font-size: 0.9rem;
  color: #6c757d;
  width: 180px;
}

.price-slider {
  flex: 1;
  height: 5px;
  -webkit-appearance: none;
  appearance: none;
  background: #e9ecef;
  outline: none;
  border-radius: 5px;
}

.price-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #4c6ef5;
  cursor: pointer;
}

/* 陪玩列表 */
.companions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.companion-card {
  background-color: #ffffff;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: transform 0.2s, box-shadow 0.2s;
}

.companion-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
}

.card-header {
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.badge {
  position: absolute;
  top: 10px;
  left: 10px;
  background-color: #4c6ef5;
  color: #ffffff;
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 12px;
}

.avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  margin-bottom: 10px;
  border: 3px solid #f8f9fa;
}

.rating {
  display: flex;
  align-items: center;
  gap: 5px;
}

.star {
  color: #ffc107;
}

.reviews {
  font-size: 0.8rem;
  color: #6c757d;
}

.card-body {
  padding: 15px;
}

.name {
  font-size: 1.1rem;
  font-weight: 600;
  color: #212529;
  margin-bottom: 8px;
}

.description {
  font-size: 0.9rem;
  color: #6c757d;
  margin-bottom: 15px;
  line-height: 1.4;
}

.info-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.info-item h4 {
  font-size: 0.85rem;
  color: #495057;
  margin-bottom: 5px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.tag {
  background-color: #e9ecef;
  color: #495057;
  font-size: 0.75rem;
  padding: 3px 8px;
  border-radius: 4px;
}

.card-footer {
  padding: 15px;
  border-top: 1px solid #e9ecef;
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;
}

.price {
  font-size: 1.1rem;
  font-weight: 600;
  color: #4c6ef5;
}

.unit {
  font-size: 0.8rem;
  font-weight: normal;
  color: #6c757d;
}

.actions {
  display: flex;
  gap: 10px;
}

.favorite-btn {
  border: none;
  background: transparent;
  cursor: pointer;
  color: #6c757d;
  transition: color 0.2s;
}

.favorite-btn:hover {
  color: #fa5252;
}

.book-btn {
  border: none;
  background-color: #4c6ef5;
  color: #ffffff;
  padding: 6px 12px;
  border-radius: 4px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.book-btn:hover {
  background-color: #3b5bdb;
}

.status {
  position: absolute;
  right: 15px;
  top: -10px;
  font-size: 0.75rem;
  padding: 2px 8px;
  border-radius: 10px;
  background-color: #e9ecef;
}

.status.online {
  background-color: #e6f7ee;
  color: #36d399;
}

.status.offline {
  background-color: #f8f9fa;
  color: #6c757d;
}

.status.busy {
  background-color: #fff8e6;
  color: #ffab00;
}

/* 图标样式 (实际项目中可使用Font Awesome等图标库) */
.search-icon::before { content: "🔍"; }
.dropdown-icon::before { content: "▼"; font-size: 0.7rem; }
.message-icon::before { content: "💬"; }
.booking-icon::before { content: "📅"; }
.profile-icon::before { content: "👤"; }
.heart-icon::before { content: "♡"; }
</style>
