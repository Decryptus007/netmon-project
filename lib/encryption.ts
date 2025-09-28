import crypto from 'crypto'

// In production, these should be stored in environment variables
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-secure-encryption-key-min-32-chars!!'
const ALGORITHM = 'aes-256-cbc'

export function encrypt(text: string): { iv: string; encryptedData: string } {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY), iv)
  let encrypted = cipher.update(text)
  encrypted = Buffer.concat([encrypted, cipher.final()])
  return {
    iv: iv.toString('hex'),
    encryptedData: encrypted.toString('hex')
  }
}

export function decrypt(encryptedData: string, iv: string): string {
  const decipher = crypto.createDecipheriv(
    ALGORITHM, 
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(iv, 'hex')
  )
  let decrypted = decipher.update(Buffer.from(encryptedData, 'hex'))
  decrypted = Buffer.concat([decrypted, decipher.final()])
  return decrypted.toString()
}

export function hashPassword(password: string): string {
  return crypto.pbkdf2Sync(password, ENCRYPTION_KEY, 10000, 64, 'sha512').toString('hex')
}

export function generateId(): string {
  return crypto.randomBytes(16).toString('hex')
} 