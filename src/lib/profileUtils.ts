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
