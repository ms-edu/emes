// pages/admin/bulk.js — Generate Lisensi Massal dari Excel
import { useEffect, useRef, useState } from 'react';
import AdminLayout from '../../components/AdminLayout';
import Head from 'next/head';

export default function BulkPage() {
  const fileRef   = useRef();
  const [rows,    setRows]    = useState([]);
  const [fileName,setFileName]= useState('');
  const [versiDef,setVersiDef]= useState('trial');
  const [jenisDef,setJenisDef]= useState('0');
  const [dateDef, setDateDef] = useState('');
  const [step,    setStep]    = useState(1); // 1=upload, 2=config, 3=generate
  const [progress,setProgress]= useState(null); // {current, total, nama}
  const [result,  setResult]  = useState(null);  // {ok, skip, dupSkip, errors}
  const [running, setRunning] = useState(false);
  const [xlsxReady, setXlsxReady] = useState(false);

  // Load XLSX dari CDN
  useEffect(() => {
    if (window.XLSX) { setXlsxReady(true); return; }
    const s = document.createElement('script');
    s.src = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';
    s.onload = () => setXlsxReady(true);
    document.head.appendChild(s);
  }, []);

  function getCol(row, ...keys) {
    for (const k of keys) {
      const found = Object.keys(row).find(
        rk => rk.toLowerCase().replace(/[\s_]/g, '') === k.toLowerCase().replace(/[\s_]/g, '')
      );
      if (found && String(row[found]).trim()) return String(row[found]).trim();
    }
    return '';
  }

  function parseFile(file) {
    if (!file) return;
    if (!window.XLSX) { alert('Library XLSX belum siap, coba lagi.'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      try {
        const wb   = window.XLSX.read(ev.target.result, { type: 'binary' });
        const ws   = wb.Sheets[wb.SheetNames[0]];
        const data = window.XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!data.length) { alert('File kosong atau tidak bisa dibaca.'); return; }
        setRows(data);
        setFileName(file.name);
        setStep(2);
        setResult(null);
        setProgress(null);
      } catch (e) { alert('Gagal membaca file: ' + e.message); }
    };
    reader.readAsBinaryString(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) parseFile(file);
  }

  function downloadTemplate() {
    if (!window.XLSX) { alert('Library belum siap.'); return; }
    const tpl = [
      { npsn: '12345678', nama_sekolah: 'MIN 1 Contoh',  kab_kota: 'Kota Singkawang', provinsi: 'Kalimantan Barat', versi: 'trial',    expiry: '',           catatan: 'Contoh trial' },
      { npsn: '87654321', nama_sekolah: 'SDN 2 Contoh',  kab_kota: 'Kab. Sambas',     provinsi: 'Kalimantan Barat', versi: 'standard', expiry: '2026-12-31', catatan: '1 tahun' },
      { npsn: '11223344', nama_sekolah: 'SMPN 3 Contoh', kab_kota: 'Kota Pontianak',  provinsi: 'Kalimantan Barat', versi: 'pro',      expiry: '',           catatan: 'Selamanya' },
    ];
    const ws = window.XLSX.utils.json_to_sheet(tpl);
    ws['!cols'] = [{ wch: 12 }, { wch: 30 }, { wch: 22 }, { wch: 22 }, { wch: 10 }, { wch: 14 }, { wch: 20 }];
    const wb = window.XLSX.utils.book_new();
    window.XLSX.utils.book_append_sheet(wb, ws, 'Template');
    window.XLSX.writeFile(wb, 'Template_Import_Lisensi.xlsx');
  }

  function getExpiryDefault() {
    if (jenisDef === 'semester') { const d = new Date(); d.setMonth(d.getMonth() + 6); return d.toISOString().split('T')[0]; }
    if (jenisDef === 'tahun')    { const d = new Date(); d.setFullYear(d.getFullYear() + 1); return d.toISOString().split('T')[0]; }
    if (jenisDef === 'custom')   return dateDef || '0';
    return '0';
  }

  // Hitung ringkasan dari rows
  const summary = rows.reduce((acc, r) => {
    const v = (getCol(r, 'versi') || '').toLowerCase();
    if (v === 'standard') acc.standard++;
    else if (v === 'pro') acc.pro++;
    else if (v === 'trial') acc.trial++;
    else acc.pakai_default++;
    return acc;
  }, { trial: 0, standard: 0, pro: 0, pakai_default: 0 });

  async function generate() {
    if (!rows.length) return;
    setRunning(true);
    setProgress({ current: 0, total: rows.length, nama: '' });
    setResult(null);

    const expiryDefault = getExpiryDefault();
    let ok = 0, skip = 0, dupSkip = 0;
    const errors   = [];
    const rekapRows = [];
    // Kumpul semua file .key untuk di-zip di client
    const keyFiles = []; // [{filename, content}]

    for (let i = 0; i < rows.length; i++) {
      const r    = rows[i];
      const npsn = getCol(r, 'npsn');
      const nama = getCol(r, 'namasekolah', 'nama_sekolah', 'nama');
      const kab  = getCol(r, 'kabkota', 'kab_kota', 'kabupaten', 'kota');
      const prov = getCol(r, 'provinsi');
      const versiRaw = (getCol(r, 'versi') || '').toLowerCase();
      const versi = ['trial', 'standard', 'pro'].includes(versiRaw) ? versiRaw : versiDefault;
      const catatan = getCol(r, 'catatan', 'note', 'keterangan');
      let expiry = getCol(r, 'expiry', 'berlaku', 'masa_berlaku') || expiryDefault;
      if (expiry && expiry !== '0') {
        const d = new Date(expiry);
        expiry = isNaN(d.getTime()) ? '0' : d.toISOString().split('T')[0];
      }

      setProgress({ current: i + 1, total: rows.length, nama: nama || npsn });

      if (!npsn || npsn.length !== 8 || !/^\d{8}$/.test(npsn)) {
        errors.push(`Baris ${i + 2}: NPSN tidak valid ("${npsn}") — dilewati`);
        skip++; continue;
      }
      if (!nama || nama.length < 3) {
        errors.push(`Baris ${i + 2}: Nama sekolah kosong — dilewati`);
        skip++; continue;
      }

      try {
        const res = await fetch('/api/licenses', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ npsn, nama_sekolah: nama, kab_kota: kab, provinsi: prov, versi, expiry, catatan }),
        });
        const d = await res.json();

        if (res.status === 409) {
          errors.push(`Baris ${i + 2}: NPSN ${npsn} (${nama}) sudah terdaftar — dilewati`);
          dupSkip++; continue;
        }
        if (!res.ok) throw new Error(d.error || 'Gagal');

        const key      = d.license_key;
        const safeName = nama.replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '_').substring(0, 40);
        keyFiles.push({ filename: `${npsn}_${safeName}.key`, content: key });

        rekapRows.push({
          NPSN: npsn,
          'Nama Sekolah': nama,
          'Kab/Kota': kab,
          Provinsi: prov,
          Versi: versi.toUpperCase(),
          Berlaku: expiry === '0' ? 'Selamanya' : expiry,
          'License Key': key,
          Status: 'OK',
        });
        ok++;
      } catch (e) {
        errors.push(`Baris ${i + 2}: ${nama} — ${e.message}`);
        skip++;
      }

      // Yield agar UI bisa update
      await new Promise(r => setTimeout(r, 0));
    }

    setProgress(null);

    if (ok > 0) {
      // Buat ZIP di browser menggunakan API download per-file + client zip
      // Karena tidak ada JSZip di server, kita download sebagai ZIP menggunakan API endpoint massal
      await downloadAllAsZip(keyFiles, rekapRows);
    }

    setResult({ ok, skip, dupSkip, errors });
    setRunning(false);
  }

  async function downloadAllAsZip(keyFiles, rekapRows) {
    // Buat ZIP manual menggunakan endpoint /api/licenses/bulk-zip
    // atau fallback: download rekap Excel + file .key individual tergabung
    // Gunakan JSZip via CDN jika tersedia
    if (!window.JSZip) {
      await new Promise((resolve) => {
        const s = document.createElement('script');
        s.src = 'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js';
        s.onload = resolve;
        document.head.appendChild(s);
      });
    }

    const zip = new window.JSZip();

    // Tambah semua .key
    for (const f of keyFiles) {
      zip.file(f.filename, f.content);
    }

    // Tambah rekap Excel
    if (rekapRows.length && window.XLSX) {
      const ws = window.XLSX.utils.json_to_sheet(rekapRows);
      const colWidths = Object.keys(rekapRows[0]).map(k => ({
        wch: Math.max(k.length, ...rekapRows.map(r => String(r[k] || '').length)) + 2
      }));
      ws['!cols'] = colWidths;
      const wb = window.XLSX.utils.book_new();
      window.XLSX.utils.book_append_sheet(wb, ws, 'Rekap Lisensi');
      const xlsxBuf = window.XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      zip.file('REKAP_LISENSI.xlsx', xlsxBuf);
    }

    const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `LisensiCBT_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function reset() {
    setRows([]); setFileName(''); setStep(1);
    setResult(null); setProgress(null);
    if (fileRef.current) fileRef.current.value = '';
  }

  const cols = rows.length ? Object.keys(rows[0]) : [];

  return (
    <AdminLayout title="Generate Massal">
      <Head>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js" />
      </Head>

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: 20 }}>⚡ Generate Lisensi Massal</h2>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={downloadTemplate}>⬇️ Unduh Template Excel</button>
          {step > 1 && <button className="btn btn-secondary btn-sm" onClick={reset}>🔄 Reset</button>}
        </div>
      </div>

      {/* STEP 1 — Upload */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header">
          <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 24, height: 24, borderRadius: '50%', background: step >= 1 ? 'var(--text)' : 'var(--border)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>1</span>
            Upload File Excel
          </span>
        </div>
        <div className="card-body">
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '10px 14px', fontSize: 12.5, marginBottom: 14, display: 'flex', gap: 8 }}>
            <span>ℹ️</span>
            <div>Kolom yang dikenali: <code>npsn</code>, <code>nama_sekolah</code>, <code>kab_kota</code>, <code>provinsi</code>, <code>versi</code> (trial/standard/pro), <code>expiry</code> (YYYY-MM-DD, kosong=Selamanya), <code>catatan</code></div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); e.currentTarget.style.borderColor = 'var(--text)'; }}
            onDragLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; }}
            onDrop={e => { e.currentTarget.style.borderColor = 'var(--border)'; handleDrop(e); }}
            onClick={() => fileRef.current?.click()}
            style={{ border: '2px dashed var(--border)', borderRadius: 12, padding: 32, textAlign: 'center', cursor: 'pointer', transition: 'border-color .15s', background: 'var(--bg)' }}
          >
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv" style={{ display: 'none' }} onChange={e => parseFile(e.target.files[0])} />
            <div style={{ fontSize: 32, marginBottom: 8 }}>📊</div>
            {fileName
              ? <div style={{ fontSize: 14, fontWeight: 700 }}>✅ {fileName} — <strong>{rows.length}</strong> baris</div>
              : <>
                  <div style={{ fontSize: 14, color: 'var(--text-3)' }}>Klik atau seret file Excel ke sini</div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 4 }}>.xlsx / .xls / .csv</div>
                </>
            }
          </div>

          {/* Preview tabel */}
          {rows.length > 0 && (
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 8, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Preview ({Math.min(5, rows.length)} dari {rows.length} baris):
              </div>
              <div className="table-wrap" style={{ maxHeight: 220, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 8 }}>
                <table>
                  <thead><tr>{cols.map(c => <th key={c}>{c}</th>)}</tr></thead>
                  <tbody>
                    {rows.slice(0, 5).map((r, i) => (
                      <tr key={i}>{cols.map(c => <td key={c} style={{ maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: 12 }}>{r[c]}</td>)}</tr>
                    ))}
                    {rows.length > 5 && <tr><td colSpan={cols.length} style={{ textAlign: 'center', color: 'var(--text-4)', fontSize: 11 }}>… dan {rows.length - 5} baris lainnya</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* STEP 2 — Konfigurasi Default */}
      {step >= 2 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>2</span>
              Konfigurasi Default
            </span>
          </div>
          <div className="card-body">
            <div style={{ background: '#fefce8', border: '1px solid #fde68a', borderRadius: 8, padding: '8px 12px', fontSize: 12, marginBottom: 16 }}>
              ⚠️ Nilai default hanya berlaku untuk baris yang <strong>tidak memiliki kolom versi/expiry</strong> di file Excel.
            </div>
            <div className="form-grid">
              <div className="form-group">
                <label className="form-label">Versi Default</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['trial', 'standard', 'pro'].map(v => (
                    <button key={v} onClick={() => setVersiDef(v)}
                      style={{ flex: 1, padding: '8px 0', border: `2px solid ${versiDef === v ? 'var(--text)' : 'var(--border)'}`, borderRadius: 8, background: versiDef === v ? 'var(--text)' : 'var(--surface)', color: versiDef === v ? '#fff' : 'var(--text-2)', fontWeight: 700, fontSize: 13, cursor: 'pointer', textTransform: 'capitalize' }}>
                      {v}
                    </button>
                  ))}
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Masa Berlaku Default</label>
                <select className="form-select" value={jenisDef} onChange={e => setJenisDef(e.target.value)}>
                  <option value="0">Selamanya</option>
                  <option value="semester">1 Semester (~6 bulan)</option>
                  <option value="tahun">1 Tahun</option>
                  <option value="custom">Tanggal custom...</option>
                </select>
                {jenisDef === 'custom' && (
                  <input type="date" className="form-input" style={{ marginTop: 6 }} value={dateDef} onChange={e => setDateDef(e.target.value)} />
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 3 — Generate */}
      {step >= 2 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 24, height: 24, borderRadius: '50%', background: 'var(--text)', color: '#fff', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800 }}>3</span>
              Generate & Unduh
            </span>
          </div>
          <div className="card-body">
            {/* Ringkasan */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label: 'Total', val: rows.length, color: 'var(--text)' },
                { label: 'Trial', val: summary.trial + (summary.pakai_default > 0 ? `+${summary.pakai_default}*` : ''), color: '#15803d' },
                { label: 'Standard', val: summary.standard, color: '#1d4ed8' },
                { label: 'Pro', val: summary.pro, color: '#7c3aed' },
              ].map(s => (
                <div key={s.label} style={{ background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 0', textAlign: 'center' }}>
                  <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
            {summary.pakai_default > 0 && (
              <div style={{ fontSize: 12, color: 'var(--warning)', marginBottom: 12 }}>
                * {summary.pakai_default} baris tidak punya kolom versi — akan pakai versi default <strong>{versiDef}</strong>
              </div>
            )}

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" onClick={generate} disabled={running || !rows.length}
                style={{ fontSize: 14, padding: '10px 24px' }}>
                {running ? <><span className="spinner" /> Memproses...</> : '⚡ Generate Semua Lisensi'}
              </button>
              <button className="btn btn-secondary" onClick={reset} disabled={running}>🔄 Reset</button>
            </div>

            {/* Progress Bar */}
            {progress && (
              <div style={{ marginTop: 16 }}>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 6 }}>
                  Memproses {progress.current} / {progress.total} — <strong>{progress.nama}</strong>
                </div>
                <div style={{ height: 8, background: 'var(--border)', borderRadius: 100, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${Math.round(progress.current / progress.total * 100)}%`, background: 'var(--text)', transition: 'width .2s', borderRadius: 100 }} />
                </div>
              </div>
            )}

            {/* Hasil */}
            {result && (
              <div style={{ marginTop: 16 }}>
                {result.ok > 0 && (
                  <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13 }}>
                    ✅ <strong>{result.ok} lisensi</strong> berhasil dibuat dan diunduh sebagai ZIP!
                    {result.dupSkip > 0 && <span style={{ color: 'var(--warning)', marginLeft: 8 }}>⚠️ {result.dupSkip} NPSN duplikat dilewati.</span>}
                    {result.skip > 0 && <span style={{ color: 'var(--danger)', marginLeft: 8 }}>❌ {result.skip} baris error/skip.</span>}
                    <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>
                      File ZIP berisi <strong>.key per sekolah</strong> + file <strong>REKAP_LISENSI.xlsx</strong>
                    </div>
                  </div>
                )}
                {result.ok === 0 && (
                  <div style={{ background: '#fff5f5', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', marginBottom: 12, fontSize: 13 }}>
                    ❌ Tidak ada lisensi yang berhasil dibuat. Periksa error di bawah.
                  </div>
                )}
                {result.errors.length > 0 && (
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 6, color: 'var(--danger)' }}>
                      ⚠️ {result.errors.length} Baris Bermasalah:
                    </div>
                    <div style={{ maxHeight: 160, overflowY: 'auto', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: 8, padding: 10 }}>
                      {result.errors.map((e, i) => (
                        <div key={i} style={{ fontSize: 12, padding: '3px 0', borderBottom: '1px solid var(--border)', color: 'var(--danger)' }}>{e}</div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
