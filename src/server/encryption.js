// encryption.js - AES-256-GCM encryption for sensitive data at rest
import crypto from 'crypto';

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const SALT_LENGTH = 64; // 512 bits

/**
 * Get encryption key from environment variable
 * Key should be 32 bytes (256 bits) for AES-256
 */
function getEncryptionKey() {
  const key = process.env.ENCRYPTION_KEY;
  
  if (!key) {
    throw new Error('ENCRYPTION_KEY environment variable is not set');
  }
  
  // Ensure key is exactly 32 bytes
  if (Buffer.from(key, 'hex').length !== 32) {
    throw new Error('ENCRYPTION_KEY must be 32 bytes (64 hex characters)');
  }
  
  return Buffer.from(key, 'hex');
}

/**
 * Encrypt sensitive data using AES-256-GCM
 * 
 * @param {string} plaintext - Data to encrypt
 * @returns {string} Encrypted data in format: iv:authTag:encryptedData (hex encoded)
 */
export function encrypt(plaintext) {
  try {
    // Handle null/undefined/empty values
    if (!plaintext || plaintext === '') {
      return null;
    }
    
    const key = getEncryptionKey();
    
    // Generate random initialization vector
    const iv = crypto.randomBytes(IV_LENGTH);
    
    // Create cipher
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    
    // Encrypt the data
    let encrypted = cipher.update(plaintext, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    // Get authentication tag (provides integrity verification)
    const authTag = cipher.getAuthTag();
    
    // Combine iv, authTag, and encrypted data
    // Format: iv:authTag:encryptedData (all hex encoded)
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (error) {
    console.error('❌ Encryption error:', error.message);
    throw new Error('Failed to encrypt data');
  }
}

/**
 * Decrypt sensitive data using AES-256-GCM
 * 
 * @param {string} encryptedData - Encrypted data in format: iv:authTag:encryptedData
 * @returns {string} Decrypted plaintext
 */
export function decrypt(encryptedData) {
  try {
    // Handle null/undefined/empty values
    if (!encryptedData || encryptedData === '') {
      return null;
    }
    
    // If data doesn't contain colons, it's likely unencrypted (legacy data)
    if (!encryptedData.includes(':')) {
      // Return as-is (will be encrypted on next update)
      return encryptedData;
    }
    
    const key = getEncryptionKey();
    
    // Split the encrypted data into components
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
      throw new Error('Invalid encrypted data format');
    }
    
    const [ivHex, authTagHex, encrypted] = parts;
    
    // Convert hex strings back to buffers
    const iv = Buffer.from(ivHex, 'hex');
    const authTag = Buffer.from(authTagHex, 'hex');
    
    // Create decipher
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    
    // Decrypt the data
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('❌ Decryption error:', error.message);
    // If decryption fails, might be legacy unencrypted data
    // Return original value (will be re-encrypted on next update)
    return encryptedData;
  }
}

/**
 * Check if data is encrypted
 * 
 * @param {string} data - Data to check
 * @returns {boolean} True if data appears to be encrypted
 */
export function isEncrypted(data) {
  if (!data || typeof data !== 'string') {
    return false;
  }
  
  // Check if data matches our encryption format: iv:authTag:encryptedData
  const parts = data.split(':');
  return parts.length === 3 && 
         parts[0].length === IV_LENGTH * 2 && // IV is 16 bytes = 32 hex chars
         parts[1].length === AUTH_TAG_LENGTH * 2; // Auth tag is 16 bytes = 32 hex chars
}

/**
 * Generate a secure encryption key
 * Use this to generate ENCRYPTION_KEY for .env file
 * 
 * @returns {string} 32-byte key in hex format (64 characters)
 */
export function generateEncryptionKey() {
  return crypto.randomBytes(32).toString('hex');
}

/**
 * Encrypt multiple fields in an object
 * 
 * @param {Object} obj - Object containing fields to encrypt
 * @param {Array<string>} fields - Field names to encrypt
 * @returns {Object} Object with encrypted fields
 */
export function encryptFields(obj, fields) {
  const result = { ...obj };
  
  for (const field of fields) {
    if (obj[field] && !isEncrypted(obj[field])) {
      result[field] = encrypt(obj[field]);
    }
  }
  
  return result;
}

/**
 * Decrypt multiple fields in an object
 * 
 * @param {Object} obj - Object containing fields to decrypt
 * @param {Array<string>} fields - Field names to decrypt
 * @returns {Object} Object with decrypted fields
 */
export function decryptFields(obj, fields) {
  if (!obj) return obj;
  
  const result = { ...obj };
  
  for (const field of fields) {
    if (obj[field]) {
      result[field] = decrypt(obj[field]);
    }
  }
  
  return result;
}

/**
 * Hash sensitive data for search/comparison without decryption
 * Useful for finding records by encrypted fields
 * 
 * @param {string} value - Value to hash
 * @returns {string} SHA-256 hash in hex format
 */
export function hashForSearch(value) {
  if (!value) return null;
  
  return crypto
    .createHash('sha256')
    .update(value)
    .digest('hex');
}

// Fields that should be encrypted in each table
export const ENCRYPTED_FIELDS = {
  users: ['national_id', 'passport', 'tin_number'],
  topup_requests: ['account_number'],
  investor_profiles: ['bank_account_number'],
  borrower_profiles: ['bank_account_number']
};

// Export utility functions
export default {
  encrypt,
  decrypt,
  isEncrypted,
  generateEncryptionKey,
  encryptFields,
  decryptFields,
  hashForSearch,
  ENCRYPTED_FIELDS
};
