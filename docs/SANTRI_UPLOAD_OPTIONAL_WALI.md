# Dokumentasi: Santri Upload dengan Wali Opsional

## Ringkasan Fitur

Fitur upload santri (bulk dan single) telah diperbarui untuk mendukung opsi **Tanpa Wali** bagi santri yatim piatu.

## Perubahan Teknis

### 1. Bulk Upload (`/src/app/admin/santri/bulk-upload-santri-dialog.tsx`)

**Perubahan:**

- Field wali menjadi opsional (semua kosong = tanpa wali)
- Jika ada data wali parsial, akan ditampilkan warning
- Kolom "Keterangan" menampilkan field yang kurang lengkap

**Validasi Baru:**

```typescript
function getRowValidationInfo(row: ParsedRow): {
  isValid: boolean;
  missingFields: string[];
  hasPartialWali: boolean;
};
```

**Aturan Validasi:**

- Santri (WAJIB): `nama_santri`, `tgl_lahir`, `tempat_lahir`, `gender`, `alamat`
- Santri (OPSIONAL): `telp_santri`
- Wali (SEMUA OPSIONAL): Jika ada data wali apapun, maka semua field wali harus diisi

### 2. Bulk API (`/src/app/api/admin/santri/bulk/route.ts`)

**Perubahan:**

- `waliProfileId` sekarang bisa `null` untuk santri tanpa wali
- Validasi wali hanya berlaku jika ada data wali

**Schema Validasi:**

```typescript
// Wali opsional - validasi hanya jika ada data
if (hasWaliData) {
  // validate wali fields
  waliProfileId = createdWaliId;
} else {
  waliProfileId = null;
}
```

### 3. Single Upload Dialog (`/src/app/admin/santri/create-santri-dialog.tsx`)

**Perubahan:**

- Mengembalikan tombol "Tanpa Wali" di Step 2
- Grid 3 kolom untuk opsi: Pilih Existing | Buat Baru | Tanpa Wali
- Alert informatif saat memilih "Tanpa Wali"

**Opsi Wali:**

```typescript
waliOption: "existing" | "new" | "none";
```

**UI Tanpa Wali:**

- Background amber/warning
- Pesan: "Santri Tanpa Wali - Santri ini akan dibuat tanpa data wali. Pilihan ini cocok untuk santri yatim piatu atau yang tidak memiliki wali. Wali dapat ditambahkan kemudian melalui menu edit."

### 4. Single API (`/src/app/api/admin/santri/route.ts`)

**Perubahan:**

- Schema diperbarui agar tidak memerlukan wali
- Validasi hanya memastikan jika `createNewWali=true`, maka `waliData` harus ada

**Schema Baru:**

```typescript
const createSantriSchema = z.object({
  // ... santri fields ...
  waliId: z.string().optional(),
  createNewWali: z.boolean().optional(),
  waliData: z.object({ ... }).optional(),
}).refine(
  (data) => {
    if (data.createNewWali && !data.waliData) {
      return false;
    }
    return true;
  },
  { message: "Data wali harus diisi jika membuat wali baru" }
);
```

## Format CSV untuk Bulk Upload

| Kolom          | Status     | Deskripsi                             |
| -------------- | ---------- | ------------------------------------- |
| nama_santri    | WAJIB      | Nama lengkap santri                   |
| tgl_lahir      | WAJIB      | Format YYYY-MM-DD                     |
| tempat_lahir   | WAJIB      | Tempat lahir santri                   |
| gender         | WAJIB      | MALE atau FEMALE                      |
| alamat         | WAJIB      | Alamat santri                         |
| telp_santri    | OPSIONAL   | Nomor telepon santri                  |
| nama_wali      | OPSIONAL   | Nama wali (kosongkan jika tanpa wali) |
| telp_wali      | OPSIONAL\* | No. telepon wali                      |
| pekerjaan_wali | OPSIONAL\* | Pekerjaan wali                        |
| alamat_wali    | OPSIONAL\* | Alamat wali                           |
| email_wali     | OPSIONAL\* | Email wali                            |

\*) Jika ada salah satu data wali, maka semua data wali harus diisi.

## Contoh CSV

### Dengan Wali:

```csv
nama_santri,tgl_lahir,tempat_lahir,gender,alamat,telp_santri,nama_wali,telp_wali,pekerjaan_wali,alamat_wali,email_wali
Ahmad Fauzi,2010-05-15,Jakarta,MALE,Jl. Raya No.1,,Budi Santoso,081234567890,Guru,Jl. Raya No.1,budi@email.com
```

### Tanpa Wali (Yatim Piatu):

```csv
nama_santri,tgl_lahir,tempat_lahir,gender,alamat,telp_santri,nama_wali,telp_wali,pekerjaan_wali,alamat_wali,email_wali
Siti Aisyah,2011-03-20,Bandung,FEMALE,Jl. Merdeka No.2,,,,,,
```

## Test Coverage

Fitur ini memerlukan pengujian untuk:

1. **Unit Test:**

   - Validasi `getRowValidationInfo()` dengan berbagai skenario
   - Schema Zod untuk single upload

2. **Integration Test:**

   - API bulk upload tanpa wali
   - API single upload tanpa wali
   - API dengan wali lengkap

3. **E2E Test:**
   - Dialog bulk upload dengan CSV tanpa wali
   - Dialog single upload dengan opsi "Tanpa Wali"

## Status Kelayakan Produksi

✅ Kompilasi TypeScript berhasil  
✅ Validasi konsisten antara frontend dan backend  
✅ Backward compatible (data wali tetap bisa diisi)  
✅ UI informatif untuk kasus tanpa wali  
⚠️ Test coverage perlu ditambahkan

---

**Tanggal:** $(date)  
**Version:** 1.0.0
