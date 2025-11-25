# 📖 Hafalan Next - Sistem Manajemen Hafalan Al-Quran

<p align="center">
  <img src="public/logo.svg" alt="Hafalan Next Logo" width="120" height="120">
</p>

<p align="center">
  <strong>Sistem informasi manajemen hafalan Al-Quran berbasis web modern</strong>
</p>

<p align="center">
  <a href="#fitur">Fitur</a> •
  <a href="#teknologi">Teknologi</a> •
  <a href="#instalasi">Instalasi</a> •
  <a href="#penggunaan">Penggunaan</a> •
  <a href="#role-pengguna">Role Pengguna</a> •
  <a href="#api-reference">API</a>
</p>

---

## 🌟 Tentang Project

**Hafalan Next** adalah sistem manajemen hafalan Al-Quran yang dirancang untuk memudahkan pencatatan, pemantauan, dan evaluasi progress hafalan santri di lingkungan pesantren atau lembaga tahfidz. Sistem ini mendukung multi-role dengan fitur lengkap untuk Admin, Guru/Ustadz, Santri, dan Wali santri.

## ✨ Fitur

### 👨‍💼 Admin
- ✅ Dashboard overview statistik sistem
- ✅ Manajemen pengguna (CRUD semua role)
- ✅ Manajemen data santri & guru
- ✅ Assign guru ke santri
- ✅ Assign wali ke santri
- ✅ Manajemen data hafalan
- ✅ Santri lookup dengan filter lengkap
- ✅ Analytics & reporting
- ✅ Pengaturan sistem

### 👨‍🏫 Guru/Ustadz (Teacher)
- ✅ Dashboard statistik hafalan santri bimbingan
- ✅ Input hafalan santri (per kaca/halaman)
- ✅ Recheck/muraja'ah hafalan
- ✅ Generate raport hafalan dengan filter tanggal
- ✅ Lihat daftar santri bimbingan
- ✅ Santri lookup dengan detail progress

### 👨‍🎓 Santri
- ✅ Dashboard progress hafalan pribadi
- ✅ Riwayat hafalan lengkap
- ✅ Statistik & grafik progress
- ✅ Profil santri

### 👨‍👩‍👧 Wali Santri
- ✅ Dashboard monitoring anak
- ✅ Lihat progress hafalan anak
- ✅ Detail riwayat hafalan
- ✅ Download laporan hafalan

## 🛠️ Teknologi

| Kategori | Teknologi |
|----------|-----------|
| **Framework** | [Next.js 15](https://nextjs.org/) (App Router) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) |
| **UI Components** | [shadcn/ui](https://ui.shadcn.com/) |
| **Database** | [SQLite](https://www.sqlite.org/) via Prisma |
| **ORM** | [Prisma](https://www.prisma.io/) |
| **Authentication** | [NextAuth.js](https://next-auth.js.org/) |
| **Charts** | [Recharts](https://recharts.org/) |
| **Icons** | [Lucide React](https://lucide.dev/) |

## 📦 Instalasi

### Prerequisites

- Node.js 18+ 
- npm atau yarn atau pnpm

### Langkah Instalasi

1. **Clone repository**
   ```bash
   git clone https://github.com/muhrobby/hafalan-next.git
   cd hafalan-next
   ```

2. **Install dependencies**
   ```bash
   npm install
   # atau
   yarn install
   # atau
   pnpm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env`:
   ```env
   DATABASE_URL="file:./db/custom.db"
   NEXTAUTH_SECRET="your-secret-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npx prisma generate
   
   # Run migrations
   npx prisma migrate dev
   
   # Seed data awal (opsional)
   npx prisma db seed
   ```

5. **Jalankan development server**
   ```bash
   npm run dev
   ```

6. **Buka browser**
   ```
   http://localhost:3000
   ```

## 🔐 Akun Default (Setelah Seeding)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@example.com | password123 |
| Teacher | teacher@example.com | password123 |
| Santri | santri@example.com | password123 |
| Wali | wali@example.com | password123 |

> ⚠️ **Penting:** Ganti password default setelah login pertama kali!

## 👥 Role Pengguna

### 🔴 ADMIN
Memiliki akses penuh ke seluruh sistem:
- `/admin` - Dashboard admin
- `/admin/users` - Manajemen pengguna
- `/admin/santri` - Manajemen santri
- `/admin/guru` - Manajemen guru
- `/admin/hafalan` - Manajemen hafalan
- `/admin/analytics` - Analytics
- `/admin/settings` - Pengaturan

### 🟢 TEACHER
Guru/Ustadz yang membimbing santri:
- `/teacher` - Dashboard guru
- `/teacher/santri` - Daftar santri bimbingan
- `/teacher/hafalan/input` - Input hafalan
- `/teacher/hafalan/recheck` - Recheck hafalan
- `/teacher/raport` - Generate raport

### 🔵 SANTRI
Pelajar yang menghafal Al-Quran:
- `/santri` - Dashboard santri
- `/santri/hafalan` - Riwayat hafalan
- `/santri/progress` - Progress & statistik
- `/santri/profile` - Profil

### 🟡 WALI
Orang tua/wali santri:
- `/wali` - Dashboard wali
- `/wali/children` - Daftar anak
- `/wali/progress` - Progress anak
- `/wali/reports` - Laporan hafalan

## 🔒 Keamanan

Sistem ini mengimplementasikan **multi-layer security**:

1. **Middleware Protection** - Route-level protection
2. **useRoleGuard Hook** - Client-side role validation
3. **API Authorization** - Server-side role checking dengan `requireRole()`

```typescript
// Contoh penggunaan useRoleGuard
const { session, isLoading, isAuthorized } = useRoleGuard({ 
  allowedRoles: ["ADMIN"] 
});
```

## 📚 API Reference

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signin` | Login |
| POST | `/api/auth/signout` | Logout |
| GET | `/api/auth/session` | Get session |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users` | List users (filtered) |
| POST | `/api/users` | Create user |
| GET | `/api/users/[id]` | Get user detail |
| PUT | `/api/users/[id]` | Update user |
| DELETE | `/api/users/[id]` | Delete user |

### Hafalan
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/hafalan` | List hafalan records |
| POST | `/api/hafalan` | Create hafalan |
| GET | `/api/hafalan/[id]` | Get hafalan detail |
| PUT | `/api/hafalan/[id]` | Update hafalan |
| DELETE | `/api/hafalan/[id]` | Delete hafalan |

### Kaca (Halaman)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/kaca` | List kaca records |
| POST | `/api/kaca` | Create kaca |
| PUT | `/api/kaca/[id]` | Update kaca status |

## 📁 Struktur Project

```
hafalan-next/
├── prisma/
│   ├── schema.prisma      # Database schema
│   ├── migrations/        # Database migrations
│   └── seed.ts            # Seed data
├── public/
│   └── logo.svg           # App logo
├── src/
│   ├── app/
│   │   ├── admin/         # Admin pages
│   │   ├── teacher/       # Teacher pages
│   │   ├── santri/        # Santri pages
│   │   ├── wali/          # Wali pages
│   │   ├── api/           # API routes
│   │   ├── auth/          # Auth pages
│   │   └── unauthorized/  # 403 page
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   └── *.tsx          # Custom components
│   ├── hooks/
│   │   ├── use-role-guard.ts  # Authorization hook
│   │   └── *.ts           # Custom hooks
│   ├── lib/
│   │   ├── auth.ts        # NextAuth config
│   │   ├── db.ts          # Prisma client
│   │   └── utils.ts       # Utilities
│   └── types/
│       └── next-auth.d.ts # Type definitions
├── docs/
│   ├── UAT-BLACKBOX-TESTING.md
│   ├── UAT-TEST-CASES.csv
│   └── QUICK-TESTING-CHECKLIST.md
├── middleware.ts          # Route protection
└── package.json
```

## 🧪 Testing

Dokumentasi testing tersedia di folder `docs/`:
- `UAT-BLACKBOX-TESTING.md` - Panduan UAT lengkap
- `UAT-TEST-CASES.csv` - Test cases dalam format CSV
- `QUICK-TESTING-CHECKLIST.md` - Checklist testing cepat

## 🚀 Deployment

### Vercel (Recommended)
```bash
npm i -g vercel
vercel
```

### Docker
```bash
docker build -t hafalan-next .
docker run -p 3000:3000 hafalan-next
```

## 📝 Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open Prisma Studio |
| `npx prisma db push` | Push schema to database |
| `npx prisma migrate dev` | Run migrations |

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Contact

Muhammad Robby - [@muhrobby](https://github.com/muhrobby)

Project Link: [https://github.com/muhrobby/hafalan-next](https://github.com/muhrobby/hafalan-next)

---

<p align="center">
  Made with ❤️ for Pondok Pesantren & Lembaga Tahfidz
</p>
