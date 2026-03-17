// pages/api/resellers/index.js
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');

  if (req.method === 'GET') {
    try {
      const snap = await db.collection('resellers').orderBy('created_at', 'desc').get();
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      return res.json({ data, total: data.length });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const { code, nama, label='', wa='', email='', komisi_persen=10, catatan='', status='aktif' } = req.body;
      if (!code || !nama) return res.status(400).json({ error: 'Kode dan nama wajib diisi.' });
      const codeClean = code.toLowerCase().replace(/[^a-z0-9_-]/g, '');
      if (!codeClean) return res.status(400).json({ error: 'Kode tidak valid.' });
      const dup = await db.collection('resellers').where('code', '==', codeClean).limit(1).get();
      if (!dup.empty) return res.status(409).json({ error: `Kode "${codeClean}" sudah digunakan.` });
      const now = new Date().toISOString();
      const doc = {
        code: codeClean, nama: nama.trim(), label: label.trim(),
        wa: wa.trim(), email: email.trim(),
        komisi_persen: parseInt(komisi_persen) || 10,
        catatan: catatan.trim(), status,
        total_penjualan: 0, total_komisi: 0,
        created_at: now, updated_at: now,
      };
      const ref = await db.collection('resellers').add(doc);
      return res.json({ data: { id: ref.id, ...doc } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
