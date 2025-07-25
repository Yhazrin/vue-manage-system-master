<template>
  <div class="profile-container">
    <h1>个人资料</h1>
    <div class="profile-card">
      <div class="profile-header">
        <div class="avatar-container">
          <img :src="userProfile.avatar" alt="用户头像" class="avatar">
          <div class="avatar-upload">
            <input type="file" id="avatar-upload" class="upload-input" @change="handleAvatarUpload">
            <label for="avatar-upload" class="upload-btn">更换头像</label>
          </div>
        </div>
        <div class="user-basic-info">
          <h2>{{ userProfile.username }}</h2>
          <p class="user-id">ID: {{ userProfile.id }}</p>
          <p class="user-role">普通用户</p>
        </div>
      </div>

      <div class="profile-form">
        <el-form ref="profileForm" :model="userProfile" :rules="rules" label-width="120px">
          <el-form-item label="昵称" prop="username">
            <el-input v-model="userProfile.username" placeholder="请输入昵称"></el-input>
          </el-form-item>
          <el-form-item label="手机号" prop="phone">
            <el-input v-model="userProfile.phone" placeholder="请输入手机号" disabled></el-input>
          </el-form-item>
          <el-form-item label="邮箱" prop="email">
            <el-input v-model="userProfile.email" placeholder="请输入邮箱"></el-input>
          </el-form-item>
          <el-form-item label="性别">
            <el-radio-group v-model="userProfile.gender">
              <el-radio :label="'male'">男</el-radio>
              <el-radio :label="'female'">女</el-radio>
              <el-radio :label="'other'">其他</el-radio>
            </el-radio-group>
          </el-form-item>
          <el-form-item label="出生日期">
            <el-date-picker v-model="userProfile.birthday" type="date" placeholder="选择日期"></el-date-picker>
          </el-form-item>
          <el-form-item label="个人简介">
            <el-input v-model="userProfile.bio" type="textarea" placeholder="请输入个人简介" :rows="4"></el-input>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="submitForm">保存修改</el-button>
            <el-button @click="resetForm">取消</el-button>
          </el-form-item>
        </el-form>
      </div>
    </div>

    <div class="security-settings">
      <h2>安全设置</h2>
      <div class="security-item">
        <div class="security-label">
          <span>修改密码</span>
          <p>建议定期更换密码以保证账户安全</p>
        </div>
        <el-button type="default" @click="goToChangePassword">修改</el-button>
      </div>
      <div class="security-item">
        <div class="security-label">
          <span>绑定手机</span>
          <p>{{ userProfile.phone ? '已绑定: ' + userProfile.phone : '未绑定手机' }}</p>
        </div>
        <el-button type="default" @click="goToBindPhone">{{ userProfile.phone ? '更换' : '绑定' }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 模拟用户资料数据
const userProfile = reactive({
  id: 'U123456',
  username: '游戏爱好者',
  phone: '13800138000',
  email: 'user@example.com',
  avatar: '/assets/img/avatar-default.png',
  gender: 'male',
  birthday: '1990-01-01',
  bio: '热爱游戏的玩家，喜欢各种类型的游戏。'
});

// 表单验证规则
const rules = {
  username: [
    { required: true, message: '请输入昵称', trigger: 'blur' },
    { min: 2, max: 20, message: '昵称长度在 2 到 20 个字符', trigger: 'blur' }
  ],
  email: [
    { type: 'email', message: '请输入正确的邮箱地址', trigger: 'blur' }
  ]
};

// 提交表单
const submitForm = () => {
  // 这里只是模拟提交，实际项目中需要调用API
  ElMessage.success('资料保存成功');
};

// 重置表单
const resetForm = () => {
  // 重置表单到初始状态
};

// 处理头像上传
const handleAvatarUpload = (event: Event) => {
  const input = event.target as HTMLInputElement;
  if (input.files && input.files[0]) {
    // 这里只是模拟上传，实际项目中需要调用上传API
    const reader = new FileReader();
    reader.onload = (e) => {
      userProfile.avatar = e.target?.result as string;
    };
    reader.readAsDataURL(input.files[0]);
  }
};

// 跳转到修改密码页面
const goToChangePassword = () => {
  // 实际项目中跳转到修改密码页面
  ElMessage.info('跳转到修改密码页面');
};

// 跳转到绑定手机页面
const goToBindPhone = () => {
  // 实际项目中跳转到绑定手机页面
  ElMessage.info('跳转到绑定手机页面');
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
}

.profile-card {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.profile-header {
  display: flex;
  align-items: center;
  gap: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f0f0;
  margin-bottom: 20px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f5f7fa;
}

.upload-input {
  display: none;
}

.upload-btn {
  padding: 6px 12px;
  background: #f5f7fa;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.3s;
}

.upload-btn:hover {
  background: #e4e7ed;
}

.user-basic-info {
  flex: 1;
}

.user-basic-info h2 {
  margin: 0 0 10px;
  font-size: 24px;
}

.user-id {
  font-size: 14px;
  color: #666;
  margin: 0 0 5px;
}

.user-role {
  font-size: 14px;
  color: #7b61ff;
  margin: 0;
}

.security-settings {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.security-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #f0f0f0;
}

.security-item:last-child {
  border-bottom: none;
}

.security-label p {
  margin: 5px 0 0;
  font-size: 14px;
  color: #666;
}
</style>