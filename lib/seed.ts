import type { State, User, Program } from "./model";
import { now } from "./domain";
// Deliberately public demo markers, not credentials or password hashes.
const hash = (value: string) => "sample-marker:" + value;
const defaultSettings = (): State["settings"] => ({
  priceCents: 4900,
  currency: "USD",
  billingModel: null,
  durationDays: null,
  access: { school: true, library: true, individual: true },
});
export const interests = [
  {
    id: "precision",
    name: "Precision & detail",
    description: "Measure carefully and solve precise problems",
  },
  {
    id: "systems",
    name: "Systems & troubleshooting",
    description: "Understand how parts work together",
  },
  {
    id: "building",
    name: "Making & building",
    description: "Turn a plan into something tangible",
  },
  {
    id: "outdoors",
    name: "Outdoor work",
    description: "Work in changing spaces and conditions",
  },
  {
    id: "machines",
    name: "Tools & machines",
    description: "Operate equipment and learn its mechanics",
  },
  {
    id: "creative",
    name: "Visual & creative work",
    description: "Care about finish, appearance and design",
  },
];
export function blankProgram(tradeId = "electrician", programId = "") {
  return {
    id: programId,
    tradeId,
    name: "",
    location: "",
    provider: "",
    contact: "",
    length: "",
    tracks: [],
    wages: "",
    eligibility: "",
    documents: "",
    applicationDates: "",
    exam: "",
    preparation: "",
    officialUrl: "",
    sourceUrl: "",
    verifiedAt: "",
    videos: [],
    steps: [],
    questions: [],
    published: false,
    version: 1,
    synthetic: true,
  } satisfies Program;
}
export function seed(): State {
  const timestamp = now();
  const start = "2020-01-01T00:00:00.000Z",
    end = "2099-01-01T00:00:00.000Z";
  const definitions: [string, string, string[]][] = [
    ["electrician", "Electrician", ["precision", "systems"]],
    ["plumber", "Plumber", ["systems", "building"]],
    ["pipefitter", "Pipefitter", ["precision", "building"]],
    ["painter", "Painter", ["creative", "precision"]],
    ["operating-engineer", "Operating Engineer", ["machines", "outdoors"]],
    ["elevator-mechanic", "Elevator Mechanic", ["machines", "systems"]],
    ["sheet-metal-worker", "Sheet Metal Worker", ["precision", "creative"]],
    ["carpenter", "Carpenter", ["building", "creative"]],
    [
      "construction-craft-laborer",
      "Construction Craft Laborer",
      ["outdoors", "building"],
    ],
    ["welder", "Welder", ["machines", "precision"]],
  ];
  const users: User[] = [
    {
      id: "demo-student",
      name: "Alex Rivera",
      email: "alex@school-a.example.test",
      audience: "student",
      role: "member",
      institutionId: "school-a",
    },
    {
      id: "demo-other",
      name: "Taylor Morgan",
      email: "taylor@school-b.example.test",
      audience: "student",
      role: "member",
      institutionId: "school-b",
    },
    {
      id: "demo-adult",
      name: "Jordan Lee",
      email: "jordan@example.test",
      audience: "adult",
      role: "member",
    },
    {
      id: "demo-library",
      name: "Sam Patel",
      email: "sam@example.test",
      audience: "adult",
      role: "member",
      institutionId: "library-a",
    },
    {
      id: "demo-counselor",
      name: "Casey Chen",
      email: "casey@school-a.example.test",
      audience: "adult",
      role: "counselor",
      institutionId: "school-a",
    },
    {
      id: "demo-admin",
      name: "Demo Administrator",
      email: "admin@example.test",
      audience: "adult",
      role: "admin",
    },
    {
      id: "demo-expired",
      name: "Expired Access Example",
      email: "expired@example.test",
      audience: "adult",
      role: "member",
    },
  ].map(
    (x) =>
      ({
        ...x,
        verified: true,
        ageAffirmed: true,
        createdAt: timestamp,
        saved: [],
        practice: {},
      }) as User,
  );
  const programs = definitions.map(([tradeId, name]) => ({
    ...blankProgram(tradeId, tradeId + "-demo-chicago"),
    name: `${name} • demonstration pathway`,
    location: "Chicago area · synthetic program",
    provider: "Sample training provider (not a real program)",
    contact: "Client-approved contact required",
    length: "Awaiting verified content",
    wages: "No verified wage data supplied",
    eligibility: "Eligibility must be confirmed with the actual provider",
    documents: "Awaiting client-supplied requirements",
    applicationDates: "No verified application dates supplied",
    exam: "Awaiting official entrance-exam information",
    preparation: "Use this sample checklist to explore the workflow.",
    tracks: ["Demonstration only"],
    published: true,
    steps: [
      {
        id: tradeId + "-research",
        title: "Review the official program requirements",
        explanation:
          "Demo preparation step. Obtain the actual provider requirements before applying.",
        required: true,
        checklist: true,
      },
      {
        id: tradeId + "-plan",
        title: "Make a preparation plan",
        explanation:
          "Demo preparation step. Record what you need to learn and confirm.",
        required: true,
        checklist: true,
      },
      {
        id: tradeId + "-practice",
        title: "Try a practice activity",
        explanation: "Optional original sample question, not an official test.",
        required: false,
        checklist: true,
      },
    ],
    questions: [
      {
        id: tradeId + "-q1",
        prompt: "A sample board is 36 inches long. How many feet is that?",
        options: ["2 feet", "3 feet", "4 feet", "6 feet"],
        answer: 1,
        explanation: "There are 12 inches in one foot. 36 ÷ 12 = 3.",
      },
      {
        id: tradeId + "-q2",
        prompt:
          "You need 4 pieces, each 2.5 feet long. What is their total length?",
        options: ["6 feet", "8 feet", "10 feet", "12 feet"],
        answer: 2,
        explanation:
          "4 × 2.5 = 10 feet. These are original synthetic practice examples.",
      },
    ],
  }));
  programs.push({
    ...programs[0],
    id: "electrician-demo-north",
    name: "Electrician • second sample location",
    location: "North area · synthetic program",
    steps: programs[0].steps.map((x) => ({ ...x })),
  });
  return {
    users,
    settings: defaultSettings(),
    institutions: [
      {
        id: "school-a",
        name: "Prairie School · demo",
        kind: "school",
        domains: ["school-a.example.test", "district.example.test"],
        staff: ["casey@school-a.example.test"],
        enrollmentHash: hash("PRAIRIE-DEMO"),
        contact: "staff@example.test",
        license: { active: true, start, end, pilot: true, price: 0 },
      },
      {
        id: "school-b",
        name: "Lake School · demo",
        kind: "school",
        domains: ["school-b.example.test", "district.example.test"],
        staff: [],
        enrollmentHash: hash("LAKE-DEMO"),
        contact: "staff-b@example.test",
        license: { active: true, start, end, pilot: true, price: 0 },
      },
      {
        id: "library-a",
        name: "Neighborhood Library · demo",
        kind: "library",
        domains: [],
        staff: [],
        contact: "library@example.test",
        license: { active: true, start, end, pilot: true, price: 0 },
      },
    ],
    grants: [
      ...users
        .filter((u) => u.role === "member" && u.id !== "demo-expired")
        .map(
          (u) =>
            ({
              id: "fixture-" + u.id,
              userId: u.id,
              source: u.institutionId
                ? u.institutionId.startsWith("school")
                  ? "school"
                  : "library"
                : "individual",
              institutionId: u.institutionId,
              start,
              end,
              active: true,
            }) as const,
        ),
      {
        id: "expired-fixture",
        userId: "demo-expired",
        source: "individual",
        start,
        end: "2021-01-01T00:00:00.000Z",
        active: true,
      },
    ],
    trades: definitions.map(([id, name, tags]) => ({
      id,
      name,
      tags,
      preview: `Explore the ${name.toLowerCase()} pathway. Detailed content in this review is a synthetic example.`,
      published: true,
      sourceUrl: "",
      verifiedAt: "",
    })),
    programs,
    resources: [
      {
        id: "unions",
        title: "Understanding apprenticeships and unions",
        category: "Learning",
        body: "Apprenticeship guidance and union information will use client-approved content. MyTradePathway helps prepare; actual applications go through the provider.",
        url: "",
        verifiedAt: "",
      },
      {
        id: "hire360",
        title: "HIRE360",
        category: "Pre-apprenticeship",
        body: "Sample resource placeholder. Provider eligibility, information sessions and application links are awaiting supplied content.",
        url: "",
        verifiedAt: "",
      },
      {
        id: "cwit",
        title: "Chicago Women in Trades",
        category: "Pre-apprenticeship",
        body: "Sample resource placeholder. Provider details and external assessments must be supplied and approved.",
        url: "",
        verifiedAt: "",
      },
    ],
    codes: [
      {
        id: "library-demo-code",
        hash: hash("LIBRARY-DEMO"),
        institutionId: "library-a",
        active: true,
        maxUses: null,
        users: [],
      },
    ],
    sessions: [],
    tokens: [],
    progress: [],
    events: [],
    outbox: [],
    inquiries: [],
    corrections: [],
    imports: [],
    paymentEvents: [],
    paymentClocks: {},
    attempts: {},
  };
}
