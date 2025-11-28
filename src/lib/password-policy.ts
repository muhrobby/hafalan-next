import { z } from 'zod';

/**
 * Password Policy:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 */
export const passwordSchema = z.string()
  .min(8, "Password minimal 8 karakter")
  .regex(/[A-Z]/, "Password harus mengandung huruf kapital")
  .regex(/[a-z]/, "Password harus mengandung huruf kecil")
  .regex(/[0-9]/, "Password harus mengandung angka");

/**
 * Weaker password policy for bulk imports (backward compatibility)
 * - Minimum 6 characters
 */
export const simplePasswordSchema = z.string()
  .min(6, "Password minimal 6 karakter");

/**
 * Validate password strength
 * Returns object with isValid and list of failed requirements
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  score: number;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecialChar: boolean;
  };
  message: string;
} {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[^A-Za-z0-9]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;
  const isValid = requirements.minLength && 
                  requirements.hasUppercase && 
                  requirements.hasLowercase && 
                  requirements.hasNumber;

  let message = '';
  if (!requirements.minLength) message = 'Password terlalu pendek (min 8 karakter)';
  else if (!requirements.hasUppercase) message = 'Tambahkan huruf kapital';
  else if (!requirements.hasLowercase) message = 'Tambahkan huruf kecil';
  else if (!requirements.hasNumber) message = 'Tambahkan angka';
  else if (!requirements.hasSpecialChar) message = 'Password kuat! (tambah karakter spesial untuk lebih aman)';
  else message = 'Password sangat kuat!';

  return { isValid, score, requirements, message };
}

/**
 * Generate secure random password
 */
export function generateSecurePassword(length: number = 12): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*';
  
  const allChars = uppercase + lowercase + numbers + special;
  
  let password = '';
  
  // Ensure at least one of each required type
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];
  
  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)];
  }
  
  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
}
