// pages/api/invoices/index.js
import { requireAdmin } from '../../../lib/auth';

async function generateNomor(db) {
  const ym = new Date().toISOString().slice(0,7).replace('-','');
  const prefix = `INV-${ym}-`;
  const snap = await db.collection('invoices').where('nomor','>=',prefix).where('nomor','<',prefix+'\uf8ff').orderBy('nomor','desc').limit(1).get();
  const seq = snap.empty ? 1 : parseInt(snap.docs[0].data().nomor.split('-')[2]) + 1;
  return `${prefix}${String(seq).padStart(4,'0')}`;
}

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  const { db } = await import('../../../lib/firestore');

  if (req.method === 'GET') {
    try {
      const { search, status } = req.query;
      const snap = await db.collection('invoices').orderBy('created_at','desc').get();
      let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (status) data = data.filter(i => i.status === status);
      if (search) {
        const s = search.toLowerCase();
        data = data.filter(i => i.nomor?.toLowerCase().includes(s) || i.nama_sekolah?.toLowerCase().includes(s) || i.npsn?.includes(s));
      }
      return res.json({ data });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  if (req.method === 'POST') {
    try {
      const { license_id=null, npsn='', nama_sekolah, kab_kota='', provinsi='', versi='standard', masa_berlaku='Permanen', harga, diskon=0, catatan='', ttd_nama='', ttd_jabatan='', ttd_image='', stempel_image='', status='lunas', tanggal, reseller_id=null } = req.body;
      if (!nama_sekolah) return res.status(400).json({ error: 'nama_sekolah wajib.' });
      if (harga === undefined) return res.status(400).json({ error: 'harga wajib.' });
      const total = Math.max(0, parseInt(harga) - parseInt(diskon));
      const nomor = await generateNomor(db);
      const tgl   = tanggal || new Date().toISOString().split('T')[0];
      const now   = new Date().toISOString();
      let komisi_nominal = 0;
      if (reseller_id) {
        const rDoc = await db.collection('resellers').doc(reseller_id).get();
        if (rDoc.exists) {
          const pct = rDoc.data().komisi_persen || 10;
          komisi_nominal = Math.round(total * pct / 100);
          await db.collection('resellers').doc(reseller_id).update({ total_penjualan: (rDoc.data().total_penjualan||0)+total, total_komisi: (rDoc.data().total_komisi||0)+komisi_nominal, updated_at: now });
        }
      }
      const doc = { nomor, license_id, npsn, nama_sekolah, kab_kota, provinsi, versi, masa_berlaku, harga: parseInt(harga), diskon: parseInt(diskon), total, catatan, ttd_nama, ttd_jabatan, ttd_image, stempel_image, status, tanggal: tgl, reseller_id, komisi_nominal, created_at: now };
      const ref = await db.collection('invoices').add(doc);
      return res.json({ data: { id: ref.id, ...doc } });
    } catch (e) { return res.status(500).json({ error: e.message }); }
  }

  res.status(405).json({ error: 'Method not allowed.' });
}
