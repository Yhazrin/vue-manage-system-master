<template>
  <div class="profile-container">
    <div class="profile-header">
      <div class="avatar-container">
        <el-avatar :size="100" :src="userInfo.avatar" class="avatar">
          <img :src="userInfo.avatar" alt="头像" />
        </el-avatar>
        <el-button type="primary" size="small" class="edit-avatar-btn" @click="uploadAvatar">更换头像</el-button>
      </div>
      <div class="user-basic-info">
        <div class="name-status">
          <h2>{{ userInfo.nickname }}</h2>
          <span class="status-tag">{{ userInfo.status === 'online' ? '在线' : '离线' }}</span>
        </div>
        <p>UID: {{ userInfo.uid }}</p>
        <div class="skill-tags">
          <el-tag v-for="skill in userInfo.skills" :key="skill" size="small">{{ skill }}</el-tag>
          <el-button icon="el-icon-plus" size="small" @click="addSkill"></el-button>
        </div>
      </div>
    </div>

    <el-tabs v-model="activeTab" class="profile-tabs">
      <el-tab-pane label="财务信息" name="finance">
        <div class="finance-card">
          <div class="finance-item">
            <span class="label">当前余额</span>
            <span class="value">{{ userInfo.balance }} 元</span>
          </div>
          <div class="finance-item">
            <span class="label">累计收益</span>
            <span class="value">{{ userInfo.totalEarnings }} 元</span>
          </div>
          <div class="finance-item">
            <span class="label">待提现金额</span>
            <span class="value">{{ userInfo.pendingWithdrawal }} 元</span>
          </div>
          <el-button type="primary" class="withdraw-btn" @click="toWithdrawals">去提现</el-button>
        </div>
      </el-tab-pane>

      <el-tab-pane label="收款信息" name="payment">
        <div class="payment-info">
          <div class="payment-item">
            <span class="label">收款人姓名</span>
            <div class="value">
              {{ userInfo.payeeName }}
              <el-button icon="el-icon-edit" size="small" @click="editPayeeName"></el-button>
            </div>
          </div>
          <div class="payment-item">
            <span class="label">收款码</span>
            <div class="qr-code-container">
              <img :src="userInfo.qrCode" alt="收款码" class="qr-code" v-if="userInfo.qrCode" />
              <div class="no-qr-code" v-else>未上传收款码</div>
              <el-button type="primary" size="small" @click="uploadQrCode">上传/更换收款码</el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
  </div>

  <!-- 编辑收款人姓名弹窗 -->
  <el-dialog title="编辑收款人姓名" v-model="showEditNameDialog" width="300px">
    <el-input v-model="newPayeeName" placeholder="请输入收款人姓名"></el-input>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showEditNameDialog = false">取消</el-button>
        <el-button type="primary" @click="savePayeeName">确定</el-button>
      </span>
    </template>
  </el-dialog>

  <!-- 添加技能弹窗 -->
  <el-dialog title="添加擅长技能" v-model="showAddSkillDialog" width="300px">
    <el-input v-model="newSkill" placeholder="请输入技能名称"></el-input>
    <template #footer>
      <span class="dialog-footer">
        <el-button @click="showAddSkillDialog = false">取消</el-button>
        <el-button type="primary" @click="saveSkill">确定</el-button>
      </span>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

// 路由跳转
const router = useRouter();

// 标签页状态
const activeTab = ref('finance');

// 用户信息
const userInfo = ref({
  nickname: '游戏大神',
  uid: 'CP12345678',
  avatar: '/src/assets/img/avatar-default.png',
  status: 'online', // online 或 offline
  skills: ['英雄联盟', '王者荣耀', '绝地求生'],
  balance: 1250.50,
  totalEarnings: 15680.75,
  pendingWithdrawal: 800.00,
  payeeName: '张三',
  qrCode: '/src/assets/img/qr-code-example.png'
});

// 弹窗状态
const showEditNameDialog = ref(false);
const showAddSkillDialog = ref(false);

// 表单数据
const newPayeeName = ref('');
const newSkill = ref('');

// 上传头像
const uploadAvatar = () => {
  // 实际项目中这里会调用文件上传接口
  ElMessage({ message: '头像上传功能待实现', type: 'info' });
};

// 编辑收款人姓名
const editPayeeName = () => {
  newPayeeName.value = userInfo.value.payeeName;
  showEditNameDialog.value = true;
};

// 保存收款人姓名
const savePayeeName = () => {
  if (!newPayeeName.value.trim()) {
    ElMessage({ message: '请输入收款人姓名', type: 'warning' });
    return;
  }
  userInfo.value.payeeName = newPayeeName.value;
  showEditNameDialog.value = false;
  ElMessage({ message: '收款人姓名已更新', type: 'success' });
};

// 上传收款码
const uploadQrCode = () => {
  // 实际项目中这里会调用文件上传接口
  ElMessage({ message: '收款码上传功能待实现', type: 'info' });
};

// 添加技能
const addSkill = () => {
  newSkill.value = '';
  showAddSkillDialog.value = true;
};

// 保存技能
const saveSkill = () => {
  if (!newSkill.value.trim()) {
    ElMessage({ message: '请输入技能名称', type: 'warning' });
    return;
  }
  if (userInfo.value.skills.includes(newSkill.value)) {
    ElMessage({ message: '该技能已存在', type: 'warning' });
    return;
  }
  userInfo.value.skills.push(newSkill.value);
  showAddSkillDialog.value = false;
  ElMessage({ message: '技能已添加', type: 'success' });
};

// 跳转到提现页面
const toWithdrawals = () => {
  router.push('/companion/withdrawals');
};
</script>

<style scoped>
.profile-container {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 70px);
}

.profile-header {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #eee;
  margin-bottom: 20px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-right: 30px;
}

.avatar {
  margin-bottom: 10px;
}

.user-basic-info {
  flex: 1;
}

.name-status {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.name-status h2 {
  margin: 0;
  margin-right: 10px;
}

.status-tag {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.status-tag.online {
  background-color: #e6f7ff;
  color: #1890ff;
}

.status-tag.offline {
  background-color: #f5f5f5;
  color: #999;
}

.skill-tags {
  display: flex;
  flex-wrap: wrap;
  margin-top: 15px;
}

.skill-tags .el-tag {
  margin-right: 8px;
  margin-bottom: 8px;
}

.profile-tabs {
  margin-top: 20px;
}

.finance-card {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.finance-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 0;
  border-bottom: 1px solid #eee;
}

.finance-item:last-child {
  border-bottom: none;
}

.label {
  color: #666;
  font-size: 14px;
}

.value {
  font-size: 18px;
  font-weight: bold;
  color: #333;
}

.withdraw-btn {
  margin-top: 20px;
  width: 100%;
}

.payment-info {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.payment-item {
  margin-bottom: 20px;
}

.payment-item .label {
  display: block;
  margin-bottom: 10px;
}

.payment-item .value {
  display: flex;
  align-items: center;
}

.qr-code-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-code {
  width: 200px;
  height: 200px;
  margin-bottom: 15px;
  border: 1px solid #eee;
  padding: 10px;
}

.no-qr-code {
  width: 200px;
  height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  border: 1px dashed #ccc;
  color: #999;
}
</style>