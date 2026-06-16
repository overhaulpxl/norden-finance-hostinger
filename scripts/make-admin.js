const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

const prisma = new PrismaClient();

async function main() {
  const emailOrName = process.argv[2];

  // Fetch all profiles
  const profiles = await prisma.profile.findMany();
  
  if (profiles.length === 0) {
    console.log('❌ Tidak ada profil pengguna di database. Silakan registrasi terlebih dahulu di aplikasi!');
    process.exit(0);
  }

  if (!emailOrName) {
    console.log('\n=== DAFTAR PENGGUNA DI DATABASE ===');
    profiles.forEach((p, idx) => {
      console.log(`[${idx + 1}] Nama: ${p.fullName || 'Tanpa Nama'} | UID: ${p.userId} | Role: ${p.role} | Plan: ${p.plan}`);
    });
    console.log('\nUntuk mengubah role pengguna menjadi ADMIN, jalankan perintah:');
    console.log('node scripts/make-admin.js "<Nama Pengguna atau UID>"');
    process.exit(0);
  }

  // Find profile by UID or match name
  const match = profiles.find(p => 
    p.userId === emailOrName || 
    (p.fullName && p.fullName.toLowerCase().includes(emailOrName.toLowerCase()))
  );

  if (!match) {
    console.log(`❌ Tidak menemukan profil dengan UID atau nama mencocokkan "${emailOrName}".`);
    console.log('Jalankan "node scripts/make-admin.js" tanpa argumen untuk melihat daftar pengguna.');
    process.exit(1);
  }

  // Toggle role
  const targetRole = match.role === 'admin' ? 'user' : 'admin';
  await prisma.profile.update({
    where: { id: match.id },
    data: { role: targetRole }
  });

  console.log(`\n✅ BERHASIL MEMPERBARUI ROLE!`);
  console.log(`Pengguna: ${match.fullName}`);
  console.log(`UID: ${match.userId}`);
  console.log(`Role Baru: ${targetRole.toUpperCase()}`);
  process.exit(0);
}

main()
  .catch(err => {
    console.error('Terjadi kesalahan:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
