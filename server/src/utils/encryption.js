const crypto = require('crypto');

// In production, these should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-min-32-chars-long!!!!!';
const ALGORITHM = 'aes-256-cbc';

function encrypt(text) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
  
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  };
}

function decrypt(encryptedData, iv) {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  );
  
  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString();
}

function hashPassword(password) {
  return crypto.pbkdf2Sync(
    password,
    'salt', // In production, use a unique salt per user
    100000, // Number of iterations
    64,     // Key length
    'sha512'
  ).toString('hex');
}

function generateId() {
  return crypto.randomBytes(16).toString('hex');
}

module.exports = {
  encrypt,
  decrypt,
  hashPassword,
  generateId
}; 