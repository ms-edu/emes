// pages/api/licenses/[id].js
import { generateKey, VERSI_CONFIG, VALID_VERSI } from '../../../lib/license';
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const doc = await db.collection('licenses').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Lisensi tidak ditemukan.' });
      return res.json({ data: { id: doc.id, ...doc.data() } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'PUT') {
    try {
      const doc = await db.collection('licenses').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Lisensi tidak ditemukan.' });
      const old = doc.data();
      const {
        nama_sekolah = old.nama_sekolah, kab_kota = old.kab_kota,
        provinsi = old.provinsi, versi = old.versi || 'trial',
        expiry = old.expiry, status = old.status,
        catatan = old.catatan, reseller_id = old.reseller_id,
      } = req.body;
      if (!VALID_VERSI.includes(versi))
        return res.status(400).json({ error: `Versi harus: ${VALID_VERSI.join(', ')}.` });
      const cfg = VERSI_CONFIG[versi];
      const expiryNorm = expiry === '0' ? '0' : new Date(expiry).toISOString().split('T')[0];
      const license_key = generateKey(old.npsn, nama_sekolah, kab_kota, provinsi, expiryNorm, versi);
      const updates = {
        nama_sekolah: nama_sekolah.trim(), kab_kota: kab_kota.trim(),
        provinsi: (provinsi||'').trim(), versi, max_siswa: cfg.max_siswa,
        expiry: expiryNorm, license_key, status,
        catatan: catatan.trim(), reseller_id,
        updated_at: new Date().toISOString(),
      };
      await db.collection('licenses').doc(id).update(updates);
      return res.json({ data: { id, ...old, ...updates }, license_key });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      const doc = await db.collection('licenses').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Lisensi tidak ditemukan.' });
      await db.collection('licenses').doc(id).update({ status: 'dicabut', updated_at: new Date().toISOString() });
      return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
