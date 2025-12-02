// src/components/afl/players/RoundSummary.tsx
// Entire Round Summary section in ONE component

import {
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  Zap,
  Activity,
} from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";

import { Badge } from "@/components/ui/badge";

// TODO: Wire this up later to real data
const roundNumber = 8;

const highlightCards = [
  {
    label: "Player of the Round",
    title: "Nick Daicos",
    subtitle: "31 disposals • 2 goals • 132 fantasy",
    statLabel: "Impact Rating",
    statValue: "92",
    changeLabel: "vs 3-round avg",
    changeValue: "+14",
    icon: Zap,
    tone: "positive",
  },
  {
    label: "Biggest Riser",
    title: "Caleb Serong",
    subtitle: "Form spike on inside mid role",
    statLabel: "Form Index",
    statValue: "88",
    changeLabel: "3-round trend",
    changeValue: "+21%",
    icon: ArrowUpRight,
    tone: "positive",
  },
  {
    label: "Biggest Dropper",
    title: "Tim Taranto",
    subtitle: "TOG + CBAs down for second week",
    statLabel: "Form Index",
    statValue: "61",
    changeLabel: "3-round trend",
    changeValue: "-18%",
    icon: ArrowDownRight,
    tone: "negative",
  },
  {
    label: "Risk Alert",
    title: "Josh Dunkley",
    subtitle: "Role drift + potential tagging risk",
    statLabel: "Risk Level",
    statValue: "High",
    changeLabel: "AI confidence",
    changeValue: "78%",
    icon: AlertTriangle,
    tone: "warning",
  },
];

const pulseCards = [
  {
    label: "Rising Momentum",
    description:
      "Inside mids and half-backs showing strong 3-round trends in disposals and marks.",
  },
  {
    label: "Dropping Momentum",
    description:
      "Premium mids tapering off due to role changes or reduced time-on-ground.",
  },
  {
    label: "Spike Candidates",
    description:
      "Under-priced breakouts linked to role upgrades and soft matchups.",
  },
  {
    label: "Regression Alerts",
    description:
      "Players overperforming expected stats with tougher games ahead.",
  },
];

function toneClasses(tone: string) {
  switch (tone) {
    case "positive":
      return "border-emerald-500/40 bg-emerald-950/40";
    case "negative":
      return "border-red-500/40 bg-red-950/40";
    case "warning":
      return "border-amber-500/40 bg-amber-950/40";
    default:
      return "";
  }
}

export default function RoundSummary() {
  return (
    <section className="space-y-8 px-4">
      {/* HEADER */}
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs uppercase tracking-wide">
            Round {roundNumber}
          </Badge>

          <Badge
            variant="secondary"
            className="text-[11px] flex items-center gap-1"
          >
            <Activity className="h-3 w-3" />
            AI Round Snapshot
          </Badge>
        </div>

        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">
          Round {roundNumber} – AI Summary
        </h1>

        <p className="text-sm text-muted-foreground max-w-2xl">
          AI-detected performance signals and role shifts from this week’s
          matches.
        </p>
      </div>

      {/* HIGHLIGHT GRID */}
      <div className="grid gap-4 md:grid-cols-2">
        {highlightCards.map((card) => {
          const Icon = card.icon;

          return (
            <Card
              key={card.label}
              className={`relative overflow-hidden border backdrop-blur-sm ${toneClasses(
                card.tone
              )}`}
            >
              <CardHeader className="flex flex-row items-start justify-between pb-3">
                <div className="space-y-1">
                  <CardDescription className="text-[11px] uppercase tracking-wide text-slate-300">
                    {card.label}
                  </CardDescription>

                  <CardTitle className="text-lg font-semibold text-slate-50">
                    {card.title}
                  </CardTitle>

                  <p className="text-xs text-slate-200/80">{card.subtitle}</p>
                </div>

                <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-black/30">
                  <Icon className="h-4 w-4 text-slate-50" />
                </div>
              </CardHeader>

              <CardContent className="flex items-end justify-between">
                <div>
                  <p className="text-[11px] uppercase text-slate-300">
                    {card.statLabel}
                  </p>

                  <p className="text-2xl font-semibold text-slate-50">
                    {card.statValue}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-[11px] uppercase text-slate-300">
                    {card.changeLabel}
                  </p>

                  <p
                    className={`text-sm font-medium ${
                      card.tone === "negative"
                        ? "text-red-300"
                        : card.tone === "warning"
                        ? "text-amber-300"
                        : "text-emerald-300"
                    }`}
                  >
                    {card.changeValue}
                  </p>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* MOMENTUM PULSE BOARD */}
      <Card className="border border-slate-700/60 bg-slate-950/60 backdrop-blur">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">
            Momentum Pulse Board
          </CardTitle>

          <CardDescription className="text-xs">
            Short-term shifts in form, role and opportunity across the
            competition.
          </CardDescription>
        </CardHeader>

        <CardContent className="grid gap-4 md:grid-cols-4">
          {pulseCards.map((pulse) => (
            <div
              key={pulse.label}
              className="flex flex-col gap-1 rounded-md border border-slate-800/80 bg-slate-900/60 p-3"
            >
              <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-200">
                {pulse.label}
              </p>

              <p className="text-xs text-slate-300 leading-snug">
                {pulse.description}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
