// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Crown,
  Filter,
  LineChart,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import {
  useAFLMockPlayers,
  getSeriesForStat,
  StatKey,
} from "@/components/afl/players/useAFLMockData";

/* ---------------------------------------------------------
   Stat labels & thresholds
--------------------------------------------------------- */

const STAT_LABELS: Record<StatKey, string> = {
  fantasy: "Fantasy",
  disposals: "Disposals",
  kicks: "Kicks",
  marks: "Marks",
  tackles: "Tackles",
  hitouts: "Hitouts",
  goals: "Goals",
};

const STAT_THRESHOLDS: Record<StatKey, number[]> = {
  fantasy: [90, 95, 100, 105, 110],
  disposals: [20, 25, 30, 35, 40],
  kicks: [10, 15, 20, 25, 30],
  marks: [5, 7, 9, 11, 13],
  tackles: [4, 6, 8, 10, 12],
  hitouts: [20, 25, 30, 35, 40],
  goals: [1, 2, 3, 4, 5],
};

/* ---------------------------------------------------------
   Types & helpers
--------------------------------------------------------- */

type HitRateKey = "90" | "95" | "100" | "105" | "110";

type MasterRow = {
  id: number;
  name: string;
  team: string;
  pos: string;
  opening: number;
  rounds: number[]; // R1..Rn
  min: number;
  max: number;
  avg: number;
  total: number;
  hitRates: Record<HitRateKey, number>;
  games: number;
};

type ColumnKey =
  | "player"
  | "team"
  | "pos"
  | "opening"
  | `R${number}`
  | "min"
  | "max"
  | "avg"
  | "total"
  | "h90"
  | "h95"
  | "h100"
  | "h105"
  | "h110"
  | "gms";

function percentColorClass(pct: number): string {
  if (pct >= 80) return "text-emerald-400";
  if (pct >= 60) return "text-lime-300";
  if (pct >= 40) return "text-yellow-300";
  if (pct >= 20) return "text-orange-300";
  return "text-red-400";
}

function average(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/* ---------------------------------------------------------
   Sparkline (expanded row) — gold glow
--------------------------------------------------------- */

function RowSparkline({ values }: { values: number[] }) {
  if (!values.length) return null;

  const max = Math.max(...values);
  const min = Math.min(...values);
  const normalized = values.map((v) => ((v - min) / (max - min || 1)) * 100);
  const width = Math.max(normalized.length * 22, 120);

  const points = normalized
    .map(
      (v, i) =>
        `${(i / Math.max(normalized.length - 1, 1)) * width},${100 - v}`
    )
    .join(" ");

  return (
    <div className="relative h-20 w-full">
      {/* soft glow */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="rgba(250,204,21,0.35)"
          strokeWidth={5}
          className="drop-shadow-[0_0_18px_rgba(250,204,21,0.75)]"
        />
      </svg>

      {/* main line */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${width} 100`}
        preserveAspectRatio="none"
      >
        <polyline
          points={points}
          fill="none"
          stroke="rgba(250,204,21,0.95)"
          strokeWidth={2.4}
        />
      </svg>
    </div>
  );
}

/* ---------------------------------------------------------
   Row components
--------------------------------------------------------- */

interface MasterRowProps {
  row: MasterRow;
  statLabel: string;
  maxRounds: number;
  isExpanded: boolean;
  onToggle: () => void;
  hoveredCol: ColumnKey | null;
  setHoveredCol: (key: ColumnKey | null) => void;
  isPremium: boolean;
  isBlurred?: boolean;
}

function MasterTableRow({
  row,
  statLabel,
  maxRounds,
  isExpanded,
  onToggle,
  hoveredCol,
  setHoveredCol,
  isPremium,
  isBlurred,
}: MasterRowProps) {
  const thresholds: HitRateKey[] = ["90", "95", "100", "105", "110"];

  const fullSeries = [row.opening, ...row.rounds];

  const labelForRoundIndex = (i: number): ColumnKey =>
    (`R${i + 1}` as ColumnKey);

  const rowContent = (
    <>
      {/* main row */}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "group relative flex w-full items-center gap-3 border-b border-white/5 px-4 py-2.5 text-left",
          "hover:bg-white/5 transition-colors",
          isExpanded && "bg-white/[0.04]"
        )}
      >
        {/* Chevron / collapse control */}
        <div className="mr-1 flex w-5 items-center justify-center">
          <span className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-white/15 text-[10px] text-white/70">
            {isExpanded ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </span>
        </div>

        {/* Player / team / pos */}
        <div
          className={cn(
            "flex min-w-[150px] flex-col",
            hoveredCol === "player" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("player")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          <span className="text-[13px] font-semibold text-white">
            {row.name}
          </span>
          <span className="text-[11px] uppercase tracking-[0.16em] text-white/50">
            {row.team} · {row.pos}
          </span>
        </div>

        {/* Opening round */}
        <div
          className={cn(
            "min-w-[52px] text-[12px] text-white/80",
            hoveredCol === "opening" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("opening")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.opening.toFixed(0)}
        </div>

        {/* R1..Rn */}
        <div className="flex flex-1 gap-2 overflow-x-auto text-[12px] text-white/70">
          {Array.from({ length: maxRounds }).map((_, rIndex) => {
            const value = row.rounds[rIndex];
            const key = labelForRoundIndex(rIndex);
            return (
              <div
                key={rIndex}
                className={cn(
                  "min-w-[42px] text-center",
                  hoveredCol === key && "bg-white/[0.03] -mx-1 px-1 rounded"
                )}
                onMouseEnter={() => setHoveredCol(key)}
                onMouseLeave={() => setHoveredCol(null)}
              >
                {typeof value === "number" ? value.toFixed(0) : "—"}
              </div>
            );
          })}
        </div>

        {/* Min / Max / Avg */}
        <div
          className={cn(
            "min-w-[52px] text-[12px] text-white/70",
            hoveredCol === "min" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("min")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.min.toFixed(0)}
        </div>
        <div
          className={cn(
            "min-w-[52px] text-[12px] text-white/70",
            hoveredCol === "max" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("max")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.max.toFixed(0)}
        </div>
        <div
          className={cn(
            "min-w-[52px] text-[12px] text-white/70",
            hoveredCol === "avg" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("avg")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.avg.toFixed(1)}
        </div>

        {/* Total */}
        <div
          className={cn(
            "min-w-[60px] text-[13px] font-semibold",
            hoveredCol === "total" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("total")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.total.toFixed(0)}
        </div>

        {/* Hit-rate bands */}
        {thresholds.map((t, idx) => {
          const key: HitRateKey = ["90", "95", "100", "105", "110"][idx] as any;
          const pct = row.hitRates[key];
          const colKey: ColumnKey =
            key === "90"
              ? "h90"
              : key === "95"
              ? "h95"
              : key === "100"
              ? "h100"
              : key === "105"
              ? "h105"
              : "h110";

          return (
            <div
              key={t}
              className={cn(
                "min-w-[54px] text-[12px]",
                percentColorClass(pct),
                hoveredCol === colKey &&
                  "bg-white/[0.03] -mx-1 px-1 rounded text-white"
              )}
              onMouseEnter={() => setHoveredCol(colKey)}
              onMouseLeave={() => setHoveredCol(null)}
            >
              {pct.toFixed(0)}%
            </div>
          );
        })}

        {/* Games */}
        <div
          className={cn(
            "min-w-[36px] text-[12px] text-white/65 text-right",
            hoveredCol === "gms" && "bg-white/[0.03] -mx-1 px-1 rounded"
          )}
          onMouseEnter={() => setHoveredCol("gms")}
          onMouseLeave={() => setHoveredCol(null)}
        >
          {row.games}
        </div>
      </button>

      {/* expanded panel */}
      {isExpanded && (
        <div className="border-b border-white/5 bg-black/70 px-4 pb-4 pt-3 text-sm text-white/80">
          <div className="grid gap-4 md:grid-cols-[2fr,1fr] md:items-center">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/50">
                Round trend &amp; role context
              </p>
              <p className="mt-1.5 text-[13px] leading-relaxed text-white/75">
                Over the sampled rounds,{" "}
                <span className="font-semibold text-yellow-200">
                  {row.name}
                </span>{" "}
                has tracked at{" "}
                <span className="font-semibold">
                  {row.avg.toFixed(1)} {statLabel.toLowerCase()}
                </span>{" "}
                with a scoring window between{" "}
                <span className="font-semibold">
                  {row.min.toFixed(0)}–{row.max.toFixed(0)}
                </span>
                , signalling{" "}
                <span className="font-semibold">
                  {row.hitRates["100"] >= 50 ? "high upside" : "steady output"}
                </span>{" "}
                and a{" "}
                <span className="font-semibold">
                  {row.hitRates["90"].toFixed(0)}%{" "}
                </span>
                hit rate above the key threshold band.
              </p>
            </div>

            <div className="rounded-xl border border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 via-black to-black/80 px-3 py-3">
              <div className="flex items-center justify-between text-xs text-yellow-200/90">
                <span className="uppercase tracking-[0.16em]">
                  Confidence index
                </span>
                <span className="font-semibold">
                  {Math.min(
                    98,
                    Math.max(40, row.hitRates["90"] + row.hitRates["100"] / 4)
                  ).toFixed(0)}
                  %
                </span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-emerald-300"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.max(18, row.hitRates["90"])
                    ).toFixed(0)}%`,
                  }}
                />
              </div>
              <p className="mt-1.5 text-[11px] text-white/60">
                Confidence blends hit-rate bands, volatility spread and number
                of games played in this stat lens.
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-white/10 bg-black/60 px-3 py-2.5">
            <RowSparkline values={fullSeries} />
          </div>
        </div>
      )}

      {/* blurred overlay for gated rows */}
      {isBlurred && !isPremium && (
        <div className="pointer-events-none absolute inset-0 rounded-none bg-gradient-to-b from-black/10 via-black/80 to-black/95 backdrop-blur-md" />
      )}
    </>
  );

  return <div className="relative">{rowContent}</div>;
}

/* ---------------------------------------------------------
   Main Master Table section
--------------------------------------------------------- */

export default function MasterTable() {
  const players = useAFLMockPlayers();
  const { isPremium } = useAuth();

  const [selectedStat, setSelectedStat] = useState<StatKey>("fantasy");
  const [selectedTeam, setSelectedTeam] = useState<string>("all");
  const [selectedRound, setSelectedRound] = useState<"all" | number>("all");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [hoveredCol, setHoveredCol] = useState<ColumnKey | null>(null);
  const [rowsToShow, setRowsToShow] = useState<number>(40);

  const statLabel = STAT_LABELS[selectedStat];
  const thresholds = STAT_THRESHOLDS[selectedStat];

  const tableRows: MasterRow[] = useMemo(() => {
    return players.map((p) => {
      const series = getSeriesForStat(p, selectedStat) || [];
      if (!series.length) {
        return {
          id: p.id,
          name: p.name,
          team: p.team,
          pos: p.pos,
          opening: 0,
          rounds: [],
          min: 0,
          max: 0,
          avg: 0,
          total: 0,
          games: 0,
          hitRates: { "90": 0, "95": 0, "100": 0, "105": 0, "110": 0 },
        };
      }

      const opening = series[0];
      const rounds = series.slice(1);
      const games = rounds.length || 1;
      const minVal = Math.min(...rounds);
      const maxVal = Math.max(...rounds);
      const avgVal = average(rounds);
      const totalVal = rounds.reduce((s, v) => s + v, 0);

      const hitRates: Record<HitRateKey, number> = {
        "90": 0,
        "95": 0,
        "100": 0,
        "105": 0,
        "110": 0,
      };

      thresholds.forEach((t, idx) => {
        const count = rounds.filter((v) => v >= t).length;
        const pct = (count / games) * 100;
        const key: HitRateKey = ["90", "95", "100", "105", "110"][idx] as any;
        hitRates[key] = pct;
      });

      return {
        id: p.id,
        name: p.name,
        team: p.team,
        pos: p.pos,
        opening,
        rounds,
        min: minVal,
        max: maxVal,
        avg: avgVal,
        total: totalVal,
        games,
        hitRates,
      };
    });
  }, [players, selectedStat, thresholds]);

  const maxRounds = useMemo(
    () =>
      tableRows.reduce(
        (max, row) => Math.max(max, row.rounds.length),
        0
      ),
    [tableRows]
  );

  const teams = useMemo(
    () =>
      Array.from(new Set(players.map((p) => p.team))).sort((a, b) =>
        a.localeCompare(b)
      ),
    [players]
  );

  const filteredRows = useMemo(() => {
    let rows = [...tableRows];

    if (isPremium && selectedTeam !== "all") {
      rows = rows.filter((r) => r.team === selectedTeam);
    }

    if (isPremium && selectedRound !== "all") {
      const index = selectedRound - 1; // R1 = index 0
      rows = rows.filter((r) => typeof r.rounds[index] === "number");
    }

    rows.sort((a, b) => b.total - a.total);
    return rows;
  }, [tableRows, selectedTeam, selectedRound, isPremium]);

  const visibleRows = filteredRows.slice(0, rowsToShow);
  const premiumCutoff = 20;
  const freeRows = isPremium ? visibleRows : visibleRows.slice(0, premiumCutoff);
  const gatedRows = isPremium ? [] : visibleRows.slice(premiumCutoff);
  const canShowMore = rowsToShow < filteredRows.length;

  return (
    <section
      className={cn(
        "relative rounded-3xl border border-white/10",
        "bg-gradient-to-br from-[#050507] via-black to-[#08070B]",
        "px-4 py-6 md:px-6 md:py-8 shadow-[0_0_80px_rgba(0,0,0,0.75)]"
      )}
    >
      {/* background wash */}
      <div className="pointer-events-none absolute inset-x-[-80px] top-16 bottom-[-80px] bg-gradient-to-b from-yellow-500/10 via-black/50 to-black/90 blur-3xl opacity-70" />

      <div className="relative space-y-4">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-xs text-yellow-200/90">
              <LineChart className="h-3.5 w-3.5 text-yellow-300" />
              <span className="uppercase tracking-[0.18em]">
                Master Table
              </span>
            </div>
            <h2 className="text-xl font-semibold md:text-2xl">
              Full-season player ledger &amp; hit-rate grid
            </h2>
            <p className="max-w-xl text-xs text-white/70 md:text-sm">
              Every player&apos;s round-by-round{" "}
              <span className="font-semibold text-yellow-200">
                {statLabel.toLowerCase()}
              </span>{" "}
              output, totals and hit rates across key thresholds — ordered by
              total output.
            </p>
            <p className="pt-1 text-[11px] text-white/45 md:text-[11px]">
              Hit-rate bands (90+, 95+, 100+, 105+, 110+) automatically adjust
              to the selected stat lens.
            </p>
          </div>

          {/* Filters */}
          <div className="space-y-2 text-right">
            <div className="text-[11px] uppercase tracking-[0.18em] text-white/45">
              Table filters
            </div>
            <div className="flex flex-wrap justify-end gap-2 text-xs">
              {/* Stat filter (freemium) */}
              <div className="relative">
                <select
                  value={selectedStat}
                  onChange={(e) =>
                    setSelectedStat(e.target.value as StatKey)
                  }
                  className={cn(
                    "appearance-none rounded-full border border-white/15 bg-black/70 px-3.5 py-1.5 pr-7 text-xs text-white/80",
                    "focus:outline-none focus:ring-1 focus:ring-yellow-400/70"
                  )}
                >
                  {/* Free options */}
                  <option value="fantasy">Fantasy</option>
                  <option value="disposals">Disposals</option>
                  <option value="goals">Goals</option>

                  {/* Locked options just to signal Neeko+ depth */}
                  <option disabled>────────</option>
                  <option disabled>Neeko+ · Kicks</option>
                  <option disabled>Neeko+ · Marks</option>
                  <option disabled>Neeko+ · Tackles</option>
                  <option disabled>Neeko+ · Hitouts</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-white/50" />
              </div>

              {/* Team filter (premium only) */}
              <button
                type="button"
                disabled={!isPremium}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                  isPremium
                    ? "border-white/15 bg-black/70 text-white/80 hover:bg-white/10"
                    : "border-white/10 bg-black/40 text-white/35 cursor-not-allowed"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>
                  Team:{" "}
                  {isPremium
                    ? selectedTeam === "all"
                      ? "All teams"
                      : selectedTeam
                    : "All teams"}
                </span>
                {!isPremium && (
                  <Crown className="h-3 w-3 text-yellow-300" />
                )}
              </button>

              {/* Round filter (premium only) */}
              <button
                type="button"
                disabled={!isPremium}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs",
                  isPremium
                    ? "border-white/15 bg-black/70 text-white/80 hover:bg-white/10"
                    : "border-white/10 bg-black/40 text-white/35 cursor-not-allowed"
                )}
              >
                <Filter className="h-3.5 w-3.5" />
                <span>
                  Round:{" "}
                  {isPremium
                    ? selectedRound === "all"
                      ? "All rounds"
                      : `R${selectedRound}`
                    : "All rounds"}
                </span>
                {!isPremium && (
                  <Crown className="h-3 w-3 text-yellow-300" />
                )}
              </button>
            </div>
            <div className="text-[10px] text-white/45">
              Fantasy, Disposals &amp; Goals are free. Team &amp; Round filters
              are Neeko+ only.
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="relative mt-3 overflow-hidden rounded-2xl border border-white/10 bg-black/70">
          <div className="relative max-h-[520px] overflow-auto">
            {/* sticky header */}
            <div className="sticky top-0 z-20 border-b border-white/10 bg-black/95">
              <div className="flex items-center gap-3 px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-white/45">
                <div className="mr-1 w-5" />
                <div className="min-w-[150px]">
                  <span>Player</span>
                </div>
                <div className="min-w-[52px]">OR</div>
                <div className="flex flex-1 gap-2 overflow-x-auto">
                  {Array.from({ length: maxRounds }).map((_, index) => (
                    <div
                      key={index}
                      className="min-w-[42px] text-center"
                    >
                      R{index + 1}
                    </div>
                  ))}
                </div>
                <div className="min-w-[52px] text-center">Min</div>
                <div className="min-w-[52px] text-center">Max</div>
                <div className="min-w-[52px] text-center">Avg</div>
                <div className="min-w-[60px] text-center">Total</div>
                {thresholds.map((t) => (
                  <div
                    key={t}
                    className="min-w-[54px] text-center"
                  >
                    {t}+
                  </div>
                ))}
                <div className="min-w-[36px] text-right">Gms</div>
              </div>
            </div>

            {/* free rows */}
            <div className="divide-y divide-white/5">
              {freeRows.map((row) => (
                <MasterTableRow
                  key={row.id}
                  row={row}
                  statLabel={statLabel}
                  maxRounds={maxRounds}
                  isExpanded={expandedId === row.id}
                  onToggle={() =>
                    setExpandedId((prev) =>
                      prev === row.id ? null : row.id
                    )
                  }
                  hoveredCol={hoveredCol}
                  setHoveredCol={setHoveredCol}
                  isPremium={!!isPremium}
                />
              ))}
            </div>

            {/* gated block */}
            {!isPremium && gatedRows.length > 0 && (
              <div className="relative mt-0 border-t border-white/5">
                <div className="divide-y divide-white/5 opacity-90">
                  {gatedRows.map((row) => (
                    <MasterTableRow
                      key={row.id}
                      row={row}
                      statLabel={statLabel}
                      maxRounds={maxRounds}
                      isExpanded={false}
                      onToggle={() => {}}
                      hoveredCol={hoveredCol}
                      setHoveredCol={setHoveredCol}
                      isPremium={false}
                      isBlurred
                    />
                  ))}
                </div>

                {/* blur overlay + CTA */}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-black/85 to-black/95 backdrop-blur-md" />
                <div className="pointer-events-auto absolute inset-x-0 bottom-10 flex flex-col items-center gap-3 px-4 text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-yellow-200/90">
                    <Crown className="h-3.5 w-3.5 text-yellow-300" />
                    <span>Neeko+ Master Grid</span>
                  </div>
                  <p className="max-w-md text-[13px] text-yellow-100/90">
                    Unlock full-season fantasy ledgers, advanced hit-rate bands
                    and deep role filters for every player.
                  </p>
                  <button
                    type="button"
                    className="rounded-full bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-400 px-6 py-2.5 text-sm font-semibold text-black shadow-[0_0_26px_rgba(250,204,21,0.75)]"
                  >
                    Unlock Neeko+ Insights
                  </button>
                  <button
                    type="button"
                    className="text-[11px] font-medium text-yellow-200/85 underline-offset-4 hover:underline"
                  >
                    View full AI analysis →
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Show more button */}
        {canShowMore && (
          <div className="mt-3 flex justify-center">
            <button
              type="button"
              onClick={() =>
                setRowsToShow((prev) =>
                  Math.min(prev + 20, filteredRows.length)
                )
              }
              className="rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
            >
              Show 20 more rows ↓
            </button>
          </div>
        )}

        {/* Premium-only notice for filters */}
        <div className="pt-2 text-center text-[11px] text-white/40">
          Table ordered by total {statLabel.toLowerCase()} output. Use the AI
          Insights section above for projections and risk analysis.
        </div>
      </div>
    </section>
  );
}
