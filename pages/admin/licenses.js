// pages/admin/licenses.js
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';

const EMPTY = { npsn: '', nama_sekolah: '', kab_kota: '', provinsi: '', versi: 'trial', expiry: '0', catatan: '', reseller_id: '' };

function Toast({ msg, type, show }) {
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  return (
    <div className={`toast ${type} ${show ? 'show' : ''}`}>
      <span className="toast-icon">{icons[type] || '💬'}</span>
      <span>{msg}</span>
    </div>
  );
}

export default function LicensesPage() {
  const [licenses,   setLicenses]   = useState([]);
  const [resellers,  setResellers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [filterVersi,setFilterVersi]= useState('');
  const [filterStatus,setFilterStatus]=useState('');
  const [showAdd,    setShowAdd]    = useState(false);
  const [form,       setForm]       = useState(EMPTY);
  const [editId,     setEditId]     = useState(null);
  const [saving,     setSaving]     = useState(false);
  const [keyModal,   setKeyModal]   = useState(null); // { key, npsn, nama }
  const [delId,      setDelId]      = useState(null);
  const [toast,      setToast]      = useState({ show: false, msg: '', type: 'success' });
  const [copied,     setCopied]     = useState(false);

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search)       params.set('search', search);
    if (filterVersi)  params.set('versi',  filterVersi);
    if (filterStatus) params.set('status', filterStatus);
    const r = await fetch(`/api/licenses?${params}`, { credentials: 'include' });
    const d = await r.json();
    setLicenses(d.data || []);
    setLoading(false);
  }, [search, filterVersi, filterStatus]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/resellers', { credentials: 'include' })
      .then(r => r.json()).then(d => setResellers(d.data || []));
  }, []);

  function openAdd()  { setForm(EMPTY); setEditId(null); setShowAdd(true); }
  function openEdit(l) {
    setForm({
      npsn: l.npsn, nama_sekolah: l.nama_sekolah, kab_kota: l.kab_kota || '',
      provinsi: l.provinsi || '', versi: l.versi || 'trial',
      expiry: l.expiry === '0' ? '0' : l.expiry,
      catatan: l.catatan || '', reseller_id: l.reseller_id || '',
      status: l.status,
    });
    setEditId(l.id);
    setShowAdd(true);
  }

  async function save() {
    setSaving(true);
    const url    = editId ? `/api/licenses/${editId}` : '/api/licenses';
    const method = editId ? 'PUT' : 'POST';
    const payload = { ...form, expiry: form.expiry || '0' };
    const r = await fetch(url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const d = await r.json();
    if (!r.ok) { showToast(d.error || 'Gagal menyimpan.', 'error'); }
    else {
      showToast(editId ? 'Lisensi diperbarui!' : 'Lisensi berhasil dibuat!', 'success');
      setShowAdd(false);
      if (d.license_key) setKeyModal({ key: d.license_key, npsn: d.data?.npsn, nama: d.data?.nama_sekolah });
      load();
    }
    setSaving(false);
  }

  async function del() {
    const r = await fetch(`/api/licenses/${delId}`, { method: 'DELETE', credentials: 'include' });
    setDelId(null);
    if (r.ok) { showToast('Lisensi dicabut.', 'info'); load(); }
    else showToast('Gagal mencabut lisensi.', 'error');
  }

  async function copyKey(key) {
    await navigator.clipboard.writeText(key).catch(() => {});
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  }

  const inp = (k) => ({ value: form[k] || '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'form-input' });

  function statusBadge(l) {
    if (l.status === 'dicabut') return <span className="badge badge-dicabut">Dicabut</span>;
    if (l.expiry !== '0' && new Date(l.expiry) < new Date()) return <span className="badge badge-expired">Expired</span>;
    return <span className="badge badge-aktif">Aktif</span>;
  }

  return (
    <AdminLayout title="Lisensi">
      <Toast {...toast} />

      {/* Header + Add Button */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>Manajemen Lisensi</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Buat Lisensi</button>
      </div>

      {/* Add/Edit Card */}
      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">{editId ? '✏️ Edit Lisensi' : '➕ Buat Lisensi Baru'}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Tutup</button>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">NPSN *</label>
                <input {...inp('npsn')} placeholder="12345678" disabled={!!editId} />
              </div>
              <div className="form-group">
                <label className="form-label">Nama Sekolah *</label>
                <input {...inp('nama_sekolah')} placeholder="SMP Negeri 1 Contoh" />
              </div>
              <div className="form-group">
                <label className="form-label">Kab/Kota</label>
                <input {...inp('kab_kota')} placeholder="Kab. Contoh" />
              </div>
              <div className="form-group">
                <label className="form-label">Provinsi</label>
                <input {...inp('provinsi')} placeholder="Jawa Tengah" />
              </div>
              <div className="form-group">
                <label className="form-label">Tier Lisensi</label>
                <select {...inp('versi')} className="form-select">
                  <option value="trial">Trial (Gratis)</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Tanggal Expiry</label>
                <input type="date" {...inp('expiry')}
                  onChange={e => setForm(p => ({ ...p, expiry: e.target.value || '0' }))}
                  value={form.expiry === '0' ? '' : form.expiry}
                />
                <span className="form-hint">Kosongkan = selamanya</span>
              </div>
              <div className="form-group">
                <label className="form-label">Reseller</label>
                <select className="form-select" value={form.reseller_id || ''} onChange={e => setForm(p => ({ ...p, reseller_id: e.target.value }))}>
                  <option value="">— Tanpa Reseller —</option>
                  {resellers.map(r => <option key={r.id} value={r.id}>{r.nama} ({r.code})</option>)}
                </select>
              </div>
              {editId && (
                <div className="form-group">
                  <label className="form-label">Status</label>
                  <select className="form-select" value={form.status || 'aktif'} onChange={e => setForm(p => ({ ...p, status: e.target.value }))}>
                    <option value="aktif">Aktif</option>
                    <option value="dicabut">Dicabut</option>
                  </select>
                </div>
              )}
              <div className="form-group full">
                <label className="form-label">Catatan</label>
                <input {...inp('catatan')} placeholder="Catatan opsional..." />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <><span className="spinner" /> Menyimpan...</> : (editId ? 'Simpan Perubahan' : 'Buat Lisensi')}
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
          <span className="card-title">Daftar Lisensi <span style={{ color: 'var(--text-4)', fontWeight: 600 }}>({licenses.length})</span></span>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select className="form-select" style={{ width: 120, padding: '7px 10px', fontSize: 12 }}
              value={filterVersi} onChange={e => setFilterVersi(e.target.value)}>
              <option value="">Semua Tier</option>
              <option value="trial">Trial</option>
              <option value="standard">Standard</option>
              <option value="pro">Pro</option>
            </select>
            <select className="form-select" style={{ width: 120, padding: '7px 10px', fontSize: 12 }}
              value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="">Semua Status</option>
              <option value="aktif">Aktif</option>
              <option value="dicabut">Dicabut</option>
            </select>
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input className="search-input" placeholder="Cari NPSN / Nama..." value={search}
                onChange={e => setSearch(e.target.value)} />
            </div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>NPSN</th>
                <th>Sekolah</th>
                <th>Tier</th>
                <th>Expiry</th>
                <th>Status</th>
                <th>Reseller</th>
                <th>Launch</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Memuat...</td></tr>}
              {!loading && licenses.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Tidak ada data</td></tr>
              )}
              {licenses.map(l => {
                const resellerName = resellers.find(r => r.id === l.reseller_id)?.nama || '—';
                return (
                  <tr key={l.id}>
                    <td><span className="td-mono">{l.npsn}</span></td>
                    <td>
                      <strong style={{ display: 'block' }}>{l.nama_sekolah}</strong>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{[l.kab_kota, l.provinsi].filter(Boolean).join(', ')}</span>
                    </td>
                    <td><span className={`badge badge-${l.versi}`}>{l.versi}</span></td>
                    <td style={{ fontSize: 12 }}>{l.expiry === '0' ? <span style={{ color: 'var(--text-4)' }}>Selamanya</span> : l.expiry}</td>
                    <td>{statusBadge(l)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{resellerName}</td>
                    <td style={{ fontSize: 12 }}>
                      {l.versi === 'trial' ? `${l.launch_count || 0}/7` : <span style={{ color: 'var(--text-4)' }}>—</span>}
                    </td>
                    <td>
                      <div className="td-actions">
                        <button className="icon-btn key" title="Lihat Key" onClick={() => setKeyModal({ id: l.id, key: l.license_key, npsn: l.npsn, nama: l.nama_sekolah })}>🔑</button>
                        <a className="icon-btn" title="Download .key" href={`/api/licenses/download?id=${l.id}`} download style={{display:'inline-flex',alignItems:'center',justifyContent:'center',textDecoration:'none'}}>⬇️</a>
                        <button className="icon-btn edit" title="Edit" onClick={() => openEdit(l)}>✏️</button>
                        <button className="icon-btn del" title="Cabut" onClick={() => setDelId(l.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Key Modal */}
      {keyModal && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setKeyModal(null)}>
          <div className="modal">
            <div className="modal-title">
              🔑 License Key
              <button className="modal-close" onClick={() => setKeyModal(null)}>✕</button>
            </div>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16 }}>
              <strong>{keyModal.nama}</strong> · NPSN: {keyModal.npsn}
            </p>
            <div className="key-box">{keyModal.key}</div>
            <div className="modal-actions" style={{flexWrap:'wrap',gap:8}}>
              <button className={`btn btn-secondary ${copied ? 'copied' : ''}`} onClick={() => copyKey(keyModal.key)}>
                {copied ? '✅ Tersalin!' : '📋 Salin Key'}
              </button>
              <a className="btn btn-secondary" href={`/api/licenses/download?id=${keyModal.id}`} download style={{textDecoration:'none'}}>
                ⬇️ Download .key
              </a>
              <a className="btn btn-secondary" href={`/api/licenses/download?id=${keyModal.id}&format=txt`} download style={{textDecoration:'none'}}>
                📄 Download .txt
              </a>
              <button className="btn btn-primary" onClick={() => setKeyModal(null)}>Tutup</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {delId && (
        <div className="modal-overlay open" onClick={e => e.target === e.currentTarget && setDelId(null)}>
          <div className="modal" style={{ maxWidth: 400 }}>
            <h3 style={{ marginBottom: 8, fontSize: 16 }}>Cabut Lisensi?</h3>
            <p style={{ fontSize: 13.5, color: 'var(--text-2)', lineHeight: 1.6 }}>
              Lisensi ini akan ditandai dicabut dan tidak bisa digunakan lagi. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setDelId(null)}>Batal</button>
              <button className="btn btn-danger" onClick={del}>Ya, Cabut</button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
