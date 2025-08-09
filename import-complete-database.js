const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function importCompleteDatabase() {
    let connection;
    
    try {
        console.log('🚀 开始导入完整示例数据库...');
        
        // 数据库连接配置
        const dbConfig = {
            host: process.env.DB_HOST || 'localhost',
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASS || '',
            multipleStatements: true,
            charset: 'utf8mb4'
        };
        
        console.log('📡 连接数据库服务器...');
        connection = await mysql.createConnection(dbConfig);
        
        // 读取SQL文件
        const sqlFilePath = path.join(__dirname, 'sql', 'database_complete.sql');
        if (!fs.existsSync(sqlFilePath)) {
            throw new Error(`SQL文件不存在: ${sqlFilePath}`);
        }
        
        console.log('📖 读取SQL文件...');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
        
        // 分割SQL语句（处理存储过程和触发器）
        const statements = sqlContent
            .split(/;\s*(?=(?:[^']*'[^']*')*[^']*$)/)
            .filter(stmt => stmt.trim().length > 0)
            .map(stmt => stmt.trim());
        
        console.log(`📝 准备执行 ${statements.length} 条SQL语句...`);
        
        // 执行SQL语句
        let successCount = 0;
        let errorCount = 0;
        
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (statement.trim()) {
                try {
                    await connection.execute(statement);
                    successCount++;
                    
                    // 显示进度
                    if (i % 10 === 0 || i === statements.length - 1) {
                        const progress = Math.round((i + 1) / statements.length * 100);
                        console.log(`⏳ 进度: ${progress}% (${i + 1}/${statements.length})`);
                    }
                } catch (error) {
                    errorCount++;
                    console.warn(`⚠️  语句执行警告 (${i + 1}): ${error.message.substring(0, 100)}...`);
                }
            }
        }
        
        console.log('\n✅ 数据库导入完成！');
        console.log(`📊 执行统计: 成功 ${successCount} 条, 警告 ${errorCount} 条`);
        
        // 验证导入结果
        console.log('\n🔍 验证导入结果...');
        
        // 切换到目标数据库
        await connection.execute('USE author_center');
        
        // 检查管理员账户
        const [admins] = await connection.execute('SELECT COUNT(*) as count FROM admins WHERE status = "active"');
        console.log(`👨‍💼 管理员账户: ${admins[0].count} 个`);
        
        // 检查客服账户
        const [customerServices] = await connection.execute('SELECT COUNT(*) as count FROM customer_services_super_unified WHERE status = "active"');
        console.log(`👩‍💼 客服账户: ${customerServices[0].count} 个`);
        
        // 检查玩家账户
        const [players] = await connection.execute('SELECT COUNT(*) as count FROM players WHERE status = "active"');
        console.log(`🎮 玩家账户: ${players[0].count} 个`);
        
        // 检查游戏数据
        const [games] = await connection.execute('SELECT COUNT(*) as count FROM games WHERE status = "active"');
        console.log(`🎯 游戏数据: ${games[0].count} 个`);
        
        // 检查礼品数据
        const [gifts] = await connection.execute('SELECT COUNT(*) as count FROM gifts WHERE status = "active"');
        console.log(`🎁 礼品数据: ${gifts[0].count} 个`);
        
        // 检查系统配置
        const [settings] = await connection.execute('SELECT COUNT(*) as count FROM system_settings');
        console.log(`⚙️  系统配置: ${settings[0].count} 项`);
        
        console.log('\n🎉 完整示例数据库导入成功！');
        console.log('\n📋 默认账户信息:');
        console.log('管理员账户:');
        console.log('  - 用户名: admin, 密码: password (超级管理员)');
        console.log('  - 用户名: manager, 密码: password (管理员)');
        console.log('客服账户:');
        console.log('  - 用户名: cs001, 密码: password123');
        console.log('  - 用户名: cs002, 密码: password123');
        console.log('玩家账户:');
        console.log('  - 用户名: player001, 密码: password');
        console.log('  - 用户名: player002, 密码: password');
        
    } catch (error) {
        console.error('❌ 导入失败:', error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log('🔌 数据库连接已关闭');
        }
    }
}

// 执行导入
importCompleteDatabase();