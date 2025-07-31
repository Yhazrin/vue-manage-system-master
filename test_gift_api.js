const axios = require('axios');

async function testGiftAPI() {
    const baseURL = 'http://localhost:3000';
    
    try {
        // 1. 先登录获取token
        console.log('1. 登录管理员账户...');
        const loginResponse = await axios.post(`${baseURL}/api/auth/login`, {
            username: 'admin',
            password: 'admin123'
        });
        
        const token = loginResponse.data.token;
        console.log('✅ 登录成功，获取到token');
        
        // 2. 测试获取礼物列表
        console.log('\n2. 获取礼物列表...');
        const giftsResponse = await axios.get(`${baseURL}/api/gifts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 获取礼物列表成功:', giftsResponse.data);
        
        // 3. 测试创建礼物
        console.log('\n3. 创建新礼物...');
        const newGift = {
            name: '测试礼物' + Date.now(),
            price: 99.99,
            imageUrl: 'https://example.com/test-gift.jpg'
        };
        
        const createResponse = await axios.post(`${baseURL}/api/gifts`, newGift, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 创建礼物成功:', createResponse.data);
        
        // 4. 再次获取礼物列表确认
        console.log('\n4. 再次获取礼物列表确认...');
        const updatedGiftsResponse = await axios.get(`${baseURL}/api/gifts`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('✅ 更新后的礼物列表:', updatedGiftsResponse.data);
        
    } catch (error) {
        console.error('❌ 测试失败:', error.response?.data || error.message);
    }
}

testGiftAPI();