// 测试用户预约陪玩服务的完整流程
const BASE_URL = 'http://localhost:3000/api';

// 测试用户登录并获取token
async function loginUser() {
    try {
        console.log('🔐 测试用户登录...');
        const response = await fetch(`${BASE_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_num: '13900000002',
                passwd: 'user123'
            })
        });
        
        const data = await response.json();
        console.log('登录响应:', data);
        
        if (data.success) {
            console.log('✅ 用户登录成功');
            console.log('Token:', data.token);
            return data.token;
        } else {
            console.log('❌ 用户登录失败:', data.message || data.error);
            return null;
        }
    } catch (error) {
        console.log('❌ 用户登录请求失败:', error.message);
        return null;
    }
}

// 获取陪玩列表
async function getPlayers(token) {
    try {
        console.log('\n👥 获取陪玩列表...');
        const response = await fetch(`${BASE_URL}/players`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        console.log('陪玩列表响应状态:', response.status);
        console.log('响应对象的键:', Object.keys(data));
        
        // 检查不同的数据结构
        let players = null;
        if (data.data && Array.isArray(data.data)) {
            players = data.data;
        } else if (Array.isArray(data)) {
            players = data;
        } else if (data.players && Array.isArray(data.players)) {
            players = data.players;
        } else {
            // 如果响应直接是对象，可能包含陪玩数据
            console.log('尝试查找陪玩数据...');
            for (const key of Object.keys(data)) {
                if (Array.isArray(data[key]) && data[key].length > 0) {
                    console.log(`找到数组字段: ${key}, 长度: ${data[key].length}`);
                    players = data[key];
                    break;
                }
            }
        }
        
        if (players && players.length > 0) {
            console.log('✅ 获取陪玩列表成功');
            console.log(`找到 ${players.length} 个陪玩`);
            console.log('第一个陪玩:', players[0].name);
            return players;
        } else {
            console.log('❌ 获取陪玩列表失败: 没有数据');
            return null;
        }
    } catch (error) {
        console.log('❌ 获取陪玩列表请求失败:', error.message);
        return null;
    }
}

// 获取指定陪玩的服务列表
async function getPlayerServices(token, playerId) {
    try {
        console.log(`\n🎮 获取陪玩 ${playerId} 的服务列表...`);
        const response = await fetch(`${BASE_URL}/services/player/${playerId}`);
        
        const data = await response.json();
        console.log('服务列表响应状态:', response.status);
        console.log('响应对象的键:', Object.keys(data));
        
        if (data.success && data.services && Array.isArray(data.services)) {
            console.log('✅ 获取服务列表成功');
            console.log(`找到 ${data.services.length} 个服务`);
            if (data.services.length > 0) {
                console.log('第一个服务:', data.services[0]);
            }
            return data.services;
        } else {
            console.log('❌ 获取服务列表失败: 没有数据');
            return [];
        }
    } catch (error) {
        console.log('❌ 获取服务列表请求失败:', error.message);
        return [];
    }
}

// 创建订单
async function createOrder(token, orderData) {
    try {
        const response = await fetch(`${BASE_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(orderData)
        });
        
        const data = await response.json();
        console.log('创建订单响应:', data);
        
        if (data.success) {
            console.log('✅ 订单创建成功');
            console.log('订单ID:', data.order_id || data.id);
            return data.order_id || data.id;
        } else {
            console.log('❌ 订单创建失败:', data.message || data.error);
            return null;
        }
    } catch (error) {
        console.log('❌ 订单创建请求失败:', error.message);
        return null;
    }
}

// 获取用户订单列表
async function getUserOrders(token) {
    try {
        console.log('\n📋 获取用户订单列表...');
        const response = await fetch(`${BASE_URL}/orders/user`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data && data.orders) {
            console.log('✅ 获取用户订单列表成功');
            console.log(`找到 ${data.orders.length} 个订单`);
            return data.orders;
        } else {
            console.log('❌ 获取用户订单列表失败');
            return [];
        }
    } catch (error) {
        console.log('❌ 获取用户订单列表请求失败:', error.message);
        return [];
    }
}

// 主测试流程
async function testBookingFlow() {
    console.log('🚀 开始测试用户预约陪玩服务的完整流程\n');
    
    // 1. 用户登录
    const token = await loginUser();
    if (!token) {
        console.log('❌ 测试终止：用户登录失败');
        return;
    }
    
    // 2. 获取陪玩列表
    const players = await getPlayers(token);
    if (!players || players.length === 0) {
        console.log('❌ 测试终止：没有可用的陪玩');
        return;
    }
    
    // 选择第一个陪玩
    const selectedPlayer = players[0];
    console.log(`\n🎯 选择陪玩: ${selectedPlayer.name} (ID: ${selectedPlayer.id})`);
    
    // 3. 获取选定陪玩的服务列表
    const services = await getPlayerServices(token, selectedPlayer.id);
    if (!services || services.length === 0) {
        console.log('❌ 测试终止：该陪玩没有可用的服务');
        return;
    }
    
    // 4. 选择第一个服务并创建订单
    const selectedService = services[0];
    console.log(`\n🎯 选择服务: 游戏ID ${selectedService.game_id}, 价格 ${selectedService.price}元, 时长 ${selectedService.hours}小时`);
    
    const orderData = {
        player_id: selectedPlayer.id,
        service_id: selectedService.id,  // 使用service_id而不是game_id
        amount: parseFloat(selectedService.price)  // 使用amount而不是total_price，并转换为数字
    };
    
    console.log('\n📝 创建订单...');
    console.log('订单数据:', orderData);
    
    const orderId = await createOrder(token, orderData);
    if (!orderId) {
        console.log('❌ 测试终止：订单创建失败');
        return;
    }
    
    // 6. 获取用户订单列表验证
    const orders = await getUserOrders(token);
    const createdOrder = orders.find(order => order.order_id === orderId);
    
    if (createdOrder) {
        console.log('\n🎉 测试成功！完整流程验证通过');
        console.log('订单详情:');
        console.log(`- 订单号: ${createdOrder.order_id}`);
        console.log(`- 陪玩: ${createdOrder.player_name}`);
        console.log(`- 服务: ${createdOrder.service_name || '未知服务'}`);
        console.log(`- 金额: ¥${createdOrder.amount}`);
        console.log(`- 状态: ${createdOrder.status}`);
        console.log(`- 创建时间: ${createdOrder.created_at}`);
    } else {
        console.log('❌ 测试失败：创建的订单未在订单列表中找到');
    }
    
    console.log('\n✨ 测试完成！');
}

// 运行测试
testBookingFlow().catch(error => {
    console.error('测试过程中发生错误:', error);
});