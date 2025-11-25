// AFLPlayers_MASTER_v12.tsx
// Rebuilt AFL Player Stats stub page.
// - Pure React + Tailwind, no external UI lib imports.
// - Dummy data only.
// - Implements premium blur + Neeko+ unlock CTAs for:
//   1) Running Hot / Going Cold cards
//   2) AI Trend Insights
//   3) Player Comparison
//   4) Master Player Table
//
// Integrate into your app by:
// - Replacing the premiumUser flag with your real auth hook (isPremium).
// - Replacing onUnlockNeekoPlus() with your real navigation (e.g. navigate("/neeko-plus")).

import React, { useState, Fragment } from "react";

// ────────────────────────────────────────────────
// Basic UI stubs (Button, Card, etc.)
// These are simple Tailwind-based components you can swap out.
// ────────────────────────────────────────────────

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
};

const Button: React.FC<ButtonProps> = ({ variant = "primary", className = "", children, ...rest }) => {
  const base =
    "inline-flex items-center justify-center rounded-full px-4 py-2 text-sm font-medium transition-transform duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-400/70 focus:ring-offset-black disabled:opacity-60 disabled:cursor-not-allowed";
  let style = "";
  if (variant === "primary") {
    style = "bg-yellow-400 text-black shadow-[0_0_25px_rgba(250,204,21,0.55)] hover:scale-[1.03] active:scale-[0.97]";
  } else if (variant === "secondary") {
    style = "bg-neutral-800 text-neutral-100 hover:bg-neutral-700/90";
  } else {
    style = "bg-transparent text-neutral-300 hover:bg-neutral-800/70";
  }
  return (
    <button className={`${base} ${style} ${className}`} {...rest}>
      {children}
    </button>
  );
};

const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = "", children }) => (
  <div
    className={`rounded-3xl border border-neutral-800/80 bg-neutral-950/70 shadow-[0_18px_60px_rgba(0,0,0,0.6)] ${className}`}
  >
    {children}
  </div>
);

const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <span
    className={`inline-flex items-center gap-1 rounded-full border border-yellow-400/60 bg-yellow-400/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-yellow-300 ${className}`}
  >
    {children}
  </span>
);

// Lock icon stub
const LockIcon: React.FC<{ className?: string }> = ({ className = "" }) => (
  <span className={`inline-flex h-4 w-4 items-center justify-center rounded-full bg-black/40 text-[10px] ${className}`}>
    🔒
  </span>
);

// Simple sparkline chart
const Sparkline: React.FC<{ values: number[]; accent?: "hot" | "cold" | "neutral" }> = ({
  values,
  accent = "neutral",
}) => {
  if (!values.length) return null;
  const width = 240;
  const height = 60;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max === min ? 1 : max - min;
  const stepX = width / Math.max(values.length - 1, 1);

  const points = values
    .map((v, i) => {
      const x = i * stepX;
      const y = height - ((v - min) / range) * (height - 10) - 5;
      return `${x},${y}`;
    })
    .join(" ");

  const stroke =
    accent === "hot" ? "#22c55e" : accent === "cold" ? "#f97373" : "#e5e7eb";

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-16 w-full">
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.25" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth={2}
        strokeLinejoin="round"
        strokeLinecap="round"
        points={points}
      />
      <polygon
        fill="url(#spark-fill)"
        points={`${points} ${width},${height} 0,${height}`}
      />
    </svg>
  );
};

// ────────────────────────────────────────────────
// Dummy data
// ────────────────────────────────────────────────

type DummyPlayer = {
  id: number;
  name: string;
  pos: string;
  team: string;
  rounds: number[]; // last N games for current stat
};

const teamCodes = ["COLL", "CARL", "ESS", "RICH", "MELB", "SYD", "PORT", "FRE", "BRIS", "HAW"];
const positions = ["MID", "FWD", "DEF", "RUC"];

const makeDummyPlayers = (count: number): DummyPlayer[] => {
  const players: DummyPlayer[] = [];
  for (let i = 1; i <= count; i++) {
    const rounds: number[] = [];
    const base = 28 + (i % 6); // 28–33 baseline
    for (let r = 0; r < 6; r++) {
      const jitter = ((i + r * 7) % 5) - 2; // -2..+2
      rounds.push(base + jitter);
    }
    players.push({
      id: i,
      name: `Player ${i}`,
      pos: positions[i % positions.length],
      team: teamCodes[i % teamCodes.length],
      rounds,
    });
  }
  return players;
};

const allPlayers: DummyPlayer[] = makeDummyPlayers(200);

const statOptions = [
  { value: "disposals", label: "Disposals" },
  { value: "fantasy", label: "Fantasy Points" },
  { value: "marks", label: "Marks" },
  { value: "tackles", label: "Tackles" },
];

const allTeamsFilter = ["All Teams", ...teamCodes];
const allPositionsFilter = ["All Positions", ...positions];
const allRoundsFilter = ["All Rounds", "Opening Round", "R1", "R2", "R3", "R4", "R5"];

// Helpers
const last5Avg = (values: number[]) => {
  const last = values.slice(-5);
  if (!last.length) return 0;
  const sum = last.reduce((a, b) => a + b, 0);
  return Math.round((sum / last.length) * 10) / 10;
};

// ────────────────────────────────────────────────
// Main page component
// ────────────────────────────────────────────────

const AFLPlayersPage: React.FC = () => {
  // Replace this with your real premium flag from auth
  const premiumUser = false;

  const [selectedStat, setSelectedStat] = useState<string>("disposals");

  const [expandedHot, setExpandedHot] = useState<Record<number, boolean>>({});
  const [expandedCold, setExpandedCold] = useState<Record<number, boolean>>({});
  const [expandedTableRows, setExpandedTableRows] = useState<Record<number, boolean>>({});

  const [teamFilter, setTeamFilter] = useState<string>("All Teams");
  const [positionFilter, setPositionFilter] = useState<string>("All Positions");
  const [roundFilter, setRoundFilter] = useState<string>("All Rounds");
  const [compactView, setCompactView] = useState<boolean>(true);
  const [visibleCount, setVisibleCount] = useState<number>(50);

  const onUnlockNeekoPlus = () => {
    // In your real app, navigate to the Neeko+ purchase / pricing page.
    // Example with react-router: navigate("/neeko-plus");
    console.log("Unlock Neeko+ clicked");
  };

  // Hot = higher ids first, Cold = lower ids first (stubbed).
  const sortedAll = [...allPlayers].sort((a, b) => last5Avg(b.rounds) - last5Avg(a.rounds));
  const hotPlayers = sortedAll.slice(0, 20);
  const coldPlayers = [...sortedAll].reverse().slice(0, 20);

  const FREE_HOT_VISIBLE = 4;
  const FREE_COLD_VISIBLE = 4;

  const filteredTableData = allPlayers.filter((p) => {
    if (teamFilter !== "All Teams" && p.team !== teamFilter) return false;
    if (positionFilter !== "All Positions" && p.pos !== positionFilter) return false;
    // roundFilter reserved for real data later
    return true;
  });

  const sortedTableData = [...filteredTableData].sort((a, b) => last5Avg(b.rounds) - last5Avg(a.rounds));
  const tableRows = sortedTableData.slice(0, visibleCount);

  const toggleHotRow = (id: number) => {
    setExpandedHot((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleColdRow = (id: number) => {
    setExpandedCold((prev) => ({ ...prev, [id]: !prev[id] }));
  };
  const toggleTableRow = (id: number) => {
    setExpandedTableRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // ────────────────────────────────────────────────
  // Section 1 – Running Hot / Going Cold
  // ────────────────────────────────────────────────

  const HotColdHeaderAndFilter = () => (
    <div className="mt-10 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-neutral-50">AFL Player Stats</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Live player metrics, trends and AI-backed insights across the last few rounds.
        </p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-[0.16em] text-neutral-500">Stat</span>
        <select
          value={selectedStat}
          onChange={(e) => setSelectedStat(e.target.value)}
          className="min-w-[150px] rounded-full border border-neutral-700 bg-neutral-950/80 px-3 py-1.5 text-sm text-neutral-100 shadow-inner outline-none focus:border-yellow-400"
        >
          {statOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );

  const HotColdSection = () => (
    <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
      {/* Running Hot */}
      <Card className="relative overflow-hidden border-emerald-500/55 bg-gradient-to-b from-emerald-900/40 via-neutral-950 to-black shadow-[0_0_40px_rgba(16,185,129,0.45)]">
        <div className="px-4 pt-4 pb-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/40 bg-emerald-500/10 px-3 py-1.5 backdrop-blur">
            <span className="text-sm text-emerald-100">🔥 Running Hot</span>
          </div>
        </div>

        <ul className="relative z-10 space-y-1.5 px-2 pb-4 text-sm">
          {hotPlayers.map((p, index) => {
            const locked = !premiumUser && index >= FREE_HOT_VISIBLE;
            const avg = last5Avg(p.rounds);
            const values = p.rounds.slice(-5);
            const expanded = !!expandedHot[p.id];

            return (
              <li
                key={p.id}
                className={`rounded-2xl px-2 py-1.5 transition-colors ${
                  locked ? "opacity-80" : "hover:bg-emerald-500/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleHotRow(p.id)}
                  className="flex w-full items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-neutral-50 whitespace-nowrap">
                        {p.name}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                        {p.pos} · {p.team}
                      </span>
                    </div>
                    <span className="text-xs text-emerald-300">Trending up</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-emerald-100">Avg {avg}</span>
                    <span className="text-[11px] text-neutral-400">Last 5</span>
                  </div>
                </button>

                {expanded && (
                  <div className="mt-2 rounded-2xl border border-emerald-500/25 bg-emerald-900/25 px-3 py-2">
                    <Sparkline values={values} accent="hot" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/88 to-black/95 backdrop-blur-2xl">
            <div className="pointer-events-auto">
              <Button onClick={onUnlockNeekoPlus} className="gap-2">
                <LockIcon />
                <span>Unlock all trending players with Neeko+</span>
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Going Cold */}
      <Card className="relative overflow-hidden border-red-500/55 bg-gradient-to-b from-red-900/40 via-neutral-950 to-black shadow-[0_0_40px_rgba(239,68,68,0.55)]">
        <div className="px-4 pt-4 pb-3 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-red-400/40 bg-red-500/10 px-3 py-1.5 backdrop-blur">
            <span className="text-sm text-red-100">❄️ Going Cold</span>
          </div>
        </div>

        <ul className="relative z-10 space-y-1.5 px-2 pb-4 text-sm">
          {coldPlayers.map((p, index) => {
            const locked = !premiumUser && index >= FREE_COLD_VISIBLE;
            const avg = last5Avg(p.rounds);
            const values = p.rounds.slice(-5);
            const expanded = !!expandedCold[p.id];

            return (
              <li
                key={p.id}
                className={`rounded-2xl px-2 py-1.5 transition-colors ${
                  locked ? "opacity-80" : "hover:bg-red-500/10"
                }`}
              >
                <button
                  type="button"
                  onClick={() => toggleColdRow(p.id)}
                  className="flex w-full items-center justify-between gap-4"
                >
                  <div className="flex min-w-0 flex-col gap-0.5 text-left">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-medium text-neutral-50 whitespace-nowrap">
                        {p.name}
                      </span>
                      <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                        {p.pos} · {p.team}
                      </span>
                    </div>
                    <span className="text-xs text-red-300">Trending down</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold text-red-100">Avg {avg}</span>
                    <span className="text-[11px] text-neutral-400">Last 5</span>
                  </div>
                </button>

                {expanded && (
                  <div className="mt-2 rounded-2xl border border-red-500/25 bg-red-900/25 px-3 py-2">
                    <Sparkline values={values} accent="cold" />
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/88 to-black/95 backdrop-blur-2xl">
            <div className="pointer-events-auto">
              <Button onClick={onUnlockNeekoPlus} className="gap-2">
                <LockIcon />
                <span>Unlock all trending players with Neeko+</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );

  // ────────────────────────────────────────────────
  // Section 2 – AI Trend Insights
  // ────────────────────────────────────────────────

  const AIInsightsSection = () => {
    const aiRows = [
      "High-possession mids up in consistency over the last 3 rounds.",
      "Key forwards seeing reduced inside‑50 targets week‑on‑week.",
      "Intercept defenders gaining more uncontested marks across half‑back.",
      "Rucks showing a spike in hit‑out‑to‑advantage impact.",
    ];

    return (
      <Card className="relative mt-10 overflow-hidden border-neutral-700/80 bg-gradient-to-b from-neutral-900/70 to-black">
        <div className="flex items-center justify-between gap-2 border-b border-neutral-800/80 px-5 pt-4 pb-3">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="text-lg">🧠</span>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-neutral-400">
                AI Trend Insights
              </p>
            </div>
            <p className="text-xs text-neutral-500">
              Quick-cut trends generated from the last few rounds to help you spot edges faster.
            </p>
          </div>
          <button
            type="button"
            className="text-xs font-medium text-yellow-300 hover:text-yellow-200 underline-offset-2 hover:underline"
            // In real app, navigate to /ai-analysis
            onClick={() => console.log("View full AI analysis")}
          >
            View full AI analysis
          </button>
        </div>

        <ul className="relative z-10 divide-y divide-neutral-800/80 px-5 pb-4 text-sm">
          {aiRows.map((line, idx) => (
            <li key={idx} className="flex items-center justify-between py-2.5">
              <span className="text-neutral-200">{line}</span>
              <span className={`text-xs ${idx % 2 === 0 ? "text-emerald-400" : "text-red-400"}`}>
                {idx % 2 === 0 ? "▲ 3–6%" : "▼ 2–4%"}
              </span>
            </li>
          ))}
        </ul>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/90 to-black/95 backdrop-blur-2xl">
            <div className="pointer-events-auto">
              <Button onClick={onUnlockNeekoPlus} className="gap-2">
                <LockIcon />
                <span>Unlock all AI Trends with Neeko+</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // ────────────────────────────────────────────────
  // Section 3 – Player Comparison (blur below header + filters)
  // ────────────────────────────────────────────────

  const ComparePlayersSection = () => {
    const [teamLeft, setTeamLeft] = useState<string>("COLL");
    const [teamRight, setTeamRight] = useState<string>("ESS");
    const [playerLeft, setPlayerLeft] = useState<number>(1);
    const [playerRight, setPlayerRight] = useState<number>(2);

    const playersLeft = allPlayers.filter((p) => teamLeft === "All Teams" || p.team === teamLeft);
    const playersRight = allPlayers.filter((p) => teamRight === "All Teams" || p.team === teamRight);

    const selectedLeft = playersLeft.find((p) => p.id === playerLeft) ?? playersLeft[0];
    const selectedRight = playersRight.find((p) => p.id === playerRight) ?? playersRight[0];

    const seriesLeft = selectedLeft?.rounds.slice(-5) ?? [];
    const seriesRight = selectedRight?.rounds.slice(-5) ?? [];

    const statRows = [
      { label: "Avg (last 5)", a: last5Avg(seriesLeft), b: last5Avg(seriesRight) },
      { label: "Best (last 5)", a: Math.max(...seriesLeft, 0), b: Math.max(...seriesRight, 0) },
      { label: "Lowest (last 5)", a: Math.min(...seriesLeft, 0), b: Math.min(...seriesRight, 0) },
    ];

    return (
      <Card className="relative mt-10 overflow-hidden border-neutral-700/80 bg-gradient-to-b from-neutral-950 to-black">
        <div className="border-b border-neutral-800/80 px-5 pt-4 pb-3 flex items-center justify-between gap-3">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">Compare Players</p>
            <p className="text-sm text-neutral-300">
              Side‑by‑side, round‑by‑round player comparison to settle tight calls.
            </p>
          </div>
          <Badge className="bg-yellow-400/5 text-yellow-300 border-yellow-400/60">Neeko+ Feature</Badge>
        </div>

        {/* Filters remain visible above blur */}
        <div className="px-5 pt-3 pb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Left Player — Team</span>
            <select
              value={teamLeft}
              onChange={(e) => setTeamLeft(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-yellow-400"
            >
              {allTeamsFilter.map((t) => (
                <option key={t} value={t === "All Teams" ? "All Teams" : t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={playerLeft}
              onChange={(e) => setPlayerLeft(Number(e.target.value))}
              className="mt-1 rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-yellow-400"
            >
              {playersLeft.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Stat Type</span>
            <select
              value={selectedStat}
              onChange={(e) => setSelectedStat(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-yellow-400"
            >
              {statOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <span className="text-xs text-neutral-500">Right Player — Team</span>
            <select
              value={teamRight}
              onChange={(e) => setTeamRight(e.target.value)}
              className="rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-yellow-400"
            >
              {allTeamsFilter.map((t) => (
                <option key={t} value={t === "All Teams" ? "All Teams" : t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={playerRight}
              onChange={(e) => setPlayerRight(Number(e.target.value))}
              className="mt-1 rounded-xl border border-neutral-700 bg-neutral-950/80 px-3 py-2 text-sm text-neutral-100 outline-none focus:border-yellow-400"
            >
              {playersRight.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Comparison grid under blur for free users */}
        <div className="relative px-5 pb-6">
          <div className="rounded-3xl border border-neutral-800/80 bg-neutral-950/80 px-4 py-4">
            <div className="grid grid-cols-3 items-center gap-3 text-sm text-neutral-200">
              <div className="text-left">
                <p className="text-xs text-neutral-500 mb-1">Left Player</p>
                <p className="font-semibold text-neutral-50">{selectedLeft?.name ?? "--"}</p>
              </div>
              <div className="text-center text-xs uppercase tracking-[0.16em] text-neutral-500">
                Stat Comparison
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-500 mb-1">Right Player</p>
                <p className="font-semibold text-neutral-50">{selectedRight?.name ?? "--"}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {statRows.map((row) => (
                <Fragment key={row.label}>
                  <div className="text-right text-neutral-100">{row.a || "--"}</div>
                  <div className="text-center text-xs text-neutral-500">{row.label}</div>
                  <div className="text-left text-neutral-100">{row.b || "--"}</div>
                </Fragment>
              ))}
            </div>

            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 px-3 py-2">
                <Sparkline values={seriesLeft} accent="hot" />
              </div>
              <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 px-3 py-2">
                <Sparkline values={seriesRight} accent="cold" />
              </div>
            </div>
          </div>

          {!premiumUser && (
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-gradient-to-b from-transparent via-black/90 to-black/95 backdrop-blur-2xl">
              <div className="pointer-events-auto">
                <Button onClick={onUnlockNeekoPlus} className="gap-2">
                  <LockIcon />
                  <span>Unlock Player Comparison — Neeko+</span>
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    );
  };

  // ────────────────────────────────────────────────
  // Section 4 – Master Player Table
  // ────────────────────────────────────────────────

  const MasterTableSection = () => {
    return (
      <Card className="relative mt-10 overflow-hidden border-yellow-500/40 bg-gradient-to-b from-yellow-500/6 via-neutral-950 to-black">
        <div className="border-b border-neutral-800/90 px-5 pt-4 pb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.16em] text-neutral-500 mb-1">
              Master Player Table
            </p>
            <p className="text-sm text-neutral-300">
              Sorted by total over the last 5 games for the selected stat.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Team</span>
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className="rounded-full border border-neutral-700 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-yellow-400"
              >
                {allTeamsFilter.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Pos</span>
              <select
                value={positionFilter}
                onChange={(e) => setPositionFilter(e.target.value)}
                className="rounded-full border border-neutral-700 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-yellow-400"
              >
                {allPositionsFilter.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-neutral-500">Rounds</span>
              <select
                value={roundFilter}
                onChange={(e) => setRoundFilter(e.target.value)}
                className="rounded-full border border-neutral-700 bg-neutral-950/80 px-3 py-1.5 text-xs text-neutral-100 outline-none focus:border-yellow-400"
              >
                {allRoundsFilter.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => setCompactView((v) => !v)}
              className="inline-flex items-center gap-2 rounded-full border border-neutral-700 bg-neutral-900/80 px-3 py-1.5 text-xs text-neutral-100"
            >
              <span className="h-4 w-7 rounded-full bg-neutral-800 flex items-center px-0.5">
                <span
                  className={`h-3 w-3 rounded-full bg-yellow-400 transition-transform ${
                    compactView ? "translate-x-3" : ""
                  }`}
                />
              </span>
              <span>Compact view</span>
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm text-neutral-200">
            <thead className="bg-neutral-900/80 text-xs uppercase tracking-[0.12em] text-neutral-500">
              <tr>
                <th className="px-4 py-3 font-medium whitespace-nowrap">Player</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Pos</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Team</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Min (L5)</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Max (L5)</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Avg (L5)</th>
                <th className="px-3 py-3 font-medium whitespace-nowrap">Total (L5)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/90">
              {tableRows.map((p) => {
                const values = p.rounds.slice(-5);
                const min = Math.min(...values);
                const max = Math.max(...values);
                const avg = last5Avg(values);
                const total = values.reduce((a, b) => a + b, 0);
                const expanded = !!expandedTableRows[p.id];

                return (
                  <Fragment key={p.id}>
                    <tr className="hover:bg-neutral-900/70">
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleTableRow(p.id)}
                          className="flex items-center gap-2 text-left"
                        >
                          <span className="text-xs text-neutral-500">▶</span>
                          <span className="whitespace-nowrap text-sm text-neutral-50">{p.name}</span>
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-xs text-neutral-400 whitespace-nowrap">{p.pos}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-400 whitespace-nowrap">{p.team}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-300">{min}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-300">{max}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-300">{avg}</td>
                      <td className="px-3 py-2.5 text-xs text-neutral-300">{total}</td>
                    </tr>
                    {expanded && (
                      <tr className="bg-neutral-950/90">
                        <td colSpan={7} className="px-4 pb-3 pt-1">
                          <div className="rounded-2xl border border-neutral-800/80 bg-neutral-900/70 px-4 py-3">
                            <Sparkline values={values} accent="neutral" />
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="px-5 pb-5 pt-3 flex items-center justify-center">
          {visibleCount < sortedTableData.length && (
            <Button
              variant="secondary"
              onClick={() => setVisibleCount((prev) => prev + 50)}
              className="px-5"
            >
              Show more players
            </Button>
          )}
        </div>

        {!premiumUser && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-40 flex items-end justify-center bg-gradient-to-b from-transparent via-black/88 to-black/98 backdrop-blur-2xl">
            <div className="pointer-events-auto pb-6">
              <Button onClick={onUnlockNeekoPlus} className="gap-2">
                <LockIcon />
                <span>Unlock all players with Neeko+</span>
              </Button>
            </div>
          </div>
        )}
      </Card>
    );
  };

  // ────────────────────────────────────────────────

  return (
    <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-16 pt-10 text-neutral-50">
      <HotColdHeaderAndFilter />
      <HotColdSection />
      <AIInsightsSection />
      <ComparePlayersSection />
      <MasterTableSection />
    </div>
  );
};

export default AFLPlayersPage;
