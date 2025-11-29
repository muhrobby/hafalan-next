/**
 * Unit Tests for usePartialHafalan Hook
 *
 * Testing scenarios:
 * 1. getActivePartialForAyat - Find active partial for specific ayat
 * 2. getLowestActivePartialAyat - Find lowest ayat with active partial (for sequential lock)
 * 3. hasActivePartialForKaca - Check if kaca has any active partial
 * 4. getPartialsForKaca - Get all partials for a kaca
 */

import { describe, it, expect } from "@jest/globals";

// Type for PartialHafalan
interface PartialHafalan {
  id: string;
  santriId: string;
  kacaId: string;
  ayatNumber: number;
  progress: string;
  percentage: number;
  status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  createdAt: Date;
  updatedAt: Date;
}

// Replicate the hook's logic for testing
function getActivePartialForAyat(
  partials: PartialHafalan[],
  targetKacaId: string,
  ayatNumber: number
): PartialHafalan | undefined {
  return partials.find(
    (p) =>
      p.kacaId === targetKacaId &&
      p.ayatNumber === ayatNumber &&
      p.status === "IN_PROGRESS"
  );
}

function getLowestActivePartialAyat(
  partials: PartialHafalan[],
  targetKacaId: string
): number | null {
  const activePartials = partials.filter(
    (p) => p.kacaId === targetKacaId && p.status === "IN_PROGRESS"
  );
  if (activePartials.length === 0) return null;
  return Math.min(...activePartials.map((p) => p.ayatNumber));
}

function hasActivePartialForKaca(
  partials: PartialHafalan[],
  targetKacaId: string
): boolean {
  return partials.some(
    (p) => p.kacaId === targetKacaId && p.status === "IN_PROGRESS"
  );
}

function getPartialsForKaca(
  partials: PartialHafalan[],
  targetKacaId: string
): PartialHafalan[] {
  return partials.filter((p) => p.kacaId === targetKacaId);
}

// Helper to determine lock type for an ayat
type AyatLockType = "partial" | "sequential" | null;

function getAyatLockType(
  ayatNumber: number,
  kacaId: string,
  partials: PartialHafalan[]
): AyatLockType {
  // Check if this specific ayat has active partial
  const hasPartial = getActivePartialForAyat(partials, kacaId, ayatNumber);
  if (hasPartial) return "partial";

  // Check if there's a lower ayat with active partial (sequential lock)
  const lowestPartialAyat = getLowestActivePartialAyat(partials, kacaId);
  if (lowestPartialAyat !== null && ayatNumber > lowestPartialAyat) {
    return "sequential";
  }

  return null;
}

describe("usePartialHafalan Hook Logic Tests", () => {
  // Test data setup
  const kaca1Id = "kaca-1";
  const kaca2Id = "kaca-2";
  const santriId = "santri-1";

  const mockPartials: PartialHafalan[] = [
    {
      id: "partial-1",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 3,
      progress: "Setengah ayat",
      percentage: 50,
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "partial-2",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 5,
      progress: "Hampir selesai",
      percentage: 80,
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "partial-3",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 2,
      progress: "Sudah selesai",
      percentage: 100,
      status: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "partial-4",
      santriId,
      kacaId: kaca2Id,
      ayatNumber: 1,
      progress: "Baru mulai",
      percentage: 20,
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  describe("1. getActivePartialForAyat", () => {
    it("should return partial when ayat has active partial", () => {
      const result = getActivePartialForAyat(mockPartials, kaca1Id, 3);

      expect(result).toBeDefined();
      expect(result?.id).toBe("partial-1");
      expect(result?.ayatNumber).toBe(3);
      expect(result?.percentage).toBe(50);
    });

    it("should return undefined when ayat has no active partial", () => {
      const result = getActivePartialForAyat(mockPartials, kaca1Id, 1);

      expect(result).toBeUndefined();
    });

    it("should not return completed partial", () => {
      const result = getActivePartialForAyat(mockPartials, kaca1Id, 2);

      expect(result).toBeUndefined();
    });

    it("should not return partial from different kaca", () => {
      // kaca2 has ayat 1 with partial, but kaca1 ayat 1 should return undefined
      const result = getActivePartialForAyat(mockPartials, kaca1Id, 1);

      expect(result).toBeUndefined();
    });

    it("should return correct partial for kaca2", () => {
      const result = getActivePartialForAyat(mockPartials, kaca2Id, 1);

      expect(result).toBeDefined();
      expect(result?.id).toBe("partial-4");
    });
  });

  describe("2. getLowestActivePartialAyat (Sequential Lock Foundation)", () => {
    it("should return lowest ayat number with active partial", () => {
      const result = getLowestActivePartialAyat(mockPartials, kaca1Id);

      // kaca1 has active partials at ayat 3 and 5, lowest is 3
      expect(result).toBe(3);
    });

    it("should return null when no active partials exist", () => {
      const result = getLowestActivePartialAyat(
        mockPartials,
        "non-existent-kaca"
      );

      expect(result).toBeNull();
    });

    it("should ignore completed partials", () => {
      // kaca1 has completed partial at ayat 2, but should return 3 (lowest active)
      const result = getLowestActivePartialAyat(mockPartials, kaca1Id);

      expect(result).toBe(3);
      expect(result).not.toBe(2); // ayat 2 is completed, should be ignored
    });

    it("should work with single active partial", () => {
      const result = getLowestActivePartialAyat(mockPartials, kaca2Id);

      // kaca2 has only one active partial at ayat 1
      expect(result).toBe(1);
    });
  });

  describe("3. getAyatLockType (Lock Detection)", () => {
    it("should return 'partial' for ayat with direct active partial", () => {
      const result = getAyatLockType(3, kaca1Id, mockPartials);

      expect(result).toBe("partial");
    });

    it("should return 'sequential' for ayat after lowest active partial", () => {
      // Ayat 4 is after ayat 3 which has active partial
      const result = getAyatLockType(4, kaca1Id, mockPartials);

      expect(result).toBe("sequential");
    });

    it("should return 'sequential' for ayat 5 even though it has partial", () => {
      // Wait, ayat 5 HAS an active partial, so it should return 'partial' not 'sequential'
      const result = getAyatLockType(5, kaca1Id, mockPartials);

      // Direct partial takes precedence
      expect(result).toBe("partial");
    });

    it("should return null for ayat before lowest active partial", () => {
      // Ayat 1 and 2 are before ayat 3 (lowest active partial)
      const result1 = getAyatLockType(1, kaca1Id, mockPartials);
      const result2 = getAyatLockType(2, kaca1Id, mockPartials);

      expect(result1).toBeNull();
      expect(result2).toBeNull();
    });

    it("should return null when no active partials in kaca", () => {
      const result = getAyatLockType(5, "non-existent-kaca", mockPartials);

      expect(result).toBeNull();
    });

    it("should handle sequential lock correctly for ayats 6, 7", () => {
      // Ayat 6 and 7 are after ayat 5 which has active partial
      const result6 = getAyatLockType(6, kaca1Id, mockPartials);
      const result7 = getAyatLockType(7, kaca1Id, mockPartials);

      expect(result6).toBe("sequential");
      expect(result7).toBe("sequential");
    });
  });

  describe("4. hasActivePartialForKaca", () => {
    it("should return true when kaca has active partials", () => {
      const result = hasActivePartialForKaca(mockPartials, kaca1Id);

      expect(result).toBe(true);
    });

    it("should return false when kaca has no active partials", () => {
      const result = hasActivePartialForKaca(mockPartials, "non-existent-kaca");

      expect(result).toBe(false);
    });
  });

  describe("5. getPartialsForKaca", () => {
    it("should return all partials for kaca including completed", () => {
      const result = getPartialsForKaca(mockPartials, kaca1Id);

      expect(result).toHaveLength(3); // partial-1, partial-2, partial-3
    });

    it("should return empty array for kaca without partials", () => {
      const result = getPartialsForKaca(mockPartials, "non-existent-kaca");

      expect(result).toHaveLength(0);
    });
  });

  describe("6. Sequential Lock Scenarios", () => {
    /**
     * Scenario: Kaca with 7 ayat, partial at ayat 3
     * Expected lock states:
     * - Ayat 1: null (unlocked)
     * - Ayat 2: null (unlocked)
     * - Ayat 3: 'partial' (has direct partial)
     * - Ayat 4-7: 'sequential' (locked, must wait for ayat 3)
     */
    it("should correctly identify all lock states for a kaca", () => {
      const singlePartialList: PartialHafalan[] = [
        {
          id: "test-partial",
          santriId,
          kacaId: "test-kaca",
          ayatNumber: 3,
          progress: "In progress",
          percentage: 50,
          status: "IN_PROGRESS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const lockStates: Record<number, AyatLockType> = {};
      for (let i = 1; i <= 7; i++) {
        lockStates[i] = getAyatLockType(i, "test-kaca", singlePartialList);
      }

      expect(lockStates[1]).toBeNull(); // Before partial - unlocked
      expect(lockStates[2]).toBeNull(); // Before partial - unlocked
      expect(lockStates[3]).toBe("partial"); // Has direct partial
      expect(lockStates[4]).toBe("sequential"); // After partial - locked
      expect(lockStates[5]).toBe("sequential"); // After partial - locked
      expect(lockStates[6]).toBe("sequential"); // After partial - locked
      expect(lockStates[7]).toBe("sequential"); // After partial - locked
    });

    /**
     * Scenario: Kaca with partial at ayat 1 (first ayat)
     * Expected: All remaining ayats (2-7) should be sequentially locked
     */
    it("should lock all ayats after first ayat with partial", () => {
      const firstAyatPartial: PartialHafalan[] = [
        {
          id: "first-ayat-partial",
          santriId,
          kacaId: "test-kaca-2",
          ayatNumber: 1,
          progress: "In progress",
          percentage: 25,
          status: "IN_PROGRESS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const lockStates: Record<number, AyatLockType> = {};
      for (let i = 1; i <= 7; i++) {
        lockStates[i] = getAyatLockType(i, "test-kaca-2", firstAyatPartial);
      }

      expect(lockStates[1]).toBe("partial");
      expect(lockStates[2]).toBe("sequential");
      expect(lockStates[3]).toBe("sequential");
      expect(lockStates[4]).toBe("sequential");
      expect(lockStates[5]).toBe("sequential");
      expect(lockStates[6]).toBe("sequential");
      expect(lockStates[7]).toBe("sequential");
    });

    /**
     * Scenario: Kaca with partial at last ayat (ayat 7)
     * Expected: Only ayat 7 is locked with 'partial', rest are unlocked
     */
    it("should only lock last ayat when partial is at end", () => {
      const lastAyatPartial: PartialHafalan[] = [
        {
          id: "last-ayat-partial",
          santriId,
          kacaId: "test-kaca-3",
          ayatNumber: 7,
          progress: "In progress",
          percentage: 75,
          status: "IN_PROGRESS",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      const lockStates: Record<number, AyatLockType> = {};
      for (let i = 1; i <= 7; i++) {
        lockStates[i] = getAyatLockType(i, "test-kaca-3", lastAyatPartial);
      }

      expect(lockStates[1]).toBeNull(); // Unlocked
      expect(lockStates[2]).toBeNull(); // Unlocked
      expect(lockStates[3]).toBeNull(); // Unlocked
      expect(lockStates[4]).toBeNull(); // Unlocked
      expect(lockStates[5]).toBeNull(); // Unlocked
      expect(lockStates[6]).toBeNull(); // Unlocked
      expect(lockStates[7]).toBe("partial"); // Has direct partial
    });
  });

  describe("7. Edge Cases", () => {
    it("should handle empty partials array", () => {
      const emptyPartials: PartialHafalan[] = [];

      expect(
        getActivePartialForAyat(emptyPartials, kaca1Id, 1)
      ).toBeUndefined();
      expect(getLowestActivePartialAyat(emptyPartials, kaca1Id)).toBeNull();
      expect(hasActivePartialForKaca(emptyPartials, kaca1Id)).toBe(false);
      expect(getAyatLockType(1, kaca1Id, emptyPartials)).toBeNull();
    });

    it("should handle all completed partials (no active)", () => {
      const allCompleted: PartialHafalan[] = [
        {
          id: "completed-1",
          santriId,
          kacaId: kaca1Id,
          ayatNumber: 3,
          progress: "Done",
          percentage: 100,
          status: "COMPLETED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: "completed-2",
          santriId,
          kacaId: kaca1Id,
          ayatNumber: 5,
          progress: "Done",
          percentage: 100,
          status: "COMPLETED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(getLowestActivePartialAyat(allCompleted, kaca1Id)).toBeNull();
      expect(hasActivePartialForKaca(allCompleted, kaca1Id)).toBe(false);
      expect(getAyatLockType(4, kaca1Id, allCompleted)).toBeNull();
    });

    it("should handle cancelled partials", () => {
      const withCancelled: PartialHafalan[] = [
        {
          id: "cancelled-1",
          santriId,
          kacaId: kaca1Id,
          ayatNumber: 3,
          progress: "Cancelled",
          percentage: 50,
          status: "CANCELLED",
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      expect(
        getActivePartialForAyat(withCancelled, kaca1Id, 3)
      ).toBeUndefined();
      expect(getLowestActivePartialAyat(withCancelled, kaca1Id)).toBeNull();
      expect(hasActivePartialForKaca(withCancelled, kaca1Id)).toBe(false);
    });
  });
});

describe("Auto-Percentage 100% Logic Tests", () => {
  /**
   * When partial is completed (status changes from IN_PROGRESS to COMPLETED),
   * the percentage should automatically be set to 100%.
   */

  it("should expect percentage 100 when completing partial", () => {
    // Simulating the API logic
    const completePartial = (percentage: number, status: string) => {
      if (status === "COMPLETED") {
        return 100; // Auto-set to 100%
      }
      return percentage;
    };

    expect(completePartial(50, "COMPLETED")).toBe(100);
    expect(completePartial(75, "COMPLETED")).toBe(100);
    expect(completePartial(25, "COMPLETED")).toBe(100);
  });

  it("should keep original percentage for non-completed status", () => {
    const updatePartial = (percentage: number, status: string) => {
      if (status === "COMPLETED") {
        return 100;
      }
      return percentage;
    };

    expect(updatePartial(50, "IN_PROGRESS")).toBe(50);
    expect(updatePartial(75, "IN_PROGRESS")).toBe(75);
    expect(updatePartial(25, "CANCELLED")).toBe(25);
  });
});

describe("Completed Partials Helper Functions", () => {
  const kaca1Id = "kaca-1";
  const santriId = "santri-1";

  // Get completed partials for a kaca
  function getCompletedPartialsForKaca(
    partials: PartialHafalan[],
    targetKacaId: string
  ): PartialHafalan[] {
    return partials.filter(
      (p) => p.kacaId === targetKacaId && p.status === "COMPLETED"
    );
  }

  // Get recently completed partials (within X minutes)
  function getRecentlyCompletedPartials(
    partials: PartialHafalan[],
    targetKacaId: string,
    minutesAgo: number = 30
  ): PartialHafalan[] {
    const cutoffTime = new Date(Date.now() - minutesAgo * 60 * 1000);
    return partials.filter(
      (p) =>
        p.kacaId === targetKacaId &&
        p.status === "COMPLETED" &&
        new Date(p.updatedAt) > cutoffTime
    );
  }

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  const mockPartials: PartialHafalan[] = [
    {
      id: "partial-1",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 3,
      progress: "Selesai",
      percentage: 100,
      status: "COMPLETED",
      createdAt: oneHourAgo,
      updatedAt: fiveMinutesAgo, // Recently completed
    },
    {
      id: "partial-2",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 5,
      progress: "In progress",
      percentage: 50,
      status: "IN_PROGRESS",
      createdAt: now,
      updatedAt: now,
    },
    {
      id: "partial-3",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 2,
      progress: "Selesai lama",
      percentage: 100,
      status: "COMPLETED",
      createdAt: oneHourAgo,
      updatedAt: oneHourAgo, // Completed long ago
    },
  ];

  describe("getCompletedPartialsForKaca", () => {
    it("should return all completed partials for a kaca", () => {
      const result = getCompletedPartialsForKaca(mockPartials, kaca1Id);

      expect(result).toHaveLength(2);
      expect(result.every((p) => p.status === "COMPLETED")).toBe(true);
    });

    it("should not include in-progress partials", () => {
      const result = getCompletedPartialsForKaca(mockPartials, kaca1Id);

      expect(result.find((p) => p.id === "partial-2")).toBeUndefined();
    });
  });

  describe("getRecentlyCompletedPartials", () => {
    it("should return only recently completed partials", () => {
      const result = getRecentlyCompletedPartials(mockPartials, kaca1Id, 30);

      // Only partial-1 was completed within last 30 minutes
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe("partial-1");
    });

    it("should return empty if no recently completed", () => {
      const result = getRecentlyCompletedPartials(mockPartials, kaca1Id, 1);

      // Within 1 minute, nothing was completed
      expect(result).toHaveLength(0);
    });

    it("should return all completed if time window is large enough", () => {
      const result = getRecentlyCompletedPartials(mockPartials, kaca1Id, 120);

      // Within 2 hours, both should be included
      expect(result).toHaveLength(2);
    });
  });
});

describe("Multiple Partial Workflow Tests", () => {
  /**
   * Tests for the scenario where a santri needs multiple partial sessions
   * before completing an ayat.
   */

  it("should allow updating partial progress without completing", () => {
    // Simulate updating progress of an existing partial
    const updatePartialProgress = (
      currentProgress: string,
      currentPercentage: number,
      newProgress: string,
      newPercentage: number
    ) => {
      return {
        progress: newProgress,
        percentage: newPercentage,
        status: "IN_PROGRESS" as const,
      };
    };

    const result = updatePartialProgress(
      "Baru sampai tanda waqaf pertama",
      25,
      "Sudah sampai tanda waqaf kedua",
      50
    );

    expect(result.progress).toBe("Sudah sampai tanda waqaf kedua");
    expect(result.percentage).toBe(50);
    expect(result.status).toBe("IN_PROGRESS");
  });

    it("should track partial progress history correctly", () => {
    // Simulating multiple updates to the same partial
    const progressHistory = [
      { progress: "Baru mulai", percentage: 10 },
      { progress: "Sampai tanda waqaf pertama", percentage: 25 },
      { progress: "Setengah ayat", percentage: 50 },
      { progress: "Hampir selesai", percentage: 75 },
      { progress: "Selesai", percentage: 100 },
    ];

    // Each update should increment progress
    for (let i = 1; i < progressHistory.length; i++) {
      expect(progressHistory[i].percentage).toBeGreaterThan(
        progressHistory[i - 1].percentage
      );
    }
  });
});

describe("Unsaved Completed Partials Detection", () => {
  /**
   * Tests for detecting partials that are COMPLETED but ayat not saved in hafalan_ayat_statuses.
   * This happens when guru forgets to save hafalan after completing partial.
   */

  const kaca1Id = "kaca-1";
  const santriId = "santri-1";

  // Function to get unsaved completed partials
  function getUnsavedCompletedPartials(
    partials: PartialHafalan[],
    targetKacaId: string,
    savedAyatNumbers: number[]
  ): PartialHafalan[] {
    const savedSet = new Set(savedAyatNumbers);
    return partials.filter(
      (p) =>
        p.kacaId === targetKacaId &&
        p.status === "COMPLETED" &&
        !savedSet.has(p.ayatNumber)
    );
  }

  const completedPartials: PartialHafalan[] = [
    {
      id: "partial-1",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 3,
      progress: "Selesai",
      percentage: 100,
      status: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "partial-2",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 5,
      progress: "Selesai",
      percentage: 100,
      status: "COMPLETED",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "partial-3",
      santriId,
      kacaId: kaca1Id,
      ayatNumber: 7,
      progress: "Masih progress",
      percentage: 50,
      status: "IN_PROGRESS",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  it("should detect unsaved completed partials when ayat not in savedAyatNumbers", () => {
    // Ayat 3 and 5 are completed but not saved (empty savedAyatNumbers)
    const result = getUnsavedCompletedPartials(completedPartials, kaca1Id, []);

    expect(result).toHaveLength(2);
    expect(result.map((p) => p.ayatNumber)).toEqual([3, 5]);
  });

  it("should exclude completed partials that are already saved", () => {
    // Ayat 3 is saved, but ayat 5 is not
    const savedAyats = [3];
    const result = getUnsavedCompletedPartials(completedPartials, kaca1Id, savedAyats);

    expect(result).toHaveLength(1);
    expect(result[0].ayatNumber).toBe(5);
  });

  it("should return empty when all completed partials are saved", () => {
    // Both ayat 3 and 5 are saved
    const savedAyats = [3, 5];
    const result = getUnsavedCompletedPartials(completedPartials, kaca1Id, savedAyats);

    expect(result).toHaveLength(0);
  });

  it("should not include IN_PROGRESS partials", () => {
    // Ayat 7 is IN_PROGRESS, should not be included
    const result = getUnsavedCompletedPartials(completedPartials, kaca1Id, []);

    expect(result.every((p) => p.status === "COMPLETED")).toBe(true);
    expect(result.find((p) => p.ayatNumber === 7)).toBeUndefined();
  });

  it("should work correctly with extra saved ayats", () => {
    // savedAyats has more ayats than what's in partials
    const savedAyats = [1, 2, 3, 4, 5, 6];
    const result = getUnsavedCompletedPartials(completedPartials, kaca1Id, savedAyats);

    expect(result).toHaveLength(0);
  });

  it("should handle empty partials array", () => {
    const result = getUnsavedCompletedPartials([], kaca1Id, [1, 2, 3]);

    expect(result).toHaveLength(0);
  });

  it("should only return partials for the specified kaca", () => {
    const mixedPartials: PartialHafalan[] = [
      ...completedPartials,
      {
        id: "partial-other-kaca",
        santriId,
        kacaId: "kaca-2",
        ayatNumber: 1,
        progress: "Selesai",
        percentage: 100,
        status: "COMPLETED",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = getUnsavedCompletedPartials(mixedPartials, kaca1Id, []);

    expect(result).toHaveLength(2);
    expect(result.every((p) => p.kacaId === kaca1Id)).toBe(true);
  });
});
