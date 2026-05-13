// pages/admin/invoices.js
import { useEffect, useState, useCallback, useRef } from 'react';
import AdminLayout from '../../components/AdminLayout';

const EMPTY = { license_id: '', npsn: '', nama_sekolah: '', kab_kota: '', provinsi: '', versi: 'standard', masa_berlaku: 'Permanen', harga: '', diskon: 0, catatan: '', ttd_nama: '', ttd_jabatan: '', ttd_image: '', stempel_image: '', status: 'lunas', reseller_id: '' };

// ────────────────────────────────────────────────────────────────────────────
// Terbilang helper
// ────────────────────────────────────────────────────────────────────────────
function terbilang(n) {
  const satuan = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan',
    'sepuluh', 'sebelas', 'dua belas', 'tiga belas', 'empat belas', 'lima belas',
    'enam belas', 'tujuh belas', 'delapan belas', 'sembilan belas'];
  if (n === 0) return 'nol';
  if (n < 20) return satuan[n];
  if (n < 100) {
    const puluhan = ['', '', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan'];
    return puluhan[Math.floor(n / 10)] + ' puluh' + (n % 10 ? ' ' + satuan[n % 10] : '');
  }
  if (n < 200) return 'seratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 1000) return satuan[Math.floor(n / 100)] + ' ratus' + (n % 100 ? ' ' + terbilang(n % 100) : '');
  if (n < 2000) return 'seribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000) return terbilang(Math.floor(n / 1000)) + ' ribu' + (n % 1000 ? ' ' + terbilang(n % 1000) : '');
  if (n < 1000000000) return terbilang(Math.floor(n / 1000000)) + ' juta' + (n % 1000000 ? ' ' + terbilang(n % 1000000) : '');
  return terbilang(Math.floor(n / 1000000000)) + ' miliar' + (n % 1000000000 ? ' ' + terbilang(n % 1000000000) : '');
}

// ────────────────────────────────────────────────────────────────────────────
// KuitansiModal
// ────────────────────────────────────────────────────────────────────────────
function KuitansiModal({ inv, resellers, onClose }) {
  const printRef = useRef(null);
  if (!inv) return null;

  const fmt = n => Number(n || 0).toLocaleString('id-ID');
  const resellerName = resellers.find(r => r.id === inv.reseller_id)?.nama || null;
  const capitalize = s => s ? s.charAt(0).toUpperCase() + s.slice(1) : '';
  const totalTerbilang = capitalize(terbilang(Number(inv.total || 0))) + ' rupiah';
  const logoUrl = 'https://i.imgur.com/bT70O4C.png';

  const handlePrint = () => {
    const content = printRef.current.innerHTML;
    const win = window.open('', '_blank', 'width=960,height=700');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Kuitansi ${inv.nomor}</title>
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{font-family:'Times New Roman',Times,serif;background:#fff;color:#111}
  @page{size:A5 landscape;margin:10mm}
  .kw{width:190mm;min-height:128mm;position:relative}
  .kb{border:2.5px solid #1a1a1a;padding:11px 15px 13px;position:relative;min-height:124mm}
  .kb::before{content:'';position:absolute;inset:4px;border:1px solid #999;pointer-events:none}
  .kh{display:flex;align-items:center;gap:12px;border-bottom:2px solid #111;padding-bottom:8px;margin-bottom:8px}
  .kh img{width:50px;height:50px;object-fit:contain;flex-shrink:0}
  .kh-org{flex:1}
  .kh-org h1{font-size:15px;font-weight:700;letter-spacing:.5px;line-height:1.2}
  .kh-org p{font-size:9px;color:#444;margin-top:1px;line-height:1.4}
  .kh-right{text-align:right}
  .kh-right .title{font-size:26px;font-weight:900;letter-spacing:3px;text-transform:uppercase;line-height:1}
  .kh-right .nomor{font-size:9px;color:#555;margin-top:2px}
  .kh-right .badge{display:inline-block;padding:1px 8px;border-radius:99px;font-size:8.5px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;margin-top:4px}
  .badge-lunas{background:#dcfce7;color:#166534;border:1px solid #86efac}
  .badge-pending{background:#fef9c3;color:#854d0e;border:1px solid #fde047}
  .krow{display:grid;grid-template-columns:110px 10px 1fr;gap:0 4px;align-items:baseline;padding:2.5px 0;border-bottom:1px dotted #ccc;font-size:10.5px}
  .krow:last-child{border-bottom:none}
  .klabel{font-weight:600;color:#222;font-size:10px}
  .ksep{color:#555}
  .knom{margin:8px 0 7px;background:#f8f8f8;border:1.5px solid #333;padding:7px 12px}
  .knom-label{font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:.5px;color:#555}
  .knom-val{font-size:22px;font-weight:900;letter-spacing:.5px;color:#111;line-height:1.15}
  .knom-diskon{font-size:11px;color:#888;margin-left:6px}
  .knom-tbilang{font-size:9.5px;color:#555;font-style:italic;margin-top:2px}
  .kfooter{display:flex;align-items:flex-end;justify-content:space-between;margin-top:8px;position:relative}
  .kfooter-left{flex:1;max-width:55%}
  .kreseller{font-size:9px;color:#666;margin-bottom:4px}
  .kcaution{font-size:9px;color:#888;font-style:italic;border-top:1px dashed #ccc;padding-top:6px}
  .kttd{text-align:center;min-width:130px}
  .kttd-label{font-size:9px;color:#555;margin-bottom:4px}
  .kttd img.ttd{height:48px;max-width:130px;object-fit:contain;display:block;margin:0 auto 2px}
  .kttd-space{height:48px}
  .kstempel{position:absolute;right:90px;bottom:18px;height:72px;width:72px;object-fit:contain;opacity:.85}
  .kttd-nama{font-size:10.5px;font-weight:700;border-top:1px solid #333;padding-top:3px;min-width:100px}
  .kttd-jabatan{font-size:9px;color:#555;margin-top:1px}
</style>
</head>
<body>${content}</body>
</html>`);
    win.document.close();
    setTimeout(() => { win.focus(); win.print(); win.close(); }, 500);
  };

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.65)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 14, padding: 24, maxWidth: 840, width: '100%', maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 24px 80px rgba(0,0,0,.35)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Modal header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>🧾 Preview Kuitansi</h3>
            <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '3px 0 0' }}>{inv.nomor} · {inv.nama_sekolah}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-primary" onClick={handlePrint}>
              🖨️ Cetak / Simpan PDF
            </button>
            <button className="btn btn-secondary" onClick={onClose}>✕ Tutup</button>
          </div>
        </div>

        {/* Preview area */}
        <div style={{ background: '#e8e8e8', padding: 20, borderRadius: 8, display: 'flex', justifyContent: 'center' }}>
          <div ref={printRef}>
            {/* ── Kuitansi document ── */}
            <div className="kw" style={{ width: '190mm', minHeight: '128mm', fontFamily: "'Times New Roman', Times, serif", color: '#111', background: '#fff' }}>
              <div className="kb" style={{ border: '2.5px solid #1a1a1a', padding: '11px 15px 13px', position: 'relative', minHeight: '124mm' }}>
                {/* Inner border */}
                <div style={{ position: 'absolute', inset: 4, border: '1px solid #999', pointerEvents: 'none' }} />

                {/* Header */}
                <div className="kh" style={{ display: 'flex', alignItems: 'center', gap: 12, borderBottom: '2px solid #111', paddingBottom: 8, marginBottom: 8 }}>
                  <img src={logoUrl} alt="Logo" style={{ width: 50, height: 50, objectFit: 'contain', flexShrink: 0 }} onError={e => { e.target.style.display = 'none'; }} />
                  <div className="kh-org" style={{ flex: 1 }}>
                    <h1 style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.5px', lineHeight: 1.2 }}>Emes CBT System</h1>
                    <p style={{ fontSize: 9, color: '#444', marginTop: 1, lineHeight: 1.4 }}>Platform Ujian Digital On-Premise untuk Sekolah Indonesia</p>
                    <p style={{ fontSize: 9, color: '#444' }}>emescbt.id · support@emescbt.id</p>
                  </div>
                  <div className="kh-right" style={{ textAlign: 'right' }}>
                    <div className="title" style={{ fontSize: 26, fontWeight: 900, letterSpacing: 3, textTransform: 'uppercase', lineHeight: 1 }}>KUITANSI</div>
                    <div className="nomor" style={{ fontSize: 9, color: '#555', marginTop: 2 }}>No. {inv.nomor}</div>
                    <div style={{ marginTop: 4 }}>
                      <span
                        className={`badge badge-${inv.status}`}
                        style={{
                          display: 'inline-block', padding: '1px 8px', borderRadius: 99,
                          fontSize: 8.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .3,
                          background: inv.status === 'lunas' ? '#dcfce7' : '#fef9c3',
                          color: inv.status === 'lunas' ? '#166534' : '#854d0e',
                          border: `1px solid ${inv.status === 'lunas' ? '#86efac' : '#fde047'}`,
                        }}
                      >
                        {inv.status === 'lunas' ? '✔ LUNAS' : '⏳ PENDING'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Body rows */}
                {[
                  { label: 'Diterima dari', value: inv.nama_sekolah },
                  { label: 'NPSN', value: inv.npsn || '—' },
                  { label: 'Kab/Kota', value: [inv.kab_kota, inv.provinsi].filter(Boolean).join(', ') || '—' },
                  { label: 'Untuk pembayaran', value: `Lisensi Emes CBT ${capitalize(inv.versi || '')} · Masa Berlaku: ${inv.masa_berlaku || 'Permanen'}` },
                  { label: 'Tanggal', value: inv.tanggal || '—' },
                  ...(inv.catatan ? [{ label: 'Keterangan', value: inv.catatan }] : []),
                ].map(({ label, value }, i) => (
                  <div key={i} className="krow" style={{ display: 'grid', gridTemplateColumns: '110px 10px 1fr', gap: '0 4px', alignItems: 'baseline', padding: '2.5px 0', borderBottom: '1px dotted #ccc', fontSize: 10.5 }}>
                    <span className="klabel" style={{ fontWeight: 600, color: '#222', fontSize: 10 }}>{label}</span>
                    <span className="ksep" style={{ color: '#555' }}>:</span>
                    <span style={{ color: '#111' }}>{value}</span>
                  </div>
                ))}

                {/* Nominal */}
                <div className="knom" style={{ margin: '8px 0 7px', background: '#f8f8f8', border: '1.5px solid #333', padding: '7px 12px' }}>
                  <div className="knom-label" style={{ fontSize: 9.5, fontWeight: 700, textTransform: 'uppercase', letterSpacing: .5, color: '#555' }}>Jumlah Pembayaran</div>
                  <div className="knom-val" style={{ fontSize: 22, fontWeight: 900, letterSpacing: .5, color: '#111', lineHeight: 1.15 }}>
                    Rp {fmt(inv.total)}
                    {inv.diskon > 0 && (
                      <span className="knom-diskon" style={{ fontSize: 11, color: '#888', marginLeft: 6 }}>
                        (diskon Rp {fmt(inv.diskon)})
                      </span>
                    )}
                  </div>
                  <div className="knom-tbilang" style={{ fontSize: 9.5, color: '#555', fontStyle: 'italic', marginTop: 2 }}>
                    Terbilang: <em>{totalTerbilang}</em>
                  </div>
                </div>

                {/* Footer */}
                <div className="kfooter" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: 8, position: 'relative' }}>
                  <div className="kfooter-left" style={{ flex: 1, maxWidth: '55%' }}>
                    {resellerName && (
                      <div className="kreseller" style={{ fontSize: 9, color: '#666', marginBottom: 4 }}>
                        Melalui reseller: <strong>{resellerName}</strong>
                      </div>
                    )}
                    <div className="kcaution" style={{ fontSize: 9, color: '#888', fontStyle: 'italic', borderTop: '1px dashed #ccc', paddingTop: 6 }}>
                      Kuitansi ini sah sebagai bukti pembayaran yang dikeluarkan secara resmi oleh Emes CBT System.
                    </div>
                  </div>

                  {/* Stempel */}
                  {inv.stempel_image && (
                    <img
                      src={inv.stempel_image}
                      alt="Stempel"
                      className="kstempel"
                      style={{ position: 'absolute', right: 90, bottom: 18, height: 72, width: 72, objectFit: 'contain', opacity: .85 }}
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}

                  {/* TTD */}
                  <div className="kttd" style={{ textAlign: 'center', minWidth: 130 }}>
                    <div className="kttd-label" style={{ fontSize: 9, color: '#555', marginBottom: 4 }}>
                      {inv.tanggal || '……………………'},<br />Yang Menerima,
                    </div>
                    {inv.ttd_image
                      ? <img src={inv.ttd_image} alt="TTD" className="ttd" style={{ height: 48, maxWidth: 130, objectFit: 'contain', display: 'block', margin: '0 auto 2px' }} onError={e => { e.target.style.display = 'none'; }} />
                      : <div className="kttd-space" style={{ height: 48 }} />
                    }
                    <div className="kttd-nama" style={{ fontSize: 10.5, fontWeight: 700, borderTop: '1px solid #333', paddingTop: 3 }}>
                      {inv.ttd_nama || '______________________'}
                    </div>
                    {inv.ttd_jabatan && (
                      <div className="kttd-jabatan" style={{ fontSize: 9, color: '#555', marginTop: 1 }}>{inv.ttd_jabatan}</div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>

        {/* Warning jika TTD belum lengkap */}
        {(!inv.ttd_nama || !inv.ttd_image || !inv.stempel_image) && (
          <div style={{ marginTop: 10, padding: '9px 14px', background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 8, fontSize: 12, color: '#92400e', display: 'flex', gap: 8, alignItems: 'center' }}>
            <span>💡</span>
            <span>
              {!inv.ttd_nama && 'Nama penanda tangan belum diisi. '}
              {!inv.ttd_image && 'Gambar tanda tangan belum diupload. '}
              {!inv.stempel_image && 'Stempel belum diupload. '}
              Edit invoice untuk melengkapi kuitansi.
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────────────────
export default function InvoicesPage() {
  const [invoices,    setInvoices]    = useState([]);
  const [resellers,   setResellers]   = useState([]);
  const [licenses,    setLicenses]    = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [search,      setSearch]      = useState('');
  const [showAdd,     setShowAdd]     = useState(false);
  const [form,        setForm]        = useState(EMPTY);
  const [editId,      setEditId]      = useState(null);
  const [saving,      setSaving]      = useState(false);
  const [toast,       setToast]       = useState({ show: false, msg: '', type: 'success' });
  const [kuitansiInv, setKuitansiInv] = useState(null);

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

  function handleImageUpload(field, e) {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 500 * 1024) { showToast('Ukuran gambar maks 500 KB', 'error'); return; }
    const reader = new FileReader();
    reader.onload = ev => setForm(p => ({ ...p, [field]: ev.target.result }));
    reader.readAsDataURL(file);
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
    if (!confirm('Hapus invoice ini?')) return;
    await fetch(`/api/invoices/${id}`, { method: 'DELETE', credentials: 'include' });
    showToast('Invoice dihapus.', 'info'); load();
  }

  const inp = k => ({ value: form[k] ?? '', onChange: e => setForm(p => ({ ...p, [k]: e.target.value })), className: 'form-input' });
  const fmt = n => Number(n || 0).toLocaleString('id-ID');
  const total = Math.max(0, parseInt(form.harga || 0) - parseInt(form.diskon || 0));

  return (
    <AdminLayout title="Invoice">
      <div className={`toast ${toast.type} ${toast.show ? 'show' : ''}`}>
        <span>{toast.type === 'success' ? '✅' : toast.type === 'info' ? 'ℹ️' : '❌'}</span>
        <span>{toast.msg}</span>
      </div>

      {/* Kuitansi Modal */}
      {kuitansiInv && (
        <KuitansiModal inv={kuitansiInv} resellers={resellers} onClose={() => setKuitansiInv(null)} />
      )}

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
                <label className="form-label">Tanggal</label>
                <input {...inp('tanggal')} type="date" className="form-input" />
              </div>
              <div className="form-group full">
                <label className="form-label">Catatan</label>
                <input {...inp('catatan')} placeholder="Catatan invoice..." />
              </div>

              {/* ── TTD & Stempel Section ── */}
              <div className="form-group full" style={{ borderTop: '1.5px solid var(--border)', paddingTop: 14, marginTop: 4 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 4 }}>✍️ Tanda Tangan &amp; Stempel <span style={{ fontSize: 11, fontWeight: 400, color: 'var(--text-4)' }}>(untuk Kuitansi)</span></div>
              </div>

              <div className="form-group">
                <label className="form-label">Nama Penanda Tangan</label>
                <input {...inp('ttd_nama')} placeholder="Nama Penanda Tangan" />
              </div>
              <div className="form-group">
                <label className="form-label">Jabatan</label>
                <input {...inp('ttd_jabatan')} placeholder="Direktur / Owner" />
              </div>

              <div className="form-group">
                <label className="form-label">Upload Tanda Tangan</label>
                <input
                  type="file" accept="image/*"
                  style={{ display: 'block', width: '100%', padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'var(--bg)' }}
                  onChange={e => handleImageUpload('ttd_image', e)}
                />
                {form.ttd_image && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={form.ttd_image} alt="TTD" style={{ height: 40, maxWidth: 140, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 6, padding: 3, background: '#fff' }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(p => ({ ...p, ttd_image: '' }))}>Hapus</button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>PNG transparan direkomendasikan · maks 500 KB</div>
              </div>

              <div className="form-group">
                <label className="form-label">Upload Stempel</label>
                <input
                  type="file" accept="image/*"
                  style={{ display: 'block', width: '100%', padding: '6px 10px', border: '1.5px solid var(--border)', borderRadius: 8, fontSize: 13, cursor: 'pointer', background: 'var(--bg)' }}
                  onChange={e => handleImageUpload('stempel_image', e)}
                />
                {form.stempel_image && (
                  <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <img src={form.stempel_image} alt="Stempel" style={{ height: 48, width: 48, objectFit: 'contain', border: '1px solid var(--border)', borderRadius: 6, padding: 3, background: '#fff' }} />
                    <button type="button" className="btn btn-secondary btn-sm" onClick={() => setForm(p => ({ ...p, stempel_image: '' }))}>Hapus</button>
                  </div>
                )}
                <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4 }}>PNG transparan direkomendasikan · maks 500 KB</div>
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

      {/* ── Table ── */}
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
              {loading && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Memuat...</td></tr>
              )}
              {!loading && invoices.length === 0 && (
                <tr><td colSpan={9} style={{ textAlign: 'center', padding: 40, color: 'var(--text-4)' }}>Belum ada invoice</td></tr>
              )}
              {invoices.map(inv => {
                const resellerName = resellers.find(r => r.id === inv.reseller_id)?.nama;
                const hasKuitansi = !!(inv.ttd_nama);
                return (
                  <tr key={inv.id}>
                    <td><span className="td-mono">{inv.nomor}</span></td>
                    <td>
                      <strong style={{ display: 'block', fontSize: 13 }}>{inv.nama_sekolah}</strong>
                      <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{[inv.kab_kota, inv.provinsi].filter(Boolean).join(', ')}</span>
                    </td>
                    <td><span className={`badge badge-${inv.versi}`}>{inv.versi}</span></td>
                    <td style={{ fontSize: 12 }}>
                      Rp {fmt(inv.harga)}
                      {inv.diskon > 0 && <span style={{ color: 'var(--text-4)', marginLeft: 4 }}>-{fmt(inv.diskon)}</span>}
                    </td>
                    <td style={{ fontSize: 13, fontWeight: 700 }}>Rp {fmt(inv.total)}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{resellerName || '—'}</td>
                    <td><span className={`badge badge-${inv.status}`}>{inv.status}</span></td>
                    <td style={{ fontSize: 12, color: 'var(--text-3)' }}>{inv.tanggal}</td>
                    <td>
                      <div className="td-actions">
                        {/* ── Tombol Kuitansi ── */}
                        <button
                          className="icon-btn"
                          title={hasKuitansi ? 'Cetak Kuitansi' : 'Kuitansi (TTD belum lengkap)'}
                          onClick={() => setKuitansiInv(inv)}
                          style={{
                            background: hasKuitansi ? '#f0fdf4' : 'var(--bg-2)',
                            border: `1.5px solid ${hasKuitansi ? '#86efac' : 'var(--border)'}`,
                            borderRadius: 7, width: 30, height: 30, cursor: 'pointer',
                            fontSize: 14, display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          }}
                        >
                          🧾
                        </button>
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
