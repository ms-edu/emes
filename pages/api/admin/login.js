// pages/api/admin/login.js
import { ADMIN_KEY } from '../../../lib/auth';

export default function handler(req, res) {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method not allowed.' });

  const { key } = req.body;
  if (key === ADMIN_KEY) {
    // Set HTTP-only cookie valid 7 hari
    res.setHeader('Set-Cookie',
      `admin_key=${ADMIN_KEY}; HttpOnly; Path=/; Max-Age=${7 * 86400}; SameSite=Strict${
        process.env.NODE_ENV === 'production' ? '; Secure' : ''
      }`
    );
    return res.json({ success: true });
  }
  return res.status(401).json({ error: 'Kunci admin salah.' });
}
