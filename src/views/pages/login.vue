<template>
  <div class="login-container">
    <div class="login-bg"></div>
    <div class="login-card">
      <div class="login-header">
        <img src="/logo.svg" alt="GameCompanion Logo" class="logo" />
        <h1 class="title">GameCompanion</h1>
        <p class="subtitle">找到你的完美游戏伙伴</p>
      </div>
      
      <div class="login-form">
        <h2 class="form-title">账号登录</h2>
        
        <!-- 角色选择卡片 -->
        <div class="role-selection">
          <div class="role-tabs">
            <div 
              class="role-tab" 
              :class="{ 'active-user': loginForm.role === 'USER', 'active': loginForm.role === 'USER' }"
              @click="selectRole('USER')"
            >
              普通用户
            </div>
            <div 
              class="role-tab"
              :class="{ 'active-companion': loginForm.role === 'COMPANION', 'active': loginForm.role === 'COMPANION' }"
              @click="selectRole('COMPANION')"
            >
              陪玩师
            </div>
            <div 
              class="role-tab"
              :class="{ 'active-admin': loginForm.role === 'ADMIN', 'active': loginForm.role === 'ADMIN' }"
              @click="selectRole('ADMIN')"
            >
              管理员
            </div>
          </div>
        </div>
        
        <el-form ref="loginFormRef" :model="loginForm" :rules="rules" class="form-container">
          <el-form-item prop="phone">
            <div class="input-group">
              <el-icon class="input-icon"><User /></el-icon>
              <input
                v-model="loginForm.phone"
                type="tel"
                placeholder="请输入手机号"
                class="custom-input w-full"
              />
            </div>
          </el-form-item>
          <el-form-item prop="password">
            <div class="input-group">
              <el-icon class="input-icon"><Lock /></el-icon>
              <input
                v-model="loginForm.password"
                type="password"
                placeholder="请输入密码"
                class="custom-input w-full"
              />
            </div>
          </el-form-item>
          <div class="form-options">
            <label class="remember-me">
              <input type="checkbox" v-model="rememberMe" class="checkbox" />
              <span>记住我</span>
            </label>
            <a href="#" class="forgot-password">忘记密码?</a>
          </div>
          <el-form-item>
            <button @click.prevent="handleLogin" class="login-btn" :style="getLoginBtnStyle">登录</button>
          </el-form-item>
        </el-form>
      </div>
      <div class="login-footer">
        <p>还没有账号? <router-link to="/register" class="register-link">立即注册</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { User, Lock } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';

const loginFormRef = ref<FormInstance>();
const loginForm = reactive({
  role: 'USER',
  phone: '',
  password: ''
});

const rememberMe = ref(false);
const router = useRouter();

// 角色选择方法
const selectRole = (role: string) => {
  console.log('选择角色:', role);
  loginForm.role = role;
  console.log('当前角色:', loginForm.role);
};

// 根据角色获取登录按钮样式
const getLoginBtnStyle = computed(() => {
  console.log('计算按钮样式，当前角色:', loginForm.role);
  switch(loginForm.role) {
    case 'USER':
      return { backgroundColor: '#4c6ef5' };
    case 'COMPANION':
      return { backgroundColor: '#38b2ac' };
    case 'ADMIN':
      return { backgroundColor: '#805ad5' };
    default:
      return { backgroundColor: '#4c6ef5' };
  }
});

const rules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ]
};

const handleLogin = async () => {
  if (!loginFormRef.value) return;
  
  try {
    await loginFormRef.value.validate();
    console.log('表单验证通过，准备登录，角色:', loginForm.role);
    
    // 保存角色到本地存储
    localStorage.setItem('role', loginForm.role);
    
    // 根据角色跳转到不同主页
    if (loginForm.role === 'USER') {
      router.push('/user');
    } else if (loginForm.role === 'COMPANION') {
      router.push('/companion');
    } else if (loginForm.role === 'ADMIN') {
      router.push('/admin');
    }
  } catch (error) {
    console.error('表单验证失败:', error);
  }
};
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  background: linear-gradient(135deg, #F6F9FC 0%, #EDF2F7 100%);
}

.login-bg {
  display: none;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 420px;
  padding: 3rem 2.5rem;
  z-index: 1;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
  background-color: #6B46C1;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #6B46C1;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  font-size: 1rem;
  color: #718096;
  text-align: center;
  margin-bottom: 2rem;
}

.form-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2D3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

/* 角色选择卡片样式 */
.role-selection {
  margin-bottom: 1.5rem;
}

.role-tabs {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e2e8f0;
  background-color: #f7fafc;
}

.role-tab {
  flex: 1;
  padding: 0.75rem 0;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  user-select: none;
  position: relative;
  z-index: 10;
}

.role-tab:not(.active) {
  background-color: transparent;
  color: #718096;
}

.role-tab:hover:not(.active) {
  background-color: rgba(0, 0, 0, 0.02);
  color: #4a5568;
}

.role-tab.active {
  color: white;
  font-weight: 600;
  transform: translateY(1px);
}

/* 不同角色的颜色 */
.role-tab.active-user {
  background-color: #4c6ef5; /* 普通用户蓝色 */
}

.role-tab.active-companion {
  background-color: #38b2ac; /* 陪玩师青色 */
}

.role-tab.active-admin {
  background-color: #805ad5; /* 管理员紫色 */
}

/* 表单样式 */
.form-container {
  width: 100%;
  margin-top: 1rem;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #a0aec0;
  z-index: 10;
}

.custom-input {
  width: 100%;
  padding: 12px 12px 12px 40px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.3s ease;
}

.custom-input:focus {
  outline: none;
  border-color: #4c6ef5;
  box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
}

.form-options {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.remember-me {
  display: flex;
  align-items: center;
  font-size: 0.9rem;
  color: #4a5568;
  cursor: pointer;
}

.checkbox {
  margin-right: 8px;
}

.forgot-password {
  font-size: 0.9rem;
  color: #4c6ef5;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
}

/* 登录按钮样式 */
.login-btn {
  width: 100%;
  height: 48px;
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.login-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.login-btn:active {
  transform: translateY(0);
}

.login-footer {
  text-align: center;
  font-size: 0.95rem;
  color: #718096;
  margin-top: 1.5rem;
}

.register-link {
  color: #4c6ef5;
  font-weight: 500;
  text-decoration: none;
}

.register-link:hover {
  text-decoration: underline;
}
</style>