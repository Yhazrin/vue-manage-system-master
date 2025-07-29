// 调试API响应格式的脚本
const debugAPI = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🔍 调试API响应格式...\n');
  
  // 测试游戏API
  try {
    console.log('📋 调试游戏API响应:');
    const response = await fetch(`${baseURL}/games`);
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应数据类型:', typeof data);
    console.log('响应数据:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 游戏API请求失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试陪玩API
  try {
    console.log('🎮 调试陪玩API响应:');
    const response = await fetch(`${baseURL}/players`);
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应数据类型:', typeof data);
    console.log('响应数据:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 陪玩API请求失败:', error.message);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // 测试用户登录API
  try {
    console.log('👤 调试用户登录API响应:');
    const response = await fetch(`${baseURL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: '13900000001',
        passwd: 'user123'
      })
    });
    const data = await response.json();
    console.log('状态码:', response.status);
    console.log('响应数据类型:', typeof data);
    console.log('响应数据:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.log('❌ 用户登录API请求失败:', error.message);
  }
};

// 运行调试
debugAPI();