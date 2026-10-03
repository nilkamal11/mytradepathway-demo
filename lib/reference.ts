import catalog from "./reference-catalog.json";
import type { Program, State } from "./model";
export const referencePrograms = catalog as Program[];
// Group labels are editorial choices; the tags themselves come from the supplied JSON.
export const assessmentGroups = [
  {
    name: "Your interests",
    ids: [
      "building",
      "machines",
      "fixing_repairing",
      "precision",
      "systems",
      "math_focus",
    ],
  },
  {
    name: "Your priorities",
    ids: ["highest_pay", "fastest_entry", "teamwork", "variety_of_sites"],
  },
  {
    name: "Your comfort level",
    ids: [
      "outdoors",
      "indoor_work",
      "heights",
      "physical_demanding",
      "safety_critical",
      "long_apprenticeship_ok",
    ],
  },
];
export const referenceInterests = [
  ["building", "Making & building", "Build something tangible"],
  ["machines", "Electrical & technical work", "Learn wiring and technology"],
  [
    "fixing_repairing",
    "Fixing & repairing",
    "Restore things and solve practical problems",
  ],
  ["precision", "Precision & detail", "Measure carefully and work accurately"],
  ["systems", "Systems & troubleshooting", "Understand how things work"],
  ["math_focus", "Math & layout", "Work with measurements and calculations"],
  [
    "highest_pay",
    "Earning potential",
    "Consider pay alongside other factors; this tag is not a wage ranking",
  ],
  [
    "fastest_entry",
    "A shorter route to entry",
    "Explore ways to get started; admission is never guaranteed",
  ],
  ["teamwork", "Teamwork", "Work closely with a crew"],
  ["variety_of_sites", "Variety of job sites", "Prefer changing settings"],
  ["outdoors", "Outdoor work", "Work in changing weather"],
  ["indoor_work", "Indoor work", "Prefer indoor settings"],
  ["heights", "Working at heights", "Consider elevated job sites"],
  [
    "physical_demanding",
    "Physically demanding work",
    "Be active through the workday",
  ],
  ["safety_critical", "Safety responsibility", "Follow careful procedures"],
  [
    "long_apprenticeship_ok",
    "Longer training is okay",
    "Build skills over several years",
  ],
].map(([id, name, description]) => ({ id, name, description }));
export function addReferenceContent(s: State) {
  for (const p of referencePrograms)
    if (!s.programs.some((x) => x.id === p.id))
      s.programs.push(structuredClone(p));
  for (const t of s.trades) {
    const p = referencePrograms.find((p) => p.tradeId === t.id)!;
    t.tags = [...p.reference!.tags];
    t.preview = p.reference!.blurb;
    t.sourceUrl = p.sourceUrl;
    t.verifiedAt = "";
  }
  s.resources = [
    {
      id: "unions",
      title: "Unions & apprenticeships",
      category: "Learning",
      body: "Compare training routes and explore the supplied provider directory.",
      url: "https://www.apprenticeship.gov/career-seekers",
      verifiedAt: "",
    },
    {
      id: "hire360",
      title: "HIRE360",
      category: "Pre-apprenticeship",
      body: "Complete the provider’s eligibility assessment to receive its next steps. This is not an employment application.",
      url: "https://hire360partners.org/assessment/",
      verifiedAt: "",
    },
    {
      id: "cwit",
      title: "Chicago Women in Trades",
      category: "Pre-apprenticeship",
      body: "Review eligibility and register for an information session to explore training opportunities.",
      url: "https://cwit.org/info-session-sign-up/",
      verifiedAt: "",
    },
  ];
}
