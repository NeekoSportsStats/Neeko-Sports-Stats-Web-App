// src/components/afl/teams/mockTeams.ts
// AFL TEAMS — Full Mock Dataset (Realistic + Structurally Complete)

export type AFLTeam = {
  id: number;
  name: string;
  code: string;            // e.g. "CAR", "COL", "ESS"
  colours: {
    primary: string;
    secondary: string;
  };

  // Round-by-round total score (over 23 rounds)
  scores: number[];

  // Scoring margin per round (score for – score against)
  margins: number[];

  // For dashboard tiles
  attackRating: number;     // 0–100
  defenceRating: number;    // 0–100
  clearanceDom: number[];   // 23 values, %, round-by-round
  consistencyIndex: number; // 0–100 (low volatility = high consistency)

  // Next 3 fixtures difficulty
  fixtureDifficulty: {
    score: number;          // 0–100
    opponents: string[];    // opponent codes
  };

  // Trend sparkline data (for charts)
  attackTrend: number[];
  defenceTrend: number[];
  midfieldTrend: number[];
};

// AFL Club List
export const TEAM_LIST = [
  "Carlton",
  "Collingwood",
  "Essendon",
  "Richmond",
  "Geelong",
  "Melbourne",
  "Fremantle",
  "West Coast",
  "Sydney",
  "GWS",
  "Brisbane",
  "Adelaide",
  "Port Adelaide",
  "St Kilda",
  "Gold Coast",
  "North Melbourne",
  "Hawthorn",
  "Western Bulldogs",
];

// Shortcodes
const TEAM_CODES = [
  "CAR", "COL", "ESS", "RICH", "GEEL", "MELB", "FRE", "WC",
  "SYD", "GWS", "BRI", "ADE", "PORT", "STK", "GC", "NMFC", "HAW", "WB"
];

// Club colour sets (simple for now)
const TEAM_COLOURS = [
  { primary: "#0033A0", secondary: "#FFFFFF" }, // Carlton
  { primary: "#000000", secondary: "#FFFFFF" }, // Collingwood
  { primary: "#D50032", secondary: "#000000" }, // Essendon
  { primary: "#F7A600", secondary: "#000000" }, // Richmond
  { primary: "#001C3F", secondary: "#FFFFFF" }, // Geelong
  { primary: "#C00000", secondary: "#0A0A0A" }, // Melbourne
  { primary: "#2E2C62", secondary: "#FFFFFF" }, // Fremantle
  { primary: "#003087", secondary: "#F2C800" }, // West Coast
  { primary: "#D00027", secondary: "#FFFFFF" }, // Sydney
  { primary: "#FF6600", secondary: "#000000" }, // GWS
  { primary: "#A50034", secondary: "#F6EB61" }, // Brisbane
  { primary: "#002B5C", secondary: "#FDBB30" }, // Adelaide
  { primary: "#001E3C", secondary: "#CCCCCC" }, // Port Adelaide
  { primary: "#ED1C24", secondary: "#FFFFFF" }, // St Kilda
  { primary: "#FFCB05", secondary: "#003087" }, // Gold Coast
  { primary: "#00285A", secondary: "#FFFFFF" }, // North Melbourne
  { primary: "#FFCD00", secondary: "#3F2A56" }, // Hawthorn
  { primary: "#003087", secondary: "#FFFFFF" }, // Western Bulldogs
];

// Random helpers for realism
const randomScore = () => Math.floor(60 + Math.random() * 70); // 60–130
const randomMargin = () => Math.floor(-40 + Math.random() * 90); // -40 to +50
const randomRating = () => Math.floor(40 + Math.random() * 60); // 40–100
const randomClearances = () => Array.from({ length: 23 }, () => Math.floor(35 + Math.random() * 35)); // 35–70%

// Trend sparkline: values 0–100
const randomTrend = () => Array.from({ length: 12 }, () => Math.floor(40 + Math.random() * 45));

// Generate all teams with realistic mock data
export const MOCK_TEAMS: AFLTeam[] = TEAM_LIST.map((name, idx) => {
  const scores = Array.from({ length: 23 }, randomScore);
  const margins = Array.from({ length: 23 }, randomMargin);
  const clearanceDom = randomClearances();

  return {
    id: idx + 1,
    name,
    code: TEAM_CODES[idx],
    colours: TEAM_COLOURS[idx],

    scores,
    margins,

    attackRating: randomRating(),
    defenceRating: randomRating(),
    clearanceDom,

    consistencyIndex: Math.floor(50 + Math.random() * 40), // 50–90

    fixtureDifficulty: {
      score: Math.floor(30 + Math.random() * 50), // 30–80
      opponents: [
        TEAM_CODES[(idx + 1) % 18],
        TEAM_CODES[(idx + 4) % 18],
        TEAM_CODES[(idx + 7) % 18],
      ],
    },

    attackTrend: randomTrend(),
    defenceTrend: randomTrend(),
    midfieldTrend: randomTrend(),
  };
});
