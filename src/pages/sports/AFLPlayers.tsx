// AFLPlayers.tsx — Rebuilt to match Matthew's player-page criteria
// NOTE: This version uses local UI stubs so it runs in this sandbox.
// In your real app, replace the stubs with:
//   import { Button } from "@/components/ui/button";
//   import { ArrowLeft, Flame, Snowflake, Lock, TrendingUp, TrendingDown } from "lucide-react";
//   import { useAuth } from "@/lib/auth";
//   import { useNavigate } from "react-router-dom";

import { useState, useEffect, useRef, Fragment } from "react";

// ────────────────────────────────────────────────
// UI STUBS (for canvas / preview)
// ────────────────────────────────────────────────
const Button = ({ children, onClick, className = "" }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-medium bg-neutral-800 hover:bg-neutral-700 text-white ${className}`}
  >
    {children}
  </button>
);

const ArrowLeftIcon = () => <span className="mr-2">←</span>;

const LockIcon = () => (
  <span className="inline-flex items-center justify-center w-4 h-4 mr-1 text-[10px] rounded-full border border-yellow-400/60 text-yellow-300">
    🔒
  </span>
);

// Simple sparkline stub
const Sparkline = () => (
  <svg width="160" height="40" className="overflow-visible">
    <polyline
      fill="none"
      stroke="#22c55e"
      strokeWidth="2"
      points="0,26 20,22 40,18 60,20 80,14 100,10 120,12 140,8 160,10"
    />
  </svg>
);

// Fake auth stub (replace with real useAuth in your app)
function useAuth() {
  return { isPremium: false }; // toggle to true to see premium state
}

// ────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────
const thresholdsMap: Record<string, { low: number; mid: number; high: number }> = {
  disposals: { low: 15, mid: 20, high: 25 },
  goals: { low: 1, mid: 2, high: 3 },
  fantasy: { low: 80, mid: 100, high: 120 },
  marks: { low: 4, mid: 6, high: 8 },
  tackles: { low: 3, mid: 6, high: 8 },
};

function computePerc(values: number[], type: string) {
  const t = thresholdsMap[type] ?? thresholdsMap.disposals;
  const played = values.filter((v) => v != null && !Number.isNaN(v));
  const games = played.length;
  if (!games) return { pLow: 0, pMid: 0, pHigh: 0 };

  const pLow = Math.round((played.filter((v) => v >= t.low).length / games) * 100);
  const pMid = Math.round((played.filter((v) => v >= t.mid).length / games) * 100);
  const pHigh = Math.round((played.filter((v) => v >= t.high).length / games) * 100);

  return { pLow, pMid, pHigh };
}

function percentColor(p: number) {
  if (p >= 80) return "bg-emerald-500";
  if (p >= 60) return "bg-lime-400";
  if (p >= 40) return "bg-amber-400";
  return "bg-red-500";
}

// Animated % ticker
const AnimatedPercent = ({ value }: { value: number }) => {
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    let frame: number;
    const step = () => {
      setDisplay((d) => {
        if (d >= value) return value;
        const delta = Math.max(1, Math.ceil(value / 20));
        return Math.min(value, d + delta);
      });
      frame = requestAnimationFrame(step);
    };
    step();
    return () => cancelAnimationFrame(frame);
  }, [value]);

  return <span className="tabular-nums">{display}%</span>;
};

const PercentCell = ({ value }: { value: number }) => (
  <div className="flex items-center gap-2">
    <div className="h-1.5 w-12 bg-neutral-800 rounded overflow-hidden">
      <div
        className={`h-full ${percentColor(value)}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
    <AnimatedPercent value={value} />
  </div>
);

// ────────────────────────────────────────────────
// Main Component
// ────────────────────────────────────────────────

interface DummyPlayer {
  id: number;
  name: string;
  pos: string;
  team: string;
  rounds: number[]; // OR, R1, R2, ...
}

export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = !!isPremium;

  const [selectedStat, setSelectedStat] = useState<string>("disposals");
  const [compactMode, setCompactMode] = useState<boolean>(true);
  const [compareMode, setCompareMode] = useState<boolean>(false);
  const [expandedRows, setExpandedRows] = useState<Record<number, boolean>>({});

  const toggleRow = (id: number) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // Dummy data: 200 players, 6 rounds
  const fullData: DummyPlayer[] = Array.from({ length: 200 }).map((_, idx) => {
    const base = 30 - (idx % 7);
    return {
      id: idx + 1,
      name: `Player ${idx + 1}`,
      pos: idx % 4 === 0 ? "RUC" : idx % 3 === 0 ? "DEF" : idx % 2 ? "MID" : "FWD",
      team: ["COLL", "ESS", "SYD", "CARL"][idx % 4],
      rounds: [base, base + 2, base - 1, base + 3, base - 2, base + 1],
    };
  });

  // Infinite scroll
  const [visibleCount, setVisibleCount] = useState<number>(40);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((v) => Math.min(v + 40, fullData.length));
        }
      },
      { threshold: 1 }
    );

    if (loadMoreRef.current) observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [fullData.length]);

  const masterData = fullData.slice(0, visibleCount);

  // For top/cold cards – simple sort by average of rounds
  const sortedByForm = [...fullData].sort((a, b) => {
    const avgA = a.rounds.reduce((s, v) => s + v, 0) / a.rounds.length;
    const avgB = b.rounds.reduce((s, v) => s + v, 0) / a.rounds.length;
    return avgB - avgA;
  });

  const hotPlayers = sortedByForm.slice(0, 10);
  const coldPlayers = [...sortedByForm].reverse().slice(0, 10);

  const freeHotVisible = 4;
  const freeAIVisible = 4;
  const freeMasterRows = 15; // rows fully clear before blur/lock for free users

  const statOptions = [
    { value: "disposals", label: "Disposals" },
    { value: "goals", label: "Goals" },
    { value: "fantasy", label: "Fantasy" },
    { value: "marks", label: "Marks" },
    { value: "tackles", label: "Tackles" },
  ];

  const isStatLocked = (value: string) => {
    // Free users: only Disposals, Goals, Fantasy enabled; others greyed
    if (premiumUser) return false;
    return !["disposals", "goals", "fantasy"].includes(value);
  };

  // AI insight dummy data
  const aiInsights = [
    {
      id: 1,
      text: "High-possession mids up in consistency over the last 3 rounds",
      value: +6,
    },
    {
      id: 2,
      text: "Key forwards seeing reduced inside-50 targets week-on-week",
      value: -4,
    },
    {
      id: 3,
      text: "Intercept defenders gaining more uncontested marks across half-back",
      value: +3,
    },
    {
      id: 4,
      text: "Rucks showing a spike in hit-out-to-advantage impact",
      value: +2,
    },
    {
      id: 5,
      text: "Tackling pressure slightly down in contested situations",
      value: -2,
    },
    {
      id: 6,
      text: "Outside runners increasing uncontested chains through the corridor",
      value: +5,
    },
    {
      id: 7,
      text: "Small forwards seeing volatile role changes impacting scoreboard",
      value: -3,
    },
    {
      id: 8,
      text: "Inside mids stabilising time-on-ground after early-season fluctuations",
      value: +4,
    },
    {
      id: 9,
      text: "Half-backs slightly down on rebound 50 involvement",
      value: -1,
    },
    {
      id: 10,
      text: "Tagging roles creating sharp dips in elite mid output",
      value: -5,
    },
  ];

  const TopBottomSection = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {/* Running Hot */}
      <div className="relative rounded-xl border border-emerald-500/40 bg-gradient-to-br from-emerald-950/70 via-emerald-900/40 to-emerald-700/10 p-4 shadow-[0_0_25px_rgba(16,185,129,0.25)]">
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-emerald-400/50 bg-emerald-600/15 px-3 py-1.5 backdrop-blur">
          <span className="text-sm">🔥 Running Hot</span>
          <span className="text-[11px] text-emerald-200">Top 10 by recent form</span>
        </div>

        <ul className="space-y-2 text-sm">
