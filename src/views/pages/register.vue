<template>
  <div class="register-bg">
    <div class="register-logo">
      <img src="/logo.svg" alt="logo" />
      <h1>陪玩平台</h1>
      <p>连接玩家，分享快乐</p>
    </div>
    <div class="register-card">
      <h2>创建账户</h2>
      <el-steps :active="step" finish-status="success" class="mb-6">
        <el-step title="基本信息" />
        <el-step title="选择角色" />
      </el-steps>
      <el-form v-if="step === 0">
        <el-form-item label="邮箱">
          <input v-model="email" type="email" class="register-input" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="密码">
          <input v-model="password" type="password" class="register-input" placeholder="请输入密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <input v-model="confirmPassword" type="password" class="register-input" placeholder="请再次输入密码" />
        </el-form-item>
        <el-form-item>
          <button class="register-btn" @click.prevent="nextStep">下一步</button>
        </el-form-item>
      </el-form>
      <div v-else>
        <div class="flex gap-4 mb-6">
          <div :class="['register-role-card', role==='USER' ? 'active' : '']" @click="role='USER'">
            <div class="role-title">普通用户</div>
            <div class="role-desc">浏览、下单、评价、送礼</div>
          </div>
          <div :class="['register-role-card', role==='COMPANION' ? 'active' : '']" @click="role='COMPANION'">
            <div class="role-title">陪玩师</div>
            <div class="role-desc">接单、服务、提现</div>
          </div>
        </div>
        <button class="register-btn" @click.prevent="onRegister">完成注册</button>
      </div>
      <div class="register-footer">
        已有账户？<router-link to="/login" class="register-link">立即登录</router-link>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
const step = ref(0)
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const role = ref('USER')
const router = useRouter()
const nextStep = () => {
  if (!email.value || !password.value || password.value !== confirmPassword.value) return
  step.value = 1
}
const onRegister = () => {
  // 注册逻辑
  router.push('/login')
}
</script>
<style scoped>
.register-bg {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f3f4f6 0%, #e0e7ff 100%);
}
.register-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 2.5rem;
}
.register-logo img {
  width: 80px;
  height: 80px;
  margin-bottom: 0.5rem;
}
.register-logo h1 {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
  color: #22223b;
}
.register-logo p {
  color: #6b7280;
  font-size: 1rem;
}
.register-card {
  background: #fff;
  border-radius: 1rem;
  box-shadow: 0 8px 32px 0 rgba(31, 41, 55, 0.08);
  padding: 2.5rem 2rem 2rem 2rem;
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: stretch;
}
.register-card h2 {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  text-align: left;
}
.register-input {
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
.register-input:focus {
  border-color: #f97316;
  outline: none;
  background: #fff;
}
.register-btn {
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
.register-btn:hover {
  background: #f97316;
}
.flex {
  display: flex;
}
.gap-4 {
  gap: 1rem;
}
.mb-6 {
  margin-bottom: 1.5rem;
}
.register-role-card {
  background: #f9fafb;
  border-radius: 0.75rem;
  box-shadow: 0 2px 8px 0 rgba(31, 41, 55, 0.04);
  border: 2px solid transparent;
  flex: 1;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.register-role-card.active {
  border-color: #f97316;
  box-shadow: 0 4px 16px 0 rgba(249, 115, 22, 0.08);
  background: #fff7ed;
}
.role-title {
  font-size: 1.1rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}
.role-desc {
  color: #6b7280;
  font-size: 0.95rem;
}
.register-footer {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.95rem;
  color: #6b7280;
}
.register-link {
  color: #f97316;
  font-weight: 500;
  margin-left: 0.25rem;
  text-decoration: none;
}
.register-link:hover {
  text-decoration: underline;
}
</style>
