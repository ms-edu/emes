// lib/license.js
// Helper: generate & verify license key (sama dengan server.js lama)

import crypto from 'crypto';

const SECRET_KEY    = process.env.LICENSE_SECRET_KEY || 'EMESCBT-197608012005011004';
const TRIAL_MAX_LAUNCH = 7;

export const VERSI_CONFIG = {
  trial: {
    label     : 'Trial',
    max_siswa : 30,
    max_launch: TRIAL_MAX_LAUNCH,
    fitur     : ['ujian','cetak_hasil','cetak_soal','ekspor','laporan','semua'],
    deskripsi : `Maks ${TRIAL_MAX_LAUNCH}x buka • Maks 30 siswa • Semua fitur`,
    harga     : 0,
  },
  standard: {
    label     : 'Standard',
    max_siswa : 200,
    max_launch: null,
    fitur     : ['ujian','cetak_hasil','cetak_soal','ekspor','laporan','semua'],
    deskripsi : 'Maks 200 siswa • Semua fitur',
    harga     : 600000,
  },
  pro: {
    label     : 'Pro',
    max_siswa : 0,
    max_launch: null,
    fitur     : ['ujian','cetak_hasil','cetak_soal','ekspor','laporan','semua'],
    deskripsi : 'Unlimited siswa • Semua fitur',
    harga     : 1200000,
  },
};

export const VALID_VERSI = Object.keys(VERSI_CONFIG);

export function generateKey(npsn, namaSekolah, kabKota = '', provinsi = '', expiry = '0', versi = 'trial') {
  if (!/^\d{8}$/.test(npsn))
    throw new Error('NPSN harus 8 digit angka.');
  if (!namaSekolah || namaSekolah.trim().length < 3)
    throw new Error('Nama sekolah terlalu pendek (min 3 karakter).');
  if (!VALID_VERSI.includes(versi))
    throw new Error(`Versi harus salah satu dari: ${VALID_VERSI.join(', ')}.`);

  const namaEncoded     = namaSekolah.trim().replace(/:/g, '[COLON]');
  const kabKotaEncoded  = (kabKota  || '').trim().replace(/:/g, '[COLON]');
  const provinsiEncoded = (provinsi || '').trim().replace(/:/g, '[COLON]');

  if (expiry !== '0') {
    const d = new Date(expiry);
    if (isNaN(d.getTime())) throw new Error(`Format tanggal tidak valid: "${expiry}"`);
    expiry = d.toISOString().split('T')[0];
  }

  const payload = `${npsn}:${namaEncoded}:${kabKotaEncoded}:${provinsiEncoded}:${versi}:${expiry}`;
  const sig     = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
  return `${payload}:${sig}`;
}

export function verifyKey(licenseKey) {
  try {
    const parts = licenseKey.trim().split(':');
    if (parts.length < 6) return { valid: false, reason: 'Format tidak valid.' };

    const sig    = parts[parts.length - 1];
    const expiry = parts[parts.length - 2];
    const npsn   = parts[0];

    const isNewFormat = parts.length >= 7 && VALID_VERSI.includes(parts[parts.length - 3]);
    let versi, provinsiEncoded, kabKotaEncoded, namaEncoded;

    if (isNewFormat) {
      versi           = parts[parts.length - 3];
      provinsiEncoded = parts[parts.length - 4];
      kabKotaEncoded  = parts[parts.length - 5];
      namaEncoded     = parts.slice(1, parts.length - 5).join(':');
    } else {
      versi           = 'standard';
      provinsiEncoded = parts[parts.length - 3];
      kabKotaEncoded  = parts[parts.length - 4];
      namaEncoded     = parts.slice(1, parts.length - 4).join(':');
    }

    const nama     = namaEncoded.replace(/\[COLON\]/g, ':');
    const kabKota  = kabKotaEncoded.replace(/\[COLON\]/g, ':');
    const provinsi = provinsiEncoded.replace(/\[COLON\]/g, ':');

    const payload  = isNewFormat
      ? `${npsn}:${namaEncoded}:${kabKotaEncoded}:${provinsiEncoded}:${versi}:${expiry}`
      : `${npsn}:${namaEncoded}:${kabKotaEncoded}:${provinsiEncoded}:${expiry}`;
    const expected = crypto.createHmac('sha256', SECRET_KEY).update(payload).digest('hex');
    if (sig !== expected) return { valid: false, reason: 'Signature tidak cocok.' };

    if (expiry !== '0') {
      const exp = new Date(expiry);
      if (isNaN(exp.getTime())) return { valid: false, reason: 'Tanggal expiry tidak valid.' };
      if (new Date() > exp) return {
        valid: false, expired: true, npsn, nama,
        reason: `Lisensi expired sejak ${exp.toLocaleDateString('id-ID')}.`
      };
    }

    const cfg = VERSI_CONFIG[versi] || VERSI_CONFIG.trial;
    return {
      valid     : true,
      npsn, nama, kabKota, provinsi, versi,
      max_siswa : cfg.max_siswa,
      max_launch: cfg.max_launch,
      fitur     : cfg.fitur,
      deskripsi : cfg.deskripsi,
      expiry    : expiry === '0' ? 'Selamanya' : new Date(expiry).toLocaleDateString('id-ID'),
    };
  } catch (e) {
    return { valid: false, reason: e.message };
  }
}
