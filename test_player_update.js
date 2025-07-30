const fetch = require('node-fetch');

async function testPlayerUpdate() {
    const baseUrl = 'http://localhost:3000';
    
    // 测试数据
    const testData = {
        name: '测试陪玩',
        phone_num: '13800138000',
        intro: '这是一个测试简介',
        game_id: 1  // 假设游戏ID 1存在
    };
    
    const invalidTestData = {
        name: '测试陪玩2',
        game_id: 999  // 不存在的游戏ID
    };
    
    console.log('开始测试陪玩个人资料更新...\n');
    
    try {
        // 测试1: 有效的game_id更新
        console.log('测试1: 更新有效的game_id');
        const response1 = await fetch(`${baseUrl}/api/players/15`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'  // 需要实际的token
            },
            body: JSON.stringify(testData)
        });
        
        const result1 = await response1.json();
        console.log('响应状态:', response1.status);
        console.log('响应数据:', result1);
        console.log('');
        
        // 测试2: 无效的game_id更新
        console.log('测试2: 更新无效的game_id');
        const response2 = await fetch(`${baseUrl}/api/players/15`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify(invalidTestData)
        });
        
        const result2 = await response2.json();
        console.log('响应状态:', response2.status);
        console.log('响应数据:', result2);
        console.log('');
        
        // 测试3: 设置game_id为null
        console.log('测试3: 设置game_id为null');
        const response3 = await fetch(`${baseUrl}/api/players/15`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer test-token'
            },
            body: JSON.stringify({ game_id: null })
        });
        
        const result3 = await response3.json();
        console.log('响应状态:', response3.status);
        console.log('响应数据:', result3);
        
    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

// 运行测试
testPlayerUpdate();