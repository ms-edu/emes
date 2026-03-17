// pages/api/admin/logout.js
export default function handler(req, res) {
  res.setHeader('Set-Cookie', 'admin_key=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict');
  return res.json({ success: true });
}
