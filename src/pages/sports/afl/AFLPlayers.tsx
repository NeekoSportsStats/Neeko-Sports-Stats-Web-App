// src/pages/sports/afl/AFLPlayers.tsx
import React from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";
import FormStabilityGrid from "@/components/afl/players/FormStabilityGrid";

export default function AFLPlayersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* Page Header */}
      <header className="mb-7 md:mb-9">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-[15px]">
          League-wide momentum, fantasy analytics, player trends, stability
          insights and performance signals — all in one intelligent dashboard.
        </p>
      </header>

      {/* Section Navigation */}
      <nav
        className="
          mb-6 md:mb-8
          rounded-2xl border border-white/5
          bg-gradient-to-r from-[#050515] via-[#050512] to-[#030308]
          px-4 py-3 md:px-6 md:py-3.5
          shadow-[0_0_40px_rgba(0,0,0,0.55)]
        "
      >
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-white/45">
            Sections
          </div>
          <div className="flex flex-wrap gap-2 md:justify-end">
            <a
              href="#round-momentum"
              className="
                rounded-full border border-white/15
                bg-white/5 px-3.5 py-1.5
                text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              Round Momentum
            </a>
            <a
              href="#form-stability"
              className="
                rounded-full border border-white/15
                bg-white/5 px-3.5 py-1.5
                text-xs font-medium text-white/75
                hover:bg-white/10 hover:text-white
                transition-colors
              "
            >
              Form Stability Grid
            </a>
          </div>
        </div>
      </nav>

      {/* Page Sections */}
      <div className="space-y-10 md:space-y-14">
        {/* Section 1 — Round Summary */}
        <section id="round-momentum" className="scroll-mt-24">
          <RoundSummary />
        </section>

        {/* Section 2 — Form Stability Grid */}
        <section id="form-stability" className="scroll-mt-24">
          <FormStabilityGrid />
        </section>

        {/* Future sections can be added below */}
        {/* <YourNextSection /> */}
      </div>
    </div>
  );
}
