// Client-only synthetic rules. These are not authentication or data security.
import type { State, User, Program, Trade, Match, Institution } from "./model";
export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export class AppError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

export function check(
  condition: unknown,
  message: string,
  status = 400,
): asserts condition {
  if (!condition) throw new AppError(message, status);
}

export function licenseActive(i: Institution | undefined, at = now()) {
  return !!i && i.license.active && i.license.start <= at && at < i.license.end;
}

export function hasAccess(s: State, u: User, at = now()) {
  return (
    u.verified &&
    u.ageAffirmed &&
    !u.disabled &&
    s.grants.some(
      (g) =>
        g.userId === u.id &&
        g.active &&
        s.settings.access[g.source] &&
        g.start <= at &&
        at < g.end &&
        (g.source === "individual" ||
          licenseActive(
            s.institutions.find((i) => i.id === g.institutionId),
            at,
          )) &&
        (!g.codeId || s.codes.some((c) => c.id === g.codeId && c.active)),
    )
  );
}

export function staffSchool(s: State, u: User) {
  const i = s.institutions.find((i) => i.id === u.institutionId);
  return u.verified &&
    u.ageAffirmed &&
    !u.disabled &&
    u.role === "counselor" &&
    i?.kind === "school" &&
    i.staff.includes(u.email) &&
    licenseActive(i)
    ? i
    : undefined;
}

export function requireAdmin(u: User) {
  check(
    u.verified && u.ageAffirmed && !u.disabled && u.role === "admin",
    "Administrator access required",
    403,
  );
}

export function requireAccess(s: State, u: User) {
  check(
    hasAccess(s, u),
    "An active access grant and verified email are required. Your saved progress is retained.",
    403,
  );
}

export function progressPercent(s: State, userId: string, p: Program) {
  const steps = p.steps.filter((x) => x.required && x.checklist);
  const done = steps.filter((x) =>
    s.progress.some(
      (r) =>
        r.userId === userId &&
        r.programId === p.id &&
        r.stepId === x.id &&
        r.done,
    ),
  ).length;
  return {
    required: steps.length,
    done,
    percent: steps.length ? Math.round((done / steps.length) * 100) : 0,
  };
}

export function matchTrades(answers: string[], trades: Trade[]): Match[] {
  return trades
    .filter((t) => t.published)
    .map((t) => ({
      tradeId: t.id,
      score: Math.round(
        (t.tags.filter((tag) => answers.includes(tag)).length /
          Math.max(new Set(answers).size, 1)) *
          100,
      ),
    }))
    .filter((t) => t.score > 0)
    .sort((a, b) => b.score - a.score || a.tradeId.localeCompare(b.tradeId))
    .slice(0, 3);
}

export function record(
  s: State,
  u: User,
  type: string,
  tradeId?: string,
  programId?: string,
) {
  s.events.push({
    id: id(),
    userId: u.id,
    institutionId: u.institutionId,
    type,
    tradeId,
    programId,
    at: now(),
  });
}

export function csv(rows: unknown[][]) {
  return rows
    .map((row) =>
      row
        .map((v) => {
          let x = String(v ?? "");
          if (/^[\s]*[=+@-]/.test(x)) x = "'" + x;
          return '"' + x.replaceAll('"', '""') + '"';
        })
        .join(","),
    )
    .join("\r\n");
}

export function report(s: State, u: User, start: string, end: string) {
  check(start < end, "Start must be before end");
  const school = u.role === "admin" ? undefined : staffSchool(s, u);
  check(u.role === "admin" || school, "Approved school staff required", 403);
  const users = s.users.filter(
    (x) => x.role === "member" && (!school || x.institutionId === school.id),
  );
  const events = s.events.filter(
    (e) =>
      e.at >= start && e.at < end && (!school || e.institutionId === school.id),
  );
  const active = new Set(events.map((e) => e.userId));
  const popularity = (type: string) =>
    s.trades
      .map((t) => ({
        name: t.name,
        count: events.filter((e) => e.type === type && e.tradeId === t.id)
          .length,
      }))
      .filter((x) => x.count)
      .sort((a, b) => b.count - a.count);
  return {
    registered: users.length,
    preparation: preparationSummary(s, users),
    active: active.size,
    assessments: events.filter((e) => e.type === "assessment").length,
    popularSaved: popularity("save"),
    popularSelected: popularity("select"),
    popularMatched: popularity("match"),
    institutions: s.institutions
      .filter((i) => !school || i.id === school.id)
      .map((i) => ({
        id: i.id,
        name: i.name,
        kind: i.kind,
        registered: s.users.filter(
          (x) => x.institutionId === i.id && x.role === "member",
        ).length,
        active: new Set(
          events.filter((e) => e.institutionId === i.id).map((e) => e.userId),
        ).size,
        licenseActive: licenseActive(i),
        preparation: preparationSummary(
          s,
          users.filter((x) => x.institutionId === i.id),
        ),
      })),
    rows: users
      .filter((x) => !school || x.institutionId === school.id)
      .map((x) => ({
        id: x.id,
        name: x.name,
        email: x.email,
        active: active.has(x.id),
        saved: x.saved.length,
        progress: x.selection
          ? progressPercent(
              s,
              x.id,
              s.programs.find((p) => p.id === x.selection)!,
            ).percent
          : 0,
        lastActive:
          s.events
            .filter(
              (e) =>
                e.userId === x.id && (!school || e.institutionId === school.id),
            )
            .at(-1)?.at ?? "",
      })),
  };
}

export function preparationSummary(s: State, users: User[]) {
  const results = users.flatMap((u) => {
    const p = s.programs.find((p) => p.id === u.selection);
    return p ? [progressPercent(s, u.id, p)] : [];
  });
  const required = results.reduce((n, p) => n + p.required, 0),
    done = results.reduce((n, p) => n + p.done, 0);
  return {
    selectedUsers: results.length,
    required,
    done,
    percent: required ? Math.round((done / required) * 100) : 0,
  };
}
