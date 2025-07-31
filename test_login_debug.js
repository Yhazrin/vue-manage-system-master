// 测试前端登录逻辑调试

const API_BASE_URL = 'http://localhost:3000/api';

async function testLoginLogic(role, identifier, password) {
    console.log(`\n=== 测试 ${role} 登录 ===`);
    console.log(`用户名: ${identifier}`);
    console.log(`密码: ${password}`);
    
    let endpoint = '';
    let requestBody = {};
    
    if (role === 'admin') {
        endpoint = `${API_BASE_URL}/managers/login`;
        requestBody = {
            phone_num: identifier,
            passwd: password
        };
    } else if (role === 'player') {
        endpoint = `${API_BASE_URL}/players/login`;
        requestBody = {
            phone_num: identifier,
            passwd: password
        };
    } else {
        endpoint = `${API_BASE_URL}/users/login`;
        requestBody = {
            phone_num: identifier,
            passwd: password
        };
    }
    
    console.log(`API端点: ${endpoint}`);
    console.log(`请求体:`, requestBody);
    
    try {
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        console.log(`响应状态: ${response.status}`);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.log(`错误响应: ${errorText}`);
            return;
        }
        
        const result = await response.json();
        console.log('登录成功:', result);
        
        if (result.success) {
            console.log(`✅ ${role} 登录成功`);
            console.log(`Token: ${result.token.substring(0, 20)}...`);
            console.log(`用户信息:`, result.user);
        } else {
            console.log(`❌ ${role} 登录失败: ${result.message}`);
        }
        
    } catch (error) {
        console.log(`❌ 网络错误: ${error.message}`);
    }
}

// 测试所有角色
async function runTests() {
    // 测试管理员登录
    await testLoginLogic('admin', '13900000001', 'admin123');
    
    // 测试陪玩登录 (使用新创建的陪玩账号)
    await testLoginLogic('player', '13900000002', 'test123');
    
    // 测试用户登录 (使用新创建的用户账号)
    await testLoginLogic('user', '13900000003', 'test123');
}

runTests().catch(console.error);