// 生成密码哈希值的脚本
const bcrypt = require('bcrypt');

async function generateHashes() {
    const passwords = {
        admin123: await bcrypt.hash('admin123', 10),
        user123: await bcrypt.hash('user123', 10),
        player123: await bcrypt.hash('player123', 10)
    };
    
    console.log('密码哈希值：');
    console.log('admin123:', passwords.admin123);
    console.log('user123:', passwords.user123);
    console.log('player123:', passwords.player123);
}

generateHashes().catch(console.error);