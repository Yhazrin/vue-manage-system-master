const bcrypt = require('bcrypt');

async function generateHashes() {
    const passwords = ['admin123', 'user123', 'player123'];
    
    for (const password of passwords) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`${password}: ${hash}`);
    }
}

generateHashes();