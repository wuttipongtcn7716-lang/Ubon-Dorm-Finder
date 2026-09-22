import crypto from 'crypto';

export const SESSION_COOKIE_NAME = 'admin_session';

function cleanEnv(val?: string): string {
  if (!val) return '';
  return val.replace(/^["']|["']$/g, '').trim();
}

export function getExpectedAdminUsername(): string {
  return cleanEnv(process.env.ADMIN_USERNAME) || 'admin-dormie';
}

export function getExpectedAdminPassword(): string {
  return cleanEnv(process.env.ADMIN_PASSWORD) || 'dormie_ubu_admin_2026';
}

export function getAdminSessionSecret(): string {
  return cleanEnv(process.env.ADMIN_SESSION_SECRET) || 'ubu_white_dorm_secret_key_2026';
}

export interface AdminSessionPayload {
  username: string;
  role: 'admin';
  iat: number;
  exp: number;
}

/**
 * Verify given username & password against server environment credentials
 * Supports both plaintext comparison and SHA-256 hash comparison.
 */
export function verifyAdminCredentials(username?: string, password?: string): boolean {
  if (!username || !password) return false;
  const u = username.trim();
  const p = password.trim();

  const expectedUser = getExpectedAdminUsername();
  const expectedPass = getExpectedAdminPassword();

  if (u !== expectedUser) {
    return false;
  }

  // 1. Direct plaintext match (dormie_ubu_admin_2026)
  if (p === expectedPass) {
    return true;
  }

  // 2. SHA-256 hash match (if ADMIN_PASSWORD in environment is stored as SHA-256 hash)
  try {
    const passSha256 = crypto.createHash('sha256').update(p).digest('hex');
    if (passSha256.toLowerCase() === expectedPass.toLowerCase()) {
      return true;
    }
  } catch (e) {}

  return false;
}

/**
 * Create a cryptographically signed HMAC token for Admin session
 */
export function createAdminSessionToken(username?: string): string {
  const adminUser = username || getExpectedAdminUsername();
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 7 * 24 * 60 * 60; // Valid for 7 days

  const payload: AdminSessionPayload = {
    username: adminUser,
    role: 'admin',
    iat: now,
    exp,
  };

  const secret = getAdminSessionSecret();
  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', secret)
    .update(payloadBase64)
    .digest('base64url');

  return `${payloadBase64}.${signature}`;
}

/**
 * Verify HMAC signature and token expiration
 */
export function verifyAdminSessionToken(token?: string | null): AdminSessionPayload | null {
  if (!token) return null;

  try {
    const parts = token.split('.');
    if (parts.length !== 2) return null;

    const [payloadBase64, providedSig] = parts;
    const secret = getAdminSessionSecret();
    const expectedSig = crypto
      .createHmac('sha256', secret)
      .update(payloadBase64)
      .digest('base64url');

    // Constant-time comparison to prevent timing attacks
    const providedBuffer = Buffer.from(providedSig);
    const expectedBuffer = Buffer.from(expectedSig);

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    const payloadJson = Buffer.from(payloadBase64, 'base64url').toString('utf-8');
    const payload: AdminSessionPayload = JSON.parse(payloadJson);

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      return null; // Expired
    }

    if (payload.role !== 'admin') {
      return null;
    }

    return payload;
  } catch (err) {
    return null;
  }
}

/**
 * Extract and verify admin session from Request cookies or Cookie header
 */
export function isRequestAdminAuthenticated(req: Request): boolean {
  try {
    const cookieHeader = req.headers.get('cookie') || '';
    const cookies = parseCookies(cookieHeader);
    const sessionToken = cookies[SESSION_COOKIE_NAME];
    const verified = verifyAdminSessionToken(sessionToken);
    return Boolean(verified);
  } catch (err) {
    return false;
  }
}

/**
 * Simple cookie parser helper
 */
export function parseCookies(cookieHeader: string): Record<string, string> {
  const list: Record<string, string> = {};
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    if (!value) return;
    list[name] = decodeURIComponent(value);
  });

  return list;
}
