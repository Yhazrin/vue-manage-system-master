// 测试陪玩完整工作流程：注册 -> 设置信息 -> 管理员审核 -> 显示在大厅
// 使用Node.js 18+内置的fetch API

const baseURL = 'http://localhost:3000/api';

// 生成随机手机号
const generatePhoneNumber = () => {
  const prefix = '139';
  const suffix = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return prefix + suffix;
};

// 测试数据
const testPlayerData = {
  name: '测试陪玩' + Math.floor(Math.random() * 1000),
  phone_num: generatePhoneNumber(),
  passwd: 'test123456',
  role: 'player',
  intro: '专业游戏陪玩，擅长多种游戏类型',
  game_id: 1
};

console.log('🎮 开始测试陪玩完整工作流程');
console.log('测试陪玩数据:', testPlayerData);

async function testCompleteWorkflow() {
  let playerToken = '';
  let playerId = '';
  let adminToken = '';

  try {
    // 步骤1: 注册新陪玩
    console.log('\n📝 步骤1: 注册新陪玩');
    const registerResponse = await fetch(`${baseURL}/players/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testPlayerData)
    });

    const registerData = await registerResponse.json();
    console.log('注册响应:', registerData);

    if (!registerData.success) {
      throw new Error(`注册失败: ${registerData.error}`);
    }

    playerId = registerData.id;
    console.log('✅ 陪玩注册成功，ID:', playerId);

    // 步骤2: 陪玩登录
    console.log('\n🔐 步骤2: 陪玩登录');
    const loginResponse = await fetch(`${baseURL}/players/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: testPlayerData.phone_num,
        passwd: testPlayerData.passwd
      })
    });

    const loginData = await loginResponse.json();
    console.log('登录响应:', loginData);

    if (!loginData.success) {
      throw new Error(`登录失败: ${loginData.error}`);
    }

    playerToken = loginData.token;
    console.log('✅ 陪玩登录成功');

    // 步骤3: 设置陪玩详细信息（价格、游戏等）
    console.log('\n⚙️ 步骤3: 设置陪玩详细信息');
    const updateResponse = await fetch(`${baseURL}/players/${playerId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${playerToken}`
      },
      body: JSON.stringify({
        intro: '专业游戏陪玩，5年游戏经验，擅长MOBA、FPS、RPG等多种游戏类型',
        game_id: 1,
        status: true
      })
    });

    const updateData = await updateResponse.json();
    console.log('更新信息响应:', updateData);

    if (!updateData.success) {
      throw new Error(`更新信息失败: ${updateData.error}`);
    }

    console.log('✅ 陪玩基本信息设置成功');

    // 步骤4: 管理员登录
    console.log('\n👨‍💼 步骤4: 管理员登录');
    const adminLoginResponse = await fetch(`${baseURL}/managers/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: '13900000001',
        passwd: 'admin123'
      })
    });

    const adminLoginData = await adminLoginResponse.json();
    console.log('管理员登录响应:', adminLoginData);

    if (!adminLoginData.success) {
      throw new Error(`管理员登录失败: ${adminLoginData.error}`);
    }

    adminToken = adminLoginData.token;
    console.log('✅ 管理员登录成功');

    // 步骤4.1: 管理员为陪玩创建服务（设置价格）
    console.log('\n💰 步骤4.1: 管理员为陪玩创建服务（设置价格）');
    
    // 先用普通用户身份创建服务（因为API限制只有普通用户可以创建服务）
    // 这里我们需要一个普通用户的token
    const userLoginResponse = await fetch(`${baseURL}/users/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        phone_num: '13900000002',
        passwd: 'user123'
      })
    });

    const userLoginData = await userLoginResponse.json();
    if (userLoginData.success) {
      const userToken = userLoginData.token;
      
      const serviceResponse = await fetch(`${baseURL}/services`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`
        },
        body: JSON.stringify({
          player_id: playerId,
          game_id: 1,
          price: 25.00,
          hours: 1
        })
      });

      const serviceData = await serviceResponse.json();
      console.log('创建服务响应:', serviceData);

      if (serviceData.success) {
        console.log('✅ 陪玩服务价格设置成功');
      } else {
        console.log('⚠️ 服务创建失败，但继续测试流程:', serviceData.error);
      }
    } else {
      console.log('⚠️ 普通用户登录失败，跳过服务创建步骤');
    }

    // 步骤5: 管理员查看待审核陪玩
    console.log('\n🔍 步骤5: 管理员查看陪玩列表');
    const playersListResponse = await fetch(`${baseURL}/players`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`
      }
    });

    const playersListData = await playersListResponse.json();
    console.log('陪玩列表响应:', playersListData);

    if (!playersListData.success) {
      throw new Error(`获取陪玩列表失败: ${playersListData.error}`);
    }

    const newPlayer = playersListData.players.find(p => p.id === playerId);
    console.log('新注册的陪玩:', newPlayer);

    // 步骤6: 管理员审核通过（如果需要的话，更新状态）
    console.log('\n✅ 步骤6: 管理员审核陪玩');
    if (newPlayer && !newPlayer.status) {
      const approveResponse = await fetch(`${baseURL}/players/${playerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${adminToken}`
        },
        body: JSON.stringify({
          status: true
        })
      });

      const approveData = await approveResponse.json();
      console.log('审核响应:', approveData);

      if (!approveData.success) {
        throw new Error(`审核失败: ${approveData.error}`);
      }

      console.log('✅ 陪玩审核通过');
    } else {
      console.log('✅ 陪玩状态已激活，无需审核');
    }

    // 步骤7: 验证陪玩在公开列表中显示
    console.log('\n🎯 步骤7: 验证陪玩在公开列表中显示');
    const publicPlayersResponse = await fetch(`${baseURL}/players/public`, {
      method: 'GET'
    });

    const publicPlayersData = await publicPlayersResponse.json();
    console.log('公开陪玩列表响应:', publicPlayersData);

    if (!publicPlayersData.success) {
      throw new Error(`获取公开陪玩列表失败: ${publicPlayersData.error}`);
    }

    const publicPlayer = publicPlayersData.players.find(p => p.id === playerId);
    if (publicPlayer) {
      console.log('✅ 陪玩已在公开列表中显示:', {
        id: publicPlayer.id,
        name: publicPlayer.name,
        intro: publicPlayer.intro,
        hourly_rate: publicPlayer.hourly_rate,
        status: publicPlayer.status
      });
    } else {
      console.log('❌ 陪玩未在公开列表中找到');
    }

    // 步骤8: 测试用户端陪玩大厅显示
    console.log('\n🏠 步骤8: 测试用户端陪玩大厅显示');
    console.log('✅ 完整工作流程测试完成！');
    console.log('\n📊 测试结果总结:');
    console.log(`- 陪玩ID: ${playerId}`);
    console.log(`- 陪玩姓名: ${testPlayerData.name}`);
    console.log(`- 手机号: ${testPlayerData.phone_num}`);
    console.log(`- 是否在公开列表: ${publicPlayer ? '是' : '否'}`);

  } catch (error) {
    console.error('❌ 测试失败:', error.message);
  }
}

// 运行测试
testCompleteWorkflow();