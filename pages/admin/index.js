// pages/admin/index.js  — Login page, redirects to /admin/dashboard
import { useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminLogin() {
  const router  = useRouter();
  const [key, setKey]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);

  async function login(e) {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const r = await fetch('/api/admin/login', {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify({ key }),
      });
      if (r.ok) {
        router.push('/admin/dashboard');
      } else {
        const d = await r.json();
        setError(d.error || 'Login gagal.');
      }
    } catch { setError('Terjadi kesalahan, coba lagi.'); }
    setLoading(false);
  }

  return (
    <>
      <Head><title>Admin — Emes CBT</title></Head>
      <div className="login-page">
        <div className="login-card">
          <div className="login-logo">
            <img src="https://i.imgur.com/bT70O4C.png" alt="Emes CBT" />
            <h1>Emes CBT Admin</h1>
            <p>Masukkan kunci admin untuk melanjutkan</p>
          </div>
          <form onSubmit={login} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="form-group">
              <label className="form-label">Kunci Admin</label>
              <input
                className={`form-input${error ? ' error' : ''}`}
                type="password"
                placeholder="••••••••••••"
                value={key}
                onChange={e => setKey(e.target.value)}
                autoFocus
              />
              {error && <span style={{ fontSize: 12, color: 'var(--danger)' }}>{error}</span>}
            </div>
            <button className="btn btn-primary" type="submit" disabled={loading || !key}
              style={{ justifyContent: 'center', marginTop: 4 }}>
              {loading ? <><span className="spinner" /> Masuk...</> : 'Masuk ke Dashboard'}
            </button>
          </form>
          <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--text-4)', marginTop: 20 }}>
            <a href="/" style={{ color: 'var(--text-3)' }}>← Kembali ke Landing Page</a>
          </p>
        </div>
      </div>
    </>
  );
}
