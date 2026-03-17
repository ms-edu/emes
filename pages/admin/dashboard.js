// pages/admin/dashboard.js
import AdminLayout from '../../components/AdminLayout';
import { useEffect, useState } from 'react';

export default function Dashboard() {
  const [stats, setStats]   = useState(null);
  const [recent, setRecent] = useState([]);

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' }).then(r => r.json()).then(setStats);
    fetch('/api/licenses?status=aktif', { credentials: 'include' })
      .then(r => r.json())
      .then(d => setRecent((d.data || []).slice(0, 8)));
  }, []);

  const fmt = n => n?.toLocaleString('id-ID') ?? '—';

  return (
    <AdminLayout title="Dashboard">
      <h2 style={{ marginBottom: 20, fontSize: 20 }}>Dashboard</h2>

      {/* Stats Grid */}
      <div className="stats-row" style={{ gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))' }}>
        {[
          { label: 'Total Lisensi',  val: fmt(stats?.total),    sub: 'Semua status' },
          { label: 'Aktif',          val: fmt(stats?.aktif),    sub: 'Lisensi aktif' },
          { label: 'Dicabut',        val: fmt(stats?.dicabut),  sub: 'Nonaktif' },
          { label: 'Trial',          val: fmt(stats?.trial),    sub: 'Gratis' },
          { label: 'Standard',       val: fmt(stats?.standard), sub: 'Berbayar' },
          { label: 'Pro',            val: fmt(stats?.pro),      sub: 'Unlimited' },
          { label: 'Reseller',       val: fmt(stats?.resellers),sub: 'Terdaftar' },
          { label: 'Est. Revenue',   val: stats?.revenue != null ? `Rp ${fmt(stats.revenue)}` : '—', sub: 'Total lisensi berbayar' },
        ].map(s => (
          <div className="stat-card" key={s.label}>
            <div className="stat-label">{s.label}</div>
            <div className="stat-num" style={{ fontSize: s.label === 'Est. Revenue' ? '16px' : undefined, paddingTop: s.label === 'Est. Revenue' ? 6 : 0 }}>
              {s.val}
            </div>
            <div className="stat-sub">{s.sub}</div>
          </div>
        ))}
      </div>

      {/* Recent Licenses */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Lisensi Terbaru</span>
          <a href="/admin/licenses" className="btn btn-secondary btn-sm">Lihat Semua →</a>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NPSN</th>
                <th>Nama Sekolah</th>
                <th>Tier</th>
                <th>Status</th>
                <th>Dibuat</th>
              </tr>
            </thead>
            <tbody>
              {recent.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>
                  Belum ada lisensi
                </td></tr>
              )}
              {recent.map(l => (
                <tr key={l.id}>
                  <td><span className="td-mono">{l.npsn}</span></td>
                  <td>
                    <strong style={{ display: 'block', fontSize: 13 }}>{l.nama_sekolah}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{l.kab_kota}{l.provinsi ? `, ${l.provinsi}` : ''}</span>
                  </td>
                  <td><span className={`badge badge-${l.versi}`}>{l.versi}</span></td>
                  <td><span className={`badge badge-${l.status}`}>{l.status}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    {l.created_at ? new Date(l.created_at).toLocaleDateString('id-ID') : '—'}
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
