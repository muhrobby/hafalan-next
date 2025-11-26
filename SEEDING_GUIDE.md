# Panduan Database Seeding

## 🌱 Apa Itu Seeding?
Seeding adalah proses mengisi database dengan data awal (sample/demo) untuk keperluan testing dan development.

## 📊 Data Yang Di-Seed

### 1. KACA (Qur'an Pages)
- 20 halaman dari Juz 1-2 
- Mencakup Surah Al-Fatihah dan Al-Baqarah
- Setiap kaca memiliki informasi: nomor halaman, surah, ayat start-end, juz, deskripsi

### 2. USERS (Test Accounts)
Empat akun demo dengan peran berbeda:

| No | Email | Role | Password | Peran |
|----|-------|------|----------|-------|
| 1 | admin@hafalan.com | ADMIN | admin123 | Administrator |
| 2 | teacher@hafalan.com | TEACHER | teacher123 | Ustadz/Guru |
| 3 | wali@hafalan.com | WALI | wali123 | Wali/Orang Tua |
| 4 | santri@hafalan.com | SANTRI | santri123 | Siswa/Santri |

---

## 🚀 Cara Menjalankan Seeding

### Opsi 1: Menggunakan Script Automated
```bash
cd /home/robby/stacks/stg/hafalan

# Lihat file seed
cat prisma/seed.ts

# Jalankan seed
podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"
```

### Opsi 2: Menggunakan Package Script
```bash
# (Jika tsx sudah di-install di container)
podman exec hafalan-stg-app npm run db:seed
```

---

## 📋 Memverifikasi Data

### Cek Jumlah Users
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT COUNT(*) FROM users;"
```

### Cek Semua Users
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT email, role, name FROM users;"
```

### Cek Jumlah Kaca
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT COUNT(*) FROM kaca;"
```

### Cek Detail Kaca
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT page_number, surah_name, juz FROM kaca LIMIT 5;"
```

---

## ⚙️ Cara Menambah Data Seed

### 1. Edit File `prisma/seed.ts`

Contoh menambah user baru:
```typescript
// Di dalam seedUsers() function
const newUser = await prisma.user.create({
  data: {
    email: 'newuser@hafalan.com',
    name: 'New User Name',
    password: '$2b$12$...hashed_password...', // Gunakan bcryptjs untuk hash
    role: 'SANTRI'
  }
})
```

### 2. Cara Generate Password Hash

```bash
# Akses container
podman exec -it hafalan-stg-app sh

# Gunakan node
node

# Paste code ini:
const bcryptjs = require('bcryptjs');
const password = 'your_password_here';
const hashed = bcryptjs.hashSync(password, 12);
console.log(hashed);

# Copy hasil hash ke seed file
exit()
exit
```

### 3. Jalankan Seed Lagi
```bash
podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"
```

---

## 🔄 Reset Database & Re-Seed

### Opsi 1: Reset Migrations (Hapus Semua Data)
```bash
# ⚠️ HATI-HATI: Ini akan menghapus SEMUA data!
podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate reset --force

# Akan otomatis menjalankan semua migrations dan seed
```

### Opsi 2: Manual Reset
```bash
# 1. Drop database
podman exec hafalan-stg-postgres psql -U hafalan -c "DROP DATABASE hafalan_stg;"

# 2. Create database baru
podman exec hafalan-stg-postgres psql -U hafalan -c "CREATE DATABASE hafalan_stg;"

# 3. Jalankan migrations
podman exec hafalan-stg-app npx --yes prisma@6.11.1 migrate deploy

# 4. Seed data
podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"
```

---

## 🧪 Testing Login

### Akses Aplikasi
```
https://hafalan-next.humahub.my.id
```

### Test Akun Demo
1. **Admin** - Lihat semua fitur & management
   - Email: `admin@hafalan.com`
   - Password: `admin123`

2. **Teacher** - Manage santri & hafalan tracking
   - Email: `teacher@hafalan.com`
   - Password: `teacher123`

3. **Wali** - Monitor santri (orang tua)
   - Email: `wali@hafalan.com`
   - Password: `wali123`

4. **Santri** - Learning interface
   - Email: `santri@hafalan.com`
   - Password: `santri123`

---

## 📝 Modifikasi Seed Data

### Menambah Kaca Baru
Edit `prisma/seed.ts`, di array `kacaData`, tambahkan:

```typescript
{
  pageNumber: 21,
  surahNumber: 2,
  surahName: "Al-Baqarah",
  ayatStart: 192,
  ayatEnd: 202,
  juz: 2,
  description: "Al-Baqarah 192-202"
}
```

### Menambah User Baru
Di dalam `seedUsers()`, tambahkan:

```typescript
const newUser = await prisma.user.create({
  data: {
    email: 'newtestuser@hafalan.com',
    name: 'Test User Baru',
    password: '$2b$12$...hash_password...', // Hash password dengan bcryptjs
    role: 'SANTRI'
  }
})
```

---

## 🐛 Troubleshooting

### Error: "table already exists"
**Solusi**: Database sudah punya data. Jalankan reset:
```bash
podman exec hafalan-stg-app sh -c "npx --yes prisma@6.11.1 migrate reset --force"
```

### Error: "tx: command not found"
**Solusi**: Gunakan npx tsx:
```bash
podman exec hafalan-stg-app sh -c "npx --yes tsx@4.20.3 prisma/seed.ts"
```

### Data tidak muncul setelah seed
**Solusi**: Verifikasi dengan query database:
```bash
podman exec hafalan-stg-postgres psql -U hafalan -d hafalan_stg -c "SELECT * FROM users;"
```

### Mau lihat struktur database?
```bash
# Akses PostgreSQL shell
podman-compose exec postgres psql -U hafalan -d hafalan_stg

# Di shell, coba command:
\dt                    # List all tables
\d users               # Describe table 'users'
\d kaca                # Describe table 'kaca'
SELECT * FROM users;   # Show all users
```

---

## 📚 Referensi Tambahan

- [Prisma Seeding Docs](https://www.prisma.io/docs/orm/prisma-migrate/workflows/seeding-your-database)
- [Bcryptjs Docs](https://github.com/dcodeIO/bcrypt.js)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)

---

**Selamat mencoba! 🎉**
