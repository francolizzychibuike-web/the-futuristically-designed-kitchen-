import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { db } from './db.ts';

export const ADMIN_COOKIE_NAME = 'tfk_admin_token';

function getOrCreateJwtSecret(): string {
  const envSecret = (process.env.JWT_SECRET || '').trim();
  if (envSecret && envSecret !== 'CHANGE_ME_TO_A_STRONG_RANDOM_SECRET') {
    return envSecret;
  }
  const secretPath = path.resolve(process.cwd(), '.data', 'jwt.secret');
  if (fs.existsSync(secretPath)) {
    const existing = fs.readFileSync(secretPath, 'utf8').trim();
    if (existing.length >= 32) return existing;
  }
  const generated = crypto.randomBytes(48).toString('hex');
  fs.mkdirSync(path.dirname(secretPath), { recursive: true });
  fs.writeFileSync(secretPath, generated, { mode: 0o600 });
  return generated;
}

const JWT_SECRET = getOrCreateJwtSecret();

export interface AdminTokenPayload {
  sub: number;
  email: string;
  name: string;
  role: 'super_admin' | 'manager';
}

export interface AuthenticatedRequest extends Request {
  admin?: AdminTokenPayload;
}

export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '12h' });
}

export function parseCookies(cookieHeader: string | undefined): Record<string, string> {
  const result: Record<string, string> = {};
  if (!cookieHeader) return result;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const val = part.slice(idx + 1).trim();
    if (key) {
      result[key] = decodeURIComponent(val);
    }
  }
  return result;
}

export function extractAdminFromRequest(req: Request): AdminTokenPayload | null {
  const cookies = parseCookies(req.headers.cookie);
  let token = cookies[ADMIN_COOKIE_NAME];

  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.slice(7).trim();
    }
  }

  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as unknown as AdminTokenPayload;
    if (!decoded || typeof decoded.sub !== 'number') return null;

    const adminRow = db
      .prepare('SELECT id, email, name, role FROM administrators WHERE id = ?')
      .get(decoded.sub) as { id: number; email: string; name: string; role: 'super_admin' | 'manager' } | undefined;

    if (!adminRow) return null;

    return {
      sub: adminRow.id,
      email: adminRow.email,
      name: adminRow.name,
      role: adminRow.role,
    };
  } catch {
    return null;
  }
}

export function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const admin = extractAdminFromRequest(req);
  if (!admin) {
    res.status(401).json({ error: 'Administrator authentication required.' });
    return;
  }
  req.admin = admin;
  next();
}
