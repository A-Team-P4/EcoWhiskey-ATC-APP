/**
 * Decodes a JWT token without verification (client-side only)
 * Returns the payload if valid, null otherwise
 */
export const decodeJWT = <T = any>(token: string): T | null => {
  try {
    // JWT format: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];

    // Replace URL-safe characters and add padding if needed
    const base64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(base64.length + (4 - base64.length % 4) % 4, '=');

    // Decode base64
    const jsonPayload = atob(paddedBase64);

    return JSON.parse(jsonPayload) as T;
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
};

/**
 * JWT payload interface based on your token structure
 */
export interface JWTPayload {
  sub: string;
  exp: number;
  user: {
    id: number;
    email: string;
    name: string;
    accountType: 'student' | 'instructor';
    school: string | null;
  };
}
