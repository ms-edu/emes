// pages/admin/resellers.js
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';

const EMPTY = { code: '', nama: '', label: '', wa: '', email: '', komisi_persen: 10, catatan: '', status: 'aktif' };

export default function ResellersPage() {
  const [resellers, setResellers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [delId,     setDelId]     = useState(null);
  const [toast,     setToast]     = useState({ show: false, msg: '', type: 'success' });
  const [detailId,  setDetailId]  = useState(null);
  const [detail,    setDetail]    = useState(null);
  const [copied,    setCopied]    = useState('');

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch('/api/resellers', { credentials: 'include' });
    const d = await r.json();
    let data = d.data || [];
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(r => r.code?.toLowerCase().includes(s) || r.nama?.toLowerCase().includes(s));
    }
    setResellers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';

  function openAdd()  { setForm(EMPTY); setEditId(null); setShowAdd(true); }
  function openEdit(r) {
    setForm({ code: r.code, nama: r.nama, label: r.label || '', wa: r.wa || '', email: r.email || '', komisi_persen: r.komisi_persen || 10, catatan: r.catatan || '', status: r.status });
    setEditId(r.id);
    setShowAdd(true);
  }

  async function save() {
    setSaving(true);
    const url    = editId ? `/api/resellers/${editId}` : '/api/resellers';
    const method = editId ? 'PUT' : 'POST';
    const r = await fetch(url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    });
    const d = await r.json();
    if (!r.ok) showToast(d.error || 'Gagal menyimpan.', 'error');
    else { showToast(editId ? 'Reseller diperbarui!' : 'Reseller ditambahkan!', 'success'); setShowAdd(false); load(); }
    setSaving(false);
  }

  async function del() {
    await fetch(`/api/resellers/${delId}`, { method: 'DELETE', credentials: 'include' });
    setDelId(null); showToast('Reseller dinonaktifkan.', 'info'); load();
  }

  async function openDetail(id) {
    setDetailId(id);
    const r = await fetch(`/api/resellers/${id}`, { credentials: 'include' });
    const d = await r.json();
    setDetail(d);
  }

  async function copyLink(code) {
    const link = `${baseUrl}/ref/${code}`;
    await navigator.clipboard.writeText(link).catch(() => {});
    setCopied(code); setTimeout(() => setCopied(''), 2000);
  }

  const inp = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'form-input' });

  const fmt = n => n != null ? `Rp ${Number(n).toLocaleString('id-ID')}` : 'Rp 0';

  return (
    <AdminLayout title="Reseller">
      {/* Toast */}
      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>
        <span>{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
        <span>{toast.msg}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>Manajemen Reseller</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Tambah Reseller</button>
      </div>

      {/* Add/Edit Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">{editId ? '✏️ Edit Reseller' : '➕ Tambah Reseller'}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Tutup</button>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Kode Unik (ref) *</label>
                <input {...inp('code')} placeholder="contoh: agus" disabled={!!editId}
                  onInput={e => setForm(p => ({ ...p, code: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '') }))} />
                <span className="form-hint">Huruf kecil, angka, - atau _. URL: ?ref=kode</span>
              </div>
              <div className="form-group">
                <label className="form-label">Nama *</label>
                <input {...inp('nama')} placeholder="Nama Reseller" />
              </div>
              <div className="form-group">
                <label className="form-label">Label / Jabatan</label>
                <input {...inp('label')} placeholder="Partner Reseller" />
              </div>
              <div className="form-group">
                <label className="form-label">No. WhatsApp</label>
                <input {...inp('wa')} placeholder="6281234567890" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input {...inp('email')} placeholder="email@example.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Komisi (%)</label>
                <input {...inp('komisi_persen')} type="number" min="0" max="100" placeholder="10" />
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="aktif">Aktif</option>
                    <option value="nonaktif">Nonaktif</option>
                  </select>
                </div>
              )}
              <div className="form-group full">
                <label className="form-label">Catatan</label>
                <input {...inp('catatan')} placeholder="Catatan opsional..." />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <><span className="spinner" /> Menyimpan...</> : 'Simpan'}
                </button>
                <button className="btn btn-secondary" onClick={() => setShowAdd(false)}>Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">Daftar Reseller <span style={{ color: 'var(--text-4)', fontWeight: 600 }}>({resellers.length})</span></span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Cari kode / nama..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Kode</th>
                <th>Nama</th>
                <th>WhatsApp</th>
                <th>Link Reseller</th>
                <th>Komisi</th>
                <th>Total Penjualan</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Memuat...</td></tr>}
              {!loading && resellers.length === 0 && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Belum ada reseller</td></tr>}
              {resellers.map(r => (
                <tr key={r.id}>
                  <td><span className="td-mono">{r.code}</span></td>
                  <td>
                    <strong style={{ display: 'block' }}>{r.nama}</strong>
                    <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{r.label || ''}</span>
                  </td>
                  <td>
                    {r.wa ? (
                      <a href={`https://wa.me/${r.wa.replace(/\D/g,'')}`} target="_blank" rel="noreferrer"
                        style={{ color: 'var(--success)', fontSize: 12.5, fontWeight: 600 }}>
                        💬 {r.wa}
                      </a>
                    ) : <span style={{ color: 'var(--text-4)' }}>—</span>}
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <a href={`${baseUrl}/ref/${r.code}`} target="_blank" rel="noreferrer"
                        style={{ fontSize: 11.5, color: 'var(--info)', fontFamily: 'monospace', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                        /ref/{r.code}
                      </a>
                      <button className={`copy-btn${copied === r.code ? ' copied' : ''}`} onClick={() => copyLink(r.code)}>
                        {copied === r.code ? '✓' : 'Salin'}
                      </button>
                    </div>
                  </td>
                  <td style={{ fontSize: 12 }}>{r.komisi_persen || 10}%</td>
                  <td style={{ fontSize: 12 }}>
                    <div>{fmt(r.total_penjualan)}</div>
                    <div style={{ color: 'var(--success)', fontSize: 11 }}>Komisi: {fmt(r.total_komisi)}</div>
                  </td>
                  <td><span className={`badge badge-${r.status || 'aktif'}`}>{r.status || 'aktif'}</span></td>
                  <td>
                    <div className="td-actions">
                      <button className="icon-btn" title="Detail" onClick={() => openDetail(r.id)}>📋</button>
                      <button className="icon-btn edit" title="Edit" onClick={() => openEdit(r)}>✏️</button>
                      <button className="icon-btn del" title="Nonaktifkan" onClick={() => setDelId(r.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {detailId && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setDetailId(null)}>
          <div className="modal" style={{ maxWidth: 560 }}>
            <div className="modal-title">
              📋 Detail Reseller
              <button className="modal-close" onClick={() => setDetailId(null)}>✕</button>
            </div>
            {!detail ? <div style={{ textAlign: 'center', padding: 24 }}><span className="spinner dark" /></div> : (
              <>
                <p style={{ marginBottom: 16 }}><strong>{detail.data?.nama}</strong> · {detail.data?.label}</p>
                <p style={{ fontSize: 13, marginBottom: 8 }}>Total lisensi terjual: <strong>{detail.licenses?.length || 0}</strong></p>
                {detail.licenses?.length > 0 && (
                  <div className="table-wrap" style={{ maxHeight: 240, overflowY: 'auto' }}>
                    <table><thead><tr><th>NPSN</th><th>Sekolah</th><th>Tier</th></tr></thead>
                      <tbody>
                        {detail.licenses.map(l => (
                          <tr key={l.id}>
                            <td><span className="td-mono">{l.npsn}</span></td>
                            <td style={{ fontSize: 12 }}>{l.nama_sekolah}</td>
                            <td><span className={`badge badge-${l.versi}`}>{l.versi}</span></td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
                <div className="modal-actions">
                  <button className="btn btn-primary" onClick={() => setDetailId(null)}>Tutup</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {delId && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 8 }}>Nonaktifkan Reseller?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)' }}>Reseller akan dinonaktifkan. Data tetap tersimpan.</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDelId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={del}>Ya, Nonaktifkan</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
