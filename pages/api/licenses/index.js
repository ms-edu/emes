// pages/api/licenses/index.js
import { generateKey, VERSI_CONFIG, VALID_VERSI } from '../../../lib/license';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');

  if (req.method === 'GET') {
    try {
      const { search, status, versi } = req.query;
      let q = db.collection('licenses').orderBy('created_at', 'desc');
      if (status) q = q.where('status', '==', status);
      if (versi)  q = q.where('versi',  '==', versi);
      const snap = await q.get();
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (search) {
        const s = search.toLowerCase();
        data = data.filter(l =>
          l.npsn?.toLowerCase().includes(s) || l.nama_sekolah?.toLowerCase().includes(s) ||
          l.kab_kota?.toLowerCase().includes(s) || l.provinsi?.toLowerCase().includes(s)
        );
      }
      return res.json({ data, total: data.length });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const {
        npsn, nama_sekolah, kab_kota = '', provinsi = '',
        versi = 'trial', expiry = '0', catatan = '', reseller_id = null,
      } = req.body;
      if (!npsn || !nama_sekolah)
        return res.status(400).json({ error: 'NPSN dan nama sekolah wajib diisi.' });
      if (!VALID_VERSI.includes(versi))
        return res.status(400).json({ error: `Versi harus: ${VALID_VERSI.join(', ')}.` });
      const existing = await db.collection('licenses').where('npsn', '==', npsn).limit(1).get();
      if (!existing.empty) {
        const d = existing.docs[0].data();
        return res.status(409).json({ error: `NPSN ${npsn} sudah terdaftar (status: ${d.status}).` });
      }
      const cfg = VERSI_CONFIG[versi];
      const expiryNorm = expiry === '0' ? '0' : new Date(expiry).toISOString().split('T')[0];
      const license_key = generateKey(npsn, nama_sekolah, kab_kota, provinsi, expiryNorm, versi);
      const now = new Date().toISOString();
      const doc = {
        npsn: npsn.trim(), nama_sekolah: nama_sekolah.trim(),
        kab_kota: kab_kota.trim(), provinsi: provinsi.trim(),
        versi, max_siswa: cfg.max_siswa, expiry: expiryNorm,
        license_key, status: 'aktif', catatan: catatan.trim(),
        launch_count: 0, reseller_id, created_at: now, updated_at: now,
      };
      const ref = await db.collection('licenses').add(doc);
      return res.json({ data: { id: ref.id, ...doc }, license_key });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
