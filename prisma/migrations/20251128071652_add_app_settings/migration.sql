-- CreateTable
CREATE TABLE "app_settings" (
    "id" TEXT NOT NULL DEFAULT 'app_settings',
    "brandName" TEXT NOT NULL DEFAULT 'Hafalan Al-Qur''an',
    "brandTagline" TEXT NOT NULL DEFAULT 'Metode 1 Kaca',
    "logoUrl" TEXT,
    "primaryColor" TEXT NOT NULL DEFAULT '#059669',
    "menuDashboard" BOOLEAN NOT NULL DEFAULT true,
    "menuHafalan" BOOLEAN NOT NULL DEFAULT true,
    "menuRecheck" BOOLEAN NOT NULL DEFAULT true,
    "menuRaport" BOOLEAN NOT NULL DEFAULT true,
    "menuSantriLookup" BOOLEAN NOT NULL DEFAULT true,
    "menuAnalytics" BOOLEAN NOT NULL DEFAULT true,
    "menuUsers" BOOLEAN NOT NULL DEFAULT true,
    "menuSettings" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_settings_pkey" PRIMARY KEY ("id")
);
