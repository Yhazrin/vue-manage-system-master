// 测试服务API的脚本
const http = require('http');

function testAPI(path, method = 'GET') {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve({ status: res.statusCode, data: result });
                } catch (e) {
                    resolve({ status: res.statusCode, data: data });
                }
            });
        });

        req.on('error', (err) => {
            console.error('请求错误:', err.message);
            reject(err);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('请求超时'));
        });

        req.end();
    });
}

async function runTests() {
    console.log('开始测试服务API...\n');

    try {
        // 测试获取陪玩服务信息的API
        console.log('测试 GET /api/services/player/1');
        const result = await testAPI('/api/services/player/1');
        console.log('状态码:', result.status);
        console.log('响应数据:', JSON.stringify(result.data, null, 2));
        console.log('---\n');

        // 测试不存在的陪玩ID
        console.log('测试 GET /api/services/player/999');
        const result2 = await testAPI('/api/services/player/999');
        console.log('状态码:', result2.status);
        console.log('响应数据:', JSON.stringify(result2.data, null, 2));
        console.log('---\n');

    } catch (error) {
        console.error('测试失败:', error.message);
    }
}

runTests();