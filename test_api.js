// 测试前后端连接的脚本
const testAPI = async () => {
  const baseURL = 'http://localhost:3000/api';
  
  console.log('🚀 开始测试前后端连接...\n');
  
  // 测试1: 获取游戏列表
  try {
    console.log('📋 测试1: 获取游戏列表');
    const response = await fetch(`${baseURL}/games`);
    const games = await response.json();
    console.log('✅ 游戏列表获取成功:', games.length, '个游戏');
    console.log('   示例游戏:', games.slice(0, 3).map(g => g.name).join(', '));
  } catch (error) {
    console.log('❌ 游戏列表获取失败:', error.message);
  }
  
  // 测试2: 获取陪玩列表
  try {
    console.log('\n📱 测试2: 获取陪玩列表');
    const response = await fetch(`${baseURL}/players`);
    const players = await response.json();
    console.log('✅ 陪玩列表获取成功:', players.length, '个陪玩');
    console.log('   示例陪玩:', players.slice(0, 3).map(p => p.name).join(', '));
  } catch (error) {
    console.log('❌ 陪玩列表获取失败:', error.message);
  }
  
  // 测试3: 获取礼物列表
  try {
    console.log('\n🎁 测试3: 获取礼物列表');
    const response = await fetch(`${baseURL}/gifts`);
    const gifts = await response.json();
    console.log('✅ 礼物列表获取成功:', gifts.length, '个礼物');
    console.log('   示例礼物:', gifts.slice(0, 3).map(g => `${g.name}(${g.price}元)`).join(', '));
  } catch (error) {
    console.log('❌ 礼物列表获取失败:', error.message);
  }
  
  // 测试4: 测试用户登录
  try {
    console.log('\n👤 测试4: 测试用户登录');
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
    const result = await response.json();
    if (response.ok) {
      console.log('✅ 用户登录成功:', result.user.name);
      console.log('   Token已生成，长度:', result.token.length);
    } else {
      console.log('❌ 用户登录失败:', result.message);
    }
  } catch (error) {
    console.log('❌ 用户登录请求失败:', error.message);
  }
  
  // 测试5: 测试陪玩登录
  try {
    console.log('\n🎯 测试5: 测试陪玩登录');
    const response = await fetch(`${baseURL}/players/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: '13700000001',
        passwd: 'player123'
      })
    });
    const result = await response.json();
    if (response.ok) {
      console.log('✅ 陪玩登录成功:', result.player.name);
      console.log('   Token已生成，长度:', result.token.length);
    } else {
      console.log('❌ 陪玩登录失败:', result.message);
    }
  } catch (error) {
    console.log('❌ 陪玩登录请求失败:', error.message);
  }
  
  console.log('\n🎉 前后端连接测试完成！');
};

// 运行测试
testAPI();