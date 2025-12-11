export const STAT_CONFIG = {
  Fantasy: {
    label: "Fantasy",
    valueUnitShort: "pts",
    thresholds: [60, 70, 80, 90, 100],
  },
  Disposals: {
    label: "Disposals",
    valueUnitShort: "disp",
    thresholds: [15, 20, 25, 30, 35],
  },
  Goals: {
    label: "Goals",
    valueUnitShort: "g",
    thresholds: [1, 2, 3, 4, 5],
  },
} as const;