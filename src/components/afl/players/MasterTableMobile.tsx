import React, { useState } from "react";
import { Lock, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PlayerRow, StatLens } from "./MasterTable";

/* -------------------------------------------------------------------------- */
/* HELPERS                                                                    */
/* -------------------------------------------------------------------------- */

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function getRounds(player: PlayerRow, lens: StatLens) {
  if (lens === "Fantasy") return player.roundsFantasy;
  if (lens === "Disposals") return player.roundsDisposals;
  return player.roundsGoals;
}

/* -------------------------------------------------------------------------- */
/* CONSTANTS                                                                  */
/* -------------------------------------------------------------------------- */

const PAGE_SIZE = 10;
const BLUR_AFTER = 8;
const CTA_AFTER = 9;

/* -------------------------------------------------------------------------- */
/* COMPONENT                                                                  */
/* -------------------------------------------------------------------------- */

export default function MasterTableMobile({
  players,
  selectedStat,
  setSelectedStat,
  isPremium,
  onSelectPlayer,
}: {
  players: PlayerRow[];
  selectedStat: StatLens;
  setSelectedStat: (s: StatLens) => void;
  isPremium: boolean;
  onSelectPlayer: (p: PlayerRow) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [showModal, setShowModal] = useState(false);

  const visiblePlayers = players.slice(0, visibleCount);

  return (
    <div className="mt-6 relative">

      {/* ================= HEADER ================= */}
      <div className="rounded-3xl border border-neutral-800 bg-black/90 px-4 py-4 shadow-xl">
        <div className="inline-flex items-center gap-2 rounded-full border border-yellow-500/30 bg-yellow-500/10 px-3 py-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          <span className="text-[10px] uppercase tracking-[0.18em] text-yellow-200">
            Master Table
          </span>
        </div>

        <h3 className="mt-3 text-lg font-semibold text-neutral-50">
          Full-season player trends
        </h3>

        <p className="mt-1 text-xs text-neutral-400">
          Round-by-round production.
        </p>

        {/* Lens selector */}
        <div className="mt-4 flex items-center gap-2 rounded-full border border-neutral-700 bg-black/80 px-2 py-1 text-[11px]">
          {(["Fantasy", "Disposals", "Goals"] as StatLens[]).map((s) => (
            <button
              key={s}
              onClick={() => setSelectedStat(s)}
              className={cx(
                "rounded-full px-3 py-1.5",
                selectedStat === s
                  ? "bg-yellow-400 text-black shadow-[0_0_16px_rgba(250,204,21,0.6)]"
                  : "bg-neutral-900 text-neutral-300"
              )}
            >
              {s}
            </button>
          ))}
        </div>

        {!isPremium && (
          <div className="mt-3 flex items-center gap-2 rounded-2xl border border-neutral-800 bg-black/60 px-3 py-2">
            <Lock className="h-4 w-4 text-neutral-500" />
            <span className="text-[12px] text-neutral-500">
              Search is Neeko+ only
            </span>
          </div>
        )}
      </div>

      {/* ================= TABLE ================= */}
      <div className="mt-4 rounded-3xl border border-neutral-800 bg-black/90 shadow-xl overflow-hidden">

        {/* Column header */}
        <div className="grid grid-cols-[140px_1fr_70px] px-4 py-3 text-[10px] uppercase tracking-[0.16em] text-neutral-500 border-b border-neutral-800">
          <div>Player</div>
          <div className="pl-1">Rounds</div>
          <div className="pl-2">Insights</div>
        </div>

        {visiblePlayers.map((p, idx) => {
          const rounds = getRounds(p, selectedStat);
          const blurred = !isPremium && idx >= BLUR_AFTER;

          return (
            <React.Fragment key={p.id}>
              <div className="grid grid-cols-[140px_1fr_70px] items-center px-4 py-4 border-b border-neutral-800">

                {/* PLAYER */}
                <div>
                  <div className="text-sm font-semibold text-neutral-50">
                    {p.name}
                  </div>
                  <div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500">
                    {p.team} • {p.role}
                  </div>
                </div>

                {/* ROUNDS (SCROLL — UNCHANGED LOGIC) */}
                <div className="relative overflow-hidden">
                  <div className="flex gap-4 overflow-x-auto no-scrollbar">
                    {rounds.map((v, i) => (
                      <div
                        key={i}
                        className="min-w-[36px] text-center text-sm text-neutral-200"
                      >
                        {v}
                      </div>
                    ))}
                  </div>

                  {/* Blur overlay */}
                  {blurred && (
                    <div className="absolute inset-0 backdrop-blur-md bg-black/60 flex items-center justify-center">
                      <span className="text-xs text-neutral-400">
                        Neeko+ only
                      </span>
                    </div>
                  )}
                </div>

                {/* INSIGHTS */}
                <button
                  onClick={() => !blurred && onSelectPlayer(p)}
                  className="flex items-center justify-end gap-1 text-yellow-300 text-sm pl-2"
                >
                  Insights
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              {/* CTA at row 9 */}
              {!isPremium && idx === CTA_AFTER && (
                <div className="px-4 py-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="w-full rounded-3xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 via-yellow-500/5 to-transparent px-6 py-4 text-left shadow-[0_0_25px_rgba(250,204,21,0.4)]"
                  >
                    <div className="text-[11px] uppercase tracking-[0.18em] text-yellow-200/80">
                      Neeko AI Suite
                    </div>
                    <div className="mt-1 text-sm font-semibold text-yellow-100">
                      Unlock full {selectedStat.toLowerCase()} trends
                    </div>
                    <p className="mt-1 text-xs text-neutral-300">
                      Full season access, insights overlays & premium forecasting.
                    </p>
                  </button>
                </div>
              )}
            </React.Fragment>
          );
        })}

        {/* SHOW MORE */}
        {visibleCount < players.length && (
          <div className="px-4 py-5 text-center">
            <Button
              onClick={() => setVisibleCount((c) => c + PAGE_SIZE)}
              className="rounded-full bg-neutral-800 text-neutral-200 hover:bg-neutral-700"
            >
              Show more players
            </Button>
          </div>
        )}
      </div>

      {/* ================= MODAL ================= */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-3xl border border-yellow-500/40 bg-black px-6 py-6 shadow-[0_0_80px_rgba(0,0,0,1)]">
            <h3 className="text-xl font-semibold text-neutral-50">
              Upgrade to Neeko+
            </h3>
            <p className="mt-2 text-sm text-neutral-300">
              Unlock full round-by-round data, insights overlays and premium AI forecasts.
            </p>

            <div className="mt-6 flex gap-3">
              <a
                href="/neeko-plus"
                className="flex-1 rounded-2xl bg-yellow-400 text-black py-2.5 text-center font-semibold"
              >
                Upgrade
              </a>
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 rounded-2xl border border-neutral-700 py-2.5 text-neutral-300"
              >
                Maybe later
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}