<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <div class="logo">CP</div>
        <h1 class="title">陪玩平台</h1>
        <p class="subtitle">选择您的身份加入我们的平台</p>
      </div>
      
      <div class="register-form">
        <!-- 角色选择卡片 -->
        <div class="role-selection">
          <div class="role-tabs">
            <div 
              :class="['role-tab', registerForm.role === 'USER' ? 'active-user active' : '']"
              @click="() => { registerForm.role = 'USER'; }"
            >
              用户注册
            </div>
            <div 
              :class="['role-tab', registerForm.role === 'COMPANION' ? 'active-companion active' : '']"
              @click="() => { registerForm.role = 'COMPANION'; }"
            >
              陪玩师注册
            </div>
          </div>
        </div>

        <el-form ref="registerFormRef" :model="registerForm" :rules="rules" class="form-container">
          <!-- 公共字段 -->
          <div class="form-row" v-if="registerForm.role === 'USER' || registerForm.role === 'COMPANION'">
            <el-form-item prop="nickname" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><User /></el-icon>
                <input
                  v-model="registerForm.nickname"
                  type="text"
                  placeholder="请输入昵称"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="realName" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><User /></el-icon>
                <input
                  v-model="registerForm.realName"
                  type="text"
                  placeholder="请输入真实姓名"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="phone" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Phone /></el-icon>
                <input
                  v-model="registerForm.phone"
                  type="tel"
                  placeholder="请输入手机号"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="age" class="flex-1">
              <div class="input-group">
                <el-icon class="input-icon"><User /></el-icon>
                <input
                  v-model="registerForm.age"
                  type="number"
                  placeholder="年龄"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
            <el-form-item prop="gender" class="flex-1">
              <div class="input-group">
                <el-icon class="input-icon"><User /></el-icon>
                <select v-model="registerForm.gender" class="custom-input w-full">
                  <option value="">选择性别</option>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="email" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Message /></el-icon>
                <input
                  v-model="registerForm.email"
                  type="email"
                  placeholder="请输入邮箱"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="serviceType" class="flex-1">
              <div class="input-group">
                <el-icon class="input-icon"><Briefcase /></el-icon>
                <select v-model="registerForm.serviceType" class="custom-input w-full">
                  <option value="">选择服务类型</option>
                  <option value="game">游戏陪玩</option>
                  <option value="chat">聊天陪伴</option>
                  <option value="other">其他服务</option>
                </select>
              </div>
            </el-form-item>
            <el-form-item prop="hourlyRate" class="flex-1">
              <div class="input-group">
                <el-icon class="input-icon"><Money /></el-icon>
                <input
                  v-model="registerForm.hourlyRate"
                  type="number"
                  placeholder="请输入时薪"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="skills" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Star /></el-icon>
                <input
                  v-model="registerForm.skills"
                  type="text"
                  placeholder="请输入技能标签，用逗号分隔"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="games" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Controller /></el-icon>
                <input
                  v-model="registerForm.games"
                  type="text"
                  placeholder="请输入擅长游戏，用逗号分隔"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row" v-if="registerForm.role === 'COMPANION'">
            <el-form-item prop="introduction" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Edit /></el-icon>
                <textarea
                  v-model="registerForm.introduction"
                  placeholder="请简单介绍一下自己"
                  class="custom-input w-full"
                  rows="3"
                ></textarea>
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="password" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Lock /></el-icon>
                <input
                  v-model="registerForm.password"
                  type="password"
                  placeholder="请输入密码（至少6位）"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <div class="form-row">
            <el-form-item prop="confirmPassword" class="w-full">
              <div class="input-group">
                <el-icon class="input-icon"><Lock /></el-icon>
                <input
                  v-model="registerForm.confirmPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  class="custom-input w-full"
                />
              </div>
            </el-form-item>
          </div>

          <el-form-item>
            <button @click.prevent="handleRegister" class="register-btn" :style="getRegisterBtnStyle">
              {{ registerForm.role === 'USER' ? '用户注册' : '陪玩师注册' }}
            </button>
          </el-form-item>
        </el-form>
      </div>

      <div class="register-footer">
        <p>已有账户? <router-link to="/login" class="login-link">立即登录</router-link></p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { User, Phone, Message, Briefcase, Money, Star, /* Controller, */ Edit, Lock } from '@element-plus/icons-vue';
import type { FormInstance } from 'element-plus';

const registerFormRef = ref<FormInstance>();
const registerForm = reactive({
  role: 'USER',
  nickname: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  // 陪玩师特有字段
  realName: '',
  age: '',
  gender: '',
  serviceType: '',
  hourlyRate: '',
  skills: '',
  games: '',
  introduction: ''
});

const router = useRouter();

// 根据角色获取注册按钮样式
const getRegisterBtnStyle = computed(() => {
  switch(registerForm.role) {
    case 'USER':
      return { backgroundColor: '#4c6ef5' }; // 用户蓝色
    case 'COMPANION':
      return { backgroundColor: '#38b2ac' }; // 陪玩师青色
    default:
      return { backgroundColor: '#4c6ef5' };
  }
});

const rules = {
  nickname: [
    { required: true, message: '请输入昵称', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号格式', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请设置密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  confirmPassword: [
    { required: true, message: '请确认密码', trigger: 'blur' },
    {
      validator: (rule: any, value: string, callback: any) => {
        if (value !== registerForm.password) {
          callback(new Error('两次输入的密码不一致'));
        } else {
          callback();
        }
      },
      trigger: 'blur'
    }
  ],
  // 陪玩师特有字段的验证规则
  realName: [
    { required: registerForm.role === 'COMPANION', message: '请输入真实姓名', trigger: 'blur' }
  ],
  age: [
    { required: registerForm.role === 'COMPANION', message: '请输入年龄', trigger: 'blur' },
    { type: 'number', message: '请输入有效的年龄', trigger: 'blur' }
  ],
  gender: [
    { required: registerForm.role === 'COMPANION', message: '请选择性别', trigger: 'change' }
  ],
  serviceType: [
    { required: registerForm.role === 'COMPANION', message: '请选择服务类型', trigger: 'change' }
  ],
  hourlyRate: [
    { required: registerForm.role === 'COMPANION', message: '请输入时薪', trigger: 'blur' },
    { type: 'number', message: '请输入有效的时薪', trigger: 'blur' }
  ]
};

const handleRegister = async () => {
  if (!registerFormRef.value) return;
  
  try {
    await registerFormRef.value.validate();
    // 这里只是模拟注册成功，实际项目中需要调用API
    ElMessage.success('注册成功，请登录');
    router.push('/login');
  } catch (error) {
    console.error('表单验证失败:', error);
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
  background: #f5f7fa;
}

.register-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  width: 100%;
  max-width: 550px;
  padding: 2.5rem;
}

.logo {
  width: 50px;
  height: 50px;
  margin: 0 auto 1rem;
  background: linear-gradient(135deg, #7b61ff 0%, #ff5e84 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
}

.title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #333;
  margin-bottom: 0.5rem;
  text-align: center;
}

.subtitle {
  font-size: 0.9rem;
  color: #999;
  text-align: center;
  margin-bottom: 2rem;
}

/* 角色选择样式 */
.role-selection {
  margin-bottom: 1.5rem;
}

.role-tabs {
  display: flex;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #e0e0e0;
}

.role-tab {
  flex: 1;
  padding: 0.75rem 0;
  text-align: center;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.role-tab.active-user {
  background-color: #4c6ef5; /* 用户蓝色 */
  color: white;
}

.role-tab.active-companion {
  background-color: #38b2ac; /* 陪玩师青色 */
  color: white;
}

.role-tab:not(.active) {
  background-color: #f9f9f9;
  color: #666;
}

/* 表单样式 */
.form-container {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  width: 100%;
}

.form-row > el-form-item {
  flex: 1;
}

.input-group {
  position: relative;
  display: flex;
  align-items: center;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 12px;
  color: #a0aec0;
  z-index: 10;
}

.custom-input {
  width: 100%;
  height: 40px;
  padding: 0 12px 0 40px;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9rem;
  transition: border-color 0.3s;
}

.custom-input:focus {
  outline: none;
  border-color: #7b61ff;
}

/* 注册按钮样式 */
.register-btn {
  width: 100%;
  height: 44px;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-top: 1rem;
}

.register-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.register-btn:active {
  transform: translateY(0);
}

/* 页脚样式 */
.register-footer {
  text-align: center;
  font-size: 0.9rem;
  color: #999;
  margin-top: 1.5rem;
}

.login-link {
  color: #7b61ff;
  text-decoration: none;
}

.login-link:hover {
  text-decoration: underline;
}
</style>
