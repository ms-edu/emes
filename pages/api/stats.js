// pages/api/stats.js
import { requireAdmin } from '../../lib/auth';

export default async function handler(req, res) {
  if (!requireAdmin(req)) return res.status(401).json({ error: 'Unauthorized.' });

  // Debug: GET /api/stats?debug=1
  if (req.query.debug === '1') {
    const checks = {
      FIREBASE_PROJECT_ID     : !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      FIREBASE_SERVICE_ACCOUNT: !!process.env.FIREBASE_SERVICE_ACCOUNT_KEY,
      FIREBASE_PRIVATE_KEY    : !!process.env.FIREBASE_PRIVATE_KEY,
      FIREBASE_CLIENT_EMAIL   : !!process.env.FIREBASE_CLIENT_EMAIL,
      ADMIN_SECRET_KEY        : !!process.env.ADMIN_SECRET_KEY,
    };
    let parseOk = false, parseErr = null;
    try {
      if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
        JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
        parseOk = true;
      }
    } catch (e) { parseErr = e.message; }

    let firestoreOk = false, firestoreErr = null;
    try {
      const { db } = await import('../../lib/firestore');
      await db.collection('_test_').limit(1).get();
      firestoreOk = true;
    } catch (e) { firestoreErr = e.message; }

    return res.json({ checks, parseOk, parseErr, firestoreOk, firestoreErr });
  }

  try {
    const { db } = await import('../../lib/firestore');
    const snap = await db.collection('licenses').get();
    const all  = snap.docs.map(d => d.data());
    const now  = new Date();

    const total    = all.length;
    const aktif    = all.filter(l => l.status === 'aktif').length;
    const dicabut  = all.filter(l => l.status === 'dicabut').length;
    const expired  = all.filter(l => l.status === 'aktif' && l.expiry !== '0' && new Date(l.expiry) < now).length;
    const trial    = all.filter(l => l.status === 'aktif' && l.versi === 'trial').length;
    const standard = all.filter(l => l.status === 'aktif' && l.versi === 'standard').length;
    const pro      = all.filter(l => l.status === 'aktif' && l.versi === 'pro').length;

    const rSnap    = await db.collection('resellers').get();
    const resellers = rSnap.docs.length;

    const revenue = all.filter(l => l.status === 'aktif').reduce((sum, l) => {
      if (l.versi === 'standard') return sum + 600000;
      if (l.versi === 'pro')      return sum + 1200000;
      return sum;
    }, 0);

    return res.json({ total, aktif, dicabut, expired, trial, standard, pro, resellers, revenue });
  } catch (e) {
    console.error('[stats] ERROR:', e.message);
    return res.status(500).json({ error: e.message });
  }
}
