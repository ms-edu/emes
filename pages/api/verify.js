// pages/api/verify.js
import { verifyKey } from '../../lib/license';

const TRIAL_MAX_LAUNCH = 7;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  try {
    const { license_key } = req.body;
    if (!license_key) return res.status(400).json({ error: 'license_key wajib diisi.' });
    const result = verifyKey(license_key);
    if (!result.valid) return res.json(result);
    const { db } = await import('../../lib/firestore');
    const snap = await db.collection('licenses').where('npsn', '==', result.npsn).limit(1).get();
    if (!snap.empty) {
      const row = snap.docs[0].data();
      if (row.status === 'dicabut') return res.json({ valid: false, reason: 'Lisensi telah dicabut.' });
      if (result.versi === 'trial') {
        result.launch_count = row.launch_count || 0;
        result.max_launch   = TRIAL_MAX_LAUNCH;
        result.sisa_launch  = Math.max(0, TRIAL_MAX_LAUNCH - result.launch_count);
      }
    }
    return res.json(result);
  } catch (e) { return res.status(500).json({ error: e.message }); }
}
