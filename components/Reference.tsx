import { Link } from "@/lib/router";
import type { Program, Trade, Match } from "@/lib/model";
import { Eyebrow, Progress, Icon } from "./App";
import { ChecklistToggle } from "./ChecklistToggle";
type Act = (route: string, body: unknown) => Promise<any>;
const external = (url: string, label: string) => (
  <a href={url} target="_blank" rel="noopener noreferrer">
    {label} ↗
  </a>
);
export function SnapshotNotice() {
  return (
    <div className="callout reference-notice">
      Supplied reference snapshot, received October 3, 2026. Wages, fees,
      eligibility and application dates have not been independently verified.
      Some listed windows have already closed. Check the provider’s current
      information before making plans.
    </div>
  );
}
export function ReferencePanels({ program: p }: { program: Program }) {
  const r = p.reference!;
  return (
    <>
      <div className="cards two">
        <section className="card detail-card">
          <Eyebrow>The work</Eyebrow>
          <h2>What this trade involves</h2>
          <p>{r.description}</p>
          {r.dayInLife && (
            <details>
              <summary>A day in the life</summary>
              <p>{r.dayInLife}</p>
            </details>
          )}
          {r.greenEnergyNote && (
            <details>
              <summary>Clean energy work</summary>
              <p>{r.greenEnergyNote}</p>
            </details>
          )}
        </section>
        <section className="card detail-card">
          <Eyebrow>Provider information</Eyebrow>
          <h2>{p.provider}</h2>
          <p>{p.location}</p>
          <p>{p.contact}</p>
          <p>
            <b>Program length:</b> {p.length}
          </p>
          {external(p.sourceUrl, "Visit provider")}
          {p.videos.map((url) => (
            <p key={url}>
              {external(url, r.videoTitle || "Trade video")}
              <small className="block">{r.videoNote}</small>
            </p>
          ))}
        </section>
      </div>
      {!!r.tracks.length && (
        <section className="card reference-section">
          <Eyebrow>Choose your direction</Eyebrow>
          <h2>Program tracks</h2>
          <p>{r.tracksIntro}</p>
          <div className="cards two">
            {r.tracks.map((t) => (
              <div className="track-card" key={t.name}>
                <h3>{t.name}</h3>
                <span className="pill">{t.length}</span>
                <p>{t.short}</p>
                <details>
                  <summary>What this track covers</summary>
                  <p>{t.covers}</p>
                  {t.related && <p>{t.related}</p>}
                </details>
              </div>
            ))}
          </div>
          <p className="muted">{r.tracksNote}</p>
          <p className="muted">
            Track comparisons describe the supplied material. This checklist
            belongs to the listed local program; confirm any track-specific
            process with that provider.
          </p>
        </section>
      )}
      <section className="card reference-section">
        <Eyebrow>Supplied figures</Eyebrow>
        <h2>Wage progression</h2>
        <p>
          Reference figures below are unverified and may be outdated. Annual
          earning estimates depend on hours worked. Base wages and total
          compensation are different measures.
        </p>
        {r.wageTracks.map((w) => (
          <div className="track-card" key={w.name}>
            <h3>{w.name}</h3>
            <p>Starting: {w.start}</p>
            <p>Journey level: {w.journey}</p>
          </div>
        ))}
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Stage or measure</th>
                <th>Supplied figure</th>
              </tr>
            </thead>
            <tbody>
              {r.wageRows.map((row, i) => (
                <tr key={i}>
                  <td>{row[0]}</td>
                  <td>{row[1]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {r.wageNote && <p>{r.wageNote}</p>}
      </section>
      <div className="cards two">
        {[
          ["Requirements & documents", p.eligibility],
          ["Application timing", p.applicationDates],
          ["Entrance exam or selection process", p.exam],
          ["How to prepare", p.preparation],
        ].map(([title, text]) => (
          <section className="card detail-card" key={title}>
            <h2>{title}</h2>
            <p>{text}</p>
          </section>
        ))}
        <section className="card detail-card">
          <h2>How to apply</h2>
          <p>{r.apply}</p>
          {p.officialUrl &&
            external(p.officialUrl, "Provider application information")}
          <p className="muted">
            Applications and document submission happen with the provider. This
            demo does not collect application documents.
          </p>
        </section>
        <section className="card detail-card">
          <h2>Common tools</h2>
          <ul>
            {r.tools.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
          <p>{r.toolsNote}</p>
          <p className="muted">
            Ask the provider what you actually need before buying equipment.
          </p>
        </section>
        <section className="card detail-card">
          <h2>Sources & content review</h2>
          <p>
            Last independently verified: not recorded. These links were supplied
            with the reference content.
          </p>
          <ul>
            {r.sources.map((s) => (
              <li key={s.url}>{external(s.url, s.title)}</li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
export function ActiveChecklist({
  programs,
  dash,
  act,
}: {
  programs: Program[];
  dash: any;
  act: Act;
}) {
  const p = programs.find((p) => p.id === dash?.selection),
    progress = dash?.progress?.find((x: any) => x.programId === p?.id);
  if (!p) return null;
  return (
    <section className="card reference-section active-checklist">
      <div className="row between">
        <div>
          <Eyebrow>Your active goal</Eyebrow>
          <h2>Requirements for your next step</h2>
        </div>
        <button
          className="btn secondary small"
          onClick={() => void act("clear-selection", {}).catch(() => {})}
        >
          Clear active goal
        </button>
      </div>
      <label>
        Active program
        <select
          value={p.id}
          onChange={(e) =>
            void act("select", { programId: e.target.value }).catch(() => {})
          }
        >
          {[...programs]
            .sort((a, b) => Number(!!b.reference) - Number(!!a.reference))
            .map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
        </select>
      </label>
      <Progress value={progress?.percent || 0} />
      {p.reference && (
        <p className="muted">
          Supplied requirements are unverified. Recommended items do not affect
          progress; training after acceptance is shown on the full roadmap.
        </p>
      )}
      {[true, false].map((required) => (
        <div key={String(required)}>
          <h3>
            {required ? "Required preparation" : "Recommended preparation"}
          </h3>
          {p.steps
            .filter((s) => s.checklist && s.required === required)
            .map((step) => (
              <div className="checklist-item" key={step.id}>
                <div>
                  <label>
                    <ChecklistToggle
                      checked={
                        !!progress?.steps?.find(
                          (x: any) => x.stepId === step.id,
                        )?.done
                      }
                      onChange={(done) =>
                        act("progress", {
                          programId: p.id,
                          stepId: step.id,
                          done,
                        })
                      }
                    />
                    <b>{step.title}</b>
                  </label>
                  <details>
                    <summary aria-label={step.title + " details"}>
                      ⓘ Step details
                    </summary>
                    <p>{step.explanation}</p>
                    {p.officialUrl &&
                      external(
                        p.officialUrl,
                        "Provider application information",
                      )}
                  </details>
                </div>
              </div>
            ))}
        </div>
      ))}
      <Link className="textlink" href={"/trades/" + p.tradeId}>
        View full roadmap <Icon name="arrow" />
      </Link>
    </section>
  );
}
export function MatchActions({
  matches,
  trades,
  programs,
  dash,
  act,
}: {
  matches: Match[];
  trades: Trade[];
  programs: Program[];
  dash: any;
  act: Act;
}) {
  return (
    <div className="cards two match-actions">
      {matches.map((m, i) => {
        const t = trades.find((t) => t.id === m.tradeId)!;
        const available = programs.filter(
          (p) => p.tradeId === t.id && p.reference,
        );
        return (
          <section className="card" key={t.id}>
            <Eyebrow>
              Match {i + 1} · {m.score}% preference overlap
            </Eyebrow>
            <h3>{t.name}</h3>
            <p>{t.preview}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const programId = new FormData(e.currentTarget).get(
                  "programId",
                );
                void act("select", { programId }).catch(() => {});
              }}
            >
              <label>
                Local program for {t.name}
                <select name="programId">
                  {available.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.provider}
                    </option>
                  ))}
                </select>
              </label>
              <div className="row wrap">
                <button className="btn small">
                  Work toward apprenticeship
                </button>
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() =>
                    void act("save", {
                      tradeId: t.id,
                      saved: !dash.saved.includes(t.id),
                    }).catch(() => {})
                  }
                >
                  {dash.saved.includes(t.id) ? "Unsave" : "Save"} {t.name}
                </button>
                <Link className="textlink" href={"/trades/" + t.id}>
                  View roadmap
                </Link>
              </div>
            </form>
          </section>
        );
      })}
    </div>
  );
}
export function LearningHub({
  view,
  programs,
  trades,
}: {
  view: string;
  programs: Program[];
  trades: Trade[];
}) {
  const refs = programs.filter((p) => p.reference),
    pre = view === "pre-apprenticeships",
    contacts = view === "contacts",
    sources = view === "sources";
  return (
    <div className="page">
      <Eyebrow>Learn the landscape</Eyebrow>
      <h1>
        {pre
          ? "A supported way to start."
          : contacts
            ? "Connect with a training provider."
            : sources
              ? "Follow the source."
              : "Understand your apprenticeship options."}
      </h1>
      <p className="lead">
        {pre
          ? "Explore preparation routes and take your next step with the provider."
          : contacts
            ? "School outreach and application questions start with the provider’s public office."
            : sources
              ? "Review the links behind the supplied trade guidance."
              : "Compare training routes, ask good questions and find a local program."}
      </p>
      <div className="tabs hub-tabs">
        {[
          ["unions", "Unions & apprenticeships"],
          ["pre-apprenticeships", "Pre-apprenticeships"],
          ["contacts", "School contacts"],
          ["sources", "Sources"],
        ].map(([route, label]) => (
          <Link
            key={route}
            className={view === route ? "selected" : ""}
            href={"/" + route}
          >
            {label}
          </Link>
        ))}
      </div>
      {pre ? (
        <>
          <div className="cards two">
            <section className="card">
              <Eyebrow>Eligibility & next steps</Eyebrow>
              <h2>HIRE360</h2>
              <p>
                The provider’s assessment helps determine eligibility for
                Illinois apprenticeship pathways. It is not an application for
                employment. The provider sends next steps after completion.
              </p>
              {external(
                "https://hire360partners.org/assessment/",
                "Complete HIRE360 assessment",
              )}
              <details>
                <summary>Before you begin</summary>
                <p>
                  Read the provider’s current instructions. Confirm the training
                  route, eligibility, cohort dates and support available to you
                  directly. Submit personal information only through its
                  official site.
                </p>
              </details>
            </section>
            <section className="card">
              <Eyebrow>Information session</Eyebrow>
              <h2>Chicago Women in Trades</h2>
              <p>
                Review CWIT’s current eligibility requirements, then register
                for an information session to explore its training opportunities
                and enrollment waitlist.
              </p>
              {external(
                "https://cwit.org/info-session-sign-up/",
                "Register for a CWIT information session",
              )}
              <p>
                {external(
                  "https://cwit.org/",
                  "Explore CWIT programs & eligibility",
                )}
              </p>
            </section>
          </div>
          <section className="card reference-section">
            <h2>More preparation routes in the specification</h2>
            <div className="cards two">
              {[
                "Illinois Works",
                "Climate Works",
                "REACH",
                "Electric Vehicle training",
                "Clean Energy Construction Trades",
              ].map((name) => (
                <div className="track-card" key={name}>
                  <h3>{name}</h3>
                  <p>
                    This route is named in the supplied specification. Current
                    local providers, eligibility and enrollment details still
                    need confirmation.
                  </p>
                  {external(
                    name === "Illinois Works"
                      ? "https://dceo.illinois.gov/illinoisworks.html"
                      : name === "REACH"
                        ? "https://dceo.illinois.gov/assistanceforindividuals/jobtraining.html"
                        : "https://dceo.illinois.gov/ceja.html",
                    "Find Illinois workforce program information",
                  )}
                </div>
              ))}
            </div>
          </section>
          <p className="muted">
            Taking a preparation course does not guarantee apprenticeship
            admission or employment.
          </p>
        </>
      ) : contacts ? (
        <>
          <SnapshotNotice />
          <div className="cards two">
            {refs.map((p) => (
              <section className="card detail-card" key={p.id}>
                <span className="pill">
                  {trades.find((t) => t.id === p.tradeId)?.name}
                </span>
                <h2>{p.provider}</h2>
                <p>{p.contact}</p>
                <p>{p.location}</p>
                {external(p.sourceUrl, "Provider contact information")}
                <p className="muted">
                  Public office from the supplied material. No named outreach
                  contact has been independently confirmed.
                </p>
              </section>
            ))}
            <section className="card">
              <h2>HIRE360 outreach</h2>
              <p>
                Ask the provider which preparation route fits your school or
                learners.
              </p>
              {external("https://hire360partners.org/", "Contact HIRE360")}
            </section>
          </div>
        </>
      ) : sources ? (
        <>
          <SnapshotNotice />
          {trades.map((t) => (
            <section className="card reference-section" key={t.id}>
              <h2>{t.name}</h2>
              {refs
                .filter((p) => p.tradeId === t.id)
                .map((p) => (
                  <div key={p.id}>
                    <h3>{p.provider}</h3>
                    <ul>
                      {p.reference!.sources.map((s) => (
                        <li key={s.url}>{external(s.url, s.title)}</li>
                      ))}
                    </ul>
                  </div>
                ))}
            </section>
          ))}
        </>
      ) : (
        <>
          <div className="cards two">
            <section className="card">
              <h2>Learn while you work</h2>
              <p>
                Apprenticeships combine paid work with related instruction.
                Registered programs have a structured training plan. Check the
                specific program’s status and requirements.
              </p>
              {external(
                "https://www.apprenticeship.gov/career-seekers",
                "Explore Registered Apprenticeship",
              )}
            </section>
            <section className="card">
              <h2>What does the union do?</h2>
              <p>
                Ask a local about representation, member benefits, dues and its
                relationship with the training program. Your application and
                acceptance are handled by the program, and may depend on
                employer demand.
              </p>
              <Link href="/contacts" className="textlink">
                Find a local office
              </Link>
            </section>
          </div>
          <section className="card reference-section">
            <h2>Compare routes before committing</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Question to ask</th>
                    <th>Apprenticeship provider</th>
                    <th>Tuition-based training provider</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    [
                      "Work & training",
                      "What paid work and instruction are included?",
                      "Does the course include work experience or only classroom training?",
                    ],
                    [
                      "Costs",
                      "What fees, dues, books or tools will I need?",
                      "What are total tuition, financing costs and refund terms?",
                    ],
                    [
                      "Outcome",
                      "What credential does completion earn?",
                      "Is the credential accepted by the employers I want?",
                    ],
                    [
                      "Admission",
                      "When can I apply, and how am I selected?",
                      "What are entry and completion requirements?",
                    ],
                  ].map((row) => (
                    <tr key={row[0]}>
                      {row.map((cell, i) => (
                        <td key={i}>{cell}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <SnapshotNotice />
          <section className="card reference-section">
            <h2>Chicagoland provider directory</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Trade</th>
                    <th>Local / provider</th>
                    <th>Website</th>
                  </tr>
                </thead>
                <tbody>
                  {refs.map((p) => (
                    <tr key={p.id}>
                      <td>{trades.find((t) => t.id === p.tradeId)?.name}</td>
                      <td>{p.provider}</td>
                      <td>{external(p.sourceUrl, "Provider website")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
