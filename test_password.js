const bcrypt = require('bcrypt');

async function testPasswordHash() {
    // 测试密码
    const password = 'admin123';
    
    // 从数据库获取的哈希值（可能被截断）
    const dbHash = '$2b$10$PxGIRmBL1BepvQT0MSpqz.3smajEg3a144KU/LWwMLB9VGcToY0vi';
    
    console.log('测试密码:', password);
    console.log('数据库哈希:', dbHash);
    
    // 验证密码
    const isValid = await bcrypt.compare(password, dbHash);
    console.log('密码验证结果:', isValid);
    
    // 生成新的哈希值进行对比
    const newHash = await bcrypt.hash(password, 10);
    console.log('新生成的哈希:', newHash);
    
    // 验证新哈希
    const newIsValid = await bcrypt.compare(password, newHash);
    console.log('新哈希验证结果:', newIsValid);
}

testPasswordHash();