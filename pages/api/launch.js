// pages/api/launch.js
import { verifyKey } from '../../lib/license';

const TRIAL_MAX_LAUNCH = 7;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const { license_key, npsn } = req.body;
    if (!license_key && !npsn) return res.status(400).json({ error: 'license_key atau npsn wajib.' });
    const { db } = await import('../../lib/firestore');
    let snap;
    if (npsn) {
      snap = await db.collection('licenses').where('npsn', '==', npsn).limit(1).get();
    } else {
      const verified = verifyKey(license_key);
      if (!verified.valid) return res.json({ allowed: false, reason: verified.reason });
      snap = await db.collection('licenses').where('npsn', '==', verified.npsn).limit(1).get();
    }
    if (snap.empty) return res.json({ allowed: false, reason: 'Lisensi tidak ditemukan.' });
    const docRef = snap.docs[0].ref;
    const row    = snap.docs[0].data();
    if (row.status === 'dicabut') return res.json({ allowed: false, reason: 'Lisensi telah dicabut.' });
    if (row.versi !== 'trial') return res.json({ allowed: true, versi: row.versi });
    const currentCount = row.launch_count || 0;
    if (currentCount >= TRIAL_MAX_LAUNCH) {
      return res.json({ allowed: false, reason: `Batas percobaan habis (${currentCount}/${TRIAL_MAX_LAUNCH}x).`, launch_count: currentCount, max_launch: TRIAL_MAX_LAUNCH, sisa_launch: 0 });
    }
    const newCount = currentCount + 1;
    await docRef.update({ launch_count: newCount, updated_at: new Date().toISOString() });
    return res.json({ allowed: true, versi: 'trial', launch_count: newCount, max_launch: TRIAL_MAX_LAUNCH, sisa_launch: TRIAL_MAX_LAUNCH - newCount });
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
