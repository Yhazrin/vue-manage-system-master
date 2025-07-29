// 测试三种不同身份用户的登录功能
const API_BASE = 'http://localhost:3000/api';

async function testLogin(endpoint, phone, password, userType) {
    console.log(`\n🔐 测试${userType}登录...`);
    console.log(`   手机号: ${phone}`);
    console.log(`   密码: ${password}`);
    
    try {
        const response = await fetch(`${API_BASE}${endpoint}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_num: phone,
                passwd: password
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.success) {
            console.log(`   ✅ ${userType}登录成功!`);
            console.log(`   - 用户名: ${data.user?.name || data.player?.name || data.manager?.name}`);
            console.log(`   - Token: ${data.token ? '已获取' : '未获取'}`);
            console.log(`   - 用户ID: ${data.user?.id || data.player?.id || data.manager?.id}`);
        } else {
            console.log(`   ❌ ${userType}登录失败`);
            console.log(`   - 状态码: ${response.status}`);
            console.log(`   - 错误信息: ${data.error || data.message || '未知错误'}`);
        }
    } catch (error) {
        console.log(`   ❌ ${userType}登录请求失败: ${error.message}`);
    }
}

async function testAllLogins() {
    console.log('🚀 开始测试三种身份用户登录...\n');
    
    // 测试管理员登录
    await testLogin('/managers/login', '13900000001', 'admin123', '管理员');
    
    // 测试普通用户登录
    await testLogin('/users/login', '13900000002', 'user123', '普通用户');
    
    // 测试陪玩登录
    await testLogin('/players/login', '13900000003', 'player123', '陪玩');
    
    console.log('\n📋 测试完成！');
    console.log('\n💡 测试账号信息:');
    console.log('   管理员: 13900000001 / admin123');
    console.log('   普通用户: 13900000002 / user123');
    console.log('   陪玩: 13900000003 / player123');
}

testAllLogins();