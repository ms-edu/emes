// lib/firestore.js
// Firebase Admin SDK singleton — digunakan di semua API routes

import admin from 'firebase-admin';

function getServiceAccount() {
  // Coba dari individual env vars dulu (lebih mudah di Vercel)
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    return {
      type              : 'service_account',
      project_id        : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      private_key       : process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      client_email      : process.env.FIREBASE_CLIENT_EMAIL,
    };
  }

  // Fallback: dari JSON string lengkap
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw new Error('Firebase credentials tidak ditemukan. Set FIREBASE_PRIVATE_KEY + FIREBASE_CLIENT_EMAIL, atau FIREBASE_SERVICE_ACCOUNT_KEY.');

  try {
    const parsed = JSON.parse(raw);
    // Fix private_key jika Vercel mengubah \n jadi literal newline
    if (parsed.private_key) {
      parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
    }
    return parsed;
  } catch (e) {
    throw new Error('FIREBASE_SERVICE_ACCOUNT_KEY bukan JSON valid: ' + e.message);
  }
}

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(getServiceAccount()),
    projectId : process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  });
}

export const db = admin.firestore();
export default admin;
