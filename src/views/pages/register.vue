<template>
  <div class="register-container">
    <div class="register-bg"></div>
    <div class="register-card">
      <div class="register-header">
        <img src="/logo.svg" alt="GameCompanion Logo" class="logo" />
        <h1 class="title">GameCompanion</h1>
        <p class="subtitle">找到你的完美游戏伙伴</p>
      </div>
      
      <div class="register-form">
        <h2 class="form-title">创建账号</h2>
        
        <el-steps :active="activeStep" finish-status="success" class="steps-bar mb-6">
          <el-step title="基本信息" />
          <el-step title="选择角色" />
        </el-steps>

        <div v-if="activeStep === 0">
          <el-form ref="basicFormRef" :model="basicForm" :rules="basicRules" class="form-container" autocomplete="off">
            <el-form-item prop="phone">
              <div class="input-group">
                <el-icon class="input-icon"><Phone /></el-icon>
                <input
                  v-model="basicForm.phone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="custom-input"
                  @input="handlePhoneInput"
                  ref="phoneInputRef"
                  autoFocus
                />
              </div>
            </el-form-item>

            <el-form-item prop="password">
              <div class="input-group">
                <el-icon class="input-icon"><Lock /></el-icon>
                <input
                  v-model="basicForm.password"
                  type="password"
                  placeholder="请设置密码"
                  class="custom-input"
                />
              </div>
            </el-form-item>

            <el-form-item prop="confirmPassword">
              <div class="input-group">
                <el-icon class="input-icon"><Lock /></el-icon>
                <input
                  v-model="basicForm.confirmPassword"
                  type="password"
                  placeholder="请确认密码"
                  class="custom-input"
                />
              </div>
            </el-form-item>

            <el-form-item>
              <button @click.prevent="nextStep" class="next-btn">下一步</button>
            </el-form-item>
          </el-form>
        </div>

        <div v-else-if="activeStep === 1">
          <el-form ref="roleFormRef" :model="roleForm" :rules="roleRules" class="form-container">
            <div class="role-selection">
              <h3 class="role-title">选择您的角色</h3>
              <p class="role-desc">选择适合您的角色，开始您的游戏之旅</p>

              <div class="role-cards">
                <div
                  :class="['role-card', roleForm.role === 'USER' ? 'active' : '']"
                  @click="selectRole('USER')"
                  :aria-pressed="roleForm.role === 'USER'"
                >
                  <div class="role-icon user-icon"></div>
                  <h4 class="card-title">普通用户</h4>
                  <p class="card-desc">浏览、下单、评价游戏陪玩服务</p>
                </div>

                <div
                  :class="['role-card', roleForm.role === 'COMPANION' ? 'active' : '']"
                  @click="selectRole('COMPANION')"
                  :aria-pressed="roleForm.role === 'COMPANION'"
                >
                  <div class="role-icon companion-icon"></div>
                  <h4 class="card-title">陪玩师</h4>
                  <p class="card-desc">提供游戏陪玩服务，赚取收入</p>
                </div>

                <div
                  :class="['role-card', roleForm.role === 'ADMIN' ? 'active' : '']"
                  @click="selectRole('ADMIN')"
                  :aria-pressed="roleForm.role === 'ADMIN'"
                >
                  <div class="role-icon admin-icon"></div>
                  <h4 class="card-title">管理员</h4>
                  <p class="card-desc">管理平台用户、订单和内容</p>
                </div>
              </div>
            </div>

            <el-form-item>
              <button @click.prevent="prevStep" class="prev-btn">上一步</button>
              <button @click.prevent="submitRegister" :loading="isLoading" class="register-btn">完成注册</button>
            </el-form-item>
          </el-form>
        </div>
      </div>

      <div class="register-footer">
        <p>已有账号? <router-link to="/login" class="login-link">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { Phone, Lock } from '@element-plus/icons-vue';
import { ElMessage } from 'element-plus';
import { register } from '../../api/index'; // 导入注册API

// 修复：删除无效文本并正确导入

const activeStep = ref(0);
const isLoading = ref(false);
const basicForm = reactive({
  phone: '',
  password: '',
  confirmPassword: ''
});

const roleForm = reactive({
  role: 'USER'
});

const router = useRouter();
// 修复：正确定义表单引用
const basicFormRef = ref<any>(null);
const roleFormRef = ref<any>(null);
const phoneInputRef = ref<any>(null);

// 优化：添加手机号格式化处理
const handlePhoneInput = (e: Event) => {
  let value = (e.target as HTMLInputElement).value;
  // 移除所有非数字字符
  value = value.replace(/\D/g, '');
  // 限制长度为11位
  if (value.length > 11) {
    value = value.substring(0, 11);
  }
  // 格式化手机号（如：138 1234 5678）
  if (value.length > 3 && value.length <= 7) {
    value = `${value.substring(0, 3)} ${value.substring(3)}`;
  } else if (value.length > 7) {
    value = `${value.substring(0, 3)} ${value.substring(3, 7)} ${value.substring(7)}`;
  }
  basicForm.phone = value;
};

// 优化：角色选择函数
const selectRole = (role: string) => {
  roleForm.role = role;
  // 添加选择动画效果
  const card = document.querySelector(`.role-card.active`);
  if (card) {
    card.classList.add('role-card-active-animation');
    setTimeout(() => {
      card.classList.remove('role-card-active-animation');
    }, 300);
  }
};

const basicRules = {
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' },
    { pattern: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/, message: '密码必须包含字母和数字', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== basicForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ]
};

const roleRules = {
  role: [
    { required: true, message: '请选择角色', trigger: 'change' }
  ]
};

// 修复：正确的表单验证方式
const nextStep = async () => {
  try {
    await basicFormRef.value.validate();
    activeStep.value = 1;
  } catch (error) {
    console.log('表单验证失败:', error);
  }
};

const prevStep = () => {
  activeStep.value = 0;
  // 返回时聚焦到手机号输入框
  setTimeout(() => {
    phoneInputRef.value?.focus();
  }, 300);
};

// 优化：添加组件挂载时的逻辑
onMounted(() => {
  // 获取URL参数中的角色类型
  const role = route.query.role as string;
  if (role && ['USER', 'COMPANION', 'ADMIN'].includes(role)) {
    roleForm.role = role;
  }
  // 确保输入框获得焦点
  setTimeout(() => {
    phoneInputRef.value?.focus();
  }, 300);
});

const submitRegister = async () => {
  isLoading.value = true;
  try {
    // 移除手机号中的空格
    const phone = basicForm.phone.replace(/\s/g, '');
    
    // 组合注册数据
    const registerData = {
      phone,
      password: basicForm.password,
      role: roleForm.role
    };

    // 调用注册API
    const response = await register(registerData);

    // 处理成功响应
    if (response.data.success) {
      ElMessage.success('注册成功，请登录');
      router.push('/login');
    } else {
      ElMessage.error(response.data.message || '注册失败，请重试');
    }
  } catch (error) {
    // 处理错误
    console.error('注册失败:', error);
    ElMessage.error('网络异常，请稍后重试');
  } finally {
    isLoading.value = false;
  }
};
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  width: 100vw;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.register-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7ff 0%, #e4e9ff 100%);
  z-index: 0;
}

/* 更新注册卡片样式 */
.register-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 580px;
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
}

/* 注册按钮样式 */
.next-btn, .register-btn {
  background: #6B46C1;
  color: white;
}

.next-btn:hover, .register-btn:hover {
  background: #553C9A;
}

.register-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.1);
}

.register-header {
  text-align: center;
  margin-bottom: 2.5rem;
}

.logo {
  width: 64px;
  height: 64px;
  margin: 0 auto 1rem;
}

.title {
  font-size: 1.8rem;
  font-weight: 700;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.subtitle {
  font-size: 1rem;
  color: #718096;
}

.register-form {
  margin-bottom: 1.5rem;
}

.form-title {
  font-size: 1.3rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 1.5rem;
  text-align: center;
}

.steps-bar {
  --el-step-active-color: #4c6ef5;
  --el-step-process-text-color: #4c6ef5;
}

.form-container {
  width: 100%;
}

.input-group {
  display: flex;
  align-items: center;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 0 1rem;
  transition: border-color 0.3s ease;
}

.input-group:focus-within {
  border-color: #4c6ef5;
  box-shadow: 0 0 0 3px rgba(76, 110, 245, 0.1);
}

.input-icon {
  color: #718096;
  margin-right: 0.75rem;
  font-size: 1.1rem;
}

.custom-input {
  flex: 1;
  height: 45px;
  border: none;
  outline: none;
  font-size: 1rem;
  color: #2d3748;
  background: transparent;
}

.next-btn,
.prev-btn,
.register-btn {
  width: 100%;
  height: 48px;
  border: none;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.3s ease, transform 0.2s ease;
}

.next-btn,
.register-btn {
  background: #4c6ef5;
  color: white;
}

.next-btn:hover,
.register-btn:hover {
  background: #3b5bdb;
  transform: translateY(-2px);
}

.next-btn:active,
.register-btn:active {
  transform: translateY(0);
}

.prev-btn {
  background: #edf2f7;
  color: #4a5568;
  margin-bottom: 1rem;
}

.prev-btn:hover {
  background: #e2e8f0;
}

.role-selection {
  text-align: center;
  margin-bottom: 1.5rem;
}

.role-title {
  font-size: 1.2rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.role-desc {
  font-size: 0.95rem;
  color: #718096;
  margin-bottom: 1.5rem;
}

.role-cards {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.role-card {
  flex: 1;
  min-width: 120px;
  background: #f7fafc;
  border: 2px solid #e2e8f0;
  border-radius: 12px;
  padding: 1.5rem 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-card.active {
  background: #edf2ff;
  border-color: #4c6ef5;
  box-shadow: 0 4px 12px rgba(76, 110, 245, 0.1);
}

/* 优化：添加角色卡片选中动画 */
.role-card-active-animation {
  animation: pulse 0.3s ease-in-out;
}

@keyframes pulse {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.05);
  }
  100% {
    transform: scale(1);
  }
}

.role-icon {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  border-radius: 50%;
  background: #e2e8f0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  color: #4a5568;
}

.user-icon {
  background: #dbeafe;
  color: #2563eb;
}

.companion-icon {
  background: #e0e7ff;
  color: #4338ca;
}

.admin-icon {
  background: #ffedd5;
  color: #c2410c;
}

.card-title {
  font-size: 1.1rem;
  font-weight: 600;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.card-desc {
  font-size: 0.9rem;
  color: #718096;
}

.register-footer {
  text-align: center;
  font-size: 0.95rem;
  color: #718096;
}

.login-link {
  color: #4c6ef5;
  font-weight: 500;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}

.mb-6 {
  margin-bottom: 1.5rem;
}

/* 优化：响应式调整 */
@media (max-width: 576px) {
  .register-card {
    padding: 2rem 1.5rem;
    max-width: 90%;
  }
  
  .role-cards {
    flex-direction: column;
  }
  
  .role-card {
    width: 100%;
  }
}
</style>
