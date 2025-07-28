<template>
  <div class="orders-container">
    <h1>我的订单</h1>

    <div class="order-filters">
      <el-radio-group v-model="activeFilter" @change="handleFilterChange">
        <el-radio :label="'all'">全部订单</el-radio>
        <el-radio :label="'pending'">待付款</el-radio>
        <el-radio :label="'confirmed'">待服务</el-radio>
        <el-radio :label="'completed'">已完成</el-radio>
        <el-radio :label="'cancelled'">已取消</el-radio>
      </el-radio-group>

      <div class="date-filter">
        <el-date-picker
          v-model="dateRange"
          type="daterange"
          range-separator="至"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          @change="handleDateChange"
        ></el-date-picker>
      </div>
    </div>

    <div class="order-list">
      <div class="order-card" v-for="order in filteredOrders" :key="order.id">
        <div class="order-header">
          <div class="order-info">
            <p class="order-number">订单号: {{ order.id }}</p>
            <p class="order-date">{{ order.date }}</p>
          </div>
          <div class="order-status" :class="order.status">
            {{ getStatusText(order.status) }}
          </div>
        </div>

        <div class="order-body">
          <img :src="order.companion.avatar" alt="{{ order.companion.name }}" class="companion-avatar">
          <div class="order-details">
            <div class="companion-info">
              <h3>{{ order.companion.name }}</h3>
              <p class="companion-skills">{{ order.companion.skills.join(' · ') }}</p>
            </div>
            <div class="service-info">
              <p><span>服务类型:</span> {{ order.serviceType }}</p>
              <p><span>服务时间:</span> {{ order.serviceTime }}</p>
              <p><span>服务时长:</span> {{ order.duration }}小时</p>
            </div>
          </div>
        </div>

        <div class="order-footer">
          <div class="order-price">
            <p>总价: <span class="price">{{ order.price }}元</span></p>
          </div>
          <div class="order-actions">
            <el-button v-if="order.status === 'pending'" type="primary" @click="payOrder(order.id)">立即支付</el-button>
            <el-button v-if="order.status === 'pending'" type="default" @click="cancelOrder(order.id)">取消订单</el-button>
            <el-button v-if="order.status === 'confirmed'" type="default" @click="contactCompanion(order.id)">联系陪玩师</el-button>
            <el-button v-if="order.status === 'completed'" type="default" @click="viewDetails(order.id)">查看详情</el-button>
            <el-button v-if="order.status === 'completed' && !order.reviewed" type="primary" @click="leaveReview(order.id)">评价</el-button>
          </div>
        </div>
      </div>
    </div>

    <div class="pagination" v-if="filteredOrders.length > 0">
      <el-pagination
        v-model:current-page="currentPage"
        v-model:page-size="pageSize"
        :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next, jumper"
        :total="filteredOrders.length"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      ></el-pagination>
    </div>

    <div class="no-orders" v-else>
      <img src="/src/assets/img/img.jpg" alt="暂无订单">
      <p>暂无订单，快去预约陪玩师吧！</p>
      <el-button type="primary" @click="goToHome">去首页</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';

const router = useRouter();

// 订单筛选状态
const activeFilter = ref('all');
const dateRange = ref<[string, string] | null>(null);
const currentPage = ref(1);
const pageSize = ref(10);

// 模拟订单数据
const orders = ref([
  {
    id: 'ORD20230501001',
    date: '2023-05-01 14:30',
    status: 'completed',
    reviewed: true,
    price: 180,
    duration: 2,
    serviceType: '游戏陪玩',
    serviceTime: '2023-05-02 19:00-21:00',
    companion: {
      id: 1,
      name: '游戏高手小王',
      avatar: '/assets/img/companion1.jpg',
      skills: ['英雄联盟', '绝地求生']
    }
  },
  {
    id: 'ORD20230510002',
    date: '2023-05-10 10:15',
    status: 'pending',
    reviewed: false,
    price: 120,
    duration: 1,
    serviceType: '游戏陪玩',
    serviceTime: '2023-05-11 15:00-16:00',
    companion: {
      id: 2,
      name: '娱乐陪玩小姐姐',
      avatar: '/assets/img/companion2.jpg',
      skills: ['和平精英', '聊天陪伴']
    }
  },
  {
    id: 'ORD20230515003',
    date: '2023-05-15 09:30',
    status: 'confirmed',
    reviewed: false,
    price: 300,
    duration: 2,
    serviceType: '电竞教学',
    serviceTime: '2023-05-16 20:00-22:00',
    companion: {
      id: 3,
      name: '专业电竞教学',
      avatar: '/assets/img/companion3.jpg',
      skills: ['DOTA2', 'CS:GO']
    }
  },
  {
    id: 'ORD20230420004',
    date: '2023-04-20 16:45',
    status: 'cancelled',
    reviewed: false,
    price: 90,
    duration: 1,
    serviceType: '游戏陪玩',
    serviceTime: '2023-04-21 18:00-19:00',
    companion: {
      id: 1,
      name: '游戏高手小王',
      avatar: '/assets/img/companion1.jpg',
      skills: ['英雄联盟', '绝地求生']
    }
  }
]);

// 根据筛选条件过滤订单
const filteredOrders = computed(() => {
  let result = [...orders.value];

  // 状态筛选
  if (activeFilter.value !== 'all') {
    result = result.filter(order => order.status === activeFilter.value);
  }

  // 日期筛选
  if (dateRange.value) {
    const [start, end] = dateRange.value;
    result = result.filter(order => {
      const orderDate = new Date(order.date.split(' ')[0]);
      return orderDate >= new Date(start) && orderDate <= new Date(end);
    });
  }

  return result;
});

// 获取状态文本
const getStatusText = (status: string) => {
  const statusMap: Record<string, string> = {
    'pending': '待付款',
    'confirmed': '待服务',
    'completed': '已完成',
    'cancelled': '已取消'
  };
  return statusMap[status] || status;
};

// 处理筛选变化
const handleFilterChange = () => {
  currentPage.value = 1; // 重置到第一页
};

// 处理日期变化
const handleDateChange = () => {
  currentPage.value = 1; // 重置到第一页
};

// 分页处理
const handleSizeChange = (size: number) => {
  pageSize.value = size;
};

const handleCurrentChange = (current: number) => {
  currentPage.value = current;
};

// 支付订单
const payOrder = (id: string) => {
  // 实际项目中调用支付API
  ElMessage.info(`订单 ${id} 支付中...`);
};

// 取消订单
const cancelOrder = (id: string) => {
  // 实际项目中调用取消订单API
  const order = orders.value.find(o => o.id === id);
  if (order) {
    order.status = 'cancelled';
    ElMessage.success('订单已取消');
  }
};

// 联系陪玩师
const contactCompanion = (id: string) => {
  // 实际项目中打开聊天窗口或显示联系方式
  ElMessage.info('联系陪玩师功能开发中...');
};

// 查看详情
const viewDetails = (id: string) => {
  // 实际项目中跳转到订单详情页
  ElMessage.info(`查看订单 ${id} 详情`);
};

// 评价
const leaveReview = (id: string) => {
  // 实际项目中打开评价窗口
  ElMessage.info(`评价订单 ${id}`);
  // 模拟评价完成
  const order = orders.value.find(o => o.id === id);
  if (order) {
    order.reviewed = true;
  }
};

// 去首页
const goToHome = () => {
  router.push('/');
};
</script>

<style scoped>
.orders-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.order-filters {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  padding: 15px;
  background: #fff;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.order-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
  margin-bottom: 30px;
}

.order-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
  background: #f5f7fa;
  border-bottom: 1px solid #e4e7ed;
}

.order-info {
  display: flex;
  flex-direction: column;
}

.order-number {
  font-size: 14px;
  font-weight: 500;
  margin: 0 0 5px;
}

.order-date {
  font-size: 12px;
  color: #666;
  margin: 0;
}

.order-status {
  padding: 4px 10px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.order-status.pending {
  background: #fff3cd;
  color: #856404;
}

.order-status.confirmed {
  background: #d1ecf1;
  color: #0c5460;
}

.order-status.completed {
  background: #d4edda;
  color: #155724;
}

.order-status.cancelled {
  background: #f8d7da;
  color: #721c24;
}

.order-body {
  display: flex;
  padding: 20px;
  border-bottom: 1px solid #e4e7ed;
}

.companion-avatar {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  margin-right: 20px;
}

.order-details {
  flex: 1;
  display: flex;
  justify-content: space-between;
}

.companion-info h3 {
  margin: 0 0 10px;
  font-size: 16px;
}

.companion-skills {
  font-size: 14px;
  color: #666;
  margin: 0;
}

.service-info p {
  margin: 0 0 8px;
  font-size: 14px;
}

.service-info span {
  color: #666;
}

.order-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 20px;
}

.order-price {
  font-size: 16px;
  font-weight: 600;
}

.price {
  color: #7b61ff;
  font-size: 18px;
}

.order-actions {
  display: flex;
  gap: 10px;
}

.pagination {
  display: flex;
  justify-content: center;
  padding: 20px 0;
}

.no-orders {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  text-align: center;
}

.no-orders img {
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
}

.no-orders p {
  font-size: 16px;
  color: #666;
  margin-bottom: 20px;
}
</style>