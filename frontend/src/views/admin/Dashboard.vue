<template>
  <div class="admin-dashboard">
    <!-- 页面标题 -->
    <div class="page-title">
      <h2>陪玩后台</h2>
    </div>

    <!-- 统计卡片区域 -->
    <div class="stats-cards">
      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">今日订单数</div>
          <div class="stat-value">1,280</div>
          <div class="stat-trend up">+5.4%</div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">今日流水</div>
          <div class="stat-value">¥25,600</div>
          <div class="stat-trend"></div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">待审核提现</div>
          <div class="stat-value">15</div>
          <div class="stat-trend"></div>
        </div>
      </el-card>

      <el-card class="stat-card" shadow="hover">
        <div class="stat-content">
          <div class="stat-label">今日新增用户</div>
          <div class="stat-value">320</div>
          <div class="stat-trend down">-1.2%</div>
        </div>
      </el-card>
    </div>

    <!-- 图表区域 -->
    <el-card class="chart-card" shadow="hover">
      <div class="chart-header">
        <h3>最近30天订单额走势</h3>
        <div class="chart-controls">
          <el-select v-model="dateRange" size="small" class="date-select">
            <el-option label="近30天" value="30days"></el-option>
            <el-option label="近7天" value="7days"></el-option>
            <el-option label="近1个月" value="1month"></el-option>
            <el-option label="近3个月" value="3months"></el-option>
          </el-select>
          <el-button icon="Download" size="small" class="export-btn"></el-button>
        </div>
      </div>
      <div class="chart-container">
        <canvas id="orderTrendChart" width="400" height="200"></canvas>
      </div>
    </el-card>

    <!-- 数据列表和待办区域 -->
    <div class="data-and-todos">
      <!-- 用户消费TOP5 -->
      <el-card class="data-card" shadow="hover">
        <h3 class="data-title">用户消费TOP5</h3>
        <div class="data-list">
          <div v-for="(item, index) in userConsumptionTop5" :key="index" class="data-item">
            <div class="rank">{{ index + 1 }}</div>
            <div class="name">{{ item.name }}</div>
            <div class="amount">{{ item.amount }}</div>
          </div>
        </div>
      </el-card>

      <!-- 陪玩收入TOP5 -->
      <el-card class="data-card" shadow="hover">
        <h3 class="data-title">陪玩收入TOP5</h3>
        <div class="data-list">
          <div v-for="(item, index) in companionIncomeTop5" :key="index" class="data-item">
            <div class="rank">{{ index + 1 }}</div>
            <div class="name">{{ item.name }}</div>
            <div class="amount">{{ item.amount }}</div>
          </div>
        </div>
      </el-card>

      <!-- 待办提醒 -->
      <el-card class="todo-card" shadow="hover">
        <h3 class="todo-title">待办提醒</h3>
        <div class="todo-list">
          <div class="todo-item">
            <div class="todo-text">待审核提现</div>
            <div class="todo-badge">15</div>
          </div>
          <div class="todo-item">
            <div class="todo-text">待处理投诉</div>
            <div class="todo-badge">8</div>
          </div>
        </div>

        <!-- 快捷操作 -->
        <div class="quick-actions">
          <h3 class="action-title">快捷操作</h3>
          <div class="action-buttons">
            <el-button type="primary" size="small" class="quick-btn">处理提现</el-button>
            <el-button type="primary" size="small" class="quick-btn">处理投诉</el-button>
          </div>
        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ElCard, ElSelect, ElOption, ElButton } from 'element-plus';
import { Download } from '@element-plus/icons-vue';
import { Chart } from 'chart.js';

// 日期范围选择
const dateRange = ref('30days');

// 模拟数据
const userConsumptionTop5 = [
  { name: '用户A', amount: '¥5,230' },
  { name: '用户B', amount: '¥4,890' },
  { name: '用户C', amount: '¥4,120' },
  { name: '用户D', amount: '¥3,500' },
  { name: '用户E', amount: '¥2,980' }
];

const companionIncomeTop5 = [
  { name: '陪玩X', amount: '¥3,100' },
  { name: '陪玩Y', amount: '¥2,800' },
  { name: '陪玩Z', amount: '¥2,550' },
  { name: '陪玩W', amount: '¥2,130' },
  { name: '陪玩V', amount: '¥1,990' }
];

// 生成30天的日期标签
const generateDateLabels = () => {
  const labels = [];
  const today = new Date();
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    labels.push(`${month}.${day}`);
  }
  return labels;
};

// 生成随机订单数据
const generateOrderData = () => {
  return Array.from({ length: 30 }, () => 500 + Math.floor(Math.random() * 1000));
};

// 生成随机收益数据
const generateIncomeData = () => {
  return Array.from({ length: 30 }, () => 100 + Math.floor(Math.random() * 200));
};

// 初始化图表
onMounted(() => {
  const ctx = document.getElementById('orderTrendChart') as HTMLCanvasElement;
  if (ctx) {
    // 直接使用 Chart 构造函数，不需要额外的命名空间
    new Chart(ctx, {
      type: 'line',
      data: {
        labels: generateDateLabels(),
        datasets: [
          {
            label: '订单额',
            data: generateOrderData(),
            borderColor: '#6495ED',
            backgroundColor: 'rgba(100, 149, 237, 0.1)',
            tension: 0.4,
            fill: true
          },
          {
            label: '平均收益',
            data: generateIncomeData(),
            borderColor: '#3CB371',
            backgroundColor: 'rgba(60, 179, 113, 0.1)',
            tension: 0.4,
            fill: true
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
          },
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }
});
</script>

<style scoped lang="scss">
.admin-dashboard {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .page-title {
    margin-bottom: 20px;
    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #333;
    }
  }

  .stats-cards {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .stat-card {
      flex: 1;
      min-width: 200px;
      .stat-content {
        padding: 15px;
        .stat-label {
          font-size: 14px;
          color: #666;
          margin-bottom: 5px;
        }
        .stat-value {
          font-size: 24px;
          font-weight: 600;
          color: #333;
          margin-bottom: 5px;
        }
        .stat-trend {
          font-size: 12px;
          &.up {
            color: #4caf50;
          }
          &.down {
            color: #f44336;
          }
        }
      }
    }
  }

  .chart-card {
    margin-bottom: 20px;
    .chart-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      padding: 0 15px;
      h3 {
        font-size: 18px;
        font-weight: 600;
        color: #333;
      }
      .chart-controls {
        display: flex;
        gap: 10px;
        .date-select {
          width: 120px;
        }
        .export-btn {
          --el-button-bg-color: transparent;
          --el-button-hover-bg-color: #f5f7fa;
        }
      }
    }
    .chart-container {
      height: 300px;
      padding: 0 15px 15px;
    }
  }

  .data-and-todos {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;

    .data-card {
      flex: 1;
      min-width: 300px;
      .data-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 15px;
        padding: 0 15px;
      }
      .data-list {
        padding: 0 15px 15px;
        .data-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid #f0f0f0;
          &:last-child {
            border-bottom: none;
          }
          .rank {
            font-size: 14px;
            color: #999;
            width: 24px;
          }
          .name {
            font-size: 14px;
            color: #333;
            flex: 1;
          }
          .amount {
            font-size: 14px;
            font-weight: 500;
            color: #333;
          }
        }
      }
    }

    .todo-card {
      width: 300px;
      .todo-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 15px;
        padding: 0 15px;
      }
      .todo-list {
        padding: 0 15px 15px;
        .todo-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 10px;
          background-color: #f9f9f9;
          border-radius: 8px;
          margin-bottom: 10px;
          .todo-text {
            font-size: 14px;
            color: #333;
          }
          .todo-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 24px;
            height: 24px;
            background-color: #ff4d4f;
            color: white;
            border-radius: 50%;
            font-size: 12px;
          }
        }
      }
      .quick-actions {
        padding: 15px;
        border-top: 1px solid #f0f0f0;
        .action-title {
          font-size: 16px;
          font-weight: 600;
          color: #333;
          margin-bottom: 15px;
        }
        .action-buttons {
          display: flex;
          flex-direction: column;
          gap: 10px;
          .quick-btn {
            width: 100%;
            border-radius: 4px;
          }
        }
      }
    }
  }
}
</style>