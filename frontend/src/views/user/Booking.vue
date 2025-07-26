<template>
  <div class="booking-container">
    <div class="booking-header">
      <el-button icon="ArrowLeft" @click="goBack">返回</el-button>
      <h1>预约陪玩师</h1>
    </div>

    <div class="companion-detail">
      <img :src="companion.avatar" alt="{{ companion.name }}" class="companion-avatar">
      <div class="companion-info">
        <div class="name-rating">
          <h2>{{ companion.name }}</h2>
          <div class="rating">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
            <span>{{ companion.rating }}</span>
            <span class="review-count">({{ companion.reviewCount }}条评价)</span>
          </div>
        </div>
        <p class="price">{{ companion.price }}元/小时</p>
        <div class="tags">
          <span class="tag" v-for="skill in companion.skills" :key="skill">{{ skill }}</span>
        </div>
        <p class="description">{{ companion.description }}</p>
      </div>
    </div>

    <div class="booking-form">
      <h2>预约信息</h2>
      <el-form ref="bookingForm" :model="bookingInfo" :rules="rules" label-width="120px">
        <el-form-item label="服务类型" prop="serviceType">
          <el-select v-model="bookingInfo.serviceType" placeholder="请选择服务类型">
            <el-option v-for="type in serviceTypes" :key="type.value" :label="type.label" :value="type.value"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="预约日期" prop="date">
          <el-date-picker v-model="bookingInfo.date" type="date" placeholder="选择日期" :disabled-date="disabledDate"></el-date-picker>
        </el-form-item>
        <el-form-item label="预约时间" prop="time">
          <el-select v-model="bookingInfo.time" placeholder="请选择时间">
            <el-option v-for="time in availableTimes" :key="time" :label="time" :value="time"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="服务时长" prop="duration">
          <el-select v-model="bookingInfo.duration" placeholder="请选择时长">
            <el-option v-for="hour in [1, 2, 3, 4, 5]" :key="hour" :label="`${hour}小时`" :value="hour"></el-option>
          </el-select>
        </el-form-item>
        <el-form-item label="备注信息">
          <el-input v-model="bookingInfo.notes" type="textarea" placeholder="请输入备注信息" :rows="3"></el-input>
        </el-form-item>
        <el-form-item>
          <div class="price-summary">
            <p>总价: <span class="total-price">{{ calculateTotalPrice() }}元</span></p>
            <p>服务费: {{ companion.price }}元/小时 × {{ bookingInfo.duration }}小时</p>
          </div>
          <el-button type="primary" @click="submitBooking" class="booking-btn">提交预约</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();
const route = useRoute();
const companionId = route.params.id as string;

// 模拟陪玩师数据
const companion = ref({
  id: 1,
  name: '游戏高手小王',
  avatar: '/assets/img/companion1.jpg',
  rating: 4.9,
  reviewCount: 128,
  price: 90,
  skills: ['英雄联盟', '绝地求生', '王者荣耀', '和平精英'],
  description: '资深游戏玩家，拥有5年游戏陪玩经验，擅长多种游戏，技术过硬，性格开朗，善于沟通，能够根据玩家水平调整游戏节奏，提供愉快的游戏体验。'
});

// 服务类型
const serviceTypes = ref([
  { value: 'game', label: '游戏陪玩' },
  { value: 'teaching', label: '游戏教学' },
  { value: 'chat', label: '聊天陪伴' }
]);

// 可用时间段
const availableTimes = ref([
  '09:00-10:00', '10:00-11:00', '11:00-12:00',
  '14:00-15:00', '15:00-16:00', '16:00-17:00',
  '19:00-20:00', '20:00-21:00', '21:00-22:00'
]);

// 预约信息
const bookingInfo = reactive({
  serviceType: '',
  date: '',
  time: '',
  duration: 1,
  notes: ''
});

// 表单验证规则
const rules = {
  serviceType: [
    { required: true, message: '请选择服务类型', trigger: 'change' }
  ],
  date: [
    { required: true, message: '请选择预约日期', trigger: 'change' }
  ],
  time: [
    { required: true, message: '请选择预约时间', trigger: 'change' }
  ],
  duration: [
    { required: true, message: '请选择服务时长', trigger: 'change' }
  ]
};

// 计算总价
const calculateTotalPrice = () => {
  return companion.value.price * bookingInfo.duration;
};

// 禁用过去的日期
const disabledDate = (time: Date) => {
  return time.getTime() < Date.now() - 8.64e7;
};

// 提交预约
const submitBooking = () => {
  // 实际项目中调用预约API
  ElMessage.success('预约成功，请前往订单页面支付');
  router.push('/user/orders');
};

// 返回上一页
const goBack = () => {
  router.go(-1);
};
</script>

<style scoped>
.booking-container {
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

.booking-header {
  display: flex;
  align-items: center;
  margin-bottom: 30px;
}

.booking-header h1 {
  margin: 0 0 0 20px;
}

.companion-detail {
  display: flex;
  gap: 30px;
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  margin-bottom: 30px;
}

.companion-avatar {
  width: 200px;
  height: 200px;
  border-radius: 10px;
  object-fit: cover;
  flex-shrink: 0;
}

.companion-info {
  flex: 1;
}

.name-rating {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.name-rating h2 {
  margin: 0;
  font-size: 24px;
}

.rating {
  display: flex;
  align-items: center;
  color: #ff9800;
  font-size: 16px;
}

.rating svg {
  margin-right: 5px;
}

.review-count {
  color: #666;
  font-size: 14px;
  margin-left: 5px;
}

.price {
  font-size: 24px;
  font-weight: 600;
  color: #7b61ff;
  margin: 0 0 15px;
}

.tags {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 15px;
}

.tag {
  padding: 4px 10px;
  background: #f5f7fa;
  border-radius: 12px;
  font-size: 14px;
  color: #666;
}

.description {
  font-size: 14px;
  color: #333;
  line-height: 1.6;
  margin: 0;
}

.booking-form {
  background: #fff;
  border-radius: 10px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.price-summary {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
}

.total-price {
  font-size: 20px;
  font-weight: 600;
  color: #7b61ff;
}

.booking-btn {
  width: 100%;
  padding: 12px;
  font-size: 16px;
}
</style>