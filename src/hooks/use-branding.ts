"use client";

import { useState, useEffect } from "react";

interface BrandingSettings {
  brandName: string;
  brandTagline: string;
  logoUrl: string | null;
  primaryColor: string;
}

const defaultBranding: BrandingSettings = {
  brandName: "Hafalan Al-Qur'an",
  brandTagline: "Metode 1 Kaca",
  logoUrl: null,
  primaryColor: "#059669",
};

// Client-side cache
let brandingCache: {
  data: BrandingSettings | null;
  timestamp: number;
  ttl: number;
} = {
  data: null,
  timestamp: 0,
  ttl: 5 * 60 * 1000, // 5 minutes
};

/**
 * Hook to fetch branding settings
 * Works without authentication - for login page, public pages
 */
export function useBranding() {
  const [branding, setBranding] = useState<BrandingSettings>(
    brandingCache.data || defaultBranding
  );
  const [isLoading, setIsLoading] = useState(!brandingCache.data);

  useEffect(() => {
    const fetchBranding = async () => {
      // Check cache
      const now = Date.now();
      if (
        brandingCache.data &&
        now - brandingCache.timestamp < brandingCache.ttl
      ) {
        setBranding(brandingCache.data);
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch("/api/settings/public");
        if (response.ok) {
          const data = await response.json();
          brandingCache = {
            data: data,
            timestamp: Date.now(),
            ttl: 5 * 60 * 1000,
          };
          setBranding(data);
        }
      } catch (error) {
        console.error("Failed to fetch branding:", error);
        // Use defaults on error
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranding();
  }, []);

  return { branding, isLoading };
}

/**
 * Invalidate branding cache (call after admin updates settings)
 */
export function invalidateBrandingCache() {
  brandingCache = {
    data: null,
    timestamp: 0,
    ttl: 5 * 60 * 1000,
  };
}
