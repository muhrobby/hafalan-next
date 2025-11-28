-- CreateIndex
CREATE INDEX "hafalan_records_santriId_idx" ON "hafalan_records"("santriId");

-- CreateIndex
CREATE INDEX "hafalan_records_teacherId_idx" ON "hafalan_records"("teacherId");

-- CreateIndex
CREATE INDEX "hafalan_records_kacaId_idx" ON "hafalan_records"("kacaId");

-- CreateIndex
CREATE INDEX "hafalan_records_statusKaca_idx" ON "hafalan_records"("statusKaca");

-- CreateIndex
CREATE INDEX "hafalan_records_createdAt_idx" ON "hafalan_records"("createdAt");

-- CreateIndex
CREATE INDEX "hafalan_records_santriId_statusKaca_idx" ON "hafalan_records"("santriId", "statusKaca");

-- CreateIndex
CREATE INDEX "kaca_juz_idx" ON "kaca"("juz");

-- CreateIndex
CREATE INDEX "kaca_surahNumber_idx" ON "kaca"("surahNumber");

-- CreateIndex
CREATE INDEX "santri_profiles_teacherId_idx" ON "santri_profiles"("teacherId");

-- CreateIndex
CREATE INDEX "santri_profiles_waliId_idx" ON "santri_profiles"("waliId");

-- CreateIndex
CREATE INDEX "santri_profiles_isActive_idx" ON "santri_profiles"("isActive");
