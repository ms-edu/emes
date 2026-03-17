// pages/api/invoices/[id].js
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const doc = await db.collection('invoices').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
      return res.json({ data: { id: doc.id, ...doc.data() } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'PUT') {
    try {
      const doc = await db.collection('invoices').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Invoice tidak ditemukan.' });
      const old = doc.data();
      const { nama_sekolah=old.nama_sekolah, kab_kota=old.kab_kota, provinsi=old.provinsi, versi=old.versi, masa_berlaku=old.masa_berlaku, harga=old.harga, diskon=old.diskon, catatan=old.catatan, ttd_nama=old.ttd_nama, ttd_jabatan=old.ttd_jabatan, ttd_image=old.ttd_image, stempel_image=old.stempel_image, status=old.status, tanggal=old.tanggal } = req.body;
      const total = Math.max(0, parseInt(harga) - parseInt(diskon));
      const updates = { nama_sekolah, kab_kota, provinsi, versi, masa_berlaku, harga: parseInt(harga), diskon: parseInt(diskon), total, catatan, ttd_nama, ttd_jabatan, ttd_image, stempel_image, status, tanggal };
      await db.collection('invoices').doc(id).update(updates);
      return res.json({ data: { id, ...old, ...updates } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('invoices').doc(id).delete();
      return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
