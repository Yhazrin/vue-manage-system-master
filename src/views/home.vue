<template>
  <div class="home-bg">
    <nav class="home-navbar">
      <div class="navbar-container">
        <img src="/logo.svg" alt="logo" class="navbar-logo" />
        <span class="navbar-title">陪玩平台</span>
        <div class="navbar-actions">
          <router-link to="/login" class="navbar-btn">登录</router-link>
          <router-link to="/register" class="navbar-btn navbar-btn-primary">注册</router-link>
        </div>
      </div>
    </nav>
    <section class="home-hero">
      <h1 class="hero-title">找到你的完美陪玩</h1>
      <p class="hero-subtitle">专业陪玩师，为你提供温馨陪伴</p>
      <div class="hero-cta">
        <router-link to="/register" class="hero-btn">立即注册</router-link>
        <router-link to="/login" class="hero-btn hero-btn-outline">登录</router-link>
      </div>
    </section>
    <section class="home-search">
      <input class="search-input" placeholder="搜索陪玩昵称/游戏名称..." />
      <select class="search-select"><option>全部技能</option></select>
      <select class="search-select"><option>默认排序</option></select>
    </section>
    <section class="home-list">
      <div class="companions-grid">
        <div v-for="i in 8" :key="i" class="companion-card">
          <img class="companion-avatar" src="https://randomuser.me/api/portraits/women/1.jpg" />
          <div class="companion-info">
            <div class="companion-name">小美</div>
            <div class="companion-tags">
              <span class="companion-tag">王者荣耀</span>
              <span class="companion-tag">聊天</span>
            </div>
            <div class="companion-meta">
              <span class="companion-price">￥50/小时</span>
              <span class="companion-status online">在线</span>
            </div>
            <router-link to="/common/CompanionDetail" class="companion-detail-btn">查看详情</router-link>
          </div>
        </div>
      </div>
    </section>
    <footer class="home-footer">
      <div>关于我们 | 联系方式 | 版权信息</div>
      <div>© 2024 陪玩平台</div>
    </footer>
  </div>
</template>
<style scoped>
.home-bg {
  min-height: 100vh;
  background: linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%);
}
.home-navbar {
  background: #fff;
  border-bottom: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px 0 rgba(31,41,55,0.04);
}
.navbar-container {
  max-width: 1280px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 1.5rem;
  justify-content: space-between;
}
.navbar-logo {
  width: 40px;
  height: 40px;
  margin-right: 0.5rem;
}
.navbar-title {
  font-size: 1.5rem;
  font-weight: bold;
  color: #22223b;
}
.navbar-actions {
  display: flex;
  gap: 1rem;
}
.navbar-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 0.5rem;
  background: #f3f4f6;
  color: #22223b;
  font-weight: 500;
  text-decoration: none;
  transition: background 0.2s;
}
.navbar-btn:hover {
  background: #f97316;
  color: #fff;
}
.navbar-btn-primary {
  background: #f97316;
  color: #fff;
}
.home-hero {
  text-align: center;
  padding: 4rem 1rem 2rem 1rem;
}
.hero-title {
  font-size: 2.5rem;
  font-weight: bold;
  color: #22223b;
  margin-bottom: 1rem;
}
.hero-subtitle {
  color: #6b7280;
  font-size: 1.25rem;
  margin-bottom: 2rem;
}
.hero-cta {
  display: flex;
  justify-content: center;
  gap: 1rem;
}
.hero-btn {
  padding: 0.75rem 2rem;
  border-radius: 0.5rem;
  background: #f97316;
  color: #fff;
  font-size: 1.1rem;
  font-weight: 600;
  text-decoration: none;
  transition: background 0.2s;
}
.hero-btn-outline {
  background: #fff;
  color: #f97316;
  border: 2px solid #f97316;
}
.hero-btn:hover, .hero-btn-outline:hover {
  background: #ea580c;
  color: #fff;
}
.home-search {
  display: flex;
  gap: 1rem;
  justify-content: center;
  align-items: center;
  margin: 2rem 0 1.5rem 0;
}
.search-input {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  width: 260px;
}
.search-select {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
}
.home-list {
  max-width: 1280px;
  margin: 0 auto 2rem auto;
  padding: 0 1.5rem;
}
.companions-grid {
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 2rem;
}
@media (min-width: 640px) {
  .companions-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (min-width: 1024px) {
  .companions-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (min-width: 1280px) {
  .companions-grid { grid-template-columns: repeat(4, 1fr); }
}
.companion-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 2px 8px 0 rgba(31,41,55,0.08);
  padding: 1.5rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  transition: box-shadow 0.2s, transform 0.2s;
}
.companion-card:hover {
  box-shadow: 0 8px 32px 0 rgba(249,115,22,0.12);
  transform: translateY(-4px);
}
.companion-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  margin-bottom: 1rem;
  object-fit: cover;
}
.companion-info {
  text-align: center;
}
.companion-name {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.companion-tags {
  margin-bottom: 0.5rem;
}
.companion-tag {
  display: inline-block;
  background: #f3f4f6;
  color: #f97316;
  border-radius: 0.5rem;
  padding: 0.2rem 0.75rem;
  font-size: 0.95rem;
  margin-right: 0.5rem;
}
.companion-meta {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 0.5rem;
  font-size: 0.95rem;
}
.companion-price {
  color: #f97316;
  font-weight: 600;
}
.companion-status {
  color: #22c55e;
  font-weight: 500;
}
.companion-status.online::before {
  content: '';
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  background: #22c55e;
  border-radius: 50%;
  margin-right: 0.3em;
}
.companion-detail-btn {
  display: inline-block;
  margin-top: 0.5rem;
  padding: 0.5rem 1.25rem;
  background: #f97316;
  color: #fff;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: background 0.2s;
}
.companion-detail-btn:hover {
  background: #ea580c;
}
.home-footer {
  background: #fff;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  padding: 2rem 0 1rem 0;
  color: #6b7280;
  font-size: 1rem;
}
</style>
