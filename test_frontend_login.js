// 测试前端登录API

async function testLogin(role, phone, password) {
    try {
        let endpoint = '';
        if (role === 'admin') {
            endpoint = 'http://localhost:3000/api/managers/login';
        } else if (role === 'player') {
            endpoint = 'http://localhost:3000/api/players/login';
        } else {
            endpoint = 'http://localhost:3000/api/users/login';
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                phone_num: phone,
                passwd: password
            }),
        });

        const result = await response.json();
        console.log(`${role} 登录测试 (${phone}):`);
        console.log('状态:', response.status);
        console.log('结果:', result);
        console.log('---');
        
        return result;
    } catch (error) {
        console.error(`${role} 登录测试失败:`, error.message);
        return null;
    }
}

async function runTests() {
    console.log('🧪 开始测试前端登录API...\n');
    
    // 测试管理员登录
    await testLogin('admin', '13900000001', 'admin123');
    
    // 测试普通用户登录
    await testLogin('user', '13900000002', 'user123');
    
    // 测试陪玩登录
    await testLogin('player', '13900000003', 'player123');
    
    console.log('✅ 测试完成！');
}

runTests();