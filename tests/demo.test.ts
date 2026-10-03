import test from "node:test";
import assert from "node:assert/strict";
import { DemoEngine, STORAGE_KEY, type DemoStorage } from "../lib/demo";
import { progressPercent } from "../lib/domain";
import {
  referencePrograms,
  assessmentGroups,
  referenceInterests,
} from "../lib/reference";
class MemoryStorage implements DemoStorage {
  values = new Map<string, string>();
  getItem(k: string) {
    return this.values.get(k) || null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
}
const sign = (engine: DemoEngine, fixtureId = "demo-student") =>
  engine.run("fixture-session", { fixtureId, ageAffirmed: true });
test("public fixtures separate ten trades, twelve unverified reference programs and legacy synthetic programs", () => {
  const s = new DemoEngine().state();
  assert.equal(s.trades.length, 10);
  assert.equal(s.programs.length, 23);
  assert.equal(s.programs.filter((p) => p.synthetic).length, 11);
  assert.equal(s.programs.filter((p) => p.reference).length, 12);
  assert.ok(
    s.programs
      .filter((p) => p.reference)
      .every((p) => p.verifiedAt === "" && !p.synthetic),
  );
  assert.ok(
    s.users.every((u) => u.email.endsWith("example.test") && !u.password),
  );
  assert.equal(s.sessions.length, 0);
  assert.equal(s.tokens.length, 0);
  assert.equal(s.paymentEvents.length, 0);
});
test("role selection requires age affirmation and has no password/authentication workflow", () => {
  const e = new DemoEngine();
  assert.throws(
    () => e.run("fixture-session", { fixtureId: "demo-student" }),
    /13/,
  );
  assert.throws(() => sign(e, "invented-role"), /sample role/);
  sign(e);
  assert.equal(e.run("session").user.id, "demo-student");
  assert.throws(
    () => e.run("login", { email: "real@example.com", password: "something" }),
    /Administrator/,
  );
  assert.equal(e.state().users.length, 12);
});
test("assessment deduplicates valid interests and gives deterministic top-three matches", () => {
  const e = new DemoEngine();
  sign(e);
  const a = e.run("assessment", {
    answers: ["systems", "precision", "precision"],
  });
  assert.equal(a.matches[0].tradeId, "electrician");
  assert.equal(a.matches[0].score, 100);
  assert.ok(a.matches.length <= 3);
  assert.equal(a.answers.length, 2);
  assert.throws(
    () => e.run("assessment", { answers: ["invented"] }),
    /sample interests/,
  );
});
test("saved trades, session and independent program steps survive a new engine", () => {
  const storage = new MemoryStorage(),
    e = new DemoEngine(storage);
  sign(e);
  e.run("save", { tradeId: "electrician", saved: true });
  e.run("select", { programId: "electrician-demo-chicago" });
  const p = e.state().programs[0],
    step = p.steps.find((x) => x.required && x.checklist)!;
  e.run("progress", { programId: p.id, stepId: step.id, done: true });
  const restored = new DemoEngine(storage),
    d = restored.run("dashboard");
  assert.ok(d.saved.includes("electrician"));
  assert.equal(d.selection, p.id);
  assert.equal(d.progress.find((x: any) => x.programId === p.id).done, 1);
  assert.equal(
    d.progress.find((x: any) => x.programId === "electrician-demo-north").done,
    0,
  );
});
test("required progress excludes recommended activities and cross-user completion", () => {
  const e = new DemoEngine();
  sign(e);
  const p = e.state().programs[0],
    required = p.steps.find((x) => x.required && x.checklist)!,
    optional = p.steps.find((x) => !x.required && x.checklist)!;
  e.run("progress", { programId: p.id, stepId: optional.id, done: true });
  assert.equal(progressPercent(e.state(), "demo-student", p).done, 0);
  e.run("progress", { programId: p.id, stepId: required.id, done: true });
  assert.equal(progressPercent(e.state(), "demo-student", p).done, 1);
  assert.equal(progressPercent(e.state(), "demo-adult", p).done, 0);
});
test("practice records correct answers and skips independently of checklist state", () => {
  const e = new DemoEngine();
  sign(e);
  const p = e.state().programs[0];
  assert.equal(
    e.run("practice", {
      programId: p.id,
      questionId: p.questions[0].id,
      answer: 1,
    }).correct,
    true,
  );
  assert.equal(
    e.run("practice", {
      programId: p.id,
      questionId: p.questions[1].id,
      answer: null,
    }).skipped,
    true,
  );
  const d = e.run("dashboard");
  assert.equal(Object.keys(d.practice[p.id]).length, 2);
  assert.equal(d.progress[0].done, 0);
  assert.throws(
    () =>
      e.run("practice", {
        programId: p.id,
        questionId: p.questions[0].id,
        answer: 99,
      }),
    /answer/,
  );
});
test("sample counselor roster and reports display their own synthetic school", () => {
  const e = new DemoEngine();
  sign(e, "demo-counselor");
  const rows = e.run("roster").rows;
  assert.ok(rows.some((x: any) => x.id === "demo-student"));
  assert.ok(!rows.some((x: any) => x.id === "demo-other"));
  assert.throws(() => e.run("student/demo-other"), /outside this school/);
  assert.equal(e.run("reports").institutions.length, 1);
  assert.throws(
    () => e.run("reports?start=2026-10-03&end=2026-10-02"),
    /before end/,
  );
  assert.throws(() => e.run("admin"), /Administrator/);
});
test("admin copy editing retains stable IDs and version-conflicting writes roll back", () => {
  const e = new DemoEngine();
  sign(e);
  const p = e.state().programs[0],
    step = p.steps[0];
  e.run("progress", { programId: p.id, stepId: step.id, done: true });
  sign(e, "demo-admin");
  e.run("admin/program", {
    program: { ...p, name: "Renamed sample" },
    expectedVersion: p.version,
  });
  const before = e.state();
  assert.throws(
    () =>
      e.run("admin/program", {
        program: { ...p, name: "Stale" },
        expectedVersion: p.version,
      }),
    /changed/,
  );
  assert.deepEqual(e.state(), before);
  assert.equal(
    progressPercent(e.state(), "demo-student", e.state().programs[0]).done,
    1,
  );
});
test("built-in manual drafts do not apply before explicit review approval", () => {
  const e = new DemoEngine();
  sign(e, "demo-admin");
  const before = e.state().programs[0],
    draft = e.state().imports[0];
  assert.equal(before.name, e.state().programs[0].name);
  assert.throws(
    () => e.run("admin/import-apply", { id: draft.id, confirm: false }),
    /approval/,
  );
  e.run("admin/import-review", {
    id: draft.id,
    draft: {
      ...draft.draft,
      name: "Reviewed synthetic program",
      published: true,
    },
  });
  assert.equal(e.state().programs[0].name, before.name);
  e.run("admin/import-apply", { id: draft.id, confirm: true });
  assert.equal(e.state().programs[0].name, "Reviewed synthetic program");
  assert.equal(e.state().imports[0].status, "applied");
  assert.throws(
    () => e.run("admin/import-apply", { id: draft.id, confirm: true }),
    /editable/,
  );
});
test("expired sample access can redeem public demo code and revocation retains progress", () => {
  const e = new DemoEngine();
  sign(e, "demo-expired");
  assert.equal(e.run("session").access, false);
  e.run("redeem", { code: "LIBRARY-DEMO" });
  assert.equal(e.run("session").access, true);
  const p = e.state().programs[0];
  e.run("progress", { programId: p.id, stepId: p.steps[0].id, done: true });
  sign(e, "demo-admin");
  e.run("admin/code-revoke", { codeId: "library-demo-code" });
  sign(e, "demo-expired");
  assert.equal(e.run("session").access, false);
  assert.equal(progressPercent(e.state(), "demo-expired", p).done, 1);
});
test("reset clears only this demo key, restores fixtures and signs out", () => {
  const storage = new MemoryStorage();
  storage.setItem("unrelated", "keep");
  const e = new DemoEngine(storage);
  sign(e);
  e.run("save", { tradeId: "welder", saved: true });
  assert.ok(storage.getItem(STORAGE_KEY));
  e.reset();
  assert.equal(storage.getItem(STORAGE_KEY), null);
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.equal(e.run("session").user, null);
  assert.deepEqual(
    e.state().users.find((u) => u.id === "demo-student")!.saved,
    [],
  );
});
test("blocked or corrupt browser storage still supports an in-memory demo with a notice", () => {
  const blocked: DemoStorage = {
    getItem() {
      throw Error("blocked");
    },
    setItem() {
      throw Error("blocked");
    },
    removeItem() {
      throw Error("blocked");
    },
  };
  const e = new DemoEngine(blocked);
  sign(e);
  assert.equal(e.run("session").user.id, "demo-student");
  assert.match(e.notice, /unavailable/);
  const bad = new MemoryStorage();
  bad.setItem(STORAGE_KEY, "broken json");
  assert.match(new DemoEngine(bad).notice, /could not be read/);
});
test("two visitors never share browser state or simulated admin edits", () => {
  const one = new DemoEngine(new MemoryStorage()),
    two = new DemoEngine(new MemoryStorage());
  sign(one, "demo-admin");
  const p = one.state().programs[0];
  one.run("admin/program", {
    program: { ...p, name: "Only visitor one" },
    expectedVersion: p.version,
  });
  assert.notEqual(two.state().programs[0].name, "Only visitor one");
  assert.equal(two.run("session").user, null);
});
test("v1 browser migration retains actor, edits, progress, grants and unrelated storage", () => {
  const storage = new MemoryStorage(),
    prior = new DemoEngine(storage);
  sign(prior);
  prior.run("select", { programId: "electrician-demo-chicago" });
  prior.run("progress", {
    programId: "electrician-demo-chicago",
    stepId: "electrician-research",
    done: true,
  });
  const snapshot = JSON.parse(storage.getItem(STORAGE_KEY)!);
  snapshot.version = 1;
  snapshot.state.programs = snapshot.state.programs.filter(
    (p: any) => !p.reference,
  );
  snapshot.state.users = snapshot.state.users.filter(
    (u: any) => !u.id.startsWith("sample-student-"),
  );
  snapshot.state.programs[0].name = "Earlier browser edit";
  storage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  storage.setItem("unrelated", "keep");
  const migrated = new DemoEngine(storage),
    d = migrated.run("dashboard");
  assert.equal(migrated.state().programs.length, 23);
  assert.equal(migrated.run("session").user.id, "demo-student");
  assert.equal(d.selection, "electrician-demo-chicago");
  assert.equal(
    d.progress.find((p: any) => p.programId === d.selection).done,
    1,
  );
  assert.equal(migrated.state().programs[0].name, "Earlier browser edit");
  assert.equal(storage.getItem("unrelated"), "keep");
  assert.deepEqual(
    migrated.state().grants.find((g) => g.id === "fixture-demo-student"),
    snapshot.state.grants.find((g: any) => g.id === "fixture-demo-student"),
  );
});
test("clear goal retains saves and program-specific checklist completion", () => {
  const e = new DemoEngine();
  sign(e);
  e.run("select", { programId: "electrician-reference-cook" });
  const p = referencePrograms.find(
    (p) => p.id === "electrician-reference-cook",
  )!;
  e.run("progress", { programId: p.id, stepId: p.steps[0].id, done: true });
  e.run("clear-selection", {});
  assert.equal(e.run("dashboard").selection, undefined);
  assert.ok(e.run("dashboard").saved.includes("electrician"));
  e.run("select", { programId: p.id });
  assert.equal(
    e.run("dashboard").progress.find((r: any) => r.programId === p.id).done,
    1,
  );
});
test("three assessment groups cover all supplied tags without duplicate chips", () => {
  assert.equal(assessmentGroups.length, 3);
  const ids = assessmentGroups.flatMap((g) => g.ids);
  assert.equal(ids.length, new Set(ids).size);
  assert.deepEqual([...ids].sort(), referenceInterests.map((i) => i.id).sort());
  const e = new DemoEngine();
  sign(e);
  const a = e.run("assessment", { answers: ids });
  assert.ok(a.matches.length <= 3);
  assert.ok(a.matches.every((m: any) => m.score > 0 && m.score <= 100));
});
test("county roadmaps and practice banks remain independent; acceptance steps do not count", () => {
  const e = new DemoEngine();
  sign(e);
  const cook = referencePrograms.find(
      (p) => p.id === "electrician-reference-cook",
    )!,
    dupage = referencePrograms.find(
      (p) => p.id === "electrician-reference-dupage",
    )!;
  assert.notDeepEqual(
    cook.steps.map((s) => s.title),
    dupage.steps.map((s) => s.title),
  );
  assert.equal(dupage.questions.length, 0);
  assert.ok(cook.steps.some((s) => !s.checklist));
  assert.ok(cook.questions.length === 15);
  const after = cook.steps.find((s) => !s.checklist)!;
  assert.throws(
    () =>
      e.run("progress", { programId: cook.id, stepId: after.id, done: true }),
    /valid checklist/,
  );
  const optional = cook.steps.find((s) => !s.required && s.checklist)!;
  e.run("progress", { programId: cook.id, stepId: optional.id, done: true });
  assert.equal(progressPercent(e.state(), "demo-student", cook).done, 0);
  assert.equal(
    referencePrograms.find((p) => p.tradeId === "painter")!.questions.length,
    0,
  );
  assert.equal(
    referencePrograms.find((p) => p.tradeId === "construction-craft-laborer")!
      .reference!.practiceLabel,
    "Try Job-Readiness Questions",
  );
});
test("all supplied questions and reference links validate, with no executable archive markup", () => {
  assert.equal(
    referencePrograms.reduce((n, p) => n + p.questions.length, 0),
    135,
  );
  for (const p of referencePrograms) {
    assert.equal(p.verifiedAt, "");
    assert.equal(new Set(p.steps.map((s) => s.id)).size, p.steps.length);
    assert.ok(!/<(?:script|div|button|a\s|img)\b/i.test(JSON.stringify(p)));
    for (const q of p.questions) {
      assert.ok(q.answer >= 0 && q.answer < q.options.length);
      assert.ok(q.explanation.length > 0);
    }
    for (const { url } of p.reference!.sources) {
      const u = new URL(url);
      assert.ok(["https:", "http:"].includes(u.protocol));
      assert.ok(!u.username && !u.password);
    }
  }
});
test("six synthetic school students retain school-scoped reports and example identities", () => {
  const e = new DemoEngine();
  sign(e, "demo-counselor");
  assert.equal(e.run("roster").total, 6);
  assert.ok(
    e.run("roster").rows.every((u: any) => u.email.endsWith("example.test")),
  );
  assert.equal(e.run("reports").registered, 6);
  assert.throws(() => e.run("student/demo-other"), /outside/);
});
test("reference edits retain sources, stay unverified and reject executable link protocols", () => {
  const e = new DemoEngine();
  sign(e, "demo-admin");
  const p = e.state().programs.find((p) => p.reference)!;
  e.run("admin/program", {
    program: {
      ...p,
      wages: "Year 1 — Demo-only replacement",
      verifiedAt: "2026-10-03",
    },
    expectedVersion: p.version,
  });
  const saved = e.state().programs.find((x) => x.id === p.id)!;
  assert.equal(saved.sourceUrl, p.sourceUrl);
  assert.equal(saved.verifiedAt, "");
  assert.deepEqual(saved.reference!.wageRows, [
    ["Year 1", "Demo-only replacement"],
  ]);
  assert.throws(
    () =>
      e.run("admin/program", {
        program: { ...saved, officialUrl: "javascript:alert(1)" },
        expectedVersion: saved.version,
      }),
    /HTTP/,
  );
  assert.equal(
    e.state().programs.find((x) => x.id === p.id)!.officialUrl,
    p.officialUrl,
  );
});
