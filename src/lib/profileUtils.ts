// src/lib/profileUtils.ts

/**
 * Generate a profile code based on user ID
 * Creates a short, user-friendly code from the Firebase UID
 */
export function generateProfileCode(uid: string): string {
  if (!uid) return '';
  
  // Take first 3 chars and last 3 chars of UID, format as XXXyYY
  const firstPart = uid.substring(0, 3);
  const lastPart = uid.substring(uid.length - 3);
  
  // Create a mix of letters and numbers
  return `${firstPart}${lastPart}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 6);
}

/**
 * Generate an issuer code based on user ID and role
 * Creates a consistent issuer code for each user
 */
export function generateIssuerCode(uid: string, role?: string): string {
  if (!uid) return '';
  
  // Use middle section of UID for different pattern
  const middlePart = uid.substring(3, 6);
  const endPart = uid.substring(uid.length - 6, uid.length - 3);
  
  // Add role prefix if available
  const rolePrefix = role === 'borrower' ? 'B' : role === 'investor' ? 'I' : '';
  
  // Create issuer code
  const baseCode = `${middlePart}${endPart}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 5);
  return `${rolePrefix}${baseCode}`.substring(0, 6);
}

/**
 * Generate a borrower/investor code based on user ID and account type
 * Creates a consistent account-specific code for each user (generated once at registration)
 */
export function generateBorrowerCode(uid: string, accountType: 'borrower' | 'investor'): string {
  if (!uid) return '';
  
  // Use different sections of UID for borrower code
  const startPart = uid.substring(1, 4);
  const middlePart = uid.substring(uid.length - 4, uid.length - 1);
  
  // Add account type prefix
  const typePrefix = accountType === 'borrower' ? 'BR' : 'IV';
  
  // Create borrower/investor code
  const baseCode = `${startPart}${middlePart}`.replace(/[^a-zA-Z0-9]/g, '').substring(0, 4);
  return `${typePrefix}${baseCode}`.substring(0, 6);
}
