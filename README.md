# Emes CBT License Manager v3 — Fullstack

Platform manajemen lisensi Emes CBT berbasis Next.js + Firestore + Vercel, lengkap dengan landing page dan sistem reseller.

---

## 🗂️ Struktur Proyek

```
emes-cbt-license-manager/
├── pages/
│   ├── index.js                  # Landing page publik (+ sistem reseller)
│   ├── _app.js
│   ├── admin/
│   │   ├── index.js              # Login admin
│   │   ├── dashboard.js          # Dashboard statistik
│   │   ├── licenses.js           # Manajemen lisensi (CRUD)
│   │   ├── resellers.js          # Manajemen reseller
│   │   ├── invoices.js           # Manajemen invoice
│   │   └── pendaftar.js          # Daftar pendaftar trial
│   └── api/
│       ├── licenses/
│       │   ├── index.js          # GET list, POST create
│       │   └── [id].js           # GET/PUT/DELETE per lisensi
│       ├── resellers/
│       │   ├── index.js          # GET list, POST create
│       │   └── [id].js           # GET/PUT/DELETE per reseller
│       ├── invoices/
│       │   ├── index.js          # GET list, POST create
│       │   └── [id].js           # GET/PUT/DELETE per invoice
│       ├── ref/
│       │   └── [code].js         # OG tag injection untuk reseller
│       ├── admin/
│       │   ├── login.js          # POST login admin
│       │   └── logout.js         # POST logout
│       ├── verify.js             # POST verifikasi license key
│       ├── launch.js             # POST hitung launch (trial)
│       ├── stats.js              # GET statistik dashboard
│       └── versi-config.js       # GET konfigurasi tier
├── components/
│   └── AdminLayout.js            # Layout bersama halaman admin
├── lib/
│   ├── firestore.js              # Firebase Admin SDK singleton
│   ├── license.js                # Generate & verify license key
│   └── auth.js                   # Middleware auth admin
├── styles/
│   └── globals.css
├── firestore.rules               # Security rules Firestore
├── firestore.indexes.json        # Composite indexes
├── vercel.json                   # Rewrite /ref/:code
├── .env.local.example            # Template environment variables
└── .gitignore
```

---

## 🚀 Cara Deploy

### 1. Siapkan Firebase

1. Buka [Firebase Console](https://console.firebase.google.com)
2. Gunakan project yang sudah ada (`emescbt-29ee1`) atau buat baru
3. Aktifkan **Firestore Database** (mode Production)
4. Deploy security rules:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
5. Buat **Service Account**:
   - Buka **Project Settings → Service Accounts**
   - Klik **Generate new private key**
   - Simpan file JSON (JANGAN commit ke GitHub!)

---

### 2. Upload ke GitHub

```bash
git init
git add .
git commit -m "Initial commit: Emes CBT License Manager v3"
git remote add origin https://github.com/USERNAME/emes-cbt-license-manager.git
git push -u origin main
```

> **Pastikan `.gitignore` sudah benar!** File `.env.local` dan `serviceAccountKey.json` tidak boleh terupload ke GitHub.

---

### 3. Deploy ke Vercel

1. Login ke [vercel.com](https://vercel.com)
2. Klik **New Project → Import Git Repository**
3. Pilih repo yang baru dibuat
4. Framework: **Next.js** (auto-detect)
5. Tambahkan **Environment Variables** berikut:

| Variable | Nilai |
|----------|-------|
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `emescbt-29ee1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | API key Firebase (boleh publik) |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | **Isi JSON service account di sini** (minify jadi 1 baris) |
| `ADMIN_SECRET_KEY` | Buat kunci rahasia kuat, contoh: `EmesAdmin@2025!Rahasia` |
| `LICENSE_SECRET_KEY` | `EMESCBT-197608012005011004` (harus sama dengan versi lama) |
| `NEXT_PUBLIC_BASE_URL` | URL Vercel Anda, contoh: `https://emescbt.vercel.app` |

6. Klik **Deploy** ✅

#### Cara minify JSON Service Account:
```bash
# Di terminal:
cat serviceAccountKey.json | python3 -m json.tool --compact
# atau
node -e "const j=require('./serviceAccountKey.json'); console.log(JSON.stringify(j))"
```
Lalu paste hasilnya ke field `FIREBASE_SERVICE_ACCOUNT_KEY` di Vercel.

---

### 4. Custom Domain (Opsional)

Di **Vercel → Settings → Domains**, tambahkan domain Anda, contoh: `emescbt.id`

---

## 🔑 Akses Admin

Setelah deploy, buka:
```
https://your-domain.vercel.app/admin
```
Masukkan kunci admin yang Anda set di `ADMIN_SECRET_KEY`.

### Halaman Admin:
| URL | Fungsi |
|-----|--------|
| `/admin` | Login |
| `/admin/dashboard` | Statistik & lisensi terbaru |
| `/admin/licenses` | CRUD lisensi |
| `/admin/resellers` | CRUD reseller + link unik |
| `/admin/invoices` | CRUD invoice + komisi otomatis |
| `/admin/pendaftar` | Daftar sekolah yang mendaftar trial |

---

## 🔌 API Endpoints

### Public (tanpa auth):
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `POST` | `/api/verify` | Verifikasi license key |
| `POST` | `/api/launch` | Tambah hitungan launch (trial) |
| `GET`  | `/api/versi-config` | Konfigurasi tier |
| `GET`  | `/ref/:code` | Redirect reseller + OG tag |

### Admin (butuh `X-Admin-Key` header atau cookie):
| Method | Endpoint | Fungsi |
|--------|----------|--------|
| `GET` | `/api/licenses` | List lisensi (+ filter) |
| `POST` | `/api/licenses` | Buat lisensi baru |
| `PUT` | `/api/licenses/:id` | Update lisensi |
| `DELETE` | `/api/licenses/:id` | Cabut lisensi |
| `GET` | `/api/resellers` | List reseller |
| `POST` | `/api/resellers` | Tambah reseller |
| `PUT/DELETE` | `/api/resellers/:id` | Edit/hapus reseller |
| `GET/POST` | `/api/invoices` | CRUD invoice |
| `GET` | `/api/stats` | Statistik dashboard |

### Contoh verify dari aplikasi CBT:
```javascript
const res = await fetch('https://your-domain.vercel.app/api/verify', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ license_key: 'KEY_DARI_PENGGUNA' })
});
const data = await res.json();
// { valid: true, versi: 'standard', max_siswa: 200, ... }
```

---

## 🤝 Sistem Reseller

1. Tambah reseller di `/admin/resellers` dengan kode unik (contoh: `agus`)
2. Reseller mendapat link: `https://your-domain.vercel.app/ref/agus`
   - Link ini akan redirect ke landing page dengan `?ref=agus`
   - OG tag WhatsApp/Facebook akan menampilkan nama reseller
3. Setiap lisensi bisa dikaitkan ke reseller saat pembuatan
4. Invoice yang dikaitkan ke reseller otomatis menghitung komisi
5. Total penjualan & komisi reseller tersimpan & tampil di tabel

---

## 🔄 Migrasi dari Versi Lama (SQLite)

License key yang dibuat oleh server.js lama **masih valid** di sistem baru karena:
- `LICENSE_SECRET_KEY` sama persis
- Algoritma HMAC-SHA256 identik

Untuk migrasi data lisensi dari SQLite ke Firestore:

```javascript
// Script migrasi (jalankan sekali di Node.js lokal)
const Database = require('better-sqlite3');
const { initializeApp, cert } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');
const sa = require('./serviceAccountKey.json');

initializeApp({ credential: cert(sa) });
const fsdb = getFirestore();
const sqlite = new Database('./data/licenses.db');

const rows = sqlite.prepare('SELECT * FROM licenses').all();
for (const row of rows) {
  await fsdb.collection('licenses').doc(String(row.id)).set({
    npsn        : row.npsn,
    nama_sekolah: row.nama_sekolah,
    kab_kota    : row.kab_kota || '',
    provinsi    : row.provinsi || '',
    versi       : row.versi || 'trial',
    max_siswa   : row.max_siswa || 30,
    expiry      : row.expiry || '0',
    license_key : row.license_key,
    status      : row.status || 'aktif',
    catatan     : row.catatan || '',
    launch_count: row.launch_count || 0,
    reseller_id : null,
    created_at  : row.created_at || new Date().toISOString(),
    updated_at  : row.updated_at || new Date().toISOString(),
  });
  console.log('Migrated:', row.npsn);
}
```

---

## 🛡️ Keamanan

- ✅ Admin auth via HTTP-only cookie (7 hari) atau `X-Admin-Key` header
- ✅ Firebase Admin SDK di server — tidak expose credentials ke client
- ✅ Firestore rules memblokir akses client langsung ke data sensitif
- ✅ NPSN duplikat dicek sebelum insert
- ✅ License key di-generate server-side, tidak bisa dipalsukan
- ⚠️ Ganti `ADMIN_SECRET_KEY` dengan string acak minimal 32 karakter!

---

## 📦 Tech Stack

| Layer | Teknologi |
|-------|-----------|
| Frontend | Next.js 14 (Pages Router) |
| Backend | Next.js API Routes (Serverless) |
| Database | Google Firestore |
| Auth Admin | Cookie HTTP-only + ADMIN_SECRET_KEY |
| License Crypto | HMAC-SHA256 (Node.js crypto) |
| Hosting | Vercel |
| Reseller OG | Vercel Serverless + Firestore REST API |

---

## 🆘 Troubleshooting

**Error: FIREBASE_SERVICE_ACCOUNT_KEY tidak valid**
→ Pastikan JSON di-minify (1 baris), tidak ada newline tersembunyi

**Error 401 di semua API admin**
→ Pastikan `ADMIN_SECRET_KEY` di Vercel env sama dengan yang Anda gunakan saat login

**License key lama tidak valid**
→ Cek `LICENSE_SECRET_KEY` harus `EMESCBT-197608012005011004`

**Reseller link tidak redirect**
→ Pastikan `vercel.json` sudah benar dan sudah di-redeploy

---

Dibuat untuk **Emes EduTech** 🎓
