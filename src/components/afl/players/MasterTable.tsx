// src/components/afl/players/MasterTable.tsx

import React, { useState } from "react";
import { ChevronRight, ChevronDown, Sparkles } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";

// -----------------------------------------------------------------------------
// Types & Mock Data
// -----------------------------------------------------------------------------

type HitRates = {
  band90: number;
  band95: number;
  band100: number;
  band105: number;
  band110: number;
};

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  orScore: number;
  rounds: number[]; // R1–R23
  min: number;
  max: number;
  avg: number;
  total: number;
  hitRates: HitRates;
};

const ROUND_LABELS = Array.from({ length: 23 }, (_, i) => `R${i + 1}`);

const MOCK_PLAYERS: PlayerRow[] = Array.from({ length: 40 }).map((_, index) => {
  const base = 85 + (index % 10);
  const rounds = ROUND_LABELS.map(() => base + Math.round(Math.random() * 20 - 10));
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((a, b) => a + b, 0);
  const avg = Math.round((total / rounds.length) * 10) / 10;

  const hit = (t: number) =>
    Math.round((rounds.filter((r) => r >= t).length / rounds.length) * 100);

  return {
    id: index + 1,
    name: `Player ${index + 1}`,
    team: ["GEEL", "CARL", "RICH", "ESS", "COLL", "NMFC"][index % 6],
    role: ["MID", "RUC", "FWD", "DEF"][index % 4],
    orScore: base + 10,
    rounds,
    min,
    max,
    avg,
    total,
    hitRates: {
      band90: hit(90),
      band95: hit(95),
      band100: hit(100),
      band105: hit(105),
      band110: hit(110),
    },
  };
});

// -----------------------------------------------------------------------------
// Main Component
// -----------------------------------------------------------------------------

export const MasterTable: React.FC = () => {
  const [compactMode, setCompactMode] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <section
      id="master-table"
      className="relative mt-16 mb-24 rounded-[32px] border border-yellow-500/15 bg-neutral-950 px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)] sm:px-8"
    >
      {/* HEADER */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-yellow-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-yellow-200">
            <Sparkles className="h-3 w-3" />
            <span>Master Table</span>
          </div>

          <h2 className="mt-3 text-2xl font-semibold text-neutral-50 sm:text-3xl">
            Full-season player ledger &amp; hit-rate grid
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-neutral-300">
            Every player's round-by-round output, totals and hit-rates across key thresholds.
          </p>
        </div>

        {/* CONTROLS */}
        <div className="flex flex-col gap-4 md:items-end">
          <div className="flex items-center gap-3 rounded-full border border-neutral-700 bg-black/70 px-3 py-1.5 text-[11px] text-neutral-300">
            <span className="font-medium text-neutral-100">Full Grid</span>
            <Switch
              checked={compactMode}
              onCheckedChange={setCompactMode}
              className="data-[state=checked]:bg-yellow-400"
            />
            <span className="font-medium text-neutral-100">Compact</span>
          </div>
        </div>
      </div>

      {/* TABLES */}
      <div className="mt-8 hidden md:block">
        {compactMode ? (
          <DesktopCompactTable players={MOCK_PLAYERS} expanded={expanded} setExpanded={setExpanded} />
        ) : (
          <DesktopFullTable players={MOCK_PLAYERS} expanded={expanded} setExpanded={setExpanded} />
        )}
      </div>

      {/* MOBILE */}
      <div className="mt-6 space-y-3 md:hidden">
        <MobileTable players={MOCK_PLAYERS} expanded={expanded} setExpanded={setExpanded} />
      </div>
    </section>
  );
};

// -----------------------------------------------------------------------------
// Desktop Full Table
// -----------------------------------------------------------------------------

type DesktopProps = {
  players: PlayerRow[];
  expanded: number | null;
  setExpanded: (id: number | null) => void;
};

const DesktopFullTable: React.FC<DesktopProps> = ({ players, expanded, setExpanded }) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0">

          {/* HEADER */}
          <thead className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
            <tr>
              <th className="sticky left-0 z-30 w-64 border-b border-neutral-800 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                Player
              </th>

              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400">
                OR
              </th>

              {ROUND_LABELS.map((r) => (
                <th
                  key={r}
                  className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400"
                >
                  {r}
                </th>
              ))}

              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400">Min</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400">Max</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400">Avg</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-neutral-400">Total</th>

              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-emerald-300">90+</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-emerald-300">95+</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-emerald-300">100+</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-emerald-300">105+</th>
              <th className="border-b border-neutral-800 px-2 py-3 text-[10px] text-emerald-300">110+</th>
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-neutral-900">
            {players.map((p, idx) => {
              const isOpen = expanded === p.id;

              return (
                <>
                  <tr
                    key={p.id}
                    className={`cursor-pointer transition-colors ${
                      isOpen ? "bg-neutral-900/70" : "hover:bg-neutral-900/40"
                    }`}
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                  >
                    {/* Player column */}
                    <td className="sticky left-0 z-10 w-64 border-r border-neutral-900 bg-black/95 px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-[10px] text-neutral-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-[13px] font-medium text-neutral-50">{p.name}</div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                            {p.team} • {p.role}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 text-yellow-300" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                    </td>

                    {/* Row values */}
                    <BodyNumbers p={p} />
                  </tr>

                  {/* INLINE DROPDOWN */}
                  {isOpen && (
                    <tr>
                      <td colSpan={100} className="px-6 py-4">
                        <InlineDropdown player={p} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Desktop Compact Table
// -----------------------------------------------------------------------------

const DesktopCompactTable: React.FC<DesktopProps> = ({
  players,
  expanded,
  setExpanded,
}) => {
  return (
    <div className="overflow-hidden rounded-3xl border border-neutral-800 bg-neutral-950">
      <div className="overflow-x-auto">
        <table className="w-full table-fixed border-separate border-spacing-0">

          {/* HEADER */}
          <thead className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
            <tr>
              <th className="sticky left-0 z-30 w-64 border-b border-neutral-800 bg-black/95 px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em] text-neutral-300">
                Player
              </th>

              <Header compact label="Min" />
              <Header compact label="Max" />
              <Header compact label="Avg" />
              <Header compact label="Total" />
              <Header compact label="90+" accent />
              <Header compact label="95+" accent />
              <Header compact label="100+" accent />
              <Header compact label="105+" accent />
              <Header compact label="110+" accent />
            </tr>
          </thead>

          {/* BODY */}
          <tbody className="divide-y divide-neutral-900">
            {players.map((p, idx) => {
              const isOpen = expanded === p.id;

              return (
                <>
                  <tr
                    key={p.id}
                    className={`cursor-pointer transition-colors ${
                      isOpen ? "bg-neutral-900/70" : "hover:bg-neutral-900/40"
                    }`}
                    onClick={() => setExpanded(isOpen ? null : p.id)}
                  >
                    <td className="sticky left-0 z-10 w-64 border-r border-neutral-900 bg-black/95 px-4 py-2">
                      <div className="flex items-center gap-3">
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-[10px] text-neutral-300">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="text-[13px] font-medium text-neutral-50">{p.name}</div>
                          <div className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                            {p.team} • {p.role}
                          </div>
                        </div>
                        {isOpen ? (
                          <ChevronDown className="ml-auto h-4 w-4 text-yellow-300" />
                        ) : (
                          <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
                        )}
                      </div>
                    </td>

                    <CompactNumbers p={p} />
                  </tr>

                  {isOpen && (
                    <tr>
                      <td colSpan={100} className="px-6 py-4">
                        <InlineDropdown player={p} />
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Mobile Table
// -----------------------------------------------------------------------------

type MobileProps = {
  players: PlayerRow[];
  expanded: number | null;
  setExpanded: (id: number | null) => void;
};

const MobileTable: React.FC<MobileProps> = ({ players, expanded, setExpanded }) => {
  return (
    <>
      {players.map((p, idx) => {
        const isOpen = expanded === p.id;

        return (
          <div
            key={p.id}
            className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4 text-xs text-neutral-100"
          >
            {/* HEADER */}
            <div
              className="flex items-center gap-3 cursor-pointer"
              onClick={() => setExpanded(isOpen ? null : p.id)}
            >
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-neutral-700 bg-neutral-950 text-[10px] text-neutral-300">
                {idx + 1}
              </span>

              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] font-medium text-neutral-50">{p.name}</span>
                  {isOpen ? (
                    <ChevronDown className="h-4 w-4 text-yellow-300" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-neutral-500" />
                  )}
                </div>
                <div className="mt-1 text-[10px] text-neutral-400 uppercase tracking-[0.16em]">
                  {p.team} • {p.role}
                </div>
              </div>
            </div>

            {/* INLINE DROPDOWN */}
            {isOpen && (
              <div className="mt-3">
                <InlineDropdown player={p} mobile />
              </div>
            )}
          </div>
        );
      })}
    </>
  );
};

// -----------------------------------------------------------------------------
// Inline Dropdown (Shared: Desktop + Compact + Mobile)
// -----------------------------------------------------------------------------

const InlineDropdown: React.FC<{ player: PlayerRow; mobile?: boolean }> = ({
  player,
  mobile = false,
}) => {
  return (
    <div className="rounded-xl border border-neutral-800 bg-neutral-900 p-4">

      {/* TOP ROW: CI + Sparkline */}
      <div
        className={`flex ${
          mobile
            ? "flex-col gap-4"
            : "flex-col gap-4 lg:flex-row lg:justify-between lg:items-start"
        }`}
      >
        {/* CI CARD */}
        <div
          className={`rounded-lg border border-yellow-400/30 bg-yellow-500/10 p-4 ${
            mobile ? "w-full" : "lg:w-1/3"
          }`}
        >
          <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-yellow-100">
            <span>Confidence Index</span>
            <span>{Math.max(player.hitRates.band100, 78)}%</span>
          </div>

          <p className="mt-2 text-[11px] text-neutral-200 leading-snug">
            Measures scoring consistency & volatility distribution across the season.
          </p>

          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full rounded-full bg-lime-400"
              style={{ width: `${Math.max(player.hitRates.band100, 78)}%` }}
            />
          </div>
        </div>

        {/* SPARKLINE */}
        <div
          className={`rounded-lg border border-neutral-700 bg-neutral-900 p-3 ${
            mobile ? "w-full" : "lg:w-2/3"
          }`}
        >
          <div className="text-[10px] uppercase tracking-[0.12em] text-neutral-400 mb-2">
            Recent Form Sparkline
          </div>

          <div className="h-20 w-full rounded-md bg-neutral-900 border border-neutral-700/40 flex items-end px-2">
            <div className="flex w-full items-end gap-1">
              {player.rounds.slice(-10).map((v, i) => (
                <div
                  key={i}
                  className="h-full flex-1 bg-yellow-400/30"
                  style={{ height: `${40 + (v % 40)}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* AI SUMMARY */}
      <div className="mt-4 rounded-lg border border-neutral-800 bg-neutral-900 px-4 py-3">
        <div className="mb-1 text-[11px] font-semibold text-yellow-200">AI Performance Summary</div>
        <p className="text-[11px] text-neutral-300 leading-snug">
          Role expectations and scoring trends indicate stable usage with moderate volatility.
        </p>
      </div>
    </div>
  );
};

// -----------------------------------------------------------------------------
// Helper Components
// -----------------------------------------------------------------------------

const BodyNumbers: React.FC<{ p: PlayerRow }> = ({ p }) => (
  <>
    <td className="px-2 py-2 text-center text-[11px] text-neutral-100">{p.orScore}</td>
    {p.rounds.map((v, i) => (
      <td key={i} className="px-2 py-2 text-center text-[11px] text-neutral-100">
        {v}
      </td>
    ))}
    <td className="px-2 py-2 text-center text-neutral-400">{p.min}</td>
    <td className="px-2 py-2 text-center text-neutral-100">{p.max}</td>
    <td className="px-2 py-2 text-center text-neutral-100">{p.avg}</td>
    <td className="px-2 py-2 text-center text-neutral-50 font-semibold">{p.total}</td>

    <HitCell value={p.hitRates.band90} />
    <HitCell value={p.hitRates.band95} />
    <HitCell value={p.hitRates.band100} />
    <HitCell value={p.hitRates.band105} />
    <HitCell value={p.hitRates.band110} />
  </>
);

const CompactNumbers: React.FC<{ p: PlayerRow }> = ({ p }) => (
  <>
    <Cell value={p.min} dim />
    <Cell value={p.max} />
    <Cell value={p.avg} />
    <Cell value={p.total} strong />

    <HitCell value={p.hitRates.band90} />
    <HitCell value={p.hitRates.band95} />
    <HitCell value={p.hitRates.band100} />
    <HitCell value={p.hitRates.band105} />
    <HitCell value={p.hitRates.band110} />
  </>
);

const Header: React.FC<{ label: string; accent?: boolean; compact?: boolean }> = ({
  label,
  accent,
  compact,
}) => (
  <th
    className={`border-b border-neutral-800 px-2 py-3 text-[10px] ${
      accent ? "text-emerald-300" : "text-neutral-400"
    } ${compact ? "min-w-[48px]" : ""}`}
  >
    {label}
  </th>
);

const Cell: React.FC<{
  value: number | string;
  dim?: boolean;
  strong?: boolean;
}> = ({ value, dim, strong }) => (
  <td
    className={`px-2 py-2 text-center text-[11px] ${
      dim ? "text-neutral-400" : "text-neutral-100"
    } ${strong ? "font-semibold text-neutral-50" : ""}`}
  >
    {value}
  </td>
);

const HitCell: React.FC<{ value: number }> = ({ value }) => {
  const bg =
    value >= 90
      ? "bg-emerald-500/20"
      : value >= 70
      ? "bg-emerald-500/10"
      : "bg-emerald-500/5";

  const txt =
    value >= 90
      ? "text-emerald-300"
      : value >= 70
      ? "text-emerald-200"
      : "text-emerald-100";

  return (
    <td className="px-2 py-2 text-center text-[11px]">
      <span
        className={`inline-flex min-w-[42px] items-center justify-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${bg} ${txt}`}
      >
        {value}%
      </span>
    </td>
  );
};

export default MasterTable;