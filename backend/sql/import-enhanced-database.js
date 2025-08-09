const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// 数据库配置
const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'author_center',
    charset: 'utf8mb4'
};

// 颜色输出函数
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
};

function colorLog(message, color = 'reset') {
    console.log(colors[color] + message + colors.reset);
}

async function importEnhancedDatabase() {
    let connection;
    
    try {
        colorLog('\n🚀 开始导入增强版数据库...', 'cyan');
        colorLog('=' .repeat(60), 'blue');
        
        // 连接数据库
        colorLog('\n📡 正在连接数据库...', 'yellow');
        connection = await mysql.createConnection(dbConfig);
        colorLog('✅ 数据库连接成功！', 'green');
        
        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, 'database_enhanced_with_real_data.sql');
        colorLog(`\n📖 正在读取SQL文件: ${sqlFilePath}`, 'yellow');
        
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL文件不存在: ${sqlFilePath}`);
        }
        
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        colorLog('✅ SQL文件读取成功！', 'green');
        
        // 分割SQL语句
        colorLog('\n⚙️  正在处理SQL语句...', 'yellow');
        const statements = sqlContent
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--') && !stmt.startsWith('/*'));
        
        colorLog(`📊 共找到 ${statements.length} 条SQL语句`, 'blue');
        
        // 执行SQL语句
        colorLog('\n🔄 开始执行SQL语句...', 'yellow');
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            
            try {
                // 显示进度
                const progress = Math.round(((i + 1) / statements.length) * 100);
                process.stdout.write(`\r⏳ 执行进度: ${progress}% (${i + 1}/${statements.length})`);
                
                await connection.execute(statement);
                successCount++;
                
            } catch (error) {
                errorCount++;
                if (error.code !== 'ER_DUP_ENTRY' && error.code !== 'ER_TABLE_EXISTS_ERROR') {
                    colorLog(`\n❌ 执行失败: ${error.message}`, 'red');
                    colorLog(`📝 SQL语句: ${statement.substring(0, 100)}...`, 'red');
                }
            }
        }
        
        console.log(); // 换行
        colorLog('\n📈 执行统计:', 'cyan');
        colorLog(`✅ 成功: ${successCount} 条`, 'green');
        colorLog(`❌ 失败: ${errorCount} 条`, errorCount > 0 ? 'red' : 'green');
        
        // 验证导入结果
        colorLog('\n🔍 正在验证导入结果...', 'yellow');
        
        const verificationQueries = [
            { name: '管理员账户', query: 'SELECT COUNT(*) as count FROM admins' },
            { name: '客服账户', query: 'SELECT COUNT(*) as count FROM customer_services_super_unified' },
            { name: '陪玩账户', query: 'SELECT COUNT(*) as count FROM players' },
            { name: '用户账户', query: 'SELECT COUNT(*) as count FROM users' },
            { name: '游戏数据', query: 'SELECT COUNT(*) as count FROM games' },
            { name: '礼物数据', query: 'SELECT COUNT(*) as count FROM gifts' },
            { name: '服务数据', query: 'SELECT COUNT(*) as count FROM services' },
            { name: '订单数据', query: 'SELECT COUNT(*) as count FROM orders' },
            { name: '礼物记录', query: 'SELECT COUNT(*) as count FROM gift_records' },
            { name: '收藏记录', query: 'SELECT COUNT(*) as count FROM favorites' },
            { name: '评论数据', query: 'SELECT COUNT(*) as count FROM comments' },
            { name: '打卡记录', query: 'SELECT COUNT(*) as count FROM attendance_records' },
            { name: '提现记录', query: 'SELECT COUNT(*) as count FROM withdrawals' },
            { name: '统计数据', query: 'SELECT COUNT(*) as count FROM statistics' }
        ];
        
        colorLog('\n📊 数据统计结果:', 'cyan');
        for (const { name, query } of verificationQueries) {
            try {
                const [rows] = await connection.execute(query);
                const count = rows[0].count;
                colorLog(`   ${name}: ${count} 条`, count > 0 ? 'green' : 'yellow');
            } catch (error) {
                colorLog(`   ${name}: 查询失败`, 'red');
            }
        }
        
        // 显示默认账户信息
        colorLog('\n🔑 默认账户信息:', 'cyan');
        colorLog('=' .repeat(60), 'blue');
        
        colorLog('\n👑 管理员账户:', 'magenta');
        colorLog('   用户名: admin', 'green');
        colorLog('   密码: admin123', 'green');
        colorLog('   权限: 超级管理员', 'green');
        
        colorLog('\n👨‍💼 客服账户示例:', 'magenta');
        colorLog('   用户名: cs_manager_001', 'green');
        colorLog('   密码: cs123456', 'green');
        colorLog('   权限: 高级客服', 'green');
        
        colorLog('\n🎮 陪玩账户示例:', 'magenta');
        colorLog('   用户名: 甜心小雨', 'green');
        colorLog('   密码: player123', 'green');
        colorLog('   游戏: 王者荣耀', 'green');
        
        colorLog('\n👤 用户账户示例:', 'magenta');
        colorLog('   用户名: 张三', 'green');
        colorLog('   密码: user123', 'green');
        colorLog('   类型: 普通用户', 'green');
        
        colorLog('\n🎯 数据特色:', 'cyan');
        colorLog('   ✨ 6个客服账户（不同等级和权限）', 'blue');
        colorLog('   ✨ 10个陪玩账户（覆盖6款热门游戏）', 'blue');
        colorLog('   ✨ 10个用户账户（完整个人信息）', 'blue');
        colorLog('   ✨ 15个订单（不同状态和类型）', 'blue');
        colorLog('   ✨ 完整的礼物、收藏、评论数据', 'blue');
        colorLog('   ✨ 真实的打卡和提现记录', 'blue');
        colorLog('   ✨ 详细的统计和收益数据', 'blue');
        
        colorLog('\n🎉 增强版数据库导入完成！', 'green');
        colorLog('=' .repeat(60), 'blue');
        
    } catch (error) {
        colorLog('\n❌ 导入过程中发生错误:', 'red');
        colorLog(error.message, 'red');
        
        if (error.code === 'ECONNREFUSED') {
            colorLog('\n💡 解决建议:', 'yellow');
            colorLog('   1. 检查MySQL服务是否启动', 'yellow');
            colorLog('   2. 检查数据库连接配置', 'yellow');
            colorLog('   3. 确认.env文件中的数据库配置正确', 'yellow');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            colorLog('\n💡 解决建议:', 'yellow');
            colorLog('   1. 检查数据库用户名和密码', 'yellow');
            colorLog('   2. 确认数据库用户有足够权限', 'yellow');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            colorLog('\n💡 解决建议:', 'yellow');
            colorLog('   1. 检查数据库名称是否正确', 'yellow');
            colorLog('   2. 确认目标数据库已创建', 'yellow');
        }
        
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            colorLog('\n🔌 数据库连接已关闭', 'blue');
        }
    }
}

// 执行导入
if (require.main === module) {
    importEnhancedDatabase().catch(error => {
        colorLog('\n💥 程序异常退出:', 'red');
        colorLog(error.message, 'red');
        process.exit(1);
    });
}

module.exports = importEnhancedDatabase;