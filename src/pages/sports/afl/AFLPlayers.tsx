// src/pages/sports/afl/AFLPlayers.tsx
import React from "react";
import RoundSummary from "@/components/afl/players/RoundSummary";
import FormStabilityGrid from "@/components/afl/players/FormStabilityGrid";

export default function AFLPlayersPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8 text-white">
      {/* Page Header */}
      <header className="mb-10 md:mb-12">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          AFL Player Performance Dashboard
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-white/70 md:text-[15px]">
          League-wide momentum, fantasy analytics, player trends, stability
          insights and performance signals — all in one intelligent dashboard.
        </p>
      </header>

      {/* Sticky mini section nav */}
      <nav className="sticky top-16 z-20 mb-5 md:mb-7 bg-gradient-to-b from-[#020617]/90 via-[#020617]/70 to-transparent backdrop-blur-md">
        <div className="flex items-center justify-between gap-2 border-b border-white/5 pb-2">
          <p className="text-[11px] uppercase tracking-[0.2em] text-white/40">
            Sections
          </p>
        </div>
        <div className="-mx-2 mt-2 overflow-x-auto scrollbar-thin scrollbar-thumb-white/10">
          <div className="flex min-w-max gap-2 px-2 pb-2">
            <a
              href="#round-summary"
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur-sm transition hover:bg-white/10"
            >
              Round Momentum
            </a>
            <a
              href="#form-stability"
              className="rounded-full border border-white/12 bg-white/5 px-3 py-1.5 text-xs font-medium text-white/75 backdrop-blur-sm transition hover:bg-white/10"
            >
              Form Stability Grid
            </a>
            {/* Future tabs can be added here */}
          </div>
        </div>
      </nav>

      {/* Page Sections */}
      <div className="space-y-10 md:space-y-12">
        {/* Section 1 — Round Summary */}
        <RoundSummary />

        {/* Section 2 — Form Stability Grid */}
        <FormStabilityGrid />

        {/* Future sections can be added below */}
        {/* <YourNextSection /> */}
      </div>
    </div>
  );
}
