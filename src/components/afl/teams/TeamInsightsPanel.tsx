// src/components/afl/teams/TeamInsightsPanel.tsx

import React, { useEffect, useRef, useState } from "react";
import { X, ArrowRight } from "lucide-react";
import Link from "next/link";
import { MODE_CONFIG, Mode } from "./TeamMasterTable";
import { TeamRow } from "./mockTeams";
import { useAuth } from "@/lib/auth";

type TeamInsightsPanelProps = {
  team: TeamRow;
  mode: Mode;
  modeSeries: number[];
  modeSummary: { min: number; max: number; average: number; total: number };
  onClose: () => void;
};

/* -------------------------------------------------------------------------- */
/*                                HAPTICS                                     */
/* -------------------------------------------------------------------------- */

function triggerHaptic() {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    navigator.vibrate(10);
  }
}

/* -------------------------------------------------------------------------- */
/*                             MAIN COMPONENT                                 */
/* -------------------------------------------------------------------------- */

const TeamInsightsPanel: React.FC<TeamInsightsPanelProps> = ({
  team,
  mode,
  modeSeries,
  modeSummary,
  onClose,
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handle = () => setIsMobile(window.innerWidth < 768);
    handle();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  }, []);

  if (!isMobile) {
    return (
      <>
        {/* Desktop backdrop */}
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[90]"
          onClick={() => {
            triggerHaptic();
            onClose();
          }}
        />
        {/* Desktop side panel */}
        <div className="fixed right-0 top-0 h-full w-[380px] bg-neutral-950/98 border-l border-neutral-800 z-[100] shadow-[0_0_40px_rgba(0,0,0,0.85)]">
          <button
            className="absolute right-4 top-4 text-neutral-400 hover:text-white"
            onClick={() => {
              triggerHaptic();
              onClose();
            }}
          >
            <X size={20} />
          </button>
          <div className="h-full overflow-y-auto pt-10 px-5 pb-8 no-scrollbar">
            <InsightsContent
              team={team}
              mode={mode}
              modeSeries={modeSeries}
              modeSummary={modeSummary}
            />
          </div>
        </div>
      </>
    );
  }

  return <MobileSheet team={team} mode={mode} modeSeries={modeSeries} modeSummary={modeSummary} onClose={onClose} />;
};

export default TeamInsightsPanel;

/* -------------------------------------------------------------------------- */
/*                           MOBILE BOTTOM SHEET                              */
/* -------------------------------------------------------------------------- */

type MobileSheetProps = TeamInsightsPanelProps;

const MobileSheet: React.FC<MobileSheetProps> = ({
  team,
  mode,
  modeSeries,
  modeSummary,
  onClose,
}) => {
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const startY = useRef(0);
  const lastY = useRef(0);
  const velocity = useRef(0);

  const dragging = useRef(false);
  const animating = useRef(false);

  const [sheetY, setSheetY] = useState(0);
  const [backdropOpacity, setBackdropOpacity] = useState(1);

  useEffect(() => {
    // start with subtle slide-up
    setSheetY(0);
    setBackdropOpacity(1);
  }, []);

  const snapBack = () => {
    animating.current = true;
    const duration = 180;
    const start = sheetY;
    const startTime = performance.now();

    const step = (time: number) => {
      const t = Math.min((time - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      const value = start * (1 - eased);

      setSheetY(value);
      setBackdropOpacity(Math.max(0, 1 - value / 300));

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        animating.current = false;
      }
    };

    requestAnimationFrame(step);
  };

  const closeSheet = () => {
    animating.current = true;
    const duration = 220;
    const start = sheetY;
    const end = 600;
    const startTime = performance.now();

    const step = (time: number) => {
      const t = Math.min((time - startTime) / duration, 1);
      const eased = Math.pow(t, 1.8); // spring-like ease
      const value = start + (end - start) * eased;

      setSheetY(value);
      setBackdropOpacity(Math.max(0, 1 - value / 300));

      if (t < 1) {
        requestAnimationFrame(step);
      } else {
        animating.current = false;
        onClose();
      }
    };

    requestAnimationFrame(step);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (animating.current) return;

    const scrollTop = scrollRef.current?.scrollTop ?? 0;
    if (scrollTop > 0) {
      dragging.current = false;
      return;
    }

    dragging.current = true;
    startY.current = e.touches[0].clientY;
    lastY.current = startY.current;
    velocity.current = 0;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!dragging.current) return;

    const y = e.touches[0].clientY;
    const delta = y - startY.current;

    velocity.current = y - lastY.current;
    lastY.current = y;

    if (delta > 0) {
      const eased = delta * 0.55;
      setSheetY(eased);
      setBackdropOpacity(Math.max(0, 1 - eased / 300));
    }
  };

  const handleTouchEnd = () => {
    if (!dragging.current) return;
    dragging.current = false;

    const fastFlick = velocity.current > 12;
    const farEnough = sheetY > 140;

    if (fastFlick || farEnough) {
      triggerHaptic();
      closeSheet();
    } else {
      snapBack();
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black backdrop-blur-sm z-[90]"
        style={{ opacity: backdropOpacity }}
        onClick={() => {
          triggerHaptic();
          closeSheet();
        }}
      />

      {/* Sheet */}
      <div
        ref={sheetRef}
        className="fixed left-0 right-0 bottom-0 z-[100] bg-neutral-950 rounded-t-3xl border-t border-neutral-800 shadow-[0_-24px_80px_rgba(0,0,0,0.95)]"
        style={{
          transform: `translateY(${sheetY}px)`,
          maxHeight: "92vh",
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* drag handle + close */}
        <div className="relative flex items-center justify-center pt-3 pb-1">
          <div className="w-10 h-1.5 rounded-full bg-neutral-600/60" />
          <button
            className="absolute right-5 top-1 text-neutral-400 hover:text-white"
            onClick={() => {
              triggerHaptic();
              closeSheet();
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div
          ref={scrollRef}
          className="overflow-y-auto max-h-[80vh] px-5 pb-8 no-scrollbar"
        >
          <InsightsContent
            team={team}
            mode={mode}
            modeSeries={modeSeries}
            modeSummary={modeSummary}
          />
        </div>
      </div>
    </>
  );
};

/* -------------------------------------------------------------------------- */
/*                             CONTENT LAYOUT                                 */
/* -------------------------------------------------------------------------- */

type InsightsContentProps = {
  team: TeamRow;
  mode: Mode;
  modeSeries: number[];
  modeSummary: { min: number; max: number; average: number; total: number };
};

const InsightsContent: React.FC<InsightsContentProps> = ({
  team,
  mode,
  modeSeries,
  modeSummary,
}) => {
  const { isPremium } = useAuth();
  const config = MODE_CONFIG[mode];
  const windowSeries = modeSeries.slice(-8);
  const last5 = modeSeries.slice(-5);

  return (
    <div>
      {/* Header */}
      <div className="mb-4">
        <p className="text-[11px] uppercase tracking-[0.2em] text-yellow-300">
          Team Insights
        </p>
        <h2 className="mt-1 text-xl font-semibold text-white">{team.name}</h2>
        <p className="text-xs text-neutral-400 mt-0.5">{team.code}</p>
      </div>

      {/* Hero card – average window */}
      <div className="rounded-2xl bg-gradient-to-br from-neutral-900 to-black border border-neutral-800 px-4 py-4 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
              {config.label} window
            </p>
            <p className="text-[11px] text-neutral-400 mt-0.5">
              Last 8 rounds · form & stability
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-500">
              Avg
            </p>
            <p className="text-3xl font-semibold text-yellow-300">
              {modeSummary.average}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5 mt-1">
          {windowSeries.map((v, i) => (
            <div
              key={i}
              className="px-2 py-1 rounded-full bg-neutral-800/80 text-[11px] text-neutral-100"
            >
              {v}
            </div>
          ))}
        </div>
      </div>

      {/* Stats grid card */}
      <div className="rounded-2xl bg-neutral-950 border border-neutral-800 px-4 py-4 mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
          {config.label} stats
        </p>

        <div className="grid grid-cols-2 gap-y-3 gap-x-4 mt-3 text-sm">
          <div>
            <p className="text-[11px] text-neutral-500">Average</p>
            <p className="text-neutral-50 font-semibold">
              {modeSummary.average}
            </p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500">Total</p>
            <p className="text-neutral-50 font-semibold">{modeSummary.total}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500">Min</p>
            <p className="text-neutral-50 font-semibold">{modeSummary.min}</p>
          </div>
          <div>
            <p className="text-[11px] text-neutral-500">Max</p>
            <p className="text-neutral-50 font-semibold">{modeSummary.max}</p>
          </div>
        </div>

        <div className="mt-4">
          <p className="text-[10px] uppercase tracking-[0.18em] text-neutral-400">
            Last 5 rounds
          </p>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {last5.map((v, i) => (
              <div
                key={i}
                className="px-2 py-1 rounded-full bg-neutral-800/80 text-[11px] text-neutral-100"
              >
                {v}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* AI summary card */}
      <div className="rounded-2xl border border-neutral-800 bg-gradient-to-br from-neutral-950 via-neutral-950 to-neutral-900 px-4 py-4 mb-4">
        <p className="text-[10px] uppercase tracking-[0.18em] text-yellow-300 flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.7)]" />
          AI Summary
        </p>
        <p className="mt-2 text-sm leading-relaxed text-neutral-200">
          {team.name} is showing{" "}
          <span className="font-semibold text-yellow-200">
            neutral–positive momentum
          </span>{" "}
          in {config.label.toLowerCase()} over the latest block. Current output is
          stabilising around{" "}
          <span className="font-semibold text-yellow-200">
            {modeSummary.average}
          </span>{" "}
          per game, with{" "}
          <span className="font-semibold text-neutral-100">
            moderate volatility
          </span>{" "}
          relative to league trends.
        </p>
      </div>

      {/* Upgrade CTA – mirrors your AI analysis paywall style */}
      {!isPremium && (
        <div className="rounded-2xl border border-yellow-500/40 bg-gradient-to-b from-yellow-500/15 via-neutral-950 to-neutral-950 px-4 py-4 mt-1">
          <p className="text-[10px] uppercase tracking-[0.18em] text-yellow-200 mb-1">
            Neeko+ Upgrade
          </p>
          <p className="text-sm font-semibold text-white">
            Unlock full AFL AI analysis
          </p>
          <p className="mt-1 text-xs text-neutral-200">
            Access deeper trend breakdowns, volatility curves, forecasting and
            AI-generated matchup insights across all 18 clubs.
          </p>

          <Link
            href="/neeko-plus"
            className="mt-4 flex h-11 w-full items-center justify-center rounded-full bg-yellow-400 text-[13px] font-semibold text-black shadow-[0_0_30px_rgba(250,204,21,0.7)] active:scale-95 transition"
            onClick={triggerHaptic}
          >
            Upgrade to Neeko+
            <ArrowRight className="ml-1.5 h-4 w-4" />
          </Link>

          <button
            type="button"
            className="mt-2 h-10 w-full rounded-full border border-neutral-700 bg-neutral-950 text-[12px] text-neutral-200 active:scale-95 transition"
          >
            Maybe later
          </button>
        </div>
      )}
    </div>
  );
};