// pages/api/licenses/download.js
// GET /api/licenses/download?id=xxx  → download file .key langsung
import { requireAdmin } from '../../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });
  if (req.method !== 'GET') return res.status(405).end();

  const { id, format = 'key' } = req.query;
  if (!id) return res.status(400).json({ error: 'id wajib.' });

  try {
    const { db } = await import('../../../lib/firestore');
    const doc = await db.collection('licenses').doc(id).get();
    if (!doc.exists) return res.status(404).json({ error: 'Lisensi tidak ditemukan.' });

    const data    = doc.data();
    const key     = data.license_key;
    const npsn    = data.npsn;
    const namaSlug = (data.nama_sekolah || 'sekolah')
      .replace(/[^a-zA-Z0-9\s]/g, '').trim().replace(/\s+/g, '_').slice(0, 40);

    if (format === 'txt') {
      // Download sebagai README/info text
      const content = [
        'LISENSI EMES CBT',
        '================',
        `Sekolah  : ${data.nama_sekolah}`,
        `NPSN     : ${data.npsn}`,
        `Kab/Kota : ${data.kab_kota || '-'}`,
        `Provinsi : ${data.provinsi || '-'}`,
        `Tier     : ${data.versi}`,
        `Expiry   : ${data.expiry === '0' ? 'Selamanya' : data.expiry}`,
        `Status   : ${data.status}`,
        '',
        'KUNCI LISENSI:',
        key,
        '',
        'Cara pakai:',
        '1. Salin file license.key ke folder instalasi Emes CBT',
        '2. Atau tempel isi kunci di atas ke kolom Kunci Lisensi saat aktivasi',
      ].join('\r\n');

      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="lisensi_${npsn}_${namaSlug}.txt"`);
      return res.send(content);
    }

    // Default: download sebagai .key
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="license_${npsn}_${namaSlug}.key"`);
    return res.send(key);
  } catch (e) {
    return res.status(500).json({ error: e.message });
  }
}
