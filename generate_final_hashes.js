const bcrypt = require('bcrypt');

async function generateHashesForUsers() {
    const passwords = {
        admin: 'admin123',
        player: 'player123'
    };
    
    for (const [role, password] of Object.entries(passwords)) {
        const hash = await bcrypt.hash(password, 10);
        console.log(`${role}: ${password}`);
        console.log(`Hash: ${hash}`);
        console.log(`Length: ${hash.length}`);
        console.log('---');
    }
}

generateHashesForUsers();