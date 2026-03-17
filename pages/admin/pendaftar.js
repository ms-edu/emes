// pages/admin/pendaftar.js
import { useEffect, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';

export default function PendaftarPage() {
  const [list,    setList]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const [toast,   setToast]   = useState({ show: false, msg: '', type: 'success' });

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3000);
  }

  async function load() {
    setLoading(true);
    try {
      const pid = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
      const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
      const r = await fetch(`https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/pendaftar?key=${key}&pageSize=200&orderBy=created_at%20desc`);
      const d = await r.json();
      const docs = (d.documents || []).map(doc => {
        const f = doc.fields || {};
        return {
          id          : doc.name.split('/').pop(),
          nama_sekolah: f.nama_sekolah?.stringValue || '',
          npsn        : f.npsn?.stringValue || '',
          kab_kota    : f.kab_kota?.stringValue || '',
          provinsi    : f.provinsi?.stringValue || '',
          wa          : f.wa?.stringValue || '',
          email       : f.email?.stringValue || '',
          ref_code    : f.ref_code?.stringValue || '',
          created_at  : f.created_at?.stringValue || '',
        };
      });
      setList(docs);
    } catch (e) {
      showToast('Gagal memuat data: ' + e.message, 'error');
    }
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  const filtered = search
    ? list.filter(d =>
        d.nama_sekolah.toLowerCase().includes(search.toLowerCase()) ||
        d.npsn.includes(search) ||
        d.wa.includes(search)
      )
    : list;

  return (
    <AdminLayout title="Pendaftar">
      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>
        <span>{toast.type === 'success' ? '✅' : '❌'}</span><span>{toast.msg}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>Pendaftar Trial</h2>
        <button className="btn btn-secondary btn-sm" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar Pendaftar <span style={{ color: 'var(--text-4)', fontWeight: 600 }}>({filtered.length})</span></span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Cari nama / NPSN / WA..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Nama Sekolah</th>
                <th>NPSN</th>
                <th>WhatsApp</th>
                <th>Kab/Kota</th>
                <th>Referral</th>
                <th>Mendaftar</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Memuat...</td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Belum ada pendaftar</td></tr>}
              {filtered.map((d, i) => (
                <tr key={d.id}>
                  <td style={{ fontSize: 12, color: 'var(--text-4)' }}>{i + 1}</td>
                  <td>
                    <strong style={{ display: 'block' }}>{d.nama_sekolah}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{d.provinsi}</span>
                  </td>
                  <td><span className="td-mono">{d.npsn || '—'}</span></td>
                  <td>
                    {d.wa ? (
                      <a href={`https://wa.me/${d.wa.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--success)', fontSize: 12.5, fontWeight: 600 }}>
                        💬 {d.wa}
                      </a>
                    ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12 }}>{d.kab_kota || '—'}</td>
                  <td style={{ fontSize: 12 }}>
                    {d.ref_code ? <span className="td-mono">{d.ref_code}</span> : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {d.created_at ? new Date(d.created_at).toLocaleDateString('id-ID') : '—'}
                  </td>
                  <td>
                    <a href={`/admin/licenses?npsn=${d.npsn}&nama=${encodeURIComponent(d.nama_sekolah)}`}
                      className="btn btn-primary btn-sm" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      🔑 Beri Lisensi
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
