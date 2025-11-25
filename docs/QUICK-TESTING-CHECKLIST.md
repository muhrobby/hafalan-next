# ✅ Quick Testing Checklist

## Aplikasi Manajemen Hafalan Al-Qur'an

---

## 🔴 CRITICAL (Harus Lulus 100%)

### Authentication

- [ ] Login dengan kredensial valid → redirect ke dashboard
- [ ] Login dengan kredensial salah → toast error
- [ ] Logout → redirect ke login, session clear
- [ ] Akses protected route tanpa login → redirect ke signin
- [ ] Akses route role lain → redirect ke unauthorized

### Input Hafalan (Teacher)

- [ ] Pilih santri → tampil progress
- [ ] Pilih halaman → tampil daftar ayat
- [ ] Centang ayat → warna berubah hijau
- [ ] Simpan → toast sukses, data tersimpan
- [ ] Semua ayat lancar → status jadi COMPLETE_WAITING_RECHECK

### Recheck Hafalan (Teacher)

- [ ] Daftar hafalan perlu recheck tampil
- [ ] Recheck semua lulus → status jadi RECHECK_PASSED
- [ ] Recheck ada gagal → status tetap, ayat gagal tercatat

### Data Integrity

- [ ] Hafalan record tersimpan dengan benar
- [ ] Recheck record tersimpan dengan benar
- [ ] History tracking berfungsi
- [ ] Status auto-update bekerja

---

## 🟡 HIGH PRIORITY

### Santri Lookup

- [ ] Search by nama berfungsi
- [ ] Search by NIS berfungsi
- [ ] Modal detail tampil lengkap
- [ ] Detail ayat (hijau/merah) tampil
- [ ] Double scroll di mobile berfungsi
- [ ] Tab switch (Daftar/Tabel) berfungsi

### Raport

- [ ] Filter tanggal preset berfungsi
- [ ] Custom date range berfungsi
- [ ] Statistics card tampil
- [ ] Chart/graph ter-render

### Santri Dashboard

- [ ] Dashboard tampil
- [ ] Progress hafalan tampil
- [ ] Riwayat hafalan tampil
- [ ] Profil tampil

### Responsiveness

- [ ] Mobile view (375px) - semua halaman
- [ ] Tablet view (768px) - semua halaman
- [ ] Desktop view (1920px) - semua halaman
- [ ] Modal responsive

---

## 🟢 MEDIUM PRIORITY

### Admin Features

- [ ] Manajemen user (CRUD)
- [ ] Filter & search user
- [ ] Admin santri lookup
- [ ] Analytics
- [ ] Settings

### Wali Dashboard

- [ ] Dashboard tampil
- [ ] Daftar anak tampil
- [ ] Progress anak tampil
- [ ] Laporan tampil

---

## 🧪 TEST ACCOUNTS

| Role    | Email            | Password    |
| ------- | ---------------- | ----------- |
| Admin   | admin@test.com   | password123 |
| Teacher | teacher@test.com | password123 |
| Santri  | santri@test.com  | password123 |
| Wali    | wali@test.com    | password123 |

---

## 🚀 DEMO FLOW (Recommended)

### Flow 1: Admin Journey (5 menit)

1. Login sebagai Admin
2. Tunjukkan dashboard admin
3. Buka Manajemen User → Tambah user baru
4. Buka Cek Progress Santri → Cari santri → Lihat detail

### Flow 2: Teacher Journey (10 menit)

1. Login sebagai Teacher
2. Tunjukkan dashboard teacher
3. Input Hafalan:
   - Pilih santri
   - Pilih halaman
   - Centang beberapa ayat
   - Simpan
4. Recheck Hafalan:
   - Lihat daftar perlu recheck
   - Proses recheck
5. Cek Progress Santri:
   - Search santri
   - Lihat detail modal
   - Tunjukkan detail ayat
6. Raport:
   - Tunjukkan filter tanggal
   - Lihat statistics

### Flow 3: Santri Journey (3 menit)

1. Login sebagai Santri
2. Tunjukkan dashboard santri
3. Lihat progress hafalan
4. Lihat riwayat

### Flow 4: Wali Journey (2 menit)

1. Login sebagai Wali
2. Tunjukkan dashboard wali
3. Lihat progress anak

---

## ⚠️ KNOWN ISSUES / LIMITATIONS

> Tambahkan di sini jika ada issue yang sudah diketahui

1. ***
2. ***
3. ***

---

## 📝 NOTES SAAT TESTING

| Waktu | Halaman | Issue | Severity |
| ----- | ------- | ----- | -------- |
|       |         |       |          |
|       |         |       |          |
|       |         |       |          |

---

**Last Updated:** 25 November 2025
