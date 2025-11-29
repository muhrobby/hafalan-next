# Plan: Partial Hafalan Flow Improvement

## 📋 Overview

Dokumen ini menjelaskan improvement flow Partial Hafalan untuk mencegah inkonsistensi data ketika guru mencatat hafalan santri yang sedang dalam proses partial.

## 🔍 Analisis Masalah Saat Ini

### Flow Existing

```
1. Guru memilih santri & kaca
2. Daftar ayat muncul dengan checkbox
3. Guru bisa klik "Partial Hafalan" untuk catat partial
4. Partial tercatat & alert muncul
5. MASALAH: Checkbox ayat masih AKTIF
6. Guru bisa langsung centang ayat yang masih partial dan klik "Perbarui Hafalan"
7. Terjadi inkonsistensi: Partial masih IN_PROGRESS tapi ayat sudah dicatat lancar
```

### Risiko

1. **Data Inkonsisten**: Partial hafalan masih berstatus `IN_PROGRESS` tapi ayat sudah tercatat selesai
2. **Tracking Progress Salah**: Tidak jelas apakah santri benar-benar sudah menyelesaikan ayat secara utuh
3. **Confusion pada Workflow**: Guru bisa bingung apakah harus selesaikan partial dulu atau langsung centang
4. **Percentage Confusion**: Partial status "COMPLETED" tapi percentage masih 25% (input manual) membingungkan user
5. **Button Visibility**: Tombol "Partial Hafalan" kurang terlihat dan terlalu kecil di halaman input

---

## 💡 Solusi yang Diusulkan

### Flow Baru (Recommended)

```
┌─────────────────────────────────────────────────────────────────┐
│                        TEACHER INPUT PAGE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. Guru pilih Santri & Kaca                                   │
│     ↓                                                          │
│  2. Sistem cek: Ada partial aktif untuk kaca ini?              │
│     ├─ TIDAK → Semua checkbox AKTIF (normal flow)              │
│     │                                                          │
│     └─ YA → Ayat yang punya partial: DISABLED + LOCKED ICON   │
│             Ayat lain: AKTIF                                   │
│             ↓                                                   │
│  3. Guru klik "Partial Hafalan" untuk catat partial baru       │
│     → Ayat yang dipilih jadi DISABLED                          │
│     ↓                                                          │
│  4. Untuk selesaikan partial:                                  │
│     ├─ Klik "Selesaikan" di alert partial                      │
│     └─ Sistem auto-centang ayat tersebut                       │
│     ↓                                                          │
│  5. Checkbox ayat kembali AKTIF (sudah tercentang)             │
│     ↓                                                          │
│  6. Guru bisa lanjut centang ayat lain atau submit             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Skenario Detail

### Skenario 1: Santri Baru (Belum Ada Partial)

```
State Awal:
- Partial aktif: 0
- Checkbox: Semua ENABLED

Action:
- Guru bisa centang ayat langsung
- Atau klik "Partial Hafalan" untuk catat partial

Hasil:
- Normal flow seperti biasa
```

### Skenario 2: Ada Partial Aktif (dengan Sequential Lock)

```
State Awal:
- Partial aktif: Ayat 3 (progress: 50%)
- Ayat 1-2: Sudah lancar ✅ (checked, ENABLED)
- Ayat 3: DISABLED + 🔒 icon (partial aktif)
- Ayat 4-7: DISABLED + ⏸️ icon (menunggu Ayat 3 selesai)

⚠️ ATURAN SEQUENTIAL:
Hafalan harus berurutan! Ayat setelah partial aktif juga di-lock
sampai partial sebelumnya selesai.

Action Guru:
A) Centang Ayat 1-2 → ✅ Allowed (sudah dilewati)
B) Centang Ayat 3 → ❌ Disabled (partial aktif)
C) Centang Ayat 4-7 → ❌ Disabled (menunggu Ayat 3)
D) Selesaikan Partial Ayat 3 → ✅ Ayat 3 auto-checked
   → Ayat 4-7 jadi ENABLED (unlock sequential)

Hasil:
- Konsistensi terjaga
- Urutan hafalan terjamin
- Partial harus diselesaikan eksplisit sebelum lanjut
```

### Skenario 3: Santri Kembali untuk Lanjut Hafalan

```
State Awal (pertemuan sebelumnya):
- Ayat 1-2: Sudah lancar ✅
- Ayat 3: Partial 50% 🔒
- Ayat 4-7: Belum dimulai

Ketika guru buka halaman:
- Ayat 1-2: Checked, ENABLED (bisa di-uncheck jika perlu)
- Ayat 3: Unchecked, DISABLED + 🔒 (ada partial aktif)
- Ayat 4-7: Unchecked, DISABLED + ⏸️ (sequential lock)

Guru selesaikan partial Ayat 3:
- Ayat 3: Auto-checked, ENABLED
- Santri bisa lanjut Ayat 4
```

---

## 📐 Technical Design

### 1. State Management Updates

```typescript
// Tambah computed state untuk ayat yang di-lock
const lockedAyats = useMemo(() => {
  const activePartials = getActivePartialsForKaca(selectedKaca);
  return new Set(activePartials.map((p) => p.ayatNumber));
}, [partials, selectedKaca]);

// Check apakah ayat di-lock
const isAyatLocked = (ayatNumber: number) => lockedAyats.has(ayatNumber);
```

### 2. Checkbox Component Update

```tsx
// Di bagian render ayat list
{
  ayatList.map((ayat) => {
    const isLocked = isAyatLocked(ayat.number);
    const activePartial = getActivePartialForAyat(ayat.number);

    return (
      <div
        key={ayat.number}
        className={cn(
          "flex items-center gap-3 p-2 rounded",
          isLocked && "bg-amber-50 border border-amber-200"
        )}
      >
        <Checkbox
          checked={ayat.checked}
          disabled={isLocked}
          onCheckedChange={(checked) => handleAyatChange(ayat.number, checked)}
        />
        <span>{ayat.text}</span>
        {isLocked && (
          <Badge variant="outline" className="ml-auto text-amber-600">
            <Lock className="h-3 w-3 mr-1" />
            Partial {activePartial?.percentage || 0}%
          </Badge>
        )}
      </div>
    );
  });
}
```

### 3. Complete Partial Flow

```typescript
const handleCompletePartial = async (partialId: string, ayatNumber: number) => {
  try {
    // 1. Complete partial via API
    await completePartial(partialId);

    // 2. Auto-check the ayat in local state
    setAyatList((prev) =>
      prev.map((ayat) =>
        ayat.number === ayatNumber ? { ...ayat, checked: true } : ayat
      )
    );

    // 3. Refresh partials
    await fetchPartials();

    toast({
      title: "Partial Selesai",
      description: `Ayat ${ayatNumber} telah ditandai selesai dan tercentang otomatis.`,
    });
  } catch (error) {
    // Handle error
  }
};
```

### 4. Partial Alert Component Update

```tsx
// PartialHafalanAlert.tsx - Tambah tombol "Selesaikan"
<Button
  size="sm"
  variant="default"
  onClick={() => onComplete(partial.id, partial.ayatNumber)}
>
  <CheckCircle className="h-4 w-4 mr-1" />
  Selesaikan
</Button>
```

### 5. Submit Validation

```typescript
const handleSubmit = async () => {
  // Check ada partial aktif yang belum selesai
  const activePartials = getActivePartialsForKaca(selectedKaca);

  if (activePartials.length > 0) {
    toast({
      variant: "warning",
      title: "Ada Partial Belum Selesai",
      description: `Selesaikan ${activePartials.length} partial hafalan terlebih dahulu sebelum menyimpan.`,
    });
    return;
  }

  // Lanjut submit normal
  // ...
};
```

### 6. Sequential Lock Logic (NEW)

```typescript
// Hitung ayat mana yang harus di-lock karena sequential rule
const getLockedAyats = useMemo(() => {
  const activePartials = getActivePartialsForKaca(selectedKaca);
  if (activePartials.length === 0) return new Set<number>();

  // Cari ayat partial terendah yang masih aktif
  const lowestPartialAyat = Math.min(...activePartials.map(p => p.ayatNumber));
  
  // Lock: ayat partial itu sendiri + semua ayat setelahnya
  const locked = new Set<number>();
  ayatList.forEach(ayat => {
    if (ayat.number >= lowestPartialAyat) {
      locked.add(ayat.number);
    }
  });
  
  return locked;
}, [partials, selectedKaca, ayatList]);

// Check tipe lock
const getAyatLockType = (ayatNumber: number): 'partial' | 'sequential' | null => {
  const activePartials = getActivePartialsForKaca(selectedKaca);
  const isPartialAyat = activePartials.some(p => p.ayatNumber === ayatNumber);
  
  if (isPartialAyat) return 'partial';
  if (getLockedAyats.has(ayatNumber)) return 'sequential';
  return null;
};
```

### 7. Auto-Percentage on Complete (NEW)

```typescript
// API: PUT /api/hafalan/partial/[id] - Auto set percentage to 100
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  // ... validation ...

  const updateData: any = { ...validatedData };
  
  // Auto-set percentage to 100% when status changes to COMPLETED
  if (validatedData.status === "COMPLETED") {
    updateData.percentage = 100;
  }

  const updated = await db.partialHafalan.update({
    where: { id: params.id },
    data: updateData,
  });

  return NextResponse.json({ data: updated });
}
```

### 8. UI Improvement - Prominent Partial Button (NEW)

**Masalah**: Tombol "Partial Hafalan" terlalu kecil dan kurang terlihat.

**Solusi**: Pindahkan ke lokasi yang lebih prominent dengan desain yang lebih jelas.

```tsx
// Layout Baru: Partial button di atas ayat list, bukan di samping checkbox
<Card>
  <CardHeader>
    <div className="flex items-center justify-between">
      <div>
        <CardTitle>Daftar Ayat</CardTitle>
        <CardDescription>Centang ayat yang sudah dihafal</CardDescription>
      </div>
      
      {/* Prominent Partial Button - Moved here! */}
      <Button 
        variant="outline" 
        size="default"
        className="bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
        onClick={() => setShowPartialDialog(true)}
      >
        <Clock className="h-4 w-4 mr-2" />
        Catat Partial Hafalan
      </Button>
    </div>
  </CardHeader>
  
  {/* Partial Alert - Show active partials prominently */}
  {activePartials.length > 0 && (
    <div className="px-6 pb-4">
      <PartialHafalanAlert 
        partials={activePartials}
        onComplete={handleCompletePartial}
        onDelete={handleDeletePartial}
      />
    </div>
  )}
  
  <CardContent>
    {/* Ayat list here */}
  </CardContent>
</Card>
```

**Alternative: Floating Action Button (FAB)**

```tsx
// FAB di pojok kanan bawah untuk akses cepat
<div className="fixed bottom-6 right-6 z-50">
  <Button
    size="lg"
    className="rounded-full h-14 w-14 shadow-lg bg-amber-500 hover:bg-amber-600"
    onClick={() => setShowPartialDialog(true)}
  >
    <Clock className="h-6 w-6" />
  </Button>
</div>
```

---

## 📁 Files to Modify

### Primary Changes

| File                                        | Changes                                                              |
| ------------------------------------------- | -------------------------------------------------------------------- |
| `src/app/teacher/hafalan/input/page.tsx`    | Sequential lock, disable checkbox, auto-check, prominent button      |
| `src/components/partial-hafalan-alert.tsx`  | Add "Selesaikan" button with callback                                |
| `src/hooks/use-partial-hafalan.ts`          | Add `completePartial` return handling                                |
| `src/app/api/hafalan/partial/[id]/route.ts` | Auto-set percentage to 100% on COMPLETED                             |

### Optional Enhancements

| File                             | Changes                            |
| -------------------------------- | ---------------------------------- |
| `src/components/ui/checkbox.tsx` | Add locked variant styling         |

---

## 🔄 Migration/Backward Compatibility

1. **Existing Partial Records**: Tetap berfungsi normal
2. **No Database Changes**: Hanya perubahan UI/UX flow
3. **Gradual Rollout**: Bisa di-toggle via feature flag jika diperlukan
4. **Existing COMPLETED with low %**: Perlu migration script untuk update ke 100%

---

## ✅ Acceptance Criteria

### Core Features
- [ ] Ayat dengan partial aktif menampilkan badge "🔒 Partial X%"
- [ ] Checkbox ayat dengan partial aktif tidak bisa di-klik
- [ ] **NEW**: Ayat setelah partial aktif juga di-lock dengan badge "⏸️ Menunggu"
- [ ] Tombol "Selesaikan" di alert partial berfungsi
- [ ] Setelah selesaikan partial, ayat auto-checked
- [ ] **NEW**: Setelah selesaikan partial, ayat berikutnya ter-unlock
- [ ] Submit terblokir jika masih ada partial aktif

### Auto-Percentage
- [ ] **NEW**: Ketika partial di-complete, percentage otomatis jadi 100%
- [ ] **NEW**: Di rekap admin, partial COMPLETED menampilkan 100%

### UI Improvements
- [ ] **NEW**: Tombol "Catat Partial Hafalan" lebih prominent (di header card)
- [ ] **NEW**: Alternatif: FAB di pojok kanan bawah
- [ ] Flow smooth tanpa page refresh

---

## 📊 User Story

### Story 1: Guru mencatat partial hafalan

```
SEBAGAI guru tahfidz
SAYA INGIN ayat yang sedang partial terkunci
AGAR tidak terjadi kesalahan mencatat ayat yang belum selesai utuh
```

### Story 2: Guru menyelesaikan partial

```
SEBAGAI guru tahfidz
SAYA INGIN bisa menyelesaikan partial langsung dari halaman input
AGAR workflow lebih efisien tanpa pindah halaman
```

### Story 3: Santri melanjutkan hafalan

```
SEBAGAI guru tahfidz
SAYA INGIN melihat status partial santri saat mereka kembali
AGAR saya tahu mana ayat yang perlu diselesaikan dulu
```

### Story 4: Sequential Lock (NEW)

```
SEBAGAI guru tahfidz
SAYA INGIN ayat setelah partial juga terkunci
AGAR urutan hafalan santri terjaga (tidak loncat ayat)
```

### Story 5: Auto-Percentage (NEW)

```
SEBAGAI admin
SAYA INGIN partial yang selesai otomatis 100%
AGAR tidak bingung melihat status "COMPLETED" dengan percentage rendah
```

### Story 6: Prominent Button (NEW)

```
SEBAGAI guru tahfidz
SAYA INGIN tombol partial hafalan mudah ditemukan
AGAR saya tidak kesulitan mencari fitur tersebut
```

---

## 🚀 Implementation Priority

### Phase 1 (Must Have - Core)

1. ✅ Lock checkbox untuk ayat dengan partial aktif
2. ✅ Visual indicator (badge 🔒) pada ayat terkunci
3. ✅ Tombol "Selesaikan" di partial alert
4. **NEW**: Sequential lock - ayat setelah partial juga di-lock (badge ⏸️)

### Phase 2 (Must Have - UX)

1. ✅ Auto-check ayat setelah complete partial
2. **NEW**: Auto-percentage 100% saat complete
3. **NEW**: Prominent button placement (header card atau FAB)
4. Warning/block submit jika ada partial aktif

### Phase 3 (Nice to Have)

1. Inline complete partial (tanpa dialog)
2. Migration script untuk existing COMPLETED dengan low %
3. Analytics partial completion rate

### Phase 4 (Future Enhancement)

1. Partial progress tracking dalam main hafalan record
2. Bulk complete multiple partials
3. Partial history timeline

---

## 📝 Notes

- Flow ini memastikan **konsistensi data** antara partial hafalan dan hafalan utama
- **Sequential lock** menjaga urutan hafalan yang benar
- **Auto-percentage** menghilangkan confusion pada status display
- **Prominent button** meningkatkan discoverability fitur
- **UX tetap smooth** dengan visual feedback yang jelas
- **Backward compatible** dengan data existing
- Guru tetap punya **kontrol penuh** kapan menyelesaikan partial

---

_Document Version: 1.1_
_Created: November 29, 2025_
_Updated: November 30, 2025_
_Status: Planning_
