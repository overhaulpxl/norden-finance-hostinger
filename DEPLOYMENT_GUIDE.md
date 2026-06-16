# 🚀 Panduan Deployment Norden Finance ke Vercel (Gratis)

Panduan ini menjelaskan langkah demi langkah untuk melakukan deployment aplikasi **Norden Finance** ke **Vercel** secara gratis, serta melakukan konfigurasi database PostgreSQL, Firebase, dan Gemini AI.

---

## 📋 Daftar Kebutuhan (Prerequisites)

Untuk melakukan deployment secara gratis, Anda memerlukan akun di platform-platform berikut:
1. **GitHub** (untuk menyimpan repositori kode Anda)
2. **Vercel** (untuk hosting Next.js dan database PostgreSQL gratis)
3. **Firebase Console** (untuk Firebase Authentication & Storage gratis)
4. **Google AI Studio** (untuk mendapatkan Gemini API Key gratis)

---

## 🛠️ Langkah 1: Setup Database PostgreSQL Gratis

Anda dapat memilih antara menggunakan **Vercel Postgres** (terintegrasi langsung, paling mudah), **Neon Tech**, atau **Supabase**.

### Opsi A: Menggunakan Vercel Postgres (Paling Mudah & Terintegrasi)
Vercel menyediakan database PostgreSQL gratis (didukung oleh Neon) langsung di dashboard Vercel Anda.
1. Saat membuat project baru di Vercel (Langkah 4), setelah mengimpor repositori Anda, pergi ke dashboard project Anda di Vercel.
2. Pilih tab **Storage** di bagian atas menu project.
3. Klik **Create Database** dan pilih **Postgres**.
4. Setujui syarat & ketentuan, lalu klik **Create**.
5. Pilih region database terdekat (misal: **Singapore** jika tersedia, atau region terdekat lainnya).
6. Setelah database dibuat, klik **Connect** untuk menghubungkannya dengan project Anda.
7. Vercel akan otomatis menambahkan Environment Variables berikut ke project Anda:
   - `POSTGRES_URL` (digunakan sebagai `DATABASE_URL` untuk Prisma)
   - `POSTGRES_PRISMA_URL`
   - `POSTGRES_URL_NON_POOLING`
   - Dan beberapa variabel kredensial lainnya.
8. Ini adalah cara tercepat karena Anda tidak perlu mendaftar ke layanan database eksternal.

### Opsi B: Menggunakan Neon Tech (Alternatif Eksternal)
1. Buka [Neon Tech](https://neon.tech/) dan daftarkan akun gratis.
2. Buat project baru dengan nama `norden-finance`.
3. Pilih region terdekat (misal: **Singapore** atau **Asia Pacific**).
4. Setelah project dibuat, Anda akan diberikan **Connection String** (Database URL). Contohnya:
   ```env
   postgres://username:password@ep-cool-flower-a1b2c3d4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require
   ```
5. Simpan URL ini. Ini akan digunakan sebagai `DATABASE_URL` Anda di Vercel.

### Opsi C: Menggunakan Supabase
1. Buka [Supabase](https://supabase.com/) dan daftarkan akun gratis.
2. Buat project baru dengan nama `norden-finance` dan tentukan database password Anda. Region pilih **Singapore**.
3. Pergi ke **Project Settings** > **Database** di sidebar kiri.
4. Scroll ke bawah ke bagian **Connection String** dan pilih tab **URI** atau **Prisma**. Salin URL-nya. Contoh:
   ```env
   postgresql://postgres.your-project-id:password@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=1
   ```
5. Simpan URL ini untuk digunakan sebagai `DATABASE_URL`.

---

## 🛠️ Langkah 2: Setup Firebase (Authentication & Storage)

Aplikasi ini menggunakan Firebase Authentication untuk login dan Firebase Storage untuk mengunggah struk/bukti transfer.

### 2.1 Buat Project Firebase
1. Buka [Firebase Console](https://console.firebase.google.com/) dan login dengan akun Google Anda.
2. Klik **Add project**, beri nama `norden-finance`, lalu ikuti langkah berikutnya. Anda bisa menonaktifkan Google Analytics jika tidak ingin ribet, atau aktifkan (gratis).
3. Setelah project dibuat, buat **Web App** baru di dalam dashboard Firebase:
   - Klik ikon **Web (`</>`)** di halaman utama project.
   - Beri nama aplikasi (misal: `norden-web`), lalu klik **Register app**.
   - Firebase akan menampilkan konfigurasi SDK berupa kode JSON. Salin nilai-nilai tersebut karena ini akan menjadi environment variables client-side Anda:
     - `apiKey` ➔ `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `authDomain` ➔ `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `projectId` ➔ `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `storageBucket` ➔ `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `messagingSenderId` ➔ `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `appId` ➔ `NEXT_PUBLIC_FIREBASE_APP_ID`
     - `measurementId` ➔ `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID`

### 2.2 Aktifkan Firebase Authentication
1. Di sidebar kiri Firebase, klik **Build** > **Authentication**.
2. Klik **Get Started**.
3. Di tab **Sign-in method**, pilih **Email/Password** dan aktifkan, lalu simpan.

### 2.3 Aktifkan Firebase Storage
1. Di sidebar kiri Firebase, klik **Build** > **Storage**.
2. Klik **Get Started**.
3. Pilih **Start in production mode** atau **test mode** (kita akan set rules-nya nanti).
4. Pilih lokasi bucket terdekat (misal: `asia-southeast2` untuk Jakarta/Singapore jika tersedia, atau biarkan default).
5. Setelah terbuat, pergi ke tab **Rules** dan ganti isinya dengan aturan berikut agar aman dan bisa diakses oleh user terotentikasi:
   ```javascript
   rules_version = '2';
   service firebase.storage {
     match /b/{bucket}/o {
       match /{allPaths=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```
6. Klik **Publish**.

### 2.4 Dapatkan Service Account Key (Firebase Admin SDK)
Ini diperlukan agar server Next.js Anda dapat memverifikasi session cookie secara aman.
1. Di Firebase Console, klik ikon roda gigi di dekat **Project Overview** di pojok kiri atas, lalu pilih **Project settings**.
2. Pilih tab **Service accounts** di bagian atas.
3. Klik **Generate new private key**, lalu konfirmasi dengan klik **Generate key**.
4. Sebuah file `.json` akan otomatis terunduh ke komputer Anda. Buka file JSON tersebut dengan text editor.
5. Catat nilai dari JSON tersebut untuk environment variables berikut:
   - `"project_id"` ➔ `FIREBASE_ADMIN_PROJECT_ID`
   - `"client_email"` ➔ `FIREBASE_ADMIN_CLIENT_EMAIL`
   - `"private_key"` ➔ `FIREBASE_ADMIN_PRIVATE_KEY` (salin seluruh string privat key dari `-----BEGIN PRIVATE KEY-----\n...` sampai `\n-----END PRIVATE KEY-----\n`). 
   > [!NOTE]
   > Saat memasukkan `FIREBASE_ADMIN_PRIVATE_KEY` ke Vercel, pastikan karakter `\n` tetap ada karena kode backend kita telah dikonfigurasi untuk menangani format tersebut dengan `.replace(/\\n/g, '\n')`.

---

## 🛠️ Langkah 3: Dapatkan Gemini API Key Gratis

Gemini AI digunakan untuk fitur **Smart Input** (capture transaksi lewat bahasa natural) dan **Receipt Scanner** (Scan struk belanja).
1. Buka [Google AI Studio](https://aistudio.google.com/).
2. Login menggunakan akun Google Anda.
3. Klik tombol **Get API Key** atau **Create API Key**.
4. Klik **Create API Key in new project**.
5. Salin API Key yang dihasilkan. Ini akan digunakan sebagai `GEMINI_API_KEY` di Vercel.

---

## 🛠️ Langkah 4: Hubungkan ke GitHub & Deploy ke Vercel

### 4.1 Push Code ke GitHub (Jika Belum)
Pastikan kode Anda sudah berada di repositori GitHub pribadi Anda.
```bash
git init
git add .
git commit -m "prep for vercel deployment"
git remote add origin https://github.com/USERNAME/REPO-NAME.git
git branch -M main
git push -u origin main
```

### 4.2 Deploy ke Vercel
1. Buka [Vercel](https://vercel.com/) dan login dengan akun GitHub Anda.
2. Klik tombol **Add New...** > **Project**.
3. Cari repositori Anda dan klik **Import**.
4. Di bagian **Configure Project**:
   - **Framework Preset**: Pilih **Next.js**.
   - **Root Directory**: `./` (default).
   - Di bagian **Environment Variables**, masukkan semua variabel berikut satu per satu:

| Variable Name | Value | Keterangan |
|---|---|---|
| `DATABASE_URL` | *URL dari Langkah 1* | Connection String PostgreSQL |
| `POSTGRES_URL` | *URL dari Langkah 1* | Connection String PostgreSQL |
| `PRISMA_DATABASE_URL` | *URL dari Langkah 1* | Connection String PostgreSQL |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | *Dari Firebase Web App* | Firebase Client API Key |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | *Dari Firebase Web App* | `project-id.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | *Dari Firebase Web App* | ID project Firebase Anda |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | *Dari Firebase Web App* | `project-id.firebasestorage.app` |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`| *Dari Firebase Web App* | Angka ID pengirim pesan |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | *Dari Firebase Web App* | App ID format `1:xxx:web:xxx` |
| `NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID` | *Dari Firebase Web App* | G-XXXXXX (opsional) |
| `FIREBASE_ADMIN_PROJECT_ID` | *Dari Service Account JSON* | Project ID dari Firebase Admin |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | *Dari Service Account JSON* | Email Client Firebase Admin |
| `FIREBASE_ADMIN_PRIVATE_KEY` | *Dari Service Account JSON* | Key lengkap dengan tanda kutip & `\n` |
| `GEMINI_API_KEY` | *Dari Langkah 3* | API Key Google Gemini |
| `NEXT_PUBLIC_APP_URL` | `https://nama-app-anda.vercel.app` | URL domain Vercel Anda |

5. Klik tombol **Deploy**. Vercel akan otomatis melakukan build proyek dan menyiapkan link live URL.

---

## 🛠️ Langkah 5: Migrasi Database ke Database Live (Production)

Setelah Vercel berhasil dideploy, Anda harus memigrasikan skema database Prisma Anda ke database live yang baru dibuat di Neon/Supabase.

1. Buka file `.env.local` (atau `.env`) di komputer Anda secara lokal.
2. Ganti `DATABASE_URL` sementara dengan URL Database live dari Neon/Supabase yang Anda dapatkan di Langkah 1.
3. Jalankan perintah migrasi ini di terminal komputer lokal Anda:
   ```bash
   npx prisma db push
   ```
   *Perintah ini akan membuat semua tabel database yang dibutuhkan langsung pada database cloud Anda.*
4. Kembalikan lagi `DATABASE_URL` di file `.env.local` Anda ke URL database lokal/dev jika Anda ingin melanjutkan development lokal.

---

## 🎉 Selesai!
Aplikasi Anda kini sudah terpasang secara online di Vercel secara gratis dan terintegrasi dengan Firebase, PostgreSQL Cloud, serta Gemini AI. Setiap kali Anda melakukan `git push` ke branch `main`, Vercel akan otomatis melakukan deploy ulang versi terbaru aplikasi Anda.
