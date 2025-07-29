const bcrypt = require('bcrypt');

async function generateSimpleHash() {
    const password = 'admin123';
    const hash = await bcrypt.hash(password, 10);
    console.log('Password:', password);
    console.log('Hash:', hash);
    console.log('Hash length:', hash.length);
    
    // 验证哈希
    const isValid = await bcrypt.compare(password, hash);
    console.log('Verification:', isValid);
}

generateSimpleHash();