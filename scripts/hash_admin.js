const crypto = require('crypto');
const salt = process.env.HASH_SALT || 'wassal_secret_salt_key_123';
const pass = 'admin123';
const hash = crypto.createHmac('sha256', salt).update(pass).digest('hex');
console.log(hash);
