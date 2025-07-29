const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');

async function insertTestUsers() {
    const connection = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'YHZ@yhz050401',
        database: 'author_center'
    });

    try {
        // 生成密码哈希
        const adminHash = await bcrypt.hash('admin123', 10);
        const playerHash = await bcrypt.hash('player123', 10);
        
        console.log('生成的哈希值:');
        console.log('Admin hash:', adminHash, '长度:', adminHash.length);
        console.log('Player hash:', playerHash, '长度:', playerHash.length);
        
        // 删除现有测试用户
        await connection.execute('DELETE FROM managers WHERE phone_num = ?', ['13900000001']);
        await connection.execute('DELETE FROM players WHERE phone_num = ?', ['13900000003']);
        
        // 插入新的测试用户
        await connection.execute(
            'INSERT INTO managers (name, phone_num, passwd) VALUES (?, ?, ?)',
            ['测试管理员', '13900000001', adminHash]
        );
        
        await connection.execute(
            'INSERT INTO players (name, phone_num, passwd, game_id, intro, status) VALUES (?, ?, ?, ?, ?, ?)',
            ['测试陪玩', '13900000003', playerHash, 1, '专业陪玩，技术过硬', true]
        );
        
        console.log('✅ 测试用户插入成功！');
        
        // 验证插入的数据
        const [managers] = await connection.execute(
            'SELECT name, phone_num, LENGTH(passwd) as passwd_length FROM managers WHERE phone_num = ?',
            ['13900000001']
        );
        
        const [players] = await connection.execute(
            'SELECT name, phone_num, LENGTH(passwd) as passwd_length FROM players WHERE phone_num = ?',
            ['13900000003']
        );
        
        console.log('验证结果:');
        console.log('管理员:', managers[0]);
        console.log('陪玩:', players[0]);
        
    } catch (error) {
        console.error('错误:', error);
    } finally {
        await connection.end();
    }
}

insertTestUsers();