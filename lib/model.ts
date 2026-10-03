export type User = {
  id: string;
  name: string;
  email: string;
  password?: string;
  verified: boolean;
  ageAffirmed: boolean;
  audience: "student" | "adult";
  role: "member" | "counselor" | "admin";
  institutionId?: string;
  createdAt: string;
  saved: string[];
  selection?: string;
  assessment?: { answers: string[]; matches: Match[]; version: string };
  practice: Record<string, Record<string, number | null>>;
  disabled?: boolean;
};
export type Match = { tradeId: string; score: number };
export type Institution = {
  id: string;
  name: string;
  kind: "school" | "library";
  domains: string[];
  staff: string[];
  enrollmentHash?: string;
  contact: string;
  license: {
    active: boolean;
    start: string;
    end: string;
    pilot: boolean;
    price: number;
  };
};
export type Grant = {
  id: string;
  userId: string;
  source: "school" | "library" | "individual";
  institutionId?: string;
  codeId?: string;
  start: string;
  end: string;
  active: boolean;
};
export type Step = {
  id: string;
  title: string;
  explanation: string;
  required: boolean;
  checklist: boolean;
};
export type Question = {
  id: string;
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
};
export type Trade = {
  id: string;
  name: string;
  preview: string;
  tags: string[];
  published: boolean;
  sourceUrl: string;
  verifiedAt: string;
};
export type Program = {
  id: string;
  tradeId: string;
  name: string;
  location: string;
  provider: string;
  contact: string;
  length: string;
  tracks: string[];
  wages: string;
  eligibility: string;
  documents: string;
  applicationDates: string;
  exam: string;
  preparation: string;
  officialUrl: string;
  sourceUrl: string;
  verifiedAt: string;
  videos: string[];
  steps: Step[];
  questions: Question[];
  published: boolean;
  version: number;
  synthetic: boolean;
};
export type Event = {
  id: string;
  userId: string;
  institutionId?: string;
  type: string;
  tradeId?: string;
  programId?: string;
  at: string;
};
export type Resource = {
  id: string;
  title: string;
  category: string;
  body: string;
  url: string;
  verifiedAt: string;
};
export type State = {
  settings: {
    priceCents: number;
    currency: "USD";
    billingModel: "one_time" | "annual" | null;
    durationDays: number | null;
    access: { school: boolean; library: boolean; individual: boolean };
  };
  users: User[];
  institutions: Institution[];
  grants: Grant[];
  trades: Trade[];
  programs: Program[];
  resources: Resource[];
  codes: {
    id: string;
    hash: string;
    institutionId: string;
    active: boolean;
    maxUses: number | null;
    users: string[];
  }[];
  sessions: { hash: string; userId: string; end: string }[];
  tokens: {
    hash: string;
    userId: string;
    purpose: "verify" | "reset";
    end: string;
  }[];
  progress: {
    userId: string;
    programId: string;
    stepId: string;
    done: boolean;
  }[];
  events: Event[];
  outbox: {
    id: string;
    key: string;
    to: string;
    subject: string;
    body: string;
    status: "queued";
    at: string;
  }[];
  inquiries: {
    id: string;
    name: string;
    email: string;
    organization: string;
    message: string;
    at: string;
  }[];
  corrections: {
    id: string;
    userId: string;
    programId: string;
    message: string;
    status: string;
    at: string;
  }[];
  imports: {
    id: string;
    sourceName: string;
    storageName: string;
    status: "draft" | "applied";
    error: string;
    targetId?: string;
    baseVersion?: number;
    draft: Program;
    at: string;
  }[];
  paymentEvents: { id: string; objectId: string; created: number }[];
  paymentClocks: Record<string, number>;
  attempts: Record<string, { count: number; reset: number }>;
};
