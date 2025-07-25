/**
 * SHA-256 hash utility for detecting changes between code and graph snapshots
 */

export async function sha256(text: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return hashHex;
}

export function hashObject(obj: any): Promise<string> {
  const serialized = JSON.stringify(obj, null, 0);
  return sha256(serialized);
}

export function hashCode(code: string): Promise<string> {
  // Normalize whitespace and remove comments for more stable hashing
  const normalized = code
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
  return sha256(normalized);
} 