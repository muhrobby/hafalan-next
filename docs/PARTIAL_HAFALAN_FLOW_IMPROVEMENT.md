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

### Skenario 2: Ada Partial Aktif
```
State Awal:
- Partial aktif: Ayat 3 (progress: 50%)
- Checkbox Ayat 3: DISABLED + 🔒 icon
- Checkbox lainnya: ENABLED

Action Guru:
A) Centang ayat lain → ✅ Allowed
B) Centang Ayat 3 → ❌ Disabled, tidak bisa
C) Selesaikan Partial Ayat 3 → ✅ Ayat 3 auto-checked & enabled

Hasil:
- Konsistensi terjaga
- Partial harus diselesaikan eksplisit
```

### Skenario 3: Santri Kembali untuk Lanjut Hafalan
```
State Awal (pertemuan sebelumnya):
- Ayat 1-2: Sudah lancar ✅
- Ayat 3: Partial 50% 🔒
- Ayat 4-7: Belum dimulai

Ketika guru buka halaman:
- Ayat 1-2: Checked, ENABLED
- Ayat 3: Unchecked, DISABLED (ada partial aktif)
- Ayat 4-7: Unchecked, ENABLED

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
  return new Set(activePartials.map(p => p.ayatNumber));
}, [partials, selectedKaca]);

// Check apakah ayat di-lock
const isAyatLocked = (ayatNumber: number) => lockedAyats.has(ayatNumber);
```

### 2. Checkbox Component Update

```tsx
// Di bagian render ayat list
{ayatList.map((ayat) => {
  const isLocked = isAyatLocked(ayat.number);
  const activePartial = getActivePartialForAyat(ayat.number);
  
  return (
    <div key={ayat.number} className={cn(
      "flex items-center gap-3 p-2 rounded",
      isLocked && "bg-amber-50 border border-amber-200"
    )}>
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
})}
```

### 3. Complete Partial Flow

```typescript
const handleCompletePartial = async (partialId: string, ayatNumber: number) => {
  try {
    // 1. Complete partial via API
    await completePartial(partialId);
    
    // 2. Auto-check the ayat in local state
    setAyatList(prev => prev.map(ayat => 
      ayat.number === ayatNumber 
        ? { ...ayat, checked: true }
        : ayat
    ));
    
    // 3. Refresh partials
    await fetchPartials();
    
    toast({
      title: "Partial Selesai",
      description: `Ayat ${ayatNumber} telah ditandai selesai dan tercentang otomatis.`
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
      description: `Selesaikan ${activePartials.length} partial hafalan terlebih dahulu sebelum menyimpan.`
    });
    return;
  }
  
  // Lanjut submit normal
  // ...
};
```

---

## 📁 Files to Modify

### Primary Changes

| File | Changes |
|------|---------|
| `src/app/teacher/hafalan/input/page.tsx` | Add locked state, disable checkbox, auto-check on complete |
| `src/components/partial-hafalan-alert.tsx` | Add "Selesaikan" button with callback |
| `src/hooks/use-partial-hafalan.ts` | Add `completePartial` return handling |

### Optional Enhancements

| File | Changes |
|------|---------|
| `src/components/ui/checkbox.tsx` | Add locked variant styling |
| `src/app/api/hafalan/partial/[id]/route.ts` | Return updated ayat status on complete |

---

## 🔄 Migration/Backward Compatibility

1. **Existing Partial Records**: Tetap berfungsi normal
2. **No Database Changes**: Hanya perubahan UI/UX flow
3. **Gradual Rollout**: Bisa di-toggle via feature flag jika diperlukan

---

## ✅ Acceptance Criteria

- [ ] Ayat dengan partial aktif menampilkan badge "Partial X%"
- [ ] Checkbox ayat dengan partial aktif tidak bisa di-klik
- [ ] Tombol "Selesaikan" di alert partial berfungsi
- [ ] Setelah selesaikan partial, ayat auto-checked
- [ ] Setelah selesaikan partial, checkbox kembali enabled
- [ ] Submit terblokir jika masih ada partial aktif (optional, bisa warning saja)
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

---

## 🚀 Implementation Priority

### Phase 1 (Must Have)
1. Lock checkbox untuk ayat dengan partial aktif
2. Visual indicator (badge) pada ayat terkunci
3. Tombol "Selesaikan" di partial alert

### Phase 2 (Nice to Have)
1. Auto-check ayat setelah complete partial
2. Warning/block submit jika ada partial aktif
3. Inline complete partial (tanpa dialog)

### Phase 3 (Future Enhancement)
1. Partial progress tracking dalam main hafalan record
2. Analytics partial completion rate
3. Bulk complete multiple partials

---

## 📝 Notes

- Flow ini memastikan **konsistensi data** antara partial hafalan dan hafalan utama
- **UX tetap smooth** dengan visual feedback yang jelas
- **Backward compatible** dengan data existing
- Guru tetap punya **kontrol penuh** kapan menyelesaikan partial

---

*Document Version: 1.0*
*Created: November 29, 2025*
*Status: Planning*
