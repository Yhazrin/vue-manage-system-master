// 简单的连接测试
const http = require('http');

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/',
    method: 'GET'
};

console.log('尝试连接到 http://localhost:3000/');

const req = http.request(options, (res) => {
    console.log(`状态码: ${res.statusCode}`);
    console.log(`响应头: ${JSON.stringify(res.headers)}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        console.log('响应数据:', data);
    });
});

req.on('error', (err) => {
    console.error('连接错误:', err.message);
    console.error('错误代码:', err.code);
});

req.setTimeout(5000, () => {
    console.log('请求超时');
    req.destroy();
});

req.end();