const axios = require('axios');

async function testAttendanceAPI() {
  const baseURL = 'http://localhost:3001/api';
  
  try {
    console.log('🔍 测试打卡记录API...');
    
    // 先登录获取token
    console.log('🔐 正在登录...');
    const loginResponse = await axios.post(`${baseURL}/managers/login`, {
      phone_num: '13800000002',
      passwd: 'admin123456'
    });
    
    const token = loginResponse.data.token;
    console.log('✅ 登录成功，获取到token');
    
    // 测试获取所有打卡记录（管理员接口）
    console.log('📊 正在获取所有打卡记录...');
    const response = await axios.get(`${baseURL}/attendance/all-records`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('✅ API响应状态:', response.status);
    console.log('📊 返回数据结构:', {
      recordsCount: response.data.records?.length || 0,
      total: response.data.total,
      hasStats: !!response.data.stats
    });
    
    if (response.data.records && response.data.records.length > 0) {
      console.log('📝 第一条记录示例:', {
        id: response.data.records[0].id,
        customer_service_name: response.data.records[0].customer_service_name,
        date: response.data.records[0].date,
        status: response.data.records[0].status,
        clock_in_time: response.data.records[0].clock_in_time,
        clock_out_time: response.data.records[0].clock_out_time
      });
    }
    
    console.log('🎉 打卡记录API测试成功！');
    
  } catch (error) {
    console.error('❌ API测试失败:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('详细错误:', error.response.data.error);
    }
  }
}

testAttendanceAPI();