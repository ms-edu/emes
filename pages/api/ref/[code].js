// pages/api/ref/[code].js
const PROJECT_ID     = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'emescbt-29ee1';
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';

function getBaseUrl(req) {
  // 1. Env var eksplisit (paling prioritas)
  if (process.env.NEXT_PUBLIC_BASE_URL) return process.env.NEXT_PUBLIC_BASE_URL;
  // 2. Vercel otomatis set VERCEL_URL (tanpa https://)
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  // 3. Dari header request
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'localhost:3000';
  const proto = req.headers['x-forwarded-proto'] || 'https';
  return `${proto}://${host}`;
}

export default async function handler(req, res) {
  const { code } = req.query;
  const BASE_URL  = getBaseUrl(req);

  if (!code) return res.redirect(BASE_URL);

  const codeClean = String(code).toLowerCase().replace(/[^a-z0-9_-]/g, '');
  const refUrl    = `${BASE_URL}/?ref=${encodeURIComponent(codeClean)}`;

  let nama = 'Emes EduTech', label = 'Tim Emes CBT';

  try {
    const fsUrl  = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/resellers?key=${FIREBASE_API_KEY}&pageSize=200`;
    const fsData = await fetch(fsUrl).then(r => r.json());
    if (fsData.documents) {
      for (const doc of fsData.documents) {
        const f = doc.fields || {};
        if ((f.code?.stringValue || '').toLowerCase() === codeClean) {
          nama  = f.nama?.stringValue  || nama;
          label = f.label?.stringValue || label;
          break;
        }
      }
    }
  } catch (_) {}

  const title = `Emes CBT — ${nama}`;
  const desc  = `Platform CBT untuk Sekolah Indonesia. Hubungi ${nama} (${label}) untuk info lisensi.`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'no-store, no-cache');
  return res.status(200).send(`<!DOCTYPE html>
<html lang="id"><head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:image" content="${BASE_URL}/og-image.png">
<meta property="og:url" content="${refUrl}">
<meta property="og:type" content="website">
<meta name="twitter:card" content="summary_large_image">
<meta http-equiv="refresh" content="0;url=${refUrl}">
<script>window.location.replace("${refUrl}");</script>
</head><body><p>Mengalihkan ke ${refUrl}...</p></body></html>`);
}
