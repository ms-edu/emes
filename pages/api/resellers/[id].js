// pages/api/resellers/[id].js
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');
  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      const doc = await db.collection('resellers').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Reseller tidak ditemukan.' });
      const lSnap = await db.collection('licenses').where('reseller_id', '==', id).get();
      return res.json({ data: { id: doc.id, ...doc.data() }, licenses: lSnap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'PUT') {
    try {
      const doc = await db.collection('resellers').doc(id).get();
      if (!doc.exists) return res.status(404).json({ error: 'Reseller tidak ditemukan.' });
      const old = doc.data();
      const { nama=old.nama, label=old.label, wa=old.wa, email=old.email, komisi_persen=old.komisi_persen, catatan=old.catatan, status=old.status } = req.body;
      const updates = { nama: nama.trim(), label: label.trim(), wa: wa.trim(), email: email.trim(), komisi_persen: parseInt(komisi_persen)||10, catatan: catatan.trim(), status, updated_at: new Date().toISOString() };
      await db.collection('resellers').doc(id).update(updates);
      return res.json({ data: { id, ...old, ...updates } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'DELETE') {
    try {
      await db.collection('resellers').doc(id).update({ status: 'nonaktif', updated_at: new Date().toISOString() });
      return res.json({ success: true });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
