const mysql = require('mysql2/promise');

async function checkCustomerServiceAccounts() {
  const connection = await mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: 'YHZ@yhz050401',
    database: 'author_center'
  });

  try {
    console.log('🔍 查看客服账号信息...');
    
    // 检查两个可能的客服表
    const tables = ['customer_services_unified', 'customer_services_super_unified'];
    
    for (const tableName of tables) {
      try {
        console.log(`\n📋 检查表: ${tableName}`);
        
        // 查看表结构
        const [tableInfo] = await connection.execute(`DESCRIBE ${tableName}`);
        console.log(`\n📋 ${tableName} 表结构:`);
        tableInfo.forEach(field => {
          console.log(`  ${field.Field}: ${field.Type} ${field.Null === 'NO' ? '(必填)' : '(可选)'}`);
        });
        
        // 查看前3个账号
        const [accounts] = await connection.execute(`SELECT * FROM ${tableName} LIMIT 3`);
        console.log(`\n👥 ${tableName} 前3个账号:`);
        accounts.forEach((account, index) => {
          console.log(`  ${index + 1}. 账号信息:`);
          Object.keys(account).forEach(key => {
            console.log(`     ${key}: ${account[key] || '无'}`);
          });
          console.log('');
        });
        
        // 查看总数
        const [countResult] = await connection.execute(`SELECT COUNT(*) as total FROM ${tableName}`);
        console.log(`📊 ${tableName} 账号总数: ${countResult[0].total}`);
        
      } catch (error) {
        console.log(`❌ 表 ${tableName} 不存在或查询失败: ${error.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await connection.end();
  }
}

checkCustomerServiceAccounts().catch(console.error);