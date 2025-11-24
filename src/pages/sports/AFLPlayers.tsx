// AFLPlayers.tsx — Clean rewritten version
// Features:
// - Infinite scroll (40 → load more)
// - Team / Position / Stat filters (UI only for now)
// - Compact mode (hide round columns)
// - Compare mode toggle (stub)
// - Premium rows with blur + Neeko+ CTA overlay (per-row, not full page)
// - Row dropdown: animated sparkline + AI trend text (full-width row)

import { useState, useEffect, useRef } from "react";

// ---- STUB COMPONENTS (replace with real imports in app) ----
const Button = ({ children, onClick }) => (
  <button onClick={onClick} className="px-3 py-2 bg-neutral-800 rounded text-white">
    {children}
  </button>
);

const ArrowLeft = () => <span>{"<-"}</span>;

const Sparkline = () => (
  <svg width="160" height="32">
    <polyline
      fill="none"
      stroke="#10b981"
      strokeWidth="2"
      points="0,24 20,18 40,12 60,16 80,10 100,8 120,12 140,6 160,4"
    />
  </svg>
);

const PremiumOverlay = () => (
  <div className="absolute inset-0 bg-black/55 backdrop-blur-sm flex items-center justify-center rounded-md pointer-events-auto animate-pulse">
    <a
      href="/neeko-plus"
      className="px-2 py-1 rounded text-[10px] font-semibold shadow whitespace-nowrap flex items-center gap-1 bg-yellow-400 text-black hover:bg-yellow-300 transition-transform duration-200 hover:scale-105 ring-2 ring-yellow-300/60"
    >
      <span className="text-yellow-700">🔒</span>
      Unlock Neeko+
    </a>
  </div>
);

function useAuth() {
  return { isPremium: false };
}

const Shimmer = () => (
  <div className="w-full h-3 rounded bg-neutral-800 animate-pulse" />
);

// ---- MAIN COMPONENT ----
export default function AFLPlayers() {
  const { isPremium } = useAuth();
  const premiumUser = isPremium ?? false;

  const [loading] = useState(false);
  const [selectedStat, setSelectedStat] = useState("disposals");
  const [compactMode, setCompactMode] = useState(true);
  const [compareMode, setCompareMode] = useState(false);

  // 🔥 Row expansion state for dropdown
  const [expandedRows, setExpandedRows] = useState({});
  const toggleRow = (id) => {
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ---- Dummy Data (200 rows for infinite scroll demonstration) ----
  const fullData = Array.from({ length: 200 }).map((_, idx) => ({
    id: idx + 1,
    name: `Player ${idx + 1}`,
    pos: idx % 4 === 0 ? "RUC" : idx % 3 === 0 ? "DEF" : idx % 2 ? "MID" : "FWD",
    team: idx % 3 === 0 ? "COLL" : idx % 3 === 1 ? "ESS" : "SYD",
    rounds: [30, 28, 26, 25, 29, 27].map((v) => v - (idx % 5)),
    isPremiumRow: idx >= 40, // first 40 rows free
  }));

  // ---- INFINITE SCROLL ----
  const [visibleCount, setVisibleCount] = useState(40);
  const loadMoreRef = useRef(null);

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
    // ✅ Correct cleanup function
    return () => observer.disconnect();
  }, [fullData.length]);

  const masterData = fullData.slice(0, visibleCount);

  // ---- Table Logic ----
  const thresholds = {
    disposals: { low: 15, mid: 20, high: 25 },
    goals: { low: 1, mid: 2, high: 3 },
    fantasy: { low: 80, mid: 100, high: 120 },
  };

  function computePerc(values, type) {
    const t = thresholds[type] || thresholds.disposals;
    const played = values.filter((v) => v !== null && v !== undefined);
    const g = played.length;
    if (!g) return { p80: 0, p90: 0, p100: 0 };
    return {
      p80: Math.round((played.filter((v) => v >= t.low).length / g) * 100),
      p90: Math.round((played.filter((v) => v >= t.mid).length / g) * 100),
      p100: Math.round((played.filter((v) => v >= t.high).length / g) * 100),
    };
  }

  function getColor(p) {
    if (p >= 80) return "bg-emerald-500";
    if (p >= 60) return "bg-lime-400";
    if (p >= 40) return "bg-amber-400";
    return "bg-red-500";
  }

  const PercentCell = ({ value }) => (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-10 bg-neutral-800 rounded overflow-hidden">
        <div className={`h-full ${getColor(value)}`} style={{ width: `${value}%` }} />
      </div>
      <span className="text-xs text-neutral-200">{value}%</span>
    </div>
  );

  // ---- MASTER TABLE ----
  const MasterTable = () => (
    <div className="rounded-xl bg-neutral-900 border border-neutral-800 p-4 mt-6 relative">
      <div className="flex items-center justify-between mb-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-neutral-400 text-sm">Team:</span>
          <select className="bg-neutral-800 border border-neutral-700 rounded p-2 text-sm">
            <option>All Teams</option>
            <option>COLL</option>
            <option>ESS</option>
            <option>SYD</option>
          </select>

          <span className="text-neutral-400 text-sm">Position:</span>
          <select className="bg-neutral-800 border border-neutral-700 rounded p-2 text-sm">
            <option>All Positions</option>
            <option>FWD</option>
            <option>MID</option>
            <option>DEF</option>
            <option>RUC</option>
          </select>

          <span className="text-neutral-400 text-sm">Stat Type:</span>
          <select
            value={selectedStat}
            onChange={(e) => setSelectedStat(e.target.value)}
            className="bg-neutral-800 border border-neutral-700 rounded p-2 text-sm"
          >
            <option value="disposals">Disposals</option>
            <option value="goals">Goals</option>
            <option value="fantasy">Fantasy</option>
          </select>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={compactMode}
              onChange={() => setCompactMode(!compactMode)}
            />
            Compact Mode
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={compareMode}
              onChange={() => setCompareMode(!compareMode)}
            />
            Compare Mode
          </label>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead>
            <tr className="border-b border-neutral-800">
              <th className="p-2">Player</th>
              <th className="p-2">Pos</th>
              <th className="p-2">Team</th>
              {/* Round columns */}
              {!compactMode &&
                masterData[0].rounds.map((_, i) => (
                  <th key={i} className="p-2">
                    R{i + 1}
                  </th>
                ))}
              <th className="p-2">80%+</th>
              <th className="p-2">90%+</th>
              <th className="p-2">100%+</th>
            </tr>
          </thead>

          <tbody>
            {masterData.map((p) => {
              const locked = !premiumUser && p.isPremiumRow;
              const { p80, p90, p100 } = computePerc(p.rounds, selectedStat);
              const isOpen = expandedRows[p.id];

              return (
                <>
                  {/* MAIN ROW */}
                  <tr key={p.id} className="border-b border-neutral-800 relative">
                    <td
                      className="p-2 cursor-pointer"
                      onClick={() => toggleRow(p.id)}
                    >
                      {isOpen ? "▼" : "▶"} {p.name}
                    </td>
                    <td className="p-2">{p.pos}</td>
                    <td className="p-2">{p.team}</td>

                    {/* Round values */}
                    {!compactMode &&
                      p.rounds.map((r, i) => (
                        <td
                          key={i}
                          className={locked ? "p-2 text-neutral-400 blur-[1px]" : "p-2"}
                        >
                          {r}
                        </td>
                      ))}

                    <td className="p-2 relative">
                      <PercentCell value={p80} />
                      {locked && <PremiumOverlay />}
                    </td>
                    <td className="p-2">
                      <PercentCell value={p90} />
                    </td>
                    <td className="p-2">
                      <PercentCell value={p100} />
                    </td>
                  </tr>

                  {/* EXPANDED ROW CONTENT */}
                  {isOpen && (
                    <tr
                      key={`expand-${p.id}`}
                      className="bg-neutral-900/40 border-b border-neutral-800"
                    >
                      <td
                        colSpan={
                          3 + (compactMode ? 0 : masterData[0].rounds.length) + 3
                        }
                        className="p-4"
                      >
                        <div className="space-y-3">
                          <div className="w-full">
                            <Sparkline />
                          </div>
                          <div className="text-xs text-neutral-300 space-y-1">
                            <p>
                              • Trending upward: +12% form improvement over the last
                              3 rounds.
                            </p>
                            <p>
                              • Consistency rating: 82% — classified as a stable
                              performer with occasional spike games.
                            </p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Infinite Scroll Trigger */}
      <div
        ref={loadMoreRef}
        className="py-6 text-center text-neutral-500 text-sm"
      >
        Loading more...
      </div>
    </div>
  );

  // ---- PAGE UI (Top Performers + AI + Table) ----
  return (
    <div className="container mx-auto px-4 py-8 text-white">
      <Button>
        <ArrowLeft /> Back
      </Button>

      {/* Top/Bottom sections (simple placeholders for now) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-8">
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          🔥 Running Hot
        </div>
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4">
          ❄️ Going Cold
        </div>
      </div>

      {/* AI Insights Box (placeholder text) */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mt-8">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">AI Trend Insights</h2>
          <a
            href="#"
            className="text-xs text-yellow-400 hover:underline"
          >
            View full AI analysis →
          </a>
        </div>
        <p className="text-xs text-neutral-300">
          Short, punchy AI-generated summaries about player form and trends will
          appear here.
        </p>
      </div>

      {/* MASTER TABLE */}
      {loading ? <Shimmer /> : <MasterTable />}
    </div>
  );
}
