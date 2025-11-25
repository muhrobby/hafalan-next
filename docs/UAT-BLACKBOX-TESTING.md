# 📋 Dokumen UAT & Blackbox Testing

## Aplikasi Manajemen Hafalan Al-Qur'an

---

## 📌 Informasi Dokumen

| Item                | Detail                                              |
| ------------------- | --------------------------------------------------- |
| **Nama Aplikasi**   | Sistem Manajemen Hafalan Al-Qur'an                  |
| **Versi**           | 1.0.0                                               |
| **Tanggal Dokumen** | 25 November 2025                                    |
| **Tujuan**          | UAT & Blackbox Testing sebelum presentasi ke vendor |

---

## 🎯 Scope Testing

### Role yang Diuji:

1. **ADMIN** - Pengelola sistem
2. **TEACHER** - Guru pembimbing hafalan
3. **SANTRI** - Siswa penghafal
4. **WALI** - Orang tua/wali santri

### Modul yang Diuji:

- Authentication & Authorization
- Dashboard per Role
- Manajemen User (Admin)
- Input & Tracking Hafalan (Teacher)
- Recheck Hafalan (Teacher)
- Raport & Analytics
- Santri Lookup
- Progress Monitoring

---

## 🔐 MODUL 1: AUTHENTICATION & AUTHORIZATION

### TC-AUTH-001: Login dengan Kredensial Valid

| Item                | Detail                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-001                                                                                                 |
| **Tujuan**          | Memastikan user dapat login dengan email dan password yang valid                                            |
| **Pre-condition**   | User sudah terdaftar di database                                                                            |
| **Test Steps**      | 1. Buka halaman `/auth/signin`<br>2. Input email valid<br>3. Input password valid<br>4. Klik tombol "Login" |
| **Test Data**       | Email: `admin@test.com`, Password: `password123`                                                            |
| **Expected Result** | ✅ User berhasil login dan redirect ke dashboard sesuai role                                                |
| **Status**          | ⬜ Belum Diuji                                                                                              |

### TC-AUTH-002: Login dengan Kredensial Invalid

| Item                | Detail                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-002                                                                                                 |
| **Tujuan**          | Memastikan sistem menolak login dengan kredensial salah                                                     |
| **Pre-condition**   | -                                                                                                           |
| **Test Steps**      | 1. Buka halaman `/auth/signin`<br>2. Input email salah<br>3. Input password salah<br>4. Klik tombol "Login" |
| **Test Data**       | Email: `wrong@test.com`, Password: `wrongpassword`                                                          |
| **Expected Result** | ❌ Muncul toast error "Email atau password salah"                                                           |
| **Status**          | ⬜ Belum Diuji                                                                                              |

### TC-AUTH-003: Login dengan Field Kosong

| Item                | Detail                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-003                                                                                  |
| **Tujuan**          | Memastikan validasi field kosong berjalan                                                    |
| **Pre-condition**   | -                                                                                            |
| **Test Steps**      | 1. Buka halaman `/auth/signin`<br>2. Kosongkan email atau password<br>3. Klik tombol "Login" |
| **Test Data**       | Email: `(kosong)`, Password: `(kosong)`                                                      |
| **Expected Result** | ❌ Form validation error muncul                                                              |
| **Status**          | ⬜ Belum Diuji                                                                               |

### TC-AUTH-004: Logout

| Item                | Detail                                                               |
| ------------------- | -------------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-004                                                          |
| **Tujuan**          | Memastikan user dapat logout dengan benar                            |
| **Pre-condition**   | User sudah login                                                     |
| **Test Steps**      | 1. Klik avatar/menu user<br>2. Klik tombol "Keluar"                  |
| **Test Data**       | -                                                                    |
| **Expected Result** | ✅ User berhasil logout, redirect ke halaman login, session terhapus |
| **Status**          | ⬜ Belum Diuji                                                       |

### TC-AUTH-005: Akses Halaman Tanpa Login

| Item                | Detail                                                         |
| ------------------- | -------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-005                                                    |
| **Tujuan**          | Memastikan protected route tidak bisa diakses tanpa login      |
| **Pre-condition**   | User tidak login (session kosong)                              |
| **Test Steps**      | 1. Langsung akses URL `/admin`, `/teacher`, `/santri`, `/wali` |
| **Test Data**       | -                                                              |
| **Expected Result** | ❌ Redirect ke halaman `/auth/signin`                          |
| **Status**          | ⬜ Belum Diuji                                                 |

### TC-AUTH-006: Akses Halaman Role Lain

| Item                | Detail                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Test ID**         | TC-AUTH-006                                                     |
| **Tujuan**          | Memastikan user tidak bisa akses halaman role lain              |
| **Pre-condition**   | Login sebagai TEACHER                                           |
| **Test Steps**      | 1. Login sebagai Teacher<br>2. Coba akses URL `/admin` langsung |
| **Test Data**       | -                                                               |
| **Expected Result** | ❌ Redirect ke `/unauthorized` atau halaman error               |
| **Status**          | ⬜ Belum Diuji                                                  |

---

## 👤 MODUL 2: ADMIN - MANAJEMEN USER

### TC-ADMIN-001: Lihat Daftar User

| Item                | Detail                                                              |
| ------------------- | ------------------------------------------------------------------- |
| **Test ID**         | TC-ADMIN-001                                                        |
| **Tujuan**          | Memastikan admin dapat melihat daftar semua user                    |
| **Pre-condition**   | Login sebagai ADMIN                                                 |
| **Test Steps**      | 1. Login sebagai Admin<br>2. Klik menu "Manajemen User"             |
| **Test Data**       | -                                                                   |
| **Expected Result** | ✅ Tampil tabel daftar user dengan kolom: Nama, Email, Role, Status |
| **Status**          | ⬜ Belum Diuji                                                      |

### TC-ADMIN-002: Tambah User Baru

| Item                | Detail                                                                                       |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-ADMIN-002                                                                                 |
| **Tujuan**          | Memastikan admin dapat menambah user baru                                                    |
| **Pre-condition**   | Login sebagai ADMIN, berada di halaman Manajemen User                                        |
| **Test Steps**      | 1. Klik tombol "Tambah User"<br>2. Isi form: Nama, Email, Password, Role<br>3. Klik "Simpan" |
| **Test Data**       | Nama: `Test User`, Email: `testuser@test.com`, Password: `password123`, Role: `TEACHER`      |
| **Expected Result** | ✅ User baru tersimpan, muncul di tabel, toast sukses                                        |
| **Status**          | ⬜ Belum Diuji                                                                               |

### TC-ADMIN-003: Edit User

| Item                | Detail                                                                            |
| ------------------- | --------------------------------------------------------------------------------- |
| **Test ID**         | TC-ADMIN-003                                                                      |
| **Tujuan**          | Memastikan admin dapat mengedit data user                                         |
| **Pre-condition**   | Login sebagai ADMIN, ada user di database                                         |
| **Test Steps**      | 1. Klik tombol "Edit" pada user<br>2. Ubah data (misal: nama)<br>3. Klik "Simpan" |
| **Test Data**       | Nama baru: `Updated User`                                                         |
| **Expected Result** | ✅ Data user terupdate, toast sukses                                              |
| **Status**          | ⬜ Belum Diuji                                                                    |

### TC-ADMIN-004: Hapus User

| Item                | Detail                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Test ID**         | TC-ADMIN-004                                                    |
| **Tujuan**          | Memastikan admin dapat menghapus user                           |
| **Pre-condition**   | Login sebagai ADMIN, ada user yang bisa dihapus                 |
| **Test Steps**      | 1. Klik tombol "Hapus" pada user<br>2. Konfirmasi penghapusan   |
| **Test Data**       | -                                                               |
| **Expected Result** | ✅ User terhapus dari database, hilang dari tabel, toast sukses |
| **Status**          | ⬜ Belum Diuji                                                  |

### TC-ADMIN-005: Filter User by Role

| Item                | Detail                                                     |
| ------------------- | ---------------------------------------------------------- |
| **Test ID**         | TC-ADMIN-005                                               |
| **Tujuan**          | Memastikan filter role berfungsi                           |
| **Pre-condition**   | Login sebagai ADMIN, ada beberapa user dengan role berbeda |
| **Test Steps**      | 1. Pilih filter "TEACHER"<br>2. Lihat hasil filter         |
| **Test Data**       | -                                                          |
| **Expected Result** | ✅ Hanya user dengan role TEACHER yang tampil              |
| **Status**          | ⬜ Belum Diuji                                             |

### TC-ADMIN-006: Search User

| Item                | Detail                                                             |
| ------------------- | ------------------------------------------------------------------ |
| **Test ID**         | TC-ADMIN-006                                                       |
| **Tujuan**          | Memastikan pencarian user berfungsi                                |
| **Pre-condition**   | Login sebagai ADMIN                                                |
| **Test Steps**      | 1. Ketik nama/email user di search box<br>2. Lihat hasil pencarian |
| **Test Data**       | Search: `ahmad`                                                    |
| **Expected Result** | ✅ Tampil user yang mengandung kata "ahmad" di nama/email          |
| **Status**          | ⬜ Belum Diuji                                                     |

---

## 👨‍🏫 MODUL 3: TEACHER - INPUT HAFALAN

### TC-TEACH-001: Akses Halaman Input Hafalan

| Item                | Detail                                                   |
| ------------------- | -------------------------------------------------------- |
| **Test ID**         | TC-TEACH-001                                             |
| **Tujuan**          | Memastikan halaman input hafalan dapat diakses           |
| **Pre-condition**   | Login sebagai TEACHER                                    |
| **Test Steps**      | 1. Login sebagai Teacher<br>2. Klik menu "Input Hafalan" |
| **Test Data**       | -                                                        |
| **Expected Result** | ✅ Halaman input hafalan tampil dengan form pilih santri |
| **Status**          | ⬜ Belum Diuji                                           |

### TC-TEACH-002: Pilih Santri untuk Input Hafalan

| Item                | Detail                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Test ID**         | TC-TEACH-002                                                    |
| **Tujuan**          | Memastikan guru dapat memilih santri yang dibimbingnya          |
| **Pre-condition**   | Login sebagai TEACHER, ada santri yang di-assign ke teacher ini |
| **Test Steps**      | 1. Klik dropdown "Pilih Santri"<br>2. Pilih salah satu santri   |
| **Test Data**       | -                                                               |
| **Expected Result** | ✅ Santri terpilih, progress hafalan santri tersebut tampil     |
| **Status**          | ⬜ Belum Diuji                                                  |

### TC-TEACH-003: Input Hafalan - Pilih Halaman (Kaca)

| Item                | Detail                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| **Test ID**         | TC-TEACH-003                                                              |
| **Tujuan**          | Memastikan guru dapat memilih halaman Al-Qur'an                           |
| **Pre-condition**   | Santri sudah dipilih                                                      |
| **Test Steps**      | 1. Klik dropdown "Pilih Halaman"<br>2. Pilih halaman yang akan dihafalkan |
| **Test Data**       | Halaman: 1 (Al-Fatihah)                                                   |
| **Expected Result** | ✅ Halaman terpilih, muncul daftar ayat dengan checkbox                   |
| **Status**          | ⬜ Belum Diuji                                                            |

### TC-TEACH-004: Input Hafalan - Centang Ayat Lancar

| Item                | Detail                                                                        |
| ------------------- | ----------------------------------------------------------------------------- |
| **Test ID**         | TC-TEACH-004                                                                  |
| **Tujuan**          | Memastikan guru dapat menandai ayat yang sudah lancar                         |
| **Pre-condition**   | Halaman sudah dipilih                                                         |
| **Test Steps**      | 1. Centang checkbox pada ayat yang sudah lancar<br>2. Atau klik ayat langsung |
| **Test Data**       | Ayat 1, 2, 3                                                                  |
| **Expected Result** | ✅ Ayat yang dicentang berubah warna (hijau), counter update                  |
| **Status**          | ⬜ Belum Diuji                                                                |

### TC-TEACH-005: Input Hafalan - Simpan Progress

| Item                | Detail                                               |
| ------------------- | ---------------------------------------------------- |
| **Test ID**         | TC-TEACH-005                                         |
| **Tujuan**          | Memastikan progress hafalan tersimpan                |
| **Pre-condition**   | Ada ayat yang sudah dicentang                        |
| **Test Steps**      | 1. Isi catatan (opsional)<br>2. Klik tombol "Simpan" |
| **Test Data**       | Catatan: "Lancar, perlu perbaikan tajwid"            |
| **Expected Result** | ✅ Data tersimpan, toast sukses, progress terupdate  |
| **Status**          | ⬜ Belum Diuji                                       |

### TC-TEACH-006: Input Hafalan - Semua Ayat Lancar (Auto Status Change)

| Item                | Detail                                                    |
| ------------------- | --------------------------------------------------------- |
| **Test ID**         | TC-TEACH-006                                              |
| **Tujuan**          | Memastikan status otomatis berubah jika semua ayat lancar |
| **Pre-condition**   | Halaman memiliki 7 ayat (misal Al-Fatihah)                |
| **Test Steps**      | 1. Centang semua 7 ayat<br>2. Simpan                      |
| **Test Data**       | Ayat 1-7                                                  |
| **Expected Result** | ✅ Status berubah menjadi "COMPLETE_WAITING_RECHECK"      |
| **Status**          | ⬜ Belum Diuji                                            |

### TC-TEACH-007: Edit Hafalan yang Sudah Ada

| Item                | Detail                                                                                                |
| ------------------- | ----------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-TEACH-007                                                                                          |
| **Tujuan**          | Memastikan guru dapat mengedit hafalan yang sudah diinput                                             |
| **Pre-condition**   | Ada hafalan record yang sudah tersimpan                                                               |
| **Test Steps**      | 1. Pilih santri<br>2. Pilih halaman yang sudah ada recordnya<br>3. Ubah ayat yang lancar<br>4. Simpan |
| **Test Data**       | -                                                                                                     |
| **Expected Result** | ✅ Data terupdate, history tercatat                                                                   |
| **Status**          | ⬜ Belum Diuji                                                                                        |

---

## 🔄 MODUL 4: TEACHER - RECHECK HAFALAN

### TC-RCHK-001: Akses Halaman Recheck

| Item                | Detail                                                               |
| ------------------- | -------------------------------------------------------------------- |
| **Test ID**         | TC-RCHK-001                                                          |
| **Tujuan**          | Memastikan halaman recheck dapat diakses                             |
| **Pre-condition**   | Login sebagai TEACHER                                                |
| **Test Steps**      | 1. Login sebagai Teacher<br>2. Klik menu "Recheck Hafalan"           |
| **Test Data**       | -                                                                    |
| **Expected Result** | ✅ Halaman recheck tampil dengan daftar hafalan yang perlu direcheck |
| **Status**          | ⬜ Belum Diuji                                                       |

### TC-RCHK-002: Lihat Daftar Hafalan Perlu Recheck

| Item                | Detail                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RCHK-002                                                                               |
| **Tujuan**          | Memastikan daftar hafalan dengan status COMPLETE_WAITING_RECHECK tampil                   |
| **Pre-condition**   | Ada hafalan dengan status COMPLETE_WAITING_RECHECK                                        |
| **Test Steps**      | 1. Lihat daftar di halaman recheck                                                        |
| **Test Data**       | -                                                                                         |
| **Expected Result** | ✅ Tampil daftar hafalan yang perlu direcheck dengan info: Santri, Halaman, Tanggal Setor |
| **Status**          | ⬜ Belum Diuji                                                                            |

### TC-RCHK-003: Proses Recheck - Semua Lulus

| Item                | Detail                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RCHK-003                                                                                              |
| **Tujuan**          | Memastikan recheck dengan hasil semua ayat lulus berfungsi                                               |
| **Pre-condition**   | Ada hafalan yang perlu direcheck                                                                         |
| **Test Steps**      | 1. Klik tombol "Recheck" pada hafalan<br>2. Centang semua ayat sebagai lulus<br>3. Klik "Simpan Recheck" |
| **Test Data**       | -                                                                                                        |
| **Expected Result** | ✅ Status berubah menjadi "RECHECK_PASSED", toast sukses                                                 |
| **Status**          | ⬜ Belum Diuji                                                                                           |

### TC-RCHK-004: Proses Recheck - Ada Ayat Gagal

| Item                | Detail                                                                                                          |
| ------------------- | --------------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RCHK-004                                                                                                     |
| **Tujuan**          | Memastikan recheck dengan ayat gagal berfungsi                                                                  |
| **Pre-condition**   | Ada hafalan yang perlu direcheck                                                                                |
| **Test Steps**      | 1. Klik tombol "Recheck"<br>2. Tandai beberapa ayat sebagai gagal<br>3. Isi catatan<br>4. Klik "Simpan Recheck" |
| **Test Data**       | Ayat gagal: 3, 5. Catatan: "Perlu ulang tajwid"                                                                 |
| **Expected Result** | ✅ Status tetap "COMPLETE_WAITING_RECHECK", ayat gagal dicatat, toast info                                      |
| **Status**          | ⬜ Belum Diuji                                                                                                  |

### TC-RCHK-005: Lihat Riwayat Recheck

| Item                | Detail                                                             |
| ------------------- | ------------------------------------------------------------------ |
| **Test ID**         | TC-RCHK-005                                                        |
| **Tujuan**          | Memastikan riwayat recheck dapat dilihat                           |
| **Pre-condition**   | Ada hafalan yang sudah pernah direcheck                            |
| **Test Steps**      | 1. Klik detail hafalan<br>2. Lihat bagian "Riwayat Recheck"        |
| **Test Data**       | -                                                                  |
| **Expected Result** | ✅ Tampil riwayat recheck: tanggal, guru perecheck, hasil, catatan |
| **Status**          | ⬜ Belum Diuji                                                     |

---

## 🔍 MODUL 5: TEACHER - CEK PROGRESS SANTRI (SANTRI LOOKUP)

### TC-LOOK-001: Akses Halaman Santri Lookup

| Item                | Detail                                                |
| ------------------- | ----------------------------------------------------- |
| **Test ID**         | TC-LOOK-001                                           |
| **Tujuan**          | Memastikan halaman santri lookup dapat diakses        |
| **Pre-condition**   | Login sebagai TEACHER                                 |
| **Test Steps**      | 1. Klik menu "Cek Progress Santri"                    |
| **Test Data**       | -                                                     |
| **Expected Result** | ✅ Halaman tampil dengan search box dan daftar santri |
| **Status**          | ⬜ Belum Diuji                                        |

### TC-LOOK-002: Search Santri by Nama

| Item                | Detail                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| **Test ID**         | TC-LOOK-002                                                            |
| **Tujuan**          | Memastikan pencarian santri berdasarkan nama berfungsi                 |
| **Pre-condition**   | Ada santri di database                                                 |
| **Test Steps**      | 1. Ketik nama santri di search box<br>2. Tunggu hasil (debounce 300ms) |
| **Test Data**       | Search: "Ahmad"                                                        |
| **Expected Result** | ✅ Tampil santri yang namanya mengandung "Ahmad"                       |
| **Status**          | ⬜ Belum Diuji                                                         |

### TC-LOOK-003: Search Santri by NIS

| Item                | Detail                                                |
| ------------------- | ----------------------------------------------------- |
| **Test ID**         | TC-LOOK-003                                           |
| **Tujuan**          | Memastikan pencarian santri berdasarkan NIS berfungsi |
| **Pre-condition**   | Ada santri dengan NIS                                 |
| **Test Steps**      | 1. Ketik NIS santri di search box                     |
| **Test Data**       | Search: "2024001"                                     |
| **Expected Result** | ✅ Tampil santri dengan NIS yang cocok                |
| **Status**          | ⬜ Belum Diuji                                        |

### TC-LOOK-004: Lihat Detail Progress Santri

| Item                | Detail                                                                                                     |
| ------------------- | ---------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-LOOK-004                                                                                                |
| **Tujuan**          | Memastikan modal detail progress tampil dengan benar                                                       |
| **Pre-condition**   | Ada hasil pencarian santri                                                                                 |
| **Test Steps**      | 1. Klik tombol "Detail" pada santri                                                                        |
| **Test Data**       | -                                                                                                          |
| **Expected Result** | ✅ Modal tampil dengan: Summary (Selesai, Progress, Recheck, Total), Info kaca berikutnya, Riwayat hafalan |
| **Status**          | ⬜ Belum Diuji                                                                                             |

### TC-LOOK-005: Lihat Detail Ayat dalam Modal

| Item                | Detail                                                      |
| ------------------- | ----------------------------------------------------------- |
| **Test ID**         | TC-LOOK-005                                                 |
| **Tujuan**          | Memastikan detail ayat (lancar/belum) tampil dengan benar   |
| **Pre-condition**   | Modal detail terbuka, ada hafalan record                    |
| **Test Steps**      | 1. Lihat bagian "Detail Ayat" di setiap record hafalan      |
| **Test Data**       | -                                                           |
| **Expected Result** | ✅ Tampil circle ayat: Hijau = Lancar, Merah = Belum Lancar |
| **Status**          | ⬜ Belum Diuji                                              |

### TC-LOOK-006: Scroll Modal di Mobile

| Item                | Detail                                                                                |
| ------------------- | ------------------------------------------------------------------------------------- |
| **Test ID**         | TC-LOOK-006                                                                           |
| **Tujuan**          | Memastikan modal bisa di-scroll di tampilan mobile                                    |
| **Pre-condition**   | Modal detail terbuka di device mobile                                                 |
| **Test Steps**      | 1. Scroll keseluruhan modal (outer scroll)<br>2. Scroll daftar hafalan (inner scroll) |
| **Test Data**       | -                                                                                     |
| **Expected Result** | ✅ Kedua scroll berfungsi dengan baik (double scroll)                                 |
| **Status**          | ⬜ Belum Diuji                                                                        |

### TC-LOOK-007: Switch Tab Daftar/Tabel

| Item                | Detail                                                  |
| ------------------- | ------------------------------------------------------- |
| **Test ID**         | TC-LOOK-007                                             |
| **Tujuan**          | Memastikan tab switch berfungsi                         |
| **Pre-condition**   | Modal detail terbuka                                    |
| **Test Steps**      | 1. Klik tab "Daftar"<br>2. Klik tab "Tabel"             |
| **Test Data**       | -                                                       |
| **Expected Result** | ✅ View berubah: Daftar (Card view), Tabel (Table view) |
| **Status**          | ⬜ Belum Diuji                                          |

---

## 📊 MODUL 6: TEACHER - RAPORT

### TC-RAPT-001: Akses Halaman Raport

| Item                | Detail                                                       |
| ------------------- | ------------------------------------------------------------ |
| **Test ID**         | TC-RAPT-001                                                  |
| **Tujuan**          | Memastikan halaman raport dapat diakses                      |
| **Pre-condition**   | Login sebagai TEACHER                                        |
| **Test Steps**      | 1. Klik menu "Raport Santri"                                 |
| **Test Data**       | -                                                            |
| **Expected Result** | ✅ Halaman raport tampil dengan analytics dan filter tanggal |
| **Status**          | ⬜ Belum Diuji                                               |

### TC-RAPT-002: Filter by Date Range Preset

| Item                | Detail                                                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RAPT-002                                                                                             |
| **Tujuan**          | Memastikan filter tanggal preset berfungsi                                                              |
| **Pre-condition**   | Berada di halaman raport                                                                                |
| **Test Steps**      | 1. Klik dropdown filter tanggal<br>2. Pilih "Hari Ini"<br>3. Pilih "Minggu Ini"<br>4. Pilih "Bulan Ini" |
| **Test Data**       | -                                                                                                       |
| **Expected Result** | ✅ Data ter-filter sesuai range yang dipilih, chart update                                              |
| **Status**          | ⬜ Belum Diuji                                                                                          |

### TC-RAPT-003: Filter by Custom Date Range

| Item                | Detail                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| **Test ID**         | TC-RAPT-003                                                                |
| **Tujuan**          | Memastikan filter custom date range berfungsi                              |
| **Pre-condition**   | Berada di halaman raport                                                   |
| **Test Steps**      | 1. Pilih "Custom Range"<br>2. Pilih tanggal awal<br>3. Pilih tanggal akhir |
| **Test Data**       | Start: 1 Nov 2025, End: 25 Nov 2025                                        |
| **Expected Result** | ✅ Data ter-filter sesuai range custom, chart update                       |
| **Status**          | ⬜ Belum Diuji                                                             |

### TC-RAPT-004: Lihat Summary Statistics

| Item                | Detail                                                          |
| ------------------- | --------------------------------------------------------------- |
| **Test ID**         | TC-RAPT-004                                                     |
| **Tujuan**          | Memastikan summary statistics ditampilkan dengan benar          |
| **Pre-condition**   | Berada di halaman raport                                        |
| **Test Steps**      | 1. Lihat card statistics di bagian atas                         |
| **Test Data**       | -                                                               |
| **Expected Result** | ✅ Tampil: Total Santri, Total Hafalan, Rata-rata Progress, dll |
| **Status**          | ⬜ Belum Diuji                                                  |

### TC-RAPT-005: Lihat Chart/Graph

| Item                | Detail                                      |
| ------------------- | ------------------------------------------- |
| **Test ID**         | TC-RAPT-005                                 |
| **Tujuan**          | Memastikan chart/grafik ditampilkan         |
| **Pre-condition**   | Berada di halaman raport                    |
| **Test Steps**      | 1. Lihat bagian chart                       |
| **Test Data**       | -                                           |
| **Expected Result** | ✅ Chart ter-render dengan data yang sesuai |
| **Status**          | ⬜ Belum Diuji                              |

---

## 👨‍🎓 MODUL 7: SANTRI DASHBOARD

### TC-SANT-001: Akses Dashboard Santri

| Item                | Detail                                                       |
| ------------------- | ------------------------------------------------------------ |
| **Test ID**         | TC-SANT-001                                                  |
| **Tujuan**          | Memastikan santri dapat mengakses dashboardnya               |
| **Pre-condition**   | Login sebagai SANTRI                                         |
| **Test Steps**      | 1. Login sebagai Santri<br>2. Otomatis redirect ke `/santri` |
| **Test Data**       | -                                                            |
| **Expected Result** | ✅ Dashboard santri tampil dengan progress hafalan           |
| **Status**          | ⬜ Belum Diuji                                               |

### TC-SANT-002: Lihat Progress Hafalan

| Item                | Detail                                                           |
| ------------------- | ---------------------------------------------------------------- |
| **Test ID**         | TC-SANT-002                                                      |
| **Tujuan**          | Memastikan santri dapat melihat progress hafalannya              |
| **Pre-condition**   | Login sebagai SANTRI                                             |
| **Test Steps**      | 1. Klik menu "Progress"<br>2. Lihat detail progress              |
| **Test Data**       | -                                                                |
| **Expected Result** | ✅ Tampil progress: halaman selesai, dalam proses, perlu recheck |
| **Status**          | ⬜ Belum Diuji                                                   |

### TC-SANT-003: Lihat Riwayat Hafalan

| Item                | Detail                                                  |
| ------------------- | ------------------------------------------------------- |
| **Test ID**         | TC-SANT-003                                             |
| **Tujuan**          | Memastikan santri dapat melihat riwayat hafalannya      |
| **Pre-condition**   | Login sebagai SANTRI, ada hafalan record                |
| **Test Steps**      | 1. Klik menu "Hafalan Saya"                             |
| **Test Data**       | -                                                       |
| **Expected Result** | ✅ Tampil riwayat: tanggal setor, halaman, status, guru |
| **Status**          | ⬜ Belum Diuji                                          |

### TC-SANT-004: Lihat Profil Santri

| Item                | Detail                                                 |
| ------------------- | ------------------------------------------------------ |
| **Test ID**         | TC-SANT-004                                            |
| **Tujuan**          | Memastikan santri dapat melihat profilnya              |
| **Pre-condition**   | Login sebagai SANTRI                                   |
| **Test Steps**      | 1. Klik menu "Profil"                                  |
| **Test Data**       | -                                                      |
| **Expected Result** | ✅ Tampil data profil: Nama, NIS, Guru Pembimbing, dll |
| **Status**          | ⬜ Belum Diuji                                         |

---

## 👨‍👩‍👧 MODUL 8: WALI DASHBOARD

### TC-WALI-001: Akses Dashboard Wali

| Item                | Detail                                                   |
| ------------------- | -------------------------------------------------------- |
| **Test ID**         | TC-WALI-001                                              |
| **Tujuan**          | Memastikan wali dapat mengakses dashboardnya             |
| **Pre-condition**   | Login sebagai WALI                                       |
| **Test Steps**      | 1. Login sebagai Wali<br>2. Otomatis redirect ke `/wali` |
| **Test Data**       | -                                                        |
| **Expected Result** | ✅ Dashboard wali tampil                                 |
| **Status**          | ⬜ Belum Diuji                                           |

### TC-WALI-002: Lihat Daftar Anak

| Item                | Detail                                               |
| ------------------- | ---------------------------------------------------- |
| **Test ID**         | TC-WALI-002                                          |
| **Tujuan**          | Memastikan wali dapat melihat daftar anaknya         |
| **Pre-condition**   | Login sebagai WALI, ada santri yang terhubung        |
| **Test Steps**      | 1. Klik menu "Anak Saya"                             |
| **Test Data**       | -                                                    |
| **Expected Result** | ✅ Tampil daftar anak yang terhubung dengan wali ini |
| **Status**          | ⬜ Belum Diuji                                       |

### TC-WALI-003: Lihat Progress Hafalan Anak

| Item                | Detail                                                               |
| ------------------- | -------------------------------------------------------------------- |
| **Test ID**         | TC-WALI-003                                                          |
| **Tujuan**          | Memastikan wali dapat melihat progress hafalan anaknya               |
| **Pre-condition**   | Login sebagai WALI, ada anak terhubung                               |
| **Test Steps**      | 1. Klik menu "Progress Hafalan"<br>2. Pilih anak (jika lebih dari 1) |
| **Test Data**       | -                                                                    |
| **Expected Result** | ✅ Tampil progress hafalan anak: halaman selesai, dalam proses       |
| **Status**          | ⬜ Belum Diuji                                                       |

### TC-WALI-004: Lihat Laporan Anak

| Item                | Detail                                |
| ------------------- | ------------------------------------- |
| **Test ID**         | TC-WALI-004                           |
| **Tujuan**          | Memastikan wali dapat melihat laporan |
| **Pre-condition**   | Login sebagai WALI                    |
| **Test Steps**      | 1. Klik menu "Laporan"                |
| **Test Data**       | -                                     |
| **Expected Result** | ✅ Tampil laporan progress anak       |
| **Status**          | ⬜ Belum Diuji                        |

---

## 🛠️ MODUL 9: ADMIN - FITUR LAINNYA

### TC-ADM2-001: Admin Santri Lookup

| Item                | Detail                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------ |
| **Test ID**         | TC-ADM2-001                                                                                |
| **Tujuan**          | Memastikan admin dapat lookup semua santri                                                 |
| **Pre-condition**   | Login sebagai ADMIN                                                                        |
| **Test Steps**      | 1. Klik menu "Cek Progress Santri"<br>2. Search santri<br>3. Filter by guru                |
| **Test Data**       | -                                                                                          |
| **Expected Result** | ✅ Admin bisa search dan filter semua santri (berbeda dengan Teacher yang hanya santrinya) |
| **Status**          | ⬜ Belum Diuji                                                                             |

### TC-ADM2-002: Admin Analytics

| Item                | Detail                                                                 |
| ------------------- | ---------------------------------------------------------------------- |
| **Test ID**         | TC-ADM2-002                                                            |
| **Tujuan**          | Memastikan halaman analytics admin berfungsi                           |
| **Pre-condition**   | Login sebagai ADMIN                                                    |
| **Test Steps**      | 1. Klik menu "Analytics"                                               |
| **Test Data**       | -                                                                      |
| **Expected Result** | ✅ Tampil analytics keseluruhan sistem: Total user, Total hafalan, dll |
| **Status**          | ⬜ Belum Diuji                                                         |

### TC-ADM2-003: Admin Settings

| Item                | Detail                                      |
| ------------------- | ------------------------------------------- |
| **Test ID**         | TC-ADM2-003                                 |
| **Tujuan**          | Memastikan halaman settings admin berfungsi |
| **Pre-condition**   | Login sebagai ADMIN                         |
| **Test Steps**      | 1. Klik menu "Pengaturan"                   |
| **Test Data**       | -                                           |
| **Expected Result** | ✅ Tampil halaman pengaturan sistem         |
| **Status**          | ⬜ Belum Diuji                              |

---

## 📱 MODUL 10: RESPONSIVENESS (UI/UX)

### TC-RESP-001: Responsive - Mobile View

| Item                | Detail                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RESP-001                                                                                                             |
| **Tujuan**          | Memastikan tampilan responsif di mobile                                                                                 |
| **Pre-condition**   | Buka aplikasi di browser mobile atau resize ke 375px                                                                    |
| **Test Steps**      | 1. Buka semua halaman di mobile view<br>2. Cek navigation (hamburger menu)<br>3. Cek form inputs<br>4. Cek tables/cards |
| **Test Data**       | Width: 375px (iPhone SE)                                                                                                |
| **Expected Result** | ✅ Semua elemen tampil dengan baik, tidak overflow, navigasi berfungsi                                                  |
| **Status**          | ⬜ Belum Diuji                                                                                                          |

### TC-RESP-002: Responsive - Tablet View

| Item                | Detail                                                                       |
| ------------------- | ---------------------------------------------------------------------------- |
| **Test ID**         | TC-RESP-002                                                                  |
| **Tujuan**          | Memastikan tampilan responsif di tablet                                      |
| **Pre-condition**   | Buka aplikasi di browser tablet atau resize ke 768px                         |
| **Test Steps**      | 1. Buka semua halaman di tablet view<br>2. Cek layout grid<br>3. Cek sidebar |
| **Test Data**       | Width: 768px (iPad)                                                          |
| **Expected Result** | ✅ Layout menyesuaikan dengan baik                                           |
| **Status**          | ⬜ Belum Diuji                                                               |

### TC-RESP-003: Responsive - Desktop View

| Item                | Detail                                                                                    |
| ------------------- | ----------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RESP-003                                                                               |
| **Tujuan**          | Memastikan tampilan optimal di desktop                                                    |
| **Pre-condition**   | Buka aplikasi di browser desktop                                                          |
| **Test Steps**      | 1. Buka semua halaman di desktop view<br>2. Cek sidebar fixed<br>3. Cek layout full width |
| **Test Data**       | Width: 1920px                                                                             |
| **Expected Result** | ✅ Layout optimal, sidebar fixed, content centered                                        |
| **Status**          | ⬜ Belum Diuji                                                                            |

### TC-RESP-004: Modal Responsiveness

| Item                | Detail                                                                                                      |
| ------------------- | ----------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-RESP-004                                                                                                 |
| **Tujuan**          | Memastikan modal responsif di semua ukuran layar                                                            |
| **Pre-condition**   | -                                                                                                           |
| **Test Steps**      | 1. Buka modal di mobile<br>2. Buka modal di tablet<br>3. Buka modal di desktop<br>4. Test scroll pada modal |
| **Test Data**       | -                                                                                                           |
| **Expected Result** | ✅ Modal: w-[95vw] max-w-6xl, h-[90vh], scrollable                                                          |
| **Status**          | ⬜ Belum Diuji                                                                                              |

---

## ⚡ MODUL 11: PERFORMANCE & ERROR HANDLING

### TC-PERF-001: Loading State

| Item                | Detail                                                                              |
| ------------------- | ----------------------------------------------------------------------------------- |
| **Test ID**         | TC-PERF-001                                                                         |
| **Tujuan**          | Memastikan loading state ditampilkan saat fetch data                                |
| **Pre-condition**   | -                                                                                   |
| **Test Steps**      | 1. Buka halaman dengan data (slow 3G jika perlu)<br>2. Perhatikan loading indicator |
| **Test Data**       | -                                                                                   |
| **Expected Result** | ✅ Spinner/skeleton muncul saat loading, tidak blank screen                         |
| **Status**          | ⬜ Belum Diuji                                                                      |

### TC-PERF-002: Error State - Network Error

| Item                | Detail                                                                    |
| ------------------- | ------------------------------------------------------------------------- |
| **Test ID**         | TC-PERF-002                                                               |
| **Tujuan**          | Memastikan error handling saat network error                              |
| **Pre-condition**   | -                                                                         |
| **Test Steps**      | 1. Matikan network/offline mode<br>2. Coba akses halaman atau submit form |
| **Test Data**       | -                                                                         |
| **Expected Result** | ✅ Toast error muncul dengan pesan yang jelas                             |
| **Status**          | ⬜ Belum Diuji                                                            |

### TC-PERF-003: Error State - Server Error (500)

| Item                | Detail                                                 |
| ------------------- | ------------------------------------------------------ |
| **Test ID**         | TC-PERF-003                                            |
| **Tujuan**          | Memastikan error handling saat server error            |
| **Pre-condition**   | Simulasi server error                                  |
| **Test Steps**      | 1. Trigger server error<br>2. Perhatikan response      |
| **Test Data**       | -                                                      |
| **Expected Result** | ✅ Toast error "Terjadi kesalahan server", tidak crash |
| **Status**          | ⬜ Belum Diuji                                         |

### TC-PERF-004: Empty State

| Item                | Detail                                                  |
| ------------------- | ------------------------------------------------------- |
| **Test ID**         | TC-PERF-004                                             |
| **Tujuan**          | Memastikan empty state ditampilkan dengan baik          |
| **Pre-condition**   | Tidak ada data di database                              |
| **Test Steps**      | 1. Akses halaman daftar yang kosong                     |
| **Test Data**       | -                                                       |
| **Expected Result** | ✅ Pesan "Tidak ada data" atau empty state illustration |
| **Status**          | ⬜ Belum Diuji                                          |

### TC-PERF-005: Toast Notification - Success

| Item                | Detail                                            |
| ------------------- | ------------------------------------------------- |
| **Test ID**         | TC-PERF-005                                       |
| **Tujuan**          | Memastikan toast sukses muncul                    |
| **Pre-condition**   | -                                                 |
| **Test Steps**      | 1. Lakukan aksi yang sukses (simpan, edit, hapus) |
| **Test Data**       | -                                                 |
| **Expected Result** | ✅ Toast hijau muncul dengan pesan sukses         |
| **Status**          | ⬜ Belum Diuji                                    |

### TC-PERF-006: Toast Notification - Error

| Item                | Detail                                           |
| ------------------- | ------------------------------------------------ |
| **Test ID**         | TC-PERF-006                                      |
| **Tujuan**          | Memastikan toast error muncul                    |
| **Pre-condition**   | -                                                |
| **Test Steps**      | 1. Lakukan aksi yang gagal (validasi error, dll) |
| **Test Data**       | -                                                |
| **Expected Result** | ✅ Toast merah muncul dengan pesan error         |
| **Status**          | ⬜ Belum Diuji                                   |

---

## 🔄 MODUL 12: DATA INTEGRITY

### TC-DATA-001: Hafalan Record Integrity

| Item                | Detail                                                                                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-DATA-001                                                                                                         |
| **Tujuan**          | Memastikan data hafalan tersimpan dengan benar                                                                      |
| **Pre-condition**   | Input hafalan baru                                                                                                  |
| **Test Steps**      | 1. Input hafalan<br>2. Cek di database/API response<br>3. Verify data: santriId, teacherId, kacaId, completedVerses |
| **Test Data**       | -                                                                                                                   |
| **Expected Result** | ✅ Semua field tersimpan dengan benar, relasi intact                                                                |
| **Status**          | ⬜ Belum Diuji                                                                                                      |

### TC-DATA-002: Recheck Record Integrity

| Item                | Detail                                                                           |
| ------------------- | -------------------------------------------------------------------------------- |
| **Test ID**         | TC-DATA-002                                                                      |
| **Tujuan**          | Memastikan data recheck tersimpan dengan benar                                   |
| **Pre-condition**   | Lakukan recheck                                                                  |
| **Test Steps**      | 1. Proses recheck<br>2. Cek RecheckRecord di database                            |
| **Test Data**       | -                                                                                |
| **Expected Result** | ✅ RecheckRecord tersimpan: hafalanRecordId, recheckedBy, allPassed, failedAyats |
| **Status**          | ⬜ Belum Diuji                                                                   |

### TC-DATA-003: History Tracking

| Item                | Detail                                                                     |
| ------------------- | -------------------------------------------------------------------------- |
| **Test ID**         | TC-DATA-003                                                                |
| **Tujuan**          | Memastikan history hafalan tercatat                                        |
| **Pre-condition**   | Edit hafalan yang sudah ada                                                |
| **Test Steps**      | 1. Edit hafalan oleh guru berbeda<br>2. Cek HafalanHistory                 |
| **Test Data**       | -                                                                          |
| **Expected Result** | ✅ HafalanHistory entry baru tercatat dengan teacherId dan completedVerses |
| **Status**          | ⬜ Belum Diuji                                                             |

### TC-DATA-004: Status Auto-Update

| Item                | Detail                                                                                      |
| ------------------- | ------------------------------------------------------------------------------------------- |
| **Test ID**         | TC-DATA-004                                                                                 |
| **Tujuan**          | Memastikan status kaca auto-update berdasarkan kondisi                                      |
| **Pre-condition**   | -                                                                                           |
| **Test Steps**      | 1. Lengkapi semua ayat → cek status<br>2. Recheck pass → cek status                         |
| **Test Data**       | -                                                                                           |
| **Expected Result** | ✅ PROGRESS → COMPLETE_WAITING_RECHECK (semua ayat lancar) → RECHECK_PASSED (lulus recheck) |
| **Status**          | ⬜ Belum Diuji                                                                              |

---

## 📋 RINGKASAN TEST CASE

| Modul                          | Total TC | Priority    |
| ------------------------------ | -------- | ----------- |
| Authentication & Authorization | 6        | 🔴 Critical |
| Admin - Manajemen User         | 6        | 🔴 Critical |
| Teacher - Input Hafalan        | 7        | 🔴 Critical |
| Teacher - Recheck Hafalan      | 5        | 🔴 Critical |
| Teacher - Santri Lookup        | 7        | 🟡 High     |
| Teacher - Raport               | 5        | 🟡 High     |
| Santri Dashboard               | 4        | 🟡 High     |
| Wali Dashboard                 | 4        | 🟢 Medium   |
| Admin - Fitur Lainnya          | 3        | 🟢 Medium   |
| Responsiveness                 | 4        | 🟡 High     |
| Performance & Error Handling   | 6        | 🔴 Critical |
| Data Integrity                 | 4        | 🔴 Critical |
| **TOTAL**                      | **61**   |             |

---

## ✅ CHECKLIST SEBELUM PRESENTASI

### Technical Checklist:

- [ ] Database sudah di-seed dengan data sample
- [ ] Semua API endpoint berfungsi
- [ ] Environment variables sudah dikonfigurasi
- [ ] Build production berhasil tanpa error
- [ ] HTTPS/SSL sudah aktif (jika di server)

### Data Sample yang Diperlukan:

- [ ] 1 Admin user
- [ ] 2-3 Teacher user
- [ ] 5-10 Santri user dengan hafalan record
- [ ] 2-3 Wali user terhubung dengan santri
- [ ] Data Kaca (halaman Al-Qur'an) sudah di-seed
- [ ] Sample hafalan dengan berbagai status (PROGRESS, COMPLETE_WAITING_RECHECK, RECHECK_PASSED)

### Demo Flow yang Direkomendasikan:

1. **Login sebagai Admin** → Tunjukkan manajemen user
2. **Login sebagai Teacher** → Input hafalan baru → Recheck hafalan → Cek progress via Santri Lookup
3. **Login sebagai Santri** → Lihat progress hafalan sendiri
4. **Login sebagai Wali** → Lihat progress anak

---

## 📝 CATATAN TESTER

| Tanggal | Tester | Catatan |
| ------- | ------ | ------- |
|         |        |         |
|         |        |         |
|         |        |         |

---

**Dokumen ini dibuat untuk memastikan kualitas aplikasi sebelum presentasi ke vendor.**
