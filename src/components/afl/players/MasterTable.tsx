// src/components/afl/players/MasterTable.tsx

import React, { useMemo, useState } from "react";
import { ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useAuth } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                               TYPES & CONFIG                               */
/* -------------------------------------------------------------------------- */

type StatLens = "Fantasy" | "Disposals" | "Goals";

type PlayerRow = {
  id: number;
  name: string;
  team: string;
  role: string;
  roundsFantasy: number[];
  roundsDisposals: number[];
  roundsGoals: number[];
};

const ROUND_LABELS = [
  "OR","R1","R2","R3","R4","R5","R6","R7","R8","R9","R10","R11","R12",
  "R13","R14","R15","R16","R17","R18","R19","R20","R21","R22","R23"
];

const STAT_CONFIG: Record<
  StatLens,
  { label: string; hitLabels: string[]; thresholds: number[]; unit: string }
> = {
  Fantasy: {
    label: "Fantasy",
    hitLabels: ["90+", "100+", "110+", "120+", "130+"],
    thresholds: [90, 100, 110, 120, 130],
    unit: "pts",
  },
  Disposals: {
    label: "Disposals",
    hitLabels: ["15+", "20+", "25+", "30+", "35+"],
    thresholds: [15, 20, 25, 30, 35],
    unit: "disp",
  },
  Goals: {
    label: "Goals",
    hitLabels: ["1+", "2+", "3+", "4+", "5+"],
    thresholds: [1, 2, 3, 4, 5],
    unit: "g",
  },
};

const INITIAL_VISIBLE = 20;
const PAGE_SIZE = 20;

/* -------------------------------------------------------------------------- */
/*                               MOCK DATA                                    */
/* -------------------------------------------------------------------------- */

const getRoundsForLens = (player: PlayerRow, lens: StatLens) =>
  lens === "Fantasy"
    ? player.roundsFantasy
    : lens === "Disposals"
    ? player.roundsDisposals
    : player.roundsGoals;

const buildMockPlayers = (): PlayerRow[] =>
  Array.from({ length: 60 }).map((_, index) => {
    const fantasyBase =
      index < 10 ? 80 : index < 20 ? 85 : index < 40 ? 90 : 95;

    const makeSeries = (base: number, jitter: number) =>
      ROUND_LABELS.map(() => {
        const j = Math.round(Math.random() * jitter * 2 - jitter);
        return base + j;
      });

    const roundsFantasy = makeSeries(fantasyBase, 9);
    const roundsDisposals = makeSeries(
      Math.max(18, fantasyBase - 30 + (index % 5)),
      5
    );
    const roundsGoals = ROUND_LABELS.map(() => {
      const raw =
        Math.round((fantasyBase - 70) / 12) +
        Math.round(Math.random() * 2) -
        1;
      return Math.min(Math.max(raw, 0), 6);
    });

    return {
      id: index + 1,
      name: `Player ${index + 1}`,
      team: ["GEEL", "CARL", "ESS", "COLL", "RICH", "NMFC"][index % 6],
      role: ["MID", "RUC", "FWD", "DEF"][index % 4],
      roundsFantasy,
      roundsDisposals,
      roundsGoals,
    };
  });

const MOCK_PLAYERS: PlayerRow[] = buildMockPlayers();

/* -------------------------------------------------------------------------- */
/*                           METRIC CALCULATIONS                              */
/* -------------------------------------------------------------------------- */

function computeSummary(player: PlayerRow, lens: StatLens) {
  const rounds = getRoundsForLens(player, lens);
  const min = Math.min(...rounds);
  const max = Math.max(...rounds);
  const total = rounds.reduce((a, b) => a + b, 0);
  const avg = +(total / rounds.length).toFixed(1);

  const lastWindow = rounds.slice(-8);
  const l5 = rounds.slice(-5);
  const l5Avg = l5.length ? +(l5.reduce((a, b) => a + b, 0) / l5.length).toFixed(1) : 0;

  const windowMin = lastWindow.length ? Math.min(...lastWindow) : min;
  const windowMax = lastWindow.length ? Math.max(...lastWindow) : max;
  const volatilityRange = windowMax - windowMin;

  return { min, max, total, avg, lastWindow, l5Avg, windowMin, windowMax, volatilityRange };
}

function computeHitRates(player: PlayerRow, lens: StatLens) {
  const cfg = STAT_CONFIG[lens];
  const rounds = getRoundsForLens(player, lens);
  return cfg.thresholds.map((t) =>
    Math.round((rounds.filter((v) => v >= t).length / rounds.length) * 100)
  );
}

function computeConfidenceScore(player: PlayerRow, lens: StatLens) {
  const hitRates = computeHitRates(player, lens);
  const { volatilityRange } = computeSummary(player, lens);

  const floorRate = hitRates[0];
  const ceilingRate = hitRates[hitRates.length - 1];
  const volatilityPenalty = Math.min(volatilityRange * 3, 45);

  const raw =
    0.45 * floorRate + 0.35 * ceilingRate + 0.2 * (100 - volatilityPenalty);

  return Math.max(0, Math.min(100, Math.round(raw)));
}

/* -------------------------------------------------------------------------- */
/*                            MAIN MASTER TABLE                               */
/* -------------------------------------------------------------------------- */

export const MasterTable: React.FC = () => {
  const { isPremium } = useAuth();

  const [statLens, setStatLens] = useState<StatLens>("Fantasy");
  const [visibleCount, setVisibleCount] = useState(INITIAL_VISIBLE);

  const [desktopOpen, setDesktopOpen] = useState(false);
  const [desktopPlayer, setDesktopPlayer] = useState<PlayerRow | null>(null);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobilePlayer, setMobilePlayer] = useState<PlayerRow | null>(null);

  const players = MOCK_PLAYERS;

  const filteredPlayers = useMemo(() => players, [players]);
  const visiblePlayers = useMemo(
    () => filteredPlayers.slice(0, Math.min(visibleCount, filteredPlayers.length)),
    [filteredPlayers, visibleCount]
  );

  const hasMoreRows = visibleCount < filteredPlayers.length;
  const cfg = STAT_CONFIG[statLens];

  const handleShowMore = () => {
    setVisibleCount((v) => Math.min(v + PAGE_SIZE, filteredPlayers.length));
  };

  const openDesktop = (player: PlayerRow) => {
    setDesktopPlayer(player);
    setDesktopOpen(true);
  };
  const closeDesktop = () => {
    setDesktopOpen(false);
    setDesktopPlayer(null);
  };

  const openMobile = (player: PlayerRow) => {
    setMobilePlayer(player);
    setMobileOpen(true);
  };
  const closeMobile = (open: boolean) => {
    setMobileOpen(open);
    if (!open) setMobilePlayer(null);
  };

  return (
    <section
      id="master-table"
      className="
        relative mt-16 mb-24 rounded-[32px]
        border border-yellow-500/15
        bg-gradient-to-b from-neutral-950 via-neutral-950/90 to-black
        px-4 py-8 shadow-[0_40px_160px_rgba(0,0,0,0.9)]
        sm:px-6 lg:px-8
      "
    >
      {/* HEADER */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/40 bg-black/80 px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.9)]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-yellow-200/90">
              Master Table
            </span>
          </div>
          <h2 className="text-xl font-semibold text-neutral-50 sm:text-2xl">
            Full-season player ledger &amp; hit-rate grid
          </h2>
          <p className="max-w-2xl text-[11px] text-neutral-300/90">
            Every player's{" "}
            <span className="font-semibold text-yellow-200/90">
              {cfg.label}
            </span>{" "}
            round-by-round output, summary window and hit-rate profile.
          </p>
        </div>

        {/* Stat lens pill switcher */}
        <div className="flex items-center gap-2 rounded-full border border-neutral-700/80 bg-black/80 px-3 py-1 text-[11px]">
          <span className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Stat lens
          </span>
          <div className="flex gap-1">
            {(["Fantasy", "Disposals", "Goals"] as const).map((stat) => (
              <button
                key={stat}
                type="button"
                onClick={() => setStatLens(stat)}
                className={`
                  rounded-full px-2.5 py-0.5 text-[10px] font-medium
                  ${
                    statLens === stat
                      ? "bg-yellow-400 text-black shadow-[0_0_18px_rgba(250,204,21,0.7)]"
                      : "bg-neutral-900/80 text-neutral-300 hover:bg-neutral-800/90"
                  }
                `}
              >
                {stat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                         DESKTOP TABLE                              */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-8 hidden rounded-3xl border border-neutral-800/80 bg-neutral-950/95 md:block">
        <div className="w-full overflow-x-auto">
          <table className="min-w-[1040px] border-separate border-spacing-0 text-[11px] text-neutral-100">
            <thead>
              <tr className="sticky top-0 z-20 bg-black/95 backdrop-blur-sm">
                {/* Player column header */}
                <th
                  className="
                    sticky left-0 z-30 w-60 border-b border-neutral-800/80 bg-black
                    px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.16em]
                    text-neutral-300
                  "
                >
                  <span className="inline-flex items-center gap-2">
                    <span className="w-4 text-[10px] text-neutral-500">#</span>
                    Player
                  </span>
                </th>

                {/* Round headers */}
                {ROUND_LABELS.map((label) => (
                  <HeaderCell key={label} label={label} />
                ))}

                {/* Summary headers */}
                <HeaderCell label="Min" />
                <HeaderCell label="Max" />
                <HeaderCell label="Avg" />
                <HeaderCell label="Total" wide />

                {/* Hit-rate headers */}
                {cfg.hitLabels.map((label) => (
                  <HeaderCell key={label} label={label} accent />
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-neutral-900/80">
              {visiblePlayers.map((player, index) => {
                const rounds = getRoundsForLens(player, statLens);
                const summary = computeSummary(player, statLens);
                const hitRates = computeHitRates(player, statLens);
                const blurred = !isPremium && index >= 20;
                const blurClass = blurred ? "blur-[3px] brightness-[0.65]" : "";

                return (
                  <tr
                    key={player.id}
                    className="transition-colors duration-150 hover:bg-neutral-900/55"
                  >
                    {/* Player cell */}
                    <td
                      className={`
                        sticky left-0 z-10 w-60 border-r border-neutral-900/80
                        bg-gradient-to-r from-black/98 via-black/94 to-black/80
                        px-4 py-2.5 ${blurClass}
                      `}
                    >
                      <button
                        type="button"
                        onClick={() => openDesktop(player)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <span
                          className="
                            inline-flex h-6 w-6 items-center justify-center
                            rounded-full border border-neutral-700/80
                            bg-neutral-950/80 text-[10px] text-neutral-300
                          "
                        >
                          {index + 1}
                        </span>
                        <div className="flex flex-col">
                          <span className="text-[13px] font-medium text-neutral-50">
                            {player.name}
                          </span>
                          <span className="text-[10px] uppercase tracking-[0.16em] text-neutral-400">
                            {player.team} • {player.role}
                          </span>
                        </div>
                        <ChevronRight className="ml-auto h-4 w-4 text-neutral-500" />
                      </button>
                    </td>

                    {/* Round-by-round values */}
                    {rounds.map((value, i) => (
                      <BodyCell
                        key={i}
                        value={value}
                        compact
                        blurClass={blurClass}
                      />
                    ))}

                    {/* Summary */}
                    <BodyCell
                      value={summary.min}
                      dim
                      compact
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.max}
                      compact
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.avg.toFixed(1)}
                      compact
                      blurClass={blurClass}
                    />
                    <BodyCell
                      value={summary.total}
                      strong
                      wide
                      compact
                      blurClass={blurClass}
                    />

                    {/* Hit-rates */}
                    {hitRates.map((value, i) => (
                      <HitRateCell
                        key={i}
                        value={value}
                        compact
                        blurClass={blurClass}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {hasMoreRows && (
          <div className="border-t border-neutral-900/80 bg-black/90 py-4 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="
                rounded-full border-neutral-700 bg-neutral-950/90
                px-5 py-1.5 text-xs text-neutral-200
                hover:border-yellow-400 hover:bg-neutral-900
              "
            >
              Show 20 more rows
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                      MOBILE MASTER LIST (COMPACT)                  */}
      {/* ------------------------------------------------------------------ */}

      <div className="mt-8 md:hidden">
        <div className="space-y-3">
          {visiblePlayers.map((player, index) => {
            const blurred = !isPremium && index >= 20;
            const blurClass = blurred ? "blur-[3px] brightness-[0.65]" : "";

            return (
              <MobilePlayerCard
                key={player.id}
                player={player}
                index={index}
                statLens={statLens}
                blurClass={blurClass}
                onOpen={() => openMobile(player)}
              />
            );
          })}
        </div>

        {hasMoreRows && (
          <div className="mt-4 text-center">
            <Button
              variant="outline"
              onClick={handleShowMore}
              className="
                rounded-full border-neutral-700 bg-neutral-950/90
                px-5 py-1.5 text-xs text-neutral-200
                hover:border-yellow-400 hover:bg-neutral-900
              "
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*                        MOBILE BOTTOM SHEET                         */}
      {/* ------------------------------------------------------------------ */}

      <Sheet open={mobileOpen} onOpenChange={closeMobile}>
        <SheetContent
          side="bottom"
          className="
            h-[85vh] rounded-t-[32px]
            border border-yellow-500/60
            bg-gradient-to-b from-yellow-500/20 via-neutral-950 to-black
            px-4 py-3 shadow-[0_0_60px_rgba(250,204,21,0.7)]
          "
        >
          <div className="mx-auto mb-3 mt-1 h-1.5 w-10 rounded-full bg-yellow-200/70" />
          {mobilePlayer && (
            <>
              <SheetHeader className="flex flex-row items-center justify-between">
                <div>
                  <SheetTitle className="text-base font-semibold text-neutral-50">
                    {mobilePlayer.name}
                  </SheetTitle>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                    {mobilePlayer.team} • {mobilePlayer.role}
                  </div>
                </div>

                {/* Stat switcher (mobile) */}
                <div className="flex items-center gap-1 rounded-full border border-neutral-700/70 bg-black/70 px-2 py-1 text-[10px]">
                  {(["Fantasy", "Disposals", "Goals"] as const).map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatLens(s)}
                      className={`
                        rounded-full px-2 py-0.5 text-[10px] font-medium
                        ${
                          statLens === s
                            ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                            : "text-neutral-300 hover:bg-neutral-800/70"
                        }
                      `}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </SheetHeader>

              <div className="mt-4 h-[calc(85vh-96px)] overflow-y-auto pb-8">
                <ExpandedInsights
                  player={mobilePlayer}
                  statLens={statLens}
                  confidence={computeConfidenceScore(mobilePlayer, statLens)}
                />
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* ------------------------------------------------------------------ */}
      {/*                      DESKTOP RIGHT-SIDE OVERLAY                     */}
      {/* ------------------------------------------------------------------ */}

      {desktopOpen && desktopPlayer && (
        <div
          className="
            fixed inset-0 z-50 hidden md:flex
            bg-black/40 backdrop-blur-sm
          "
          onClick={closeDesktop}
        >
          <div
            className="
              ml-auto flex h-full w-[420px] md:w-[480px] xl:w-[520px] flex-col
              border-l border-yellow-500/40
              bg-gradient-to-b from-yellow-500/14 via-neutral-950 to-black
              shadow-[0_0_80px_rgba(0,0,0,0.95)]
            "
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-yellow-500/30 px-6 py-4">
              <div>
                <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-yellow-200/80">
                  Player Insights
                </div>
                <div className="mt-1 text-sm font-semibold text-neutral-50">
                  {desktopPlayer.name}
                </div>
                <div className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
                  {desktopPlayer.team} • {desktopPlayer.role}
                </div>
              </div>

              {/* Stat switcher (desktop) */}
              <div className="flex gap-1 rounded-full border border-neutral-700 bg-black px-2 py-1 text-[10px] text-neutral-200">
                {(["Fantasy", "Disposals", "Goals"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setStatLens(s)}
                    className={`
                      rounded-full px-2 py-0.5 text-[10px] font-medium
                      ${
                        statLens === s
                          ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                          : "text-neutral-300 hover:bg-neutral-800/70"
                      }
                    `}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-[calc(100vh-64px)] overflow-y-auto px-4 py-4 md:px-5">
              <ExpandedInsights
                player={desktopPlayer}
                statLens={statLens}
                confidence={computeConfidenceScore(desktopPlayer, statLens)}
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

/* -------------------------------------------------------------------------- */
/*                          SMALLER BUILDING BLOCKS                           */
/* -------------------------------------------------------------------------- */

type HeaderCellProps = {
  label: string;
  wide?: boolean;
  accent?: boolean;
};

const HeaderCell: React.FC<HeaderCellProps> = ({ label, wide, accent }) => (
  <th
    className={`
      border-b border-l border-neutral-800/80
      px-2 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.16em]
      ${wide ? "min-w-[72px]" : "min-w-[52px]"}
      ${accent ? "text-emerald-300" : "text-neutral-400"}
    `}
  >
    {label}
  </th>
);

type BodyCellProps = {
  value: number | string;
  dim?: boolean;
  strong?: boolean;
  wide?: boolean;
  compact?: boolean;
  blurClass?: string;
};

const BodyCell: React.FC<BodyCellProps> = ({
  value,
  dim,
  strong,
  wide,
  compact,
  blurClass = "",
}) => (
  <td
    className={`
      border-l border-neutral-900/85 px-2
      ${compact ? "py-1.5" : "py-2"}
      text-center text-[11px]
      ${wide ? "min-w-[72px]" : "min-w-[52px]"}
      ${dim ? "text-neutral-400" : "text-neutral-100"}
      ${strong ? "font-semibold text-neutral-50" : ""}
      ${blurClass}
    `}
  >
    {value}
  </td>
);

type HitRateCellProps = {
  value: number;
  compact?: boolean;
  blurClass?: string;
};

const HitRateCell: React.FC<HitRateCellProps> = ({
  value,
  compact,
  blurClass = "",
}) => {
  let color = "text-red-400";
  let bg = "bg-red-500/12";

  if (value >= 90) {
    color = "text-lime-300";
    bg = "bg-lime-400/12";
  } else if (value >= 60) {
    color = "text-green-400";
    bg = "bg-green-500/12";
  } else if (value >= 30) {
    color = "text-yellow-300";
    bg = "bg-yellow-500/12";
  } else if (value >= 15) {
    color = "text-orange-400";
    bg = "bg-orange-500/12";
  }

  return (
    <td
      className={`
        border-l border-neutral-900/85 px-2
        ${compact ? "py-1.5" : "py-2"}
        text-center ${blurClass}
      `}
    >
      <span
        className={`
          inline-flex min-w-[42px] items-center justify-center
          rounded-full px-1.5 py-0.5 text-[10px] font-semibold
          ${bg} ${color}
        `}
      >
        {value}%
      </span>
    </td>
  );
};

/* -------------------------------------------------------------------------- */
/*                     MOBILE CARD + EXPANDED INSIGHTS                        */
/* -------------------------------------------------------------------------- */

type MobilePlayerCardProps = {
  player: PlayerRow;
  index: number;
  statLens: StatLens;
  blurClass?: string;
  onOpen: () => void;
};

const MobilePlayerCard: React.FC<MobilePlayerCardProps> = ({
  player,
  index,
  statLens,
  blurClass = "",
  onOpen,
}) => {
  const cfg = STAT_CONFIG[statLens];
  const summary = computeSummary(player, statLens);
  const hitRates = computeHitRates(player, statLens);

  const floor = hitRates[0];
  const ceiling = hitRates[hitRates.length - 1];

  return (
    <div
      className={`
        relative overflow-hidden rounded-2xl border border-yellow-500/40
        bg-gradient-to-br from-yellow-500/10 via-black to-black
        px-3 py-2 shadow-[0_0_30px_rgba(0,0,0,0.8)]
        ${blurClass}
      `}
    >
      <div className="relative z-10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span
                className="
                  inline-flex h-5 w-5 items-center justify-center
                  rounded-full border border-neutral-700/80
                  bg-neutral-950/80 text-[9px] text-neutral-300
                "
              >
                {index + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-[12px] font-semibold text-neutral-50">
                  {player.name}
                </span>
                <span className="text-[9px] uppercase tracking-[0.14em] text-neutral-400">
                  {player.team} • {player.role}
                </span>
              </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px] text-neutral-200">
              <div>
                <span className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                  {cfg.label} avg
                </span>
                <div className="mt-0.5 text-xs font-semibold text-yellow-200">
                  {summary.avg}
                </div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                  Total
                </span>
                <div className="mt-0.5 text-xs font-semibold">
                  {summary.total}
                </div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                  L5 avg
                </span>
                <div className="mt-0.5 text-[11px]">{summary.l5Avg}</div>
              </div>
              <div>
                <span className="text-[8px] uppercase tracking-[0.14em] text-neutral-500">
                  Hit profile
                </span>
                <div className="mt-0.5 text-[10px]">
                  <span className="font-semibold text-emerald-300">
                    {floor}%
                  </span>{" "}
                  floor •{" "}
                  <span className="font-semibold text-lime-300">
                    {ceiling}%
                  </span>{" "}
                  ceiling
                </div>
              </div>
            </div>
          </div>

          <Button
            size="sm"
            onClick={onOpen}
            className="
              rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-semibold text-black
              shadow-[0_0_18px_rgba(250,204,21,0.8)] hover:bg-yellow-300
            "
          >
            View
          </Button>
        </div>
      </div>
    </div>
  );
};

type ExpandedInsightsProps = {
  player: PlayerRow;
  statLens: StatLens;
  confidence: number;
};

const ExpandedInsights: React.FC<ExpandedInsightsProps> = ({
  player,
  statLens,
  confidence,
}) => {
  const cfg = STAT_CONFIG[statLens];
  const summary = computeSummary(player, statLens);
  const hitRates = computeHitRates(player, statLens);

  const volatilityLabel =
    summary.volatilityRange <= 8
      ? "Low"
      : summary.volatilityRange <= 14
      ? "Medium"
      : "High";

  return (
    <div className="grid gap-5 md:gap-6 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1.1fr)]">
      {/* LEFT COLUMN */}
      <div className="space-y-4">
        <div
          className="
            rounded-2xl border border-neutral-800/80
            bg-gradient-to-b from-neutral-900/90 via-neutral-950 to-black
            p-4 shadow-[0_0_40px_rgba(0,0,0,0.7)]
          "
        >
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-neutral-400">
            <span>Recent scoring window</span>
            <span className="text-neutral-500">
              {summary.lastWindow.length} games •{" "}
              <span className="text-yellow-200">
                L5 {summary.l5Avg}
                {cfg.unit}
              </span>
            </span>
          </div>

          <div className="mb-3 grid grid-cols-3 gap-2 text-[11px] text-neutral-300">
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                L5 avg
              </div>
              <div className="text-sm font-semibold text-yellow-200">
                {summary.l5Avg}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                Best / Worst
              </div>
              <div className="text-sm font-semibold text-neutral-100">
                {summary.windowMax}/{summary.windowMin}
              </div>
            </div>
            <div>
              <div className="text-[9px] uppercase tracking-[0.14em] text-neutral-500">
                Volatility
              </div>
              <div className="text-sm font-semibold text-emerald-300">
                {volatilityLabel}{" "}
                <span className="text-[10px] text-neutral-400">
                  ({summary.volatilityRange})
                </span>
              </div>
            </div>
          </div>

          {/* Sparkline */}
          <div
            className="
              rounded-xl border border-yellow-500/20
              bg-gradient-to-b from-yellow-500/10 via-neutral-950 to-black
              px-3 py-2
            "
          >
            <MiniSparkline values={summary.lastWindow} />
          </div>

          {/* Round-by-round wheel (carousel) */}
          <div
            className="
              mt-4 rounded-xl border border-neutral-800/70
              bg-neutral-950/90 px-3 py-2
            "
          >
            <div className="mb-1 text-[9px] uppercase tracking-[0.14em] text-neutral-400">
              Round-by-round scores
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {getRoundsForLens(player, statLens).map((value, i) => (
                <div key={i} className="flex min-w-[42px] flex-col items-center">
                  <span className="text-[8px] text-neutral-500">
                    {ROUND_LABELS[i]}
                  </span>
                  <div
                    className="
                      mt-1 flex h-7 w-9 items-center justify-center
                      rounded-md bg-neutral-900/90 text-[10px]
                    "
                  >
                    {value}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Simple AI blurb */}
        <div
          className="
            rounded-2xl border border-neutral-800/80
            bg-neutral-900/80 px-4 py-3 text-[11px] text-neutral-300
          "
        >
          <div className="mb-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-yellow-200">
            AI performance summary
          </div>
          <p className="leading-snug">
            Usage and role suggest{" "}
            <span className="font-semibold text-neutral-50">
              stable opportunity with moderate volatility
            </span>{" "}
            at this lens. Hit profile blends floor security with
            ceiling access across the recent window.
          </p>
        </div>
      </div>

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        {/* Confidence index */}
        <div
          className="
            rounded-2xl border border-yellow-400/35
            bg-gradient-to-b from-yellow-500/18 via-black to-black
            p-4 shadow-[0_0_30px_rgba(250,204,21,0.75)]
          "
        >
          <div className="mb-1 flex items-center justify-between text-[10px] uppercase tracking-[0.14em] text-yellow-100">
            <span>Confidence index</span>
            <span>{confidence}%</span>
          </div>
          <p className="text-[11px] text-neutral-200">
            Blends floor/ceiling hit-rates, recent volatility and window
            structure into a single confidence gauge.
          </p>
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-900">
            <div
              className="h-full rounded-full bg-lime-400"
              style={{ width: `${confidence}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[9px] text-neutral-400">
            <span>Floor security</span>
            <span>Ceiling access</span>
          </div>
        </div>

        {/* Hit-rate profile list */}
        <div
          className="
            rounded-2xl border border-neutral-800/80
            bg-neutral-900/80 px-4 py-3 text-[11px] text-neutral-200
          "
        >
          <div className="mb-2 text-[9px] font-semibold uppercase tracking-[0.14em] text-neutral-400">
            Hit-rate profile
          </div>
          <div className="space-y-2">
            {hitRates.map((value, idx) => (
              <HitRateProfileBar
                key={cfg.hitLabels[idx]}
                label={cfg.hitLabels[idx]}
                value={value}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                               SPARKLINE SVG                                */
/* -------------------------------------------------------------------------- */

type MiniSparklineProps = { values: number[] };

const MiniSparkline: React.FC<MiniSparklineProps> = ({ values }) => {
  if (!values || !values.length) return null;

  const width = 260;
  const height = 90;
  const padX = 8;
  const padY = 6;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;

  const points = values.map((v, i) => {
    const x = padX + (i / (values.length - 1)) * (width - padX * 2);
    const y = padY + (1 - (v - min) / range) * (height - padY * 2);
    return { x, y };
  });

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-20 w-full">
      <line
        x1={padX}
        y1={height - padY}
        x2={width - padX}
        y2={height - padY}
        stroke="rgba(148,163,184,0.35)"
        strokeWidth={0.75}
      />
      <path d={path} fill="none" stroke="rgb(250,204,21)" strokeWidth={1.8} />
      <circle cx={last.x} cy={last.y} r={3} fill="white" stroke="gold" />
    </svg>
  );
};

type HitRateProfileBarProps = {
  label: string;
  value: number;
};

const HitRateProfileBar: React.FC<HitRateProfileBarProps> = ({
  label,
  value,
}) => {
  let barColor =
    value >= 90
      ? "bg-lime-400"
      : value >= 60
      ? "bg-green-400/80"
      : value >= 30
      ? "bg-yellow-400/80"
      : value >= 15
      ? "bg-orange-400/80"
      : "bg-red-500/70";

  return (
    <div className="flex items-center gap-2">
      <div className="w-10 text-[10px] text-neutral-400">{label}</div>
      <div className="h-2 flex-1 rounded-full bg-neutral-800/90">
        <div
          className={`h-full rounded-full ${barColor}`}
          style={{ width: `${Math.max(value, 3)}%` }}
        />
      </div>
      <div className="w-8 text-right text-[10px] text-neutral-300">
        {value}%
      </div>
    </div>
  );
};

export default MasterTable;
