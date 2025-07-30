const fetch = require('node-fetch');

async function checkGames() {
    const baseUrl = 'http://localhost:3000';
    
    console.log('查询可用的游戏列表...\n');
    
    try {
        const response = await fetch(`${baseUrl}/api/games`);
        const result = await response.json();
        
        console.log('响应状态:', response.status);
        console.log('游戏列表:', JSON.stringify(result, null, 2));
        
    } catch (error) {
        console.error('查询失败:', error.message);
    }
}

// 运行查询
checkGames();