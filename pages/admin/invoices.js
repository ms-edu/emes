// pages/admin/invoices.js
import { useEffect, useState, useCallback } from 'react';
import AdminLayout from '../../components/AdminLayout';

const EMPTY = { license_id: '', npsn: '', nama_sekolah: '', kab_kota: '', provinsi: '', versi: 'standard', masa_berlaku: 'Permanen', harga: '', diskon: 0, catatan: '', ttd_nama: '', ttd_jabatan: '', status: 'lunas', reseller_id: '' };

export default function InvoicesPage() {
  const [invoices,  setInvoices]  = useState([]);
  const [resellers, setResellers] = useState([]);
  const [licenses,  setLicenses]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState('');
  const [showAdd,   setShowAdd]   = useState(false);
  const [form,      setForm]      = useState(EMPTY);
  const [editId,    setEditId]    = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [toast,     setToast]     = useState({ show: false, msg: '', type: 'success' });

  function showToast(msg, type = 'success') {
    setToast({ show: true, msg, type });
    setTimeout(() => setToast(t => ({ ...t, show: false })), 3200);
  }

  const load = useCallback(async () => {
    setLoading(true);
    const r = await fetch(`/api/invoices${search ? `?search=${search}` : ''}`, { credentials: 'include' });
    const d = await r.json();
    setInvoices(d.data || []);
    setLoading(false);
  }, [search]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    fetch('/api/resellers', { credentials: 'include' }).then(r => r.json()).then(d => setResellers(d.data || []));
    fetch('/api/licenses?status=aktif', { credentials: 'include' }).then(r => r.json()).then(d => setLicenses(d.data || []));
  }, []);

  function openAdd() { setForm(EMPTY); setEditId(null); setShowAdd(true); }
  function openEdit(inv) {
    setForm({ ...inv, harga: inv.harga, diskon: inv.diskon || 0 });
    setEditId(inv.id); setShowAdd(true);
  }

  // Auto-fill from license selection
  function onLicenseSelect(id) {
    const lic = licenses.find(l => l.id === id);
    if (lic) {
      setForm(p => ({
        ...p, license_id: id, npsn: lic.npsn,
        nama_sekolah: lic.nama_sekolah, kab_kota: lic.kab_kota,
        provinsi: lic.provinsi, versi: lic.versi,
        reseller_id: lic.reseller_id || '',
      }));
    } else {
      setForm(p => ({ ...p, license_id: '' }));
    }
  }

  async function save() {
    setSaving(true);
    const url    = editId ? `/api/invoices/${editId}` : '/api/invoices';
    const method = editId ? 'PUT' : 'POST';
    const r = await fetch(url, {
      method, credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, harga: parseInt(form.harga || 0), diskon: parseInt(form.diskon || 0) }),
    });
    const d = await r.json();
    if (!r.ok) showToast(d.error || 'Gagal menyimpan.', 'error');
    else { showToast('Invoice disimpan!', 'success'); setShowAdd(false); load(); }
    setSaving(false);
  }

  async function del(id) {
    await fetch(`/api/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
    showToast('Invoice dihapus.', 'info'); load();
  }

  const inp = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'form-input' });
  const fmt = n => Number(n || 0).toLocaleString('id-ID');
  const total = Math.max(0, parseInt(form.harga || 0) - parseInt(form.diskon || 0));

  return (
    <AdminLayout title="Invoice">
      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>
        <span>{toast.type === 'success' ? '✅' : '❌'}</span><span>{toast.msg}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>Manajemen Invoice</h2>
        <button className="btn btn-primary" onClick={openAdd}>+ Buat Invoice</button>
      </div>

      {showAdd && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header">
            <span className="card-title">{editId ? '✏️ Edit Invoice' : '➕ Invoice Baru'}</span>
            <button className="btn btn-secondary btn-sm" onClick={() => setShowAdd(false)}>Tutup</button>
          </div>
          <div className="card-body">
            <div className="form-grid">
              <div className="form-group full">
                <label className="form-label">Pilih Lisensi (opsional)</label>
                <select className="form-select" value={form.license_id || ''} onChange={e => onLicenseSelect(e.target.value)}>
                  <option value="">— Input Manual —</option>
                  {licenses.map(l => <option key={l.id} value={l.id}>{l.npsn} — {l.nama_sekolah}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama Sekolah *</label>
                <input {...inp('nama_sekolah')} placeholder="SMP Negeri 1 Contoh" />
              </div>
              <div className="form-group">
                <label className="form-label">NPSN</label>
                <input {...inp('npsn')} placeholder="12345678" />
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
                  <option value="trial">Trial</option>
                  <option value="standard">Standard</option>
                  <option value="pro">Pro</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Masa Berlaku</label>
                <select {...inp('masa_berlaku')} className="form-select">
                  <option value="Semester">Semester (6 bulan)</option>
                  <option value="Tahunan">Tahunan (1 tahun)</option>
                  <option value="Permanen">Permanen</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Harga (Rp) *</label>
                <input {...inp('harga')} type="number" min="0" placeholder="600000" />
              </div>
              <div className="form-group">
                <label className="form-label">Diskon (Rp)</label>
                <input {...inp('diskon')} type="number" min="0" placeholder="0" />
              </div>
              <div className="form-group">
                <label className="form-label">Total</label>
                <div style={{ padding: '9px 12px', background: 'var(--bg)', border: '1.5px solid var(--border)', borderRadius: 9, fontSize: 14, fontWeight: 700 }}>
                  Rp {fmt(total)}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Reseller</label>
                <select className="form-select" value={form.reseller_id || ''} onChange={e => setForm(p => ({ ...p, reseller_id: e.target.value }))}>
                  <option value="">— Tanpa Reseller —</option>
                  {resellers.map(r => <option key={r.id} value={r.id}>{r.nama} ({r.code})</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Status</label>
                <select {...inp('status')} className="form-select">
                  <option value="lunas">Lunas</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Nama TTD</label>
                <input {...inp('ttd_nama')} placeholder="Nama Penanda Tangan" />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan TTD</label>
                <input {...inp('ttd_jabatan')} placeholder="Direktur / Owner" />
              </div>
              <div className="form-group full">
                <label className="form-label">Catatan</label>
                <input {...inp('catatan')} placeholder="Catatan invoice..." />
              </div>
              <div className="form-actions">
                <button className="btn btn-primary" onClick={save} disabled={saving}>
                  {saving ? <><span className="spinner" /> Menyimpan...</> : 'Simpan Invoice'}
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
          <span className="card-title">Daftar Invoice <span style={{ color: 'var(--text-4)', fontWeight: 600 }}>({invoices.length})</span></span>
          <div className="search-wrap">
            <span className="search-icon">🔍</span>
            <input className="search-input" placeholder="Cari nomor / nama..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nomor</th>
                <th>Sekolah</th>
                <th>Tier</th>
                <th>Harga</th>
                <th>Total</th>
                <th>Reseller</th>
                <th>Status</th>
                <th>Tanggal</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Memuat...</td></tr>}
              {!loading && invoices.length === 0 && <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Belum ada invoice</td></tr>}
              {invoices.map(inv => {
                const resellerName = resellers.find(r => r.id === inv.reseller_id)?.nama;
                return (
                  <tr key={inv.id}>
                    <td><span className="td-mono">{inv.nomor}</span></td>
                    <td>
                      <strong style={{ display: 'block', fontSize: 13 }}>{inv.nama_sekolah}</strong>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{[inv.kab_kota, inv.provinsi].filter(Boolean).join(', ')}</span>
                    </td>
                    <td><span className={`badge badge-${inv.versi}`}>{inv.versi}</span></td>
                    <td style={{ fontSize: 12 }}>Rp {fmt(inv.harga)}{inv.diskon > 0 && <span style={{ color: 'var(--text-4)', marginLeft: 4 }}>-{fmt(inv.diskon)}</span>}</td>
                    <td style={{ fontSize: 13, fontWeight: 700 }}>Rp {fmt(inv.total)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{resellerName || '—'}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{inv.tanggal}</td>
                    <td>
                      <div className="td-actions">
                        <button className="icon-btn edit" title="Edit" onClick={() => openEdit(inv)}>✏️</button>
                        <button className="icon-btn del" title="Hapus" onClick={() => del(inv.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
