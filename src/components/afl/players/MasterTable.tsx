// src/components/afl/players/MasterTable.tsx
import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronRight, Lock, Search, Sparkles, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

/* -------------------------------------------------------------------------- */
/*                               TYPES & CONFIG                               */
/* -------------------------------------------------------------------------- */

export type StatLens = "Fantasy" | "Disposals" | "Goals";

type PlayerRow = {
  id: number;
  rank: number;
  name: string;
  team: string;
  role: string;
  roundsFantasy: number[];
  roundsDisposals: number[];
  roundsGoals: number[];
};

type StatConfig = {
  label: string;
  valueUnitShort: string;
  thresholds: number[];
};

const ROUND_LABELS = [
  "OR", "R1","R2","R3","R4","R5","R6","R7","R8","R9",
  "R10","R11","R12","R13","R14","R15","R16","R17","R18",
  "R19","R20","R21","R22","R23",
];

const STAT_CONFIG: Record<StatLens, StatConfig> = {
  Fantasy: { label: "Fantasy", valueUnitShort: "pts", thresholds: [90,100,110,120,130] },
  Disposals: { label: "Disposals", valueUnitShort: "dis", thresholds: [20,25,30,35,40] },
  Goals: { label: "Goals", valueUnitShort: "g", thresholds: [1,2,3,4,5] },
};

/* -------------------------------------------------------------------------- */
/*                               MOCK DATA BUILD                              */
/* -------------------------------------------------------------------------- */

function buildMockPlayers(): PlayerRow[] {
  const rows: PlayerRow[] = [];

  for (let i = 1; i <= 60; i++) {
    const baseFantasy = 70 + Math.round(Math.random() * 40);
    const baseDisposals = 18 + Math.round(Math.random() * 10);
    const baseGoals = Math.random() < 0.5 ? 1 : 0;

    const roundsFantasy: number[] = [];
    const roundsDisposals: number[] = [];
    const roundsGoals: number[] = [];

    for (let r = 0; r < ROUND_LABELS.length; r++) {
      roundsFantasy.push(baseFantasy + Math.round((Math.random() - 0.5) * 24));
      roundsDisposals.push(baseDisposals + Math.round((Math.random() - 0.5) * 8));
      roundsGoals.push(baseGoals + (Math.random() < 0.2 ? 1 : 0));
    }

    rows.push({
      id: i,
      rank: i,
      name: `Player ${i}`,
      team: ["CARL","ESS","COLL","RICH","GEEL","NMFC"][i % 6],
      role: ["MID","RUC","FWD","DEF"][i % 4],
      roundsFantasy,
      roundsDisposals,
      roundsGoals,
    });
  }

  return rows;
}

const MOCK_PLAYERS = buildMockPlayers();

/* -------------------------------------------------------------------------- */
/*                                  HELPERS                                   */
/* -------------------------------------------------------------------------- */

const getRounds = (p: PlayerRow, lens: StatLens) =>
  lens === "Fantasy" ? p.roundsFantasy :
  lens === "Disposals" ? p.roundsDisposals :
  p.roundsGoals;

function computeSummary(p: PlayerRow, lens: StatLens) {
  const r = getRounds(p, lens);
  const min = Math.min(...r);
  const max = Math.max(...r);
  const total = r.reduce((a,b)=>a+b,0);
  const avg = +(total / r.length).toFixed(1);
  const window = r.slice(-8);
  const wmin = Math.min(...window);
  const wmax = Math.max(...window);

  return {
    min, max, total, avg,
    windowMin: wmin,
    windowMax: wmax,
    volatilityRange: wmax - wmin,
  };
}

function computeHitRates(p: PlayerRow, lens: StatLens) {
  const r = getRounds(p, lens);
  return STAT_CONFIG[lens].thresholds.map(t =>
    Math.round((r.filter(v => v >= t).length / r.length) * 100)
  );
}

/* -------------------------------------------------------------------------- */
/*                              TABLE CELLS                                   */
/* -------------------------------------------------------------------------- */

const HeaderCell = ({ children, className="" }: any) => (
  <th className={`border-b border-neutral-800 bg-black/95 px-2.5 py-2 text-left text-[10px] font-semibold uppercase tracking-[0.16em] text-neutral-400 ${className}`}>
    {children}
  </th>
);

const BodyCell = ({ value, className="", compact, blurClass="" }: any) => (
  <td className={`border-b border-neutral-900 bg-black/80 px-2.5 ${compact?"py-2":"py-2.5"} text-[11px] text-neutral-200 ${blurClass} ${className}`}>
    {value}
  </td>
);
/* -------------------------------------------------------------------------- */
/*                              INSIGHTS CONTENT                               */
/* -------------------------------------------------------------------------- */

function InsightsContent({ player, selectedStat }: any) {
  const config = STAT_CONFIG[selectedStat];
  const summary = computeSummary(player, selectedStat);
  const hitRates = computeHitRates(player, selectedStat);
  const rounds = getRounds(player, selectedStat);
  const vol =
    summary.volatilityRange <= 8 ? "Low" :
    summary.volatilityRange <= 14 ? "Medium" : "High";

  return (
    <div className="flex flex-col gap-4 pb-10">
      {/* round-by-round */}
      <div>
        <div className="text-[10px] uppercase text-neutral-500">Round-by-round</div>
        <div className="overflow-x-auto mt-2 flex gap-2">
          {rounds.map((v,i)=>(
            <div key={i} className="min-w-[46px] flex flex-col items-center">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
              <div className="mt-1 h-8 w-10 flex items-center justify-center rounded bg-neutral-900 text-[11px]">{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* summary card */}
      <div className="rounded-2xl border border-neutral-800 bg-neutral-950 p-4">
        <div className="flex justify-between">
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Avg</div>
            <div className="text-yellow-200 text-sm font-semibold">{summary.avg} {config.valueUnitShort}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Total</div>
            <div className="text-neutral-200 text-sm">{summary.total}</div>
          </div>
          <div>
            <div className="text-[10px] uppercase text-neutral-500">Volatility</div>
            <div className="text-sm text-teal-300">{vol}</div>
          </div>
        </div>
      </div>

      {/* confidence + hit rates */}
      <div className="grid gap-4">
        <div className="rounded-2xl border border-yellow-500/30 bg-black p-4">
          <div className="text-[10px] uppercase text-yellow-200 mb-2">Confidence</div>
          <div className="text-2xl text-yellow-200">
            {Math.round((hitRates[1] + hitRates[2]) / 2)}%
          </div>
        </div>

        <div className="rounded-2xl border border-neutral-800 bg-black p-4">
          <div className="text-[10px] uppercase text-neutral-500 mb-2">Hit-rate</div>
          <div className="space-y-2">
            {hitRates.map((rate,i)=>(
              <div key={i} className="flex items-center gap-3">
                <div className="w-10 text-[10px] text-neutral-400">{STAT_CONFIG[selectedStat].thresholds[i]}+</div>
                <div className="flex-1 h-1.5 bg-neutral-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-400 via-yellow-300 to-lime-400"
                    style={{ width: `${rate}%` }}
                  />
                </div>
                <div className={`w-8 text-right text-[10px] font-semibold ${
                  rate >= 75 ? "text-lime-300" :
                  rate >= 50 ? "text-yellow-300" :
                  rate >= 30 ? "text-amber-300" :
                  "text-red-300"
                }`}>
                  {rate}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                             INSIGHTS OVERLAY                                */
/* -------------------------------------------------------------------------- */

function InsightsOverlay({ player, selectedStat, onClose, onLensChange }: any) {
  const [swipeStart, setSwipeStart] = useState(0);
  const [swipeY, setSwipeY] = useState(0);

  useEffect(() => {
    const o = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = o; };
  }, []);

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" onClick={onClose}>
      <div className="flex h-full justify-end" onClick={(e)=>e.stopPropagation()}>
        
        {/* DESKTOP RIGHT PANEL */}
        <div className="hidden md:block w-[480px] h-full bg-black border-l border-yellow-500/30 px-5 py-4">
          <div className="flex justify-between mb-4">
            <div>
              <div className="text-[10px] uppercase text-yellow-200">Player insights</div>
              <div className="text-neutral-50 text-sm mt-1">{player.name}</div>
              <div className="text-[10px] uppercase text-neutral-400">{player.team} • {player.role}</div>
            </div>
            <button onClick={onClose} className="p-1.5 bg-neutral-900 rounded-full text-neutral-300">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* stat lens pills (TS fix applied) */}
          <div className="flex gap-2 rounded-full border border-neutral-700 bg-black px-2 py-1 mb-4">
            {(["Fantasy","Disposals","Goals"] as StatLens[]).map((s)=>(
              <button
                key={s}
                onClick={()=>onLensChange(s)}
                className={`px-3 py-1.5 rounded-full ${
                  selectedStat===s?"bg-yellow-400 text-black":"bg-neutral-900 text-neutral-300"
                }`}
              >
                {s}
              </button>
            ))}
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto pr-1">
            <InsightsContent player={player} selectedStat={selectedStat} />
          </div>
        </div>

        {/* MOBILE BOTTOM-SHEET */}
        <div className="md:hidden w-full flex items-end">
          <div
            className="w-full rounded-t-3xl border border-yellow-500/25 bg-black px-4 py-3 shadow-[0_0_50px_rgba(250,204,21,0.7)] transition-transform duration-300 ease-out"
            style={{ transform: swipeY > 40 ? `translateY(${swipeY}px)` : "translateY(0)" }}
            onTouchStart={(e) => setSwipeStart(e.touches[0].clientY)}
            onTouchMove={(e) => {
              const dy = e.touches[0].clientY - swipeStart;
              if (dy > 0) setSwipeY(dy);
            }}
            onTouchEnd={() => {
              if (swipeY > 120) onClose();
              setSwipeY(0);
            }}
          >
            <div className="mx-auto mt-1 mb-3 h-1.5 w-10 rounded-full bg-yellow-200/70"></div>

            <div className="flex justify-between mb-3">
              <div>
                <div className="text-[10px] uppercase text-yellow-200">Player insights</div>
                <div className="text-neutral-50 text-sm mt-1">{player.name}</div>
                <div className="text-[10px] uppercase text-neutral-400">{player.team} • {player.role}</div>
              </div>
              <button onClick={onClose} className="p-1.5 bg-neutral-900 rounded-full text-neutral-300">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* TS FIX APPLIED HERE */}
            <div className="flex gap-2 rounded-full border border-neutral-700 bg-black px-2 py-1 mb-3">
              {(["Fantasy","Disposals","Goals"] as StatLens[]).map((s)=>(
                <button
                  key={s}
                  onClick={()=>onLensChange(s)}
                  className={`px-3 py-1.5 rounded-full ${
                    selectedStat===s?"bg-yellow-400 text-black":"bg-neutral-900 text-neutral-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            <div className="max-h-[65vh] overflow-y-auto pb-2">
              <InsightsContent player={player} selectedStat={selectedStat} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
/* -------------------------------------------------------------------------- */
/*                         MOBILE PLAYER CARD (unchanged)                     */
/* -------------------------------------------------------------------------- */

function MobilePlayerCard({ player, index, selectedStat, blurClass, onOpen }: any) {
  const summary = computeSummary(player, selectedStat);
  const rounds = getRounds(player, selectedStat);
  const config = STAT_CONFIG[selectedStat];

  return (
    <div className={`rounded-2xl border border-neutral-800 bg-black px-4 py-3 ${blurClass}`}>
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-700 text-[11px]">
            {index + 1}
          </div>
          <div>
            <div className="text-[13px] text-neutral-50">{player.name}</div>
            <div className="text-[10px] uppercase text-neutral-400">
              {player.team} • {player.role}
            </div>
          </div>
        </div>

        <div className="text-right text-[11px]">
          <div className="text-[10px] text-neutral-500 uppercase">{config.label} avg</div>
          <div className="text-yellow-200 text-sm font-semibold">{summary.avg}</div>
        </div>
      </div>

      <div className="mt-3 overflow-x-auto">
        <div className="flex gap-2">
          {rounds.map((v,i)=>(
            <div key={i} className="flex flex-col min-w-[46px] items-center">
              <span className="text-[9px] text-neutral-500">{ROUND_LABELS[i]}</span>
              <div className="h-8 w-10 mt-1 flex items-center justify-center rounded bg-neutral-900 text-[11px]">
                {v}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-3 flex justify-between items-center">
        <div className="text-[10px] text-neutral-400">Tap insights</div>
        <Button onClick={onOpen} size="sm" className="bg-yellow-400 text-black px-3 py-1 rounded-full text-[11px]">
          View insights
        </Button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*                               MASTER TABLE                                 */
/* -------------------------------------------------------------------------- */

export default function MasterTable() {
  const { isPremium } = useAuth();
  const [selectedStat, setSelectedStat] = useState<StatLens>("Fantasy");
  const [compactMode, setCompactMode] = useState(false);
  const [visibleCount, setVisibleCount] = useState(20);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerRow | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(()=>setIsMounted(true), []);

  const players = useMemo(()=>MOCK_PLAYERS, []);
  const visiblePlayers = players.slice(0, visibleCount);
  const hasMore = visibleCount < players.length;

  const open = (p: PlayerRow) => setSelectedPlayer(p);
  const close = () => setSelectedPlayer(null);

  const rowBase = "border-b border-neutral-900 text-[11px] text-neutral-200";

  return (
    <>
      {/* HEADER */}
      <div className="rounded-3xl border border-neutral-800 bg-black px-5 py-4">
        <div className="flex flex-col md:flex-row md:justify-between gap-3">
          <div>
            <div className="inline-flex gap-2 items-center border border-yellow-500/40 rounded-full px-3 py-1 text-[10px] text-yellow-200">
              <span className="h-1.5 w-1.5 rounded-full bg-yellow-400"></span>
              Master table
            </div>
            <h3 className="mt-3 text-neutral-50 text-xl md:text-2xl">Full-season player ledger</h3>
            <p className="text-xs text-neutral-400 mt-2 max-w-2xl">Full ledger overview…</p>
          </div>

          {/* stat lens pills — TS FIX APPLIED */}
          <div className="flex flex-col gap-3 md:items-end">
            <div className="flex gap-2 border border-neutral-700 bg-black rounded-full px-2 py-1 text-[11px]">
              {(["Fantasy","Disposals","Goals"] as StatLens[]).map((s)=>(
                <button
                  key={s}
                  onClick={()=>setSelectedStat(s)}
                  className={`px-3 py-1.5 rounded-full ${
                    selectedStat===s ? "bg-yellow-400 text-black" : "bg-neutral-900 text-neutral-300"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>

            {/* compact hidden on mobile */}
            <div className="hidden md:flex gap-2 items-center border border-neutral-700 bg-black px-3 py-1.5 rounded-full">
              <Switch checked={compactMode} onCheckedChange={setCompactMode} />
              <span className="text-[11px] text-neutral-100">Compact</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------- DESKTOP TABLE ---------------- */}
      <div className="hidden md:block mt-8 rounded-3xl border border-neutral-800 bg-neutral-950">
        <div className="overflow-x-auto">
          <table className="min-w-[1040px] w-full border-separate border-spacing-0">
            <thead>
              <tr className="sticky top-0 bg-black backdrop-blur-md">
                <HeaderCell className="sticky left-0 z-30 w-60 border-r border-neutral-900 bg-black">
                  Player
                </HeaderCell>

                {!compactMode && ROUND_LABELS.map((r)=>(
                  <HeaderCell key={r}>{r}</HeaderCell>
                ))}

                <HeaderCell className="text-right">Min</HeaderCell>
                <HeaderCell className="text-right">Max</HeaderCell>
                <HeaderCell className="text-right">Avg</HeaderCell>
                <HeaderCell className="text-right">Total</HeaderCell>

                {STAT_CONFIG[selectedStat].thresholds.map((t)=>(
                  <HeaderCell key={t} className="text-right">{t}+</HeaderCell>
                ))}
              </tr>
            </thead>

            <tbody>
              {visiblePlayers.map((p,i)=>{
                const sum = computeSummary(p, selectedStat);
                const rates = computeHitRates(p, selectedStat);
                const rounds = getRounds(p, selectedStat);
                const blur = !isPremium && i >= 20 ? "blur-[3px] brightness-[0.65]" : "";

                return (
                  <tr key={p.id} className="hover:bg-neutral-900/50">
                    {/* Player */}
                    <td
                      className={`sticky left-0 z-10 w-60 border-r border-neutral-900 bg-black px-4 cursor-pointer ${blur}`}
                      onClick={()=>open(p)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-7 w-7 flex items-center justify-center rounded-full border border-neutral-700">
                          {p.rank}
                        </div>
                        <div>
                          <div className="text-neutral-50 text-[13px]">{p.name}</div>
                          <div className="text-[10px] uppercase text-neutral-400">{p.team} • {p.role}</div>
                        </div>
                        <ChevronRight className="ml-auto text-neutral-500" />
                      </div>
                    </td>

                    {!compactMode && rounds.map((v,j)=>(
                      <BodyCell key={j} value={v} blurClass={blur} />
                    ))}

                    <BodyCell value={sum.min} className="text-right" blurClass={blur} />
                    <BodyCell value={sum.max} className="text-right" blurClass={blur} />
                    <BodyCell value={sum.avg} className="text-right text-yellow-200" blurClass={blur} />
                    <BodyCell value={sum.total} className="text-right" blurClass={blur} />

                    {/* HIT-RATE COLOURS (updated) */}
                    {rates.map((rate,j)=>(
                      <BodyCell
                        key={j}
                        value={`${rate}%`}
                        className={`text-right font-semibold ${
                          rate >= 75 ? "text-lime-300" :
                          rate >= 50 ? "text-yellow-300" :
                          rate >= 30 ? "text-amber-300" : "text-red-300"
                        }`}
                        blurClass={blur}
                      />
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* BUTTON CENTERED */}
        {hasMore && (
          <div className="border-t border-neutral-900 bg-black py-3 flex justify-center">
            <Button
              variant="outline"
              onClick={()=>setVisibleCount(visibleCount+20)}
              className="border-neutral-700 bg-neutral-950 text-neutral-200"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* ---------------- MOBILE LIST ---------------- */}
      <div className="md:hidden mt-8 space-y-3">
        {visiblePlayers.map((p,i)=>(
          <MobilePlayerCard
            key={p.id}
            player={p}
            index={i}
            selectedStat={selectedStat}
            blurClass={!isPremium && i>=20 ? "blur-[3px] brightness-[0.65]" : ""}
            onOpen={()=>open(p)}
          />
        ))}

        {hasMore && (
          <div className="text-center mt-4">
            <Button
              variant="outline"
              onClick={()=>setVisibleCount(visibleCount+20)}
              className="border-neutral-700 bg-neutral-900 text-neutral-200"
            >
              Show 20 more players
            </Button>
          </div>
        )}
      </div>

      {/* CTA */}
      <div className="mt-16 flex flex-col items-center gap-3 text-center">
        <div className="inline-flex gap-2 items-center border border-yellow-500/40 rounded-full px-3 py-1 text-[10px] text-yellow-200">
          <Sparkles className="h-3 w-3" /> Neeko+ Master Grid
        </div>
        <p className="text-xs text-neutral-300 max-w-xl">Unlock full grid…</p>
        <Button className="bg-yellow-400 text-black px-7 py-2 rounded-full">Get Neeko+</Button>
      </div>

      {/* PORTAL OVERLAY */}
      {isMounted && selectedPlayer &&
        createPortal(
          <InsightsOverlay
            player={selectedPlayer}
            selectedStat={selectedStat}
            onClose={close}
            onLensChange={setSelectedStat}
          />,
          document.body
        )
      }
    </>
  );
}
