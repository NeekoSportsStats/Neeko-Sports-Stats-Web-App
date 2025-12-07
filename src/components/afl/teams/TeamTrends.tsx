// src/components/afl/teams/TeamTrends.tsx
import React, { useMemo } from "react";
import { MOCK_TEAMS } from "./mockTeams";
import { TrendingUp, Shield, Activity } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*                         Sparkline Large Placeholder                         */
/* -------------------------------------------------------------------------- */
function SparklineLarge({ values }: { values: number[] }) {
  return (
    <div className="h-24 w-full rounded-xl bg-gradient-to-b from-neutral-800/40 to-black shadow-inner" />
  );
}

/* -------------------------------------------------------------------------- */
/*                             TEAM TRENDS SECTION                             */
/* -------------------------------------------------------------------------- */
export default function TeamTrends() {
  /* ---------------------------------------------------------------------- */
  /*                           LEAGUE-WIDE OFFENCE                           */
  /* ---------------------------------------------------------------------- */

  const offenceTrend = useMemo(() => {
    const rounds = 23;
    const arr: number[] = [];
    for (let r = 0; r < rounds; r++) {
      const roundScores = MOCK_TEAMS.map((t) => t.scores[r]);
      arr.push(
        Math.round(
          roundScores.reduce((a, b) => a + b, 0) / roundScores.length
        )
      );
    }
    return arr;
  }, []);

  // Expected score proxy (smooth version of offence trend)
  const expectedTrend = useMemo(() => {
    return offenceTrend.map((v, i) => {
      const prev = offenceTrend[i - 1] ?? v;
      return Math.round((v + prev) / 2);
    });
  }, [offenceTrend]);

  // Conversion rate placeholder (65%–85%)
  const conversionTrend = useMemo(() => {
    return offenceTrend.map(
      () => Math.floor(65 + Math.random() * 20)
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                           LEAGUE-WIDE DEFENCE                           */
  /* ---------------------------------------------------------------------- */

  const defenceTrend = useMemo(() => {
    const rounds = 23;
    const arr: number[] = [];

    for (let r = 0; r < rounds; r++) {
      // Conceded points = negative margin adjustment
      const conceded = MOCK_TEAMS.map(
        (t) => t.scores[r] - t.margins[r]
      );
      arr.push(
        Math.round(conceded.reduce((a, b) => a + b, 0) / conceded.length)
      );
    }
    return arr;
  }, []);

  // Pressure index placeholder (0–100)
  const pressureTrend = useMemo(() => {
    return defenceTrend.map((_, i) =>
      Math.floor(40 + Math.random() * 50)
    );
  }, []);

  /* ---------------------------------------------------------------------- */
  /*                          LEAGUE-WIDE MIDFIELD                            */
  /* ---------------------------------------------------------------------- */

  // Contested possession proxy — combine clearanceDom + margins
  const midfieldTrend = useMemo(() => {
    const arr: number[] = [];

    for (let r = 0; r < 23; r++) {
      const contestedProxy = MOCK_TEAMS.map(
        (t) => t.clearanceDom[r] + (t.margins[r] / 3)
      );
      arr.push(
        Math.round(
          contestedProxy.reduce((a, b) => a + b, 0) /
            contestedProxy.length
        )
      );
    }
    return arr;
  }, []);

  // Stoppage wins proxy (random variance)
  const stoppageTrend = useMemo(() => {
    return midfieldTrend.map(
      (v) => v - Math.floor(5 - Math.random() * 10)
    );
  }, [midfieldTrend]);

  return (
    <section className="mt-14">
      {/* Header */}
      <div className="inline-flex items-center gap-2 rounded-full border border-yellow-600/40 bg-gradient-to-r from-yellow-500/20 via-yellow-500/5 to-transparent px-3 py-1">
        <span className="h-1.5 w-1.5 rounded-full bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.8)]" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-yellow-200/90">
          Team Trends
        </span>
      </div>

      <h2 className="mt-4 text-xl font-semibold text-neutral-50 md:text-2xl">
        Offence, defence & midfield evolution across the league
      </h2>

      <p className="mt-2 max-w-2xl text-xs text-neutral-400">
        Rolling trends highlighting scoring quality, defensive strength, pressure indicators
        and centre-bounce dominance.
      </p>

      {/* GRID OF 3 TRENDS */}
      <div className="mt-10 space-y-10">

        {/* -------------------------------------------------------------- */}
        {/* OFFENCE TREND                                                   */}
        {/* -------------------------------------------------------------- */}
        <TrendBlock
          title="Offence Trend"
          icon={<TrendingUp className="h-4 w-4 text-yellow-300" />}
          description="Average points scored, expected scoring flow and conversion rate across the league."
          series={[
            { label: "Points Scored", values: offenceTrend },
            { label: "Expected Score", values: expectedTrend },
            { label: "Conversion Rate %", values: conversionTrend },
          ]}
        />

        {/* -------------------------------------------------------------- */}
        {/* DEFENCE TREND                                                   */}
        {/* -------------------------------------------------------------- */}
        <TrendBlock
          title="Defence Trend"
          icon={<Shield className="h-4 w-4 text-teal-300" />}
          description="Points conceded trend, defensive solidity and league-wide pressure indicators."
          series={[
            { label: "Points Conceded", values: defenceTrend },
            { label: "Pressure Index", values: pressureTrend },
          ]}
        />

        {/* -------------------------------------------------------------- */}
        {/* MIDFIELD TREND                                                  */}
        {/* -------------------------------------------------------------- */}
        <TrendBlock
          title="Midfield Trend"
          icon={<Activity className="h-4 w-4 text-orange-300" />}
          description="Clearances, contested ball influence and stoppage-win effectiveness."
          series={[
            { label: "Contested Influence", values: midfieldTrend },
            { label: "Stoppage Wins", values: stoppageTrend },
          ]}
        />
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- */
/*                             TREND BLOCK COMPONENT                           */
/* -------------------------------------------------------------------------- */

function TrendBlock({
  title,
  icon,
  description,
  series,
}: {
  title: string;
  icon: React.ReactNode;
  description: string;
  series: { label: string; values: number[] }[];
}) {
  return (
    <div className="rounded-3xl border border-neutral-800/70 bg-gradient-to-b from-neutral-900/80 to-black p-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
      {/* Header */}
      <div className="flex items-center gap-3">
        {icon}
        <h3 className="text-lg font-semibold text-neutral-50">{title}</h3>
      </div>

      <p className="mt-1 max-w-xl text-xs text-neutral-400">{description}</p>

      {/* Chart Series */}
      <div className="mt-6 space-y-6">
        {series.map((s) => (
          <div key={s.label}>
            <div className="mb-2 text-[10px] uppercase tracking-[0.16em] text-neutral-500">
              {s.label}
            </div>
            <SparklineLarge values={s.values} />
          </div>
        ))}
      </div>
    </div>
  );
}
