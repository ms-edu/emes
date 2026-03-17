// components/AdminLayout.js
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const LINKS = [
  { href: '/admin/dashboard', label: 'Dashboard',  icon: '📊' },
  { href: '/admin/licenses',  label: 'Lisensi',    icon: '🔑' },
  { href: '/admin/bulk',      label: 'Massal',     icon: '⚡' },
  { href: '/admin/resellers', label: 'Reseller',   icon: '🤝' },
  { href: '/admin/invoices',  label: 'Invoice',    icon: '🧾' },
  { href: '/admin/pendaftar', label: 'Pendaftar',  icon: '🏫' },
];

export default function AdminLayout({ children, title = 'Admin' }) {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    fetch('/api/stats', { credentials: 'include' }).then(r => {
      if (r.status === 401) router.replace('/admin');
      else setChecking(false);
    }).catch(() => router.replace('/admin'));
  }, []);

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST', credentials: 'include' });
    router.replace('/admin');
  }

  if (checking) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner dark" style={{ width: 24, height: 24 }} />
      </div>
    );
  }

  return (
    <>
      <Head><title>{title} — Emes CBT Admin</title></Head>

      <nav className="admin-nav">
        <div className="nav-brand">
          <img src="https://i.imgur.com/bT70O4C.png" alt="" />
          <span>Emes CBT</span>
        </div>

        <div className="nav-links">
          {LINKS.map(l => (
            <Link key={l.href} href={l.href}
              className={`nav-link${router.pathname === l.href ? ' active' : ''}`}>
              <span>{l.icon}</span> {l.label}
            </Link>
          ))}
        </div>

        <div className="nav-right">
          <a href="/" className="nav-badge" target="_blank" rel="noreferrer">Landing ↗</a>
          <button className="btn-ghost-sm" onClick={logout}>Keluar</button>
        </div>
      </nav>

      <div className="page-body">
        {children}
      </div>
    </>
  );
}
