import crypto from 'crypto';

// Klucz szyfrowania - w produkcji powinien być w zmiennych środowiskowych
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key-here!';
const ALGORITHM = 'aes-256-gcm';

/**
 * Szyfruje tekst używając AES-256-GCM
 */
export function encrypt(text: string): string {
  if (!text) return '';
  
  try {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(ALGORITHM, ENCRYPTION_KEY);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Łączymy IV, authTag i zaszyfrowany tekst
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  } catch (error) {
    console.error('Błąd podczas szyfrowania:', error);
    throw new Error('Nie udało się zaszyfrować danych');
  }
}

/**
 * Deszyfruje tekst zaszyfrowany funkcją encrypt
 */
export function decrypt(encryptedText: string): string {
  if (!encryptedText) return '';
  
  try {
    const parts = encryptedText.split(':');
    if (parts.length !== 3) {
      throw new Error('Nieprawidłowy format zaszyfrowanych danych');
    }
    
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    
    const decipher = crypto.createDecipher(ALGORITHM, ENCRYPTION_KEY);
    decipher.setAuthTag(authTag);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  } catch (error) {
    console.error('Błąd podczas deszyfrowania:', error);
    throw new Error('Nie udało się odszyfrować danych');
  }
}

/**
 * Sprawdza czy tekst jest zaszyfrowany (ma format iv:authTag:encrypted)
 */
export function isEncrypted(text: string): boolean {
  if (!text) return false;
  const parts = text.split(':');
  return parts.length === 3 && parts.every(part => /^[0-9a-f]+$/i.test(part));
}

/**
 * Bezpiecznie maskuje hasło do wyświetlenia
 */
export function maskPassword(password: string | null): string | null {
  return password ? '••••••••' : null;
}

/**
 * Sprawdza czy hasło jest zamaskowane
 */
export function isMaskedPassword(password: string): boolean {
  return password === '••••••••';
}
