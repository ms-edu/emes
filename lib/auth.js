// lib/auth.js
// Middleware: validasi X-Admin-Key header atau cookie session

export const ADMIN_KEY = process.env.ADMIN_SECRET_KEY || 'ganti-ini-dengan-kunci-rahasia';

export function requireAdmin(req) {
  const headerKey = req.headers['x-admin-key'];
  const cookieKey = parseCookie(req.headers.cookie || '')['admin_key'];
  return headerKey === ADMIN_KEY || cookieKey === ADMIN_KEY;
}

function parseCookie(str) {
  return Object.fromEntries(
    str.split(';').map(c => c.trim().split('=').map(decodeURIComponent))
  );
}
