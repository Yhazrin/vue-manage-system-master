const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

// 数据库连接配置
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'author_center',
  charset: 'utf8mb4'
};

async function importCleanDatabase() {
  let connection;
  
  try {
    console.log('🔗 连接数据库...');
    connection = await mysql.createConnection(dbConfig);
    
    const sqlFilePath = path.join(__dirname, '../sql/clean_database_with_admins.sql');
    
    // 检查SQL文件是否存在
    try {
      await fs.access(sqlFilePath);
    } catch (error) {
      throw new Error(`SQL文件不存在: ${sqlFilePath}`);
    }
    
    console.log('📁 读取SQL文件...');
    const sqlContent = await fs.readFile(sqlFilePath, 'utf8');
    
    console.log('🧹 开始导入干净的数据库...');
    
    // 分割SQL语句（简单的分割，基于分号）
    const statements = sqlContent
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    console.log(`📊 共 ${statements.length} 条SQL语句需要执行`);
    
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      try {
        await connection.execute(statement);
        successCount++;
        
        // 显示进度
        if ((i + 1) % 10 === 0 || i === statements.length - 1) {
          console.log(`⏳ 进度: ${i + 1}/${statements.length} (${Math.round((i + 1) / statements.length * 100)}%)`);
        }
      } catch (error) {
        errorCount++;
        console.log(`⚠️ 执行失败 (${i + 1}): ${error.message}`);
        // 继续执行其他语句
      }
    }
    
    console.log('✅ 数据库导入完成！');
    console.log('📊 导入统计:');
    console.log(`  - 成功执行: ${successCount} 条语句`);
    console.log(`  - 执行失败: ${errorCount} 条语句`);
    
    // 验证导入结果
    console.log('🔍 验证导入结果...');
    
    // 检查管理员账户
    const [admins] = await connection.execute('SELECT COUNT(*) as count FROM managers WHERE status = 1');
    console.log(`👑 管理员账户数量: ${admins[0].count}`);
    
    // 检查其他主要表是否为空
    const checkTables = ['users', 'players', 'orders', 'customer_services_super_unified'];
    for (const table of checkTables) {
      try {
        const [result] = await connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
        console.log(`📋 ${table} 表记录数: ${result[0].count}`);
      } catch (error) {
        console.log(`⚠️ 检查表 ${table} 失败: ${error.message}`);
      }
    }
    
    console.log('\n🎉 数据库已恢复到干净状态！');
    console.log('💡 现在可以重新开始添加数据了');
    
  } catch (error) {
    console.error('❌ 数据库导入失败:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 数据库连接已关闭');
    }
  }
}

// 执行导入
importCleanDatabase()
  .then(() => {
    console.log('🎯 数据库导入任务完成！');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 数据库导入任务失败:', error);
    process.exit(1);
  });