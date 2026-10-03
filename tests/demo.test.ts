import test from "node:test";
import assert from "node:assert/strict";
import { DemoEngine, STORAGE_KEY, type DemoStorage } from "../lib/demo";
import { progressPercent } from "../lib/domain";
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
test("public fixtures contain ten trades, only synthetic programs and example-domain identities", () => {
  const s = new DemoEngine().state();
  assert.equal(s.trades.length, 10);
  assert.equal(s.programs.length, 11);
  assert.ok(s.programs.every((p) => p.synthetic));
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
  assert.equal(e.state().users.length, 8);
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
