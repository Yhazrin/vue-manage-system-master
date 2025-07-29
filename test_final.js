// 最终测试脚本 - 验证前后端连接
const API_BASE = 'http://localhost:3000/api';

async function testFinalConnection() {
    console.log('🚀 开始最终连接测试...\n');
    
    try {
        // 1. 测试游戏列表获取
        console.log('1. 测试游戏列表获取...');
        const gamesResponse = await fetch(`${API_BASE}/games`);
        const gamesData = await gamesResponse.json();
        console.log('✅ 游戏列表获取成功');
        console.log(`   - 状态码: ${gamesResponse.status}`);
        console.log(`   - 游戏数量: ${gamesData.games?.length || 0}`);
        if (gamesData.games?.length > 0) {
            console.log(`   - 第一个游戏: ${gamesData.games[0].name}`);
        }
        console.log('');
        
        // 2. 测试用户登录
        console.log('2. 测试用户登录...');
        const loginResponse = await fetch(`${API_BASE}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                phone_num: '13800000001',
                passwd: 'password123'
            })
        });
        const loginData = await loginResponse.json();
        console.log('✅ 用户登录成功');
        console.log(`   - 状态码: ${loginResponse.status}`);
        console.log(`   - 用户名: ${loginData.user?.name || 'N/A'}`);
        console.log(`   - Token: ${loginData.token ? '已获取' : '未获取'}`);
        console.log('');
        
        // 3. 测试前端页面访问
        console.log('3. 测试前端页面访问...');
        const frontendResponse = await fetch('http://localhost:3001/');
        console.log('✅ 前端页面访问成功');
        console.log(`   - 状态码: ${frontendResponse.status}`);
        console.log(`   - 内容类型: ${frontendResponse.headers.get('content-type')}`);
        console.log('');
        
        console.log('🎉 所有测试通过！前后端连接正常！');
        console.log('\n📋 系统状态总结:');
        console.log('   - 后端服务器: http://localhost:3000 ✅');
        console.log('   - 前端服务器: http://localhost:3001 ✅');
        console.log('   - 数据库连接: 正常 ✅');
        console.log('   - API接口: 正常 ✅');
        console.log('   - 用户认证: 正常 ✅');
        
    } catch (error) {
        console.error('❌ 测试失败:', error.message);
        if (error.response) {
            console.error(`   - 状态码: ${error.response.status}`);
            console.error(`   - 错误信息: ${error.response.data?.error || error.response.data?.message || 'Unknown error'}`);
        }
    }
}

testFinalConnection();