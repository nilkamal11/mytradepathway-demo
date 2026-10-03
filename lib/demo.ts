// No HTTP requests or production integrations. Every operation changes this browser's sample state.
import type { State, User, Program } from "./model";
import { seed, interests } from "./seed";
import {
  check,
  now,
  id,
  hasAccess,
  staffSchool,
  requireAdmin,
  requireAccess,
  matchTrades,
  progressPercent,
  record,
  report,
  csv,
} from "./domain";

export const STORAGE_KEY = "mytradepathway-public-demo-v1";
export interface DemoStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}
type Snapshot = { version: 1; actorId: string | null; state: State };
export const fixtures = [
  { id: "demo-student", label: "Student - Prairie School" },
  { id: "demo-adult", label: "Adult - individual access" },
  { id: "demo-library", label: "Library patron" },
  { id: "demo-counselor", label: "Counselor - Prairie School" },
  { id: "demo-admin", label: "Administrator" },
  { id: "demo-expired", label: "Expired access" },
];
function fresh(): Snapshot {
  const state = seed();
  // Additional original synthetic activity makes the sample reports useful before visitors try a journey.
  const template = state.users.find((x) => x.id === "demo-student")!;
  const sample: User = {
    ...structuredClone(template),
    id: "sample-student",
    name: "Avery Brooks",
    email: "avery@school-a.example.test",
    saved: ["carpenter"],
    selection: "carpenter-demo-chicago",
    assessment: {
      answers: ["building", "creative"],
      matches: matchTrades(["building", "creative"], state.trades),
      version: "synthetic-tags-v1",
    },
  };
  state.users.push(sample);
  state.grants.push({
    id: "fixture-sample",
    userId: sample.id,
    source: "school",
    institutionId: "school-a",
    start: "2020-01-01T00:00:00.000Z",
    end: "2099-01-01T00:00:00.000Z",
    active: true,
  });
  state.progress.push({
    userId: sample.id,
    programId: sample.selection!,
    stepId: state.programs
      .find((p) => p.id === sample.selection)!
      .steps.find((x) => x.required && x.checklist)!.id,
    done: true,
  });
  record(state, sample, "assessment");
  record(state, sample, "save", "carpenter");
  record(state, sample, "select", "carpenter", sample.selection);
  const program = structuredClone(state.programs[0]);
  program.name = "Electrician - reviewed sample draft";
  program.published = false;
  state.imports.push({
    id: "sample-import",
    sourceName: "Built-in synthetic program sample",
    storageName: "",
    status: "draft",
    error:
      "Manual sample draft. No file upload, AI extraction or external publication occurs.",
    targetId: program.id,
    baseVersion: program.version,
    draft: program,
    at: now(),
  });
  state.outbox.push({
    id: "sample-message",
    key: "sample",
    to: "staff@example.test",
    subject: "Sample pathway notification",
    body: "This is a synthetic notification preview. No email is sent.",
    status: "queued",
    at: now(),
  });
  return { version: 1, actorId: null, state };
}
const safe = (u: User) => ({
  id: u.id,
  name: u.name,
  email: u.email,
  verified: u.verified,
  ageAffirmed: u.ageAffirmed,
  audience: u.audience,
  role: u.role,
  institutionId: u.institutionId,
});
export class DemoEngine {
  private snapshot: Snapshot;
  notice = "";
  constructor(private storage?: DemoStorage) {
    this.snapshot = fresh();
    try {
      const raw = storage?.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (
          parsed.version === 1 &&
          Array.isArray(parsed.state?.users) &&
          Array.isArray(parsed.state?.programs)
        )
          this.snapshot = parsed;
        else this.notice = "Saved demo version was reset.";
      }
    } catch {
      this.notice = "Saved demo data could not be read. Using a fresh sample.";
    }
  }
  reset() {
    this.snapshot = fresh();
    try {
      this.storage?.removeItem(STORAGE_KEY);
    } catch {
      this.notice =
        "Browser storage is unavailable; changes last for this visit only.";
    }
  }
  state() {
    return structuredClone(this.snapshot.state);
  }
  private persist() {
    try {
      if (this.storage)
        this.storage.setItem(STORAGE_KEY, JSON.stringify(this.snapshot));
      else
        this.notice =
          "Browser storage is unavailable; changes last for this visit only.";
    } catch {
      this.notice =
        "Browser storage is unavailable; changes last for this visit only.";
    }
  }
  run(route: string, body?: any): any {
    const prior = structuredClone(this.snapshot);
    try {
      const result = this.dispatch(route, body);
      if (body !== undefined) this.persist();
      return structuredClone(result);
    } catch (e) {
      this.snapshot = prior;
      throw e;
    }
  }
  private dispatch(route: string, b?: any): any {
    const url = new URL(route, "https://demo.invalid/"),
      key = url.pathname.slice(1),
      params = url.searchParams;
    const s = this.snapshot.state;
    let u = s.users.find((x) => x.id === this.snapshot.actorId && !x.disabled);
    if (key === "session")
      return {
        user: u ? safe(u) : null,
        access: !!u && hasAccess(s, u),
        fixtures,
      };
    if (key === "catalog")
      return {
        trades: s.trades.filter((t) => t.published),
        programs:
          u && hasAccess(s, u) ? s.programs.filter((p) => p.published) : [],
        interests,
        access: !!u && hasAccess(s, u),
        pricing: s.settings,
      };
    if (key === "fixture-session") {
      check(
        b?.ageAffirmed === true,
        "Affirm that you are at least 13 to enter the demo.",
      );
      check(
        fixtures.some((x) => x.id === b.fixtureId),
        "Choose a sample role",
      );
      this.snapshot.actorId = b.fixtureId;
      return { ok: true };
    }
    if (key === "logout") {
      this.snapshot.actorId = null;
      return { ok: true };
    }
    if (key === "inquiry") {
      s.outbox.push({
        id: id(),
        key: id(),
        to: "admin@example.test",
        subject: "Sample institutional inquiry",
        body: "Prairie School submitted a synthetic inquiry. This browser-only preview sends no message.",
        status: "queued",
        at: now(),
      });
      return {
        message:
          "Sample inquiry added to this browser's demo notifications. Nothing was sent.",
      };
    }
    check(u, "Choose a demo role to continue", 401);
    if (key === "account")
      return {
        user: safe(u),
        access: hasAccess(s, u),
        grants: s.grants.filter((g) => g.userId === u!.id),
        institution: s.institutions.find((i) => i.id === u!.institutionId)
          ?.name,
      };
    if (key === "redeem") {
      const c = s.codes.find(
        (c) =>
          c.hash === "sample-marker:" + String(b?.code || "").trim() &&
          c.active,
      );
      check(c, "Use the sample code LIBRARY-DEMO");
      const i = s.institutions.find((i) => i.id === c.institutionId)!;
      check(i.license.active, "Sample library license is inactive");
      check(
        !c.maxUses || c.users.includes(u.id) || c.users.length < c.maxUses,
        "Sample code limit reached",
      );
      if (!c.users.includes(u.id)) c.users.push(u.id);
      if (!s.grants.some((g) => g.id === `library:${u!.id}:${c.id}`))
        s.grants.push({
          id: `library:${u.id}:${c.id}`,
          userId: u.id,
          source: "library",
          institutionId: i.id,
          codeId: c.id,
          start: i.license.start,
          end: i.license.end,
          active: true,
        });
      u.institutionId = i.id;
      return { message: "Sample library access restored in this browser." };
    }
    const program = (key: string) => {
      const p = s.programs.find((p) => p.id === key && p.published);
      check(p, "Sample program not found", 404);
      return p;
    };
    if (key === "dashboard") {
      requireAccess(s, u);
      return {
        saved: u.saved,
        selection: u.selection,
        assessment: u.assessment,
        practice: u.practice,
        resources: s.resources,
        progress: s.programs
          .filter((p) => p.published)
          .map((p) => ({
            programId: p.id,
            ...progressPercent(s, u!.id, p),
            steps: s.progress.filter(
              (x) => x.userId === u!.id && x.programId === p.id,
            ),
          })),
      };
    }
    if (key === "resources") {
      requireAccess(s, u);
      return s.resources;
    }
    if (key === "roster" || key.startsWith("student/")) {
      const school = staffSchool(s, u);
      check(school, "Choose the Counselor role", 403);
      const students = s.users.filter(
        (x) => x.institutionId === school.id && x.role === "member",
      );
      if (key.startsWith("student/")) {
        const student = students.find((x) => x.id === key.slice(8));
        check(student, "Sample student is outside this school", 404);
        return {
          user: safe(student),
          saved: student.saved,
          assessment: student.assessment,
          progress: s.programs
            .filter((p) => p.published)
            .map((p) => ({
              programId: p.id,
              name: p.name,
              ...progressPercent(s, student.id, p),
            })),
          events: s.events
            .filter(
              (e) => e.userId === student.id && e.institutionId === school.id,
            )
            .slice(-100)
            .reverse(),
        };
      }
      const q = (params.get("q") || "").toLowerCase(),
        filter = params.get("filter"),
        page = Math.max(1, Number(params.get("page")) || 1);
      const rows = students.filter(
        (x) =>
          (x.name + " " + x.email).toLowerCase().includes(q) &&
          (filter !== "assessed" || !!x.assessment) &&
          (filter !== "saved" || x.saved.length > 0),
      );
      return {
        school: school.name,
        total: rows.length,
        page,
        rows: rows
          .slice((page - 1) * 20, page * 20)
          .map((x) => ({
            ...safe(x),
            matches: x.assessment?.matches || [],
            saved: x.saved,
            progress: x.selection
              ? progressPercent(s, x.id, program(x.selection))
              : null,
            lastActive: s.events
              .filter((e) => e.userId === x.id && e.institutionId === school.id)
              .at(-1)?.at,
          })),
      };
    }
    if (key === "reports") {
      const start = params.get("start") || "2020-01-01",
        end = params.get("end") || "2100-01-01";
      check(
        /^\d{4}-\d{2}-\d{2}$/.test(start) && /^\d{4}-\d{2}-\d{2}$/.test(end),
        "Choose valid dates",
      );
      return report(
        s,
        u,
        new Date(start).toISOString(),
        new Date(end).toISOString(),
      );
    }
    if (
      [
        "assessment",
        "save",
        "select",
        "progress",
        "practice",
        "correction",
      ].includes(key)
    ) {
      requireAccess(s, u);
      if (key === "assessment") {
        check(
          Array.isArray(b?.answers) &&
            b.answers.length > 0 &&
            b.answers.length <= 6 &&
            b.answers.every((x: string) => interests.some((i) => i.id === x)),
          "Choose one or more sample interests",
        );
        const answers = [...new Set<string>(b.answers)],
          matches = matchTrades(answers, s.trades);
        u.assessment = { answers, matches, version: "synthetic-tags-v1" };
        record(s, u, "assessment");
        for (const m of matches) record(s, u, "match", m.tradeId);
        return u.assessment;
      }
      if (key === "save") {
        check(
          s.trades.some((t) => t.id === b?.tradeId && t.published) &&
            typeof b.saved === "boolean",
          "Choose a valid trade",
        );
        u.saved = u.saved.filter((x) => x !== b.tradeId);
        if (b.saved) {
          u.saved.push(b.tradeId);
          record(s, u, "save", b.tradeId);
        }
        return { saved: u.saved };
      }
      const p = program(b?.programId);
      if (key === "select") {
        u.selection = p.id;
        if (!u.saved.includes(p.tradeId)) u.saved.push(p.tradeId);
        record(s, u, "select", p.tradeId, p.id);
        return { selection: p.id };
      }
      if (key === "progress") {
        check(
          p.steps.some((x) => x.id === b.stepId && x.checklist) &&
            typeof b.done === "boolean",
          "Choose a valid checklist step",
        );
        let entry = s.progress.find(
          (x) =>
            x.userId === u!.id && x.programId === p.id && x.stepId === b.stepId,
        );
        if (!entry) {
          entry = {
            userId: u.id,
            programId: p.id,
            stepId: b.stepId,
            done: b.done,
          };
          s.progress.push(entry);
        }
        entry.done = b.done;
        record(s, u, "checklist", p.tradeId, p.id);
        return progressPercent(s, u.id, p);
      }
      if (key === "practice") {
        const q = p.questions.find((x) => x.id === b.questionId);
        check(q, "Choose a sample question");
        check(
          b.answer === null ||
            (Number.isInteger(b.answer) &&
              b.answer >= 0 &&
              b.answer < q.options.length),
          "Choose an answer",
        );
        u.practice[p.id] ??= {};
        u.practice[p.id][q.id] = b.answer;
        record(s, u, "practice", p.tradeId, p.id);
        return {
          correct: b.answer === q.answer,
          correctAnswer: q.answer,
          explanation: q.explanation,
          skipped: b.answer === null,
        };
      }
      check(
        typeof b.message === "string" &&
          b.message.trim().length >= 10 &&
          b.message.length <= 3000,
        "Enter 10-3000 characters of sample feedback",
      );
      s.corrections.push({
        id: id(),
        userId: u.id,
        programId: p.id,
        message: b.message,
        status: "pending",
        at: now(),
      });
      return {
        message:
          "Sample correction saved in this browser only. Nothing was submitted.",
      };
    }
    requireAdmin(u);
    if (key === "admin")
      return {
        users: s.users.map((x) => ({
          ...safe(x),
          disabled: !!x.disabled,
          access: hasAccess(s, x),
        })),
        institutions: s.institutions.map(({ enrollmentHash, ...i }) => i),
        programs: s.programs,
        trades: s.trades,
        resources: s.resources,
        codes: s.codes.map(({ hash, ...c }) => c),
        corrections: s.corrections,
        imports: s.imports,
        outbox: s.outbox,
        settings: s.settings,
        integrations: {
          oauth: "Not connected - no real sign-in",
          stripe: "Not connected - no payments",
          email: "Sample notifications only - not sent",
          ai: "Built-in manual draft - no AI extraction",
          database: "Browser-local synthetic state only",
        },
      };
    if (key === "admin/program") {
      const p = b?.program as Program;
      check(
        p &&
          typeof p.id === "string" &&
          p.id.length > 0 &&
          p.id.length < 100 &&
          p.name?.trim() &&
          Array.isArray(p.steps) &&
          Array.isArray(p.questions),
        "Complete the sample program fields",
      );
      check(
        new Set(p.steps.map((x) => x.id)).size === p.steps.length,
        "Keep step IDs unique",
      );
      check(
        p.steps.every(
          (x) =>
            typeof x.id === "string" &&
            typeof x.title === "string" &&
            typeof x.required === "boolean" &&
            typeof x.checklist === "boolean",
        ),
        "Check preparation step fields",
      );
      check(
        p.questions.every(
          (x) =>
            typeof x.id === "string" &&
            Array.isArray(x.options) &&
            x.options.length >= 2 &&
            Number.isInteger(x.answer) &&
            x.answer >= 0 &&
            x.answer < x.options.length,
        ),
        "Check practice question fields",
      );
      const previous = s.programs.find((x) => x.id === p.id);
      check(
        previous
          ? b.expectedVersion === previous.version
          : b.expectedVersion === null,
        "Sample program changed; reload before saving",
        409,
      );
      const next = {
        ...p,
        synthetic: true,
        version: previous ? previous.version + 1 : 1,
        officialUrl: "",
        sourceUrl: "",
        videos: [],
      };
      if (previous) s.programs[s.programs.indexOf(previous)] = next;
      else s.programs.push(next);
      return { message: "Sample program saved in this browser." };
    }
    if (key === "admin/sample-import") {
      const p = structuredClone(s.programs[0]);
      p.name = "Electrician - reviewed sample draft";
      p.published = false;
      const draft = {
        id: id(),
        sourceName: "Built-in synthetic program sample",
        storageName: "",
        status: "draft" as const,
        error:
          "Sample manual draft; no file uploaded or AI extraction performed.",
        targetId: p.id,
        baseVersion: p.version,
        draft: p,
        at: now(),
      };
      s.imports.push(draft);
      return { id: draft.id };
    }
    if (key === "admin/import-review") {
      const draft = s.imports.find(
        (x) => x.id === b.id && x.status === "draft",
      );
      check(draft, "Choose an editable sample draft");
      check(
        b.draft?.id === draft.targetId &&
          typeof b.draft.name === "string" &&
          b.draft.name.trim(),
        "Keep the target ID and complete the sample name",
      );
      draft.draft = { ...b.draft, synthetic: true };
      return { message: "Sample draft saved; it has not been applied." };
    }
    if (key === "admin/import-apply") {
      check(b?.confirm === true, "Explicit sample review approval is required");
      const draft = s.imports.find(
        (x) => x.id === b.id && x.status === "draft",
      );
      check(draft, "Choose an editable sample draft");
      const p = s.programs.find((p) => p.id === draft.targetId);
      check(
        p && p.version === draft.baseVersion,
        "Sample program changed; create a new draft",
        409,
      );
      const result = this.dispatch("admin/program", {
        program: { ...draft.draft, id: p.id },
        expectedVersion: p.version,
      });
      draft.status = "applied";
      return result;
    }
    if (key === "admin/code-revoke") {
      const c = s.codes.find((x) => x.id === b.codeId);
      check(c, "Sample code not found");
      c.active = false;
      return { message: "Sample code revoked in this browser." };
    }
    if (key === "admin/correction") {
      const c = s.corrections.find((x) => x.id === b.id);
      check(c, "Sample correction not found");
      check(["reviewed", "resolved"].includes(b.status), "Choose a status");
      c.status = b.status;
      return { message: "Sample correction updated." };
    }
    check(false, "This action is not connected in the public demo.", 503);
  }
}
let engine: DemoEngine | undefined;
function current() {
  if (!engine) {
    let storage: DemoStorage | undefined;
    try {
      storage = window.localStorage;
    } catch {}
    engine = new DemoEngine(storage);
  }
  return engine;
}
export async function demoApi(route: string, body?: unknown) {
  return current().run(route, body);
}
export function resetDemo() {
  current().reset();
}
export function storageNotice() {
  return current().notice;
}
export function downloadReport(query: string) {
  const r = current().run("reports?" + query);
  const rows = [
    [
      "Synthetic demo report",
      "Registered",
      "Active",
      "Required completed",
      "Required total",
    ],
    ...r.institutions.map((i: any) => [
      i.name,
      i.registered,
      i.active,
      i.preparation.done,
      i.preparation.required,
    ]),
  ];
  const url = URL.createObjectURL(
    new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = "mytradepathway-synthetic-report.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
