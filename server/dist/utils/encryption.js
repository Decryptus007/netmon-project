import crypto from 'crypto';
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secret-key-min-32-chars-long!!!!!';
const ALGORITHM = 'aes-256-cbc';
export function encrypt(text) {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return {
        iv: iv.toString('hex'),
        encryptedData: encrypted.toString('hex')
    };
}
export function decrypt(encryptedData, iv) {
    const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), Buffer.from(iv, 'hex'));
    let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'));
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}
export function hashPassword(password) {
    return crypto.pbkdf2Sync(password, 'salt', 100000, 64, 'sha512').toString('hex');
}
export function generateId() {
    return crypto.randomBytes(16).toString('hex');
}
//# sourceMappingURL=encryption.js.map