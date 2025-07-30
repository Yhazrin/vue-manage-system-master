// 测试管理员页面API连接的脚本
const http = require('http');
const { URL } = require('url');

const API_BASE_URL = 'http://localhost:3000/api';

// 发送HTTP请求的辅助函数
function makeRequest(url, options = {}) {
    return new Promise((resolve, reject) => {
        const urlObj = new URL(url);
        const requestOptions = {
            hostname: urlObj.hostname,
            port: urlObj.port,
            path: urlObj.pathname + urlObj.search,
            method: options.method || 'GET',
            headers: options.headers || {},
            timeout: 5000
        };

        const req = http.request(requestOptions, (res) => {
            let data = '';
            res.on('data', (chunk) => {
                data += chunk;
            });
            res.on('end', () => {
                resolve({
                    status: res.statusCode,
                    data: data,
                    headers: res.headers
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        if (options.data) {
            req.write(JSON.stringify(options.data));
        }

        req.end();
    });
}

// 测试各个管理员API接口
async function testAdminAPIs() {
    console.log('🔍 开始测试管理员页面API连接...\n');
    
    const tests = [
        {
            name: '数据概览',
            url: `${API_BASE_URL}/statistics/global`,
            method: 'GET'
        },
        {
            name: '统计分析',
            url: `${API_BASE_URL}/statistics`,
            method: 'GET'
        },
        {
            name: '订单管理',
            url: `${API_BASE_URL}/orders`,
            method: 'GET'
        },
        {
            name: '用户管理',
            url: `${API_BASE_URL}/users`,
            method: 'GET'
        },
        {
            name: '陪玩管理',
            url: `${API_BASE_URL}/players`,
            method: 'GET'
        },
        {
            name: '礼物管理',
            url: `${API_BASE_URL}/gifts`,
            method: 'GET'
        },
        {
            name: '礼物记录',
            url: `${API_BASE_URL}/gift-records`,
            method: 'GET'
        },
        {
            name: '提现管理',
            url: `${API_BASE_URL}/withdrawals`,
            method: 'GET'
        },
        {
            name: '权限管理',
            url: `${API_BASE_URL}/managers`,
            method: 'GET'
        }
    ];

    for (const test of tests) {
        try {
            console.log(`🔄 测试 ${test.name}...`);
            const response = await makeRequest(test.url, {
                method: test.method,
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.status === 200) {
                console.log(`✅ ${test.name} - API连接正常 (状态码: ${response.status})`);
            } else if (response.status === 401) {
                console.log(`🔐 ${test.name} - 需要认证 (状态码: ${response.status}) - 路由存在`);
            } else if (response.status === 404) {
                console.log(`❌ ${test.name} - 路由不存在 (状态码: ${response.status})`);
            } else {
                console.log(`⚠️  ${test.name} - API响应异常 (状态码: ${response.status})`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${test.name} - 无法连接到后端服务器`);
            } else {
                console.log(`❌ ${test.name} - 请求失败: ${error.message}`);
            }
        }
        
        // 添加延迟避免请求过快
        await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 API测试完成！');
    console.log('\n📝 说明：');
    console.log('✅ API连接正常 - 接口可以正常访问');
    console.log('🔐 需要认证 - 接口存在但需要登录token');
    console.log('❌ 路由不存在 - 接口路径错误或未实现');
}

// 运行测试
testAdminAPIs().catch(console.error);