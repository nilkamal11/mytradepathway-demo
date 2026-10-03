import { useEffect, useState } from "react";
import type { Trade } from "@/lib/model";
import { api, Eyebrow, Message, Icon } from "./App";
import { downloadReport } from "@/lib/demo";
export function Reports() {
  const [start, setStart] = useState(
      new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10),
    ),
    [end, setEnd] = useState(
      new Date(Date.now() + 86400000).toISOString().slice(0, 10),
    ),
    [data, setData] = useState<any>(null),
    [error, setError] = useState("");
  const query = `start=${start}&end=${end}`;
  async function load() {
    setError("");
    try {
      setData(await api("reports?" + query));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load();
  }, []);
  return (
    <section>
      <h2>Engagement report</h2>
      <p>
        Active users performed a tracked application activity in the selected
        period. End date is exclusive. Registered counts and required progress
        reflect the current state.
      </p>
      <form
        className="report-filters"
        onSubmit={(e) => {
          e.preventDefault();
          void load();
        }}
      >
        <label>
          Start date
          <input
            type="date"
            required
            value={start}
            onChange={(e) => setStart(e.target.value)}
          />
        </label>
        <label>
          End date (exclusive)
          <input
            type="date"
            required
            value={end}
            onChange={(e) => setEnd(e.target.value)}
          />
        </label>
        <button className="btn secondary">Apply dates</button>
        <a
          className="btn secondary"
          href="#download"
          onClick={(e) => {
            e.preventDefault();
            downloadReport(query);
          }}
        >
          Export CSV ↓
        </a>
      </form>
      {error && <Message error={error} />}{" "}
      {!data ? (
        <div className="empty">Loading report…</div>
      ) : (
        <>
          <div className="cards three stats">
            {[
              ["Registered users", data.registered],
              ["Active in period", data.active],
              ["Assessment submissions", data.assessments],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <div className="card">
            <h3>Selected-program preparation</h3>
            <p>
              {data.preparation.done} of {data.preparation.required} required
              steps completed across {data.preparation.selectedUsers} selected
              pathways ({data.preparation.percent}%). Current preparation
              snapshot; activity counts use the date period.
            </p>
          </div>
          <div className="cards three">
            {[
              ["Popular matches", data.popularMatched],
              ["Saved trades", data.popularSaved],
              ["Selected pathways", data.popularSelected],
            ].map(([title, rows]) => (
              <div className="card" key={title}>
                <h3>{title}</h3>
                {rows.length ? (
                  rows.map((r: any) => (
                    <div className="metric-line" key={r.name}>
                      <span>{r.name}</span>
                      <b>{r.count}</b>
                    </div>
                  ))
                ) : (
                  <p className="muted">No tracked activity in this period.</p>
                )}
              </div>
            ))}
          </div>
          <div className="table-wrap">
            <table>
              <caption>
                Institution summaries — library engagement is aggregated
              </caption>
              <thead>
                <tr>
                  <th>Institution</th>
                  <th>Registered</th>
                  <th>Active</th>
                  <th>License</th>
                  <th>Current required steps</th>
                </tr>
              </thead>
              <tbody>
                {data.institutions.map((i: any) => (
                  <tr key={i.id}>
                    <td>{i.name}</td>
                    <td>{i.registered}</td>
                    <td>{i.active}</td>
                    <td>{i.licenseActive ? "Active" : "Inactive"}</td>
                    <td>
                      {i.preparation.done}/{i.preparation.required} (
                      {i.preparation.percent}%)
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  );
}
export function Counselor({ trades }: { trades: Trade[] }) {
  const [q, setQ] = useState(""),
    [filter, setFilter] = useState("all"),
    [page, setPage] = useState(1),
    [roster, setRoster] = useState<any>(null),
    [student, setStudent] = useState<any>(null),
    [error, setError] = useState("");
  async function load(p = page) {
    try {
      setError("");
      setRoster(
        await api(
          `roster?q=${encodeURIComponent(q)}&filter=${filter}&page=${p}`,
        ),
      );
      setPage(p);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  useEffect(() => {
    void load(1);
  }, []);
  async function detail(id: string) {
    try {
      setStudent(await api("student/" + id));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <div className="page">
      <Eyebrow>School engagement</Eyebrow>
      <h1>A clearer view of their next steps.</h1>
      <p className="lead">
        {roster?.school || "Your school"} · read-only student progress
      </p>
      {error && <Message error={error} />}
      <section className="card">
        <div className="section-title">
          <h2>Student roster</h2>
          <span className="pill">{roster?.total || 0} students</span>
        </div>
        <form
          className="directory-toolbar"
          onSubmit={(e) => {
            e.preventDefault();
            void load(1);
          }}
        >
          <label className="searchbox">
            <Icon name="search" />
            <input
              aria-label="Search students"
              placeholder="Search name or email…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </label>
          <select
            aria-label="Student engagement filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All students</option>
            <option value="assessed">Assessment completed</option>
            <option value="saved">Saved a trade</option>
          </select>
          <button className="btn secondary">Search</button>
        </form>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Top match</th>
                <th>Saved</th>
                <th>Required progress</th>
                <th>Last active</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {roster?.rows?.map((s: any) => (
                <tr key={s.id}>
                  <td>
                    <b>{s.name}</b>
                    <small>{s.email}</small>
                  </td>
                  <td>
                    {trades.find((t) => t.id === s.matches?.[0]?.tradeId)
                      ?.name || "Not submitted"}
                  </td>
                  <td>{s.saved.length}</td>
                  <td>
                    {s.progress
                      ? s.progress.percent + "%"
                      : "No program selected"}
                  </td>
                  <td>
                    {s.lastActive
                      ? new Date(s.lastActive).toLocaleString()
                      : "No recorded activity"}
                  </td>
                  <td>
                    <button
                      className="textlink"
                      onClick={() => void detail(s.id)}
                    >
                      View student →
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {roster && !roster.rows.length && (
          <div className="empty">No students match these filters.</div>
        )}
        <div className="row between">
          <button
            className="btn secondary"
            disabled={page <= 1}
            onClick={() => void load(page - 1)}
          >
            Previous
          </button>
          <span>Page {page}</span>
          <button
            className="btn secondary"
            disabled={page * 20 >= (roster?.total || 0)}
            onClick={() => void load(page + 1)}
          >
            Next
          </button>
        </div>
      </section>
      {student && (
        <section className="card student-detail">
          <div className="row between">
            <h2>{student.user.name}</h2>
            <button className="btn secondary" onClick={() => setStudent(null)}>
              Close details
            </button>
          </div>
          <h3>Assessment matches</h3>
          <p>
            {student.assessment?.matches
              .map(
                (m: any) =>
                  `${trades.find((t) => t.id === m.tradeId)?.name} (${m.score}% demo affinity)`,
              )
              .join(", ") || "No submitted assessment"}
          </p>
          <h3>Saved trades</h3>
          <p>
            {student.saved
              .map((id: string) => trades.find((t) => t.id === id)?.name)
              .join(", ") || "No saved trades"}
          </p>
          <h3>Program preparation</h3>
          {student.progress
            .filter((p: any) => p.done > 0)
            .map((p: any) => (
              <p key={p.programId}>
                {p.name}: {p.percent}% ({p.done}/{p.required} required)
              </p>
            ))}
          <h3>Recent school activity</h3>
          {student.events.length ? (
            <ul>
              {student.events.map((e: any) => (
                <li key={e.id}>
                  {e.type} · {e.tradeId || "interests"} ·{" "}
                  {new Date(e.at).toLocaleString()}
                </li>
              ))}
            </ul>
          ) : (
            <p>No recorded activity.</p>
          )}
        </section>
      )}
      <Reports />
      <section className="card">
        <h2>Outreach contacts & sources</h2>
        <p>
          Union/provider contacts and supporting sources have not been supplied.
          Approved outreach content can be added through resource
          administration.
        </p>
        <p className="muted">
          Counselor access is read-only. Task assignment, messaging and school
          scheduling are outside this release.
        </p>
      </section>
    </div>
  );
}
