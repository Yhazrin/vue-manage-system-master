<template>
  <div class="login-bg">
    <div class="login-logo">
      <img src="/logo.svg" alt="logo" />
      <h1>陪玩平台</h1>
      <p>连接玩家，分享快乐</p>
    </div>
    <div class="login-card">
      <h2>登录</h2>
      <p class="login-desc">选择您的角色并登录到平台</p>
      <el-form>
        <el-form-item label="角色">
          <el-select v-model="role" class="w-full">
            <el-option label="普通用户" value="USER" />
            <el-option label="陪玩师" value="COMPANION" />
            <el-option label="管理员" value="ADMIN" />
          </el-select>
        </el-form-item>
        <el-form-item label="邮箱">
          <input v-model="email" type="email" class="login-input" placeholder="user1@example.com" />
        </el-form-item>
        <el-form-item label="密码">
          <input v-model="password" type="password" class="login-input" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item>
          <button class="login-btn" @click.prevent="onLogin">登录</button>
        </el-form-item>
      </el-form>
      <div class="login-footer">
        还没有账号？<router-link to="/register" class="login-link">立即注册</router-link>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const role = ref('USER')
const email = ref('')
const password = ref('')
const router = useRouter()
const onLogin = () => {
  // 登录逻辑
  if (role.value === 'USER') {
    router.push('/user')
  } else if (role.value === 'COMPANION') {
    router.push('/companion')
  } else if (role.value === 'ADMIN') {
    router.push('/admin')
  }
}
</script>
<style scoped>
.login-bg {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%);
}
.login-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2.5rem;
}
.login-logo img {
  width: 80px;
  height: 80px;
  margin-bottom: 0.5rem;
}
.login-logo h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #22223b;
}
.login-logo p {
  color: #6b7280;
  font-size: 1rem;
}
.login-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(31, 41, 55, 0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.login-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: left;
}
.login-desc {
  color: #6b7280;
  font-size: 1rem;
  margin-bottom: 1.5rem;
  text-align: left;
}
.login-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  font-size: 1rem;
  background: #f9fafb;
  color: #22223b;
  margin-bottom: 0.25rem;
  transition: border-color 0.2s;
}
.login-input:focus {
  border-color: #f97316;
  outline: none;
  background: #fff;
}
.login-btn {
  width: 100%;
  padding: 0.75rem 0;
  background: #22223b;
  color: #fff;
  border: none;
  border-radius: 0.5rem;
  font-size: 1.1rem;
  font-weight: 600;
  margin-top: 0.5rem;
  cursor: pointer;
  transition: background 0.2s;
}
.login-btn:hover {
  background: #f97316;
}
.login-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #6b7280;
}
.login-link {
  color: #f97316;
  font-weight: 500;
  margin-left: 0.25rem;
  text-decoration: none;
}
.login-link:hover {
  text-decoration: underline;
}
</style>
