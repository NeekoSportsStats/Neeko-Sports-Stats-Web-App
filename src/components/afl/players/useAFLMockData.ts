import { useMemo } from "react";

export type StatKey = "fantasy" | "disposals" | "goals";
export type Position = "MID" | "FWD" | "DEF" | "RUC";

export interface Player {
  id: number;
  name: string;
  pos: Position;
  team: string;
  rounds: number[];
}

export const TEAM_OPTIONS = [
  "All",
  "COLL",
  "ESS",
  "SYD",
  "CARL",
  "GEEL",
  "MELB",
  "RICH",
];

export const POSITION_OPTIONS = ["All", "MID", "FWD", "DEF", "RUC"];

export const ROUND_OPTIONS = ["All", "OR", "R1", "R2", "R3", "R4", "R5"];

export const YEARS = [2025, 2024, 2023, 2022];

function generatePlayers(): Player[] {
  return Array.from({ length: 120 }).map((_, i) => {
    const base = 80 + (i % 15);
    const pos = ["MID", "FWD", "DEF", "RUC"][i % 4] as Position;
    const team = ["COLL", "ESS", "SYD", "CARL", "GEEL", "MELB", "RICH"][i % 7];

    const rounds = [
      base - 10 + (i % 5),
      base - 5 + (i % 4),
      base + 3 - (i % 6),
      base + 8 - (i % 7),
      base + 1 + (i % 3),
      base + 4 - (i % 2),
    ];

    return { id: i + 1, name: `Player ${i + 1}`, pos, team, rounds };
  });
}

export const lastN = (s: number[], n: number) => s.slice(-n);

export const average = (s: number[]) =>
  s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0;

export function stdDev(values: number[]) {
  if (values.length <= 1) return 0;
  const avg = average(values);
  const variance =
    values.reduce((s, v) => s + (v - avg) ** 2, 0) / (values.length - 1);
  return Math.sqrt(variance);
}

export function getSeriesForStat(p: Player, stat: StatKey) {
  const base = p.rounds;
  if (stat === "fantasy") return base;
  if (stat === "disposals") return base.map((v) => Math.round(v / 1.5));
  if (stat === "goals")
    return base.map((v) => Math.max(0, Math.round((v - 60) / 15)));
  return base;
}

export function stabilityMeta(vol: number) {
  if (vol < 4)
    return {
      label: "Rock solid",
      colour: "text-emerald-400",
      reason: "Reliable scoring floor.",
    };
  if (vol < 8)
    return {
      label: "Steady",
      colour: "text-emerald-300",
      reason: "Low movement week to week.",
    };
  if (vol < 12)
    return {
      label: "Swingy",
      colour: "text-amber-300",
      reason: "Matchup dependent swings.",
    };
  return {
    label: "Rollercoaster",
    colour: "text-red-400",
    reason: "High upside, high risk.",
  };
}

export function useAFLMockPlayers(): Player[] {
  return useMemo(() => generatePlayers(), []);
}
