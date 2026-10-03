import { useCallback, useEffect, useState } from "react";
import { api, Eyebrow, Message } from "./App";
import { Reports } from "./Staff";
export function Admin() {
  const [data, setData] = useState<any>(null),
    [tab, setTab] = useState("overview"),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [programId, setProgramId] = useState("electrician-demo-chicago"),
    [name, setName] = useState(""),
    [importId, setImportId] = useState("sample-import"),
    [draftName, setDraftName] = useState(""),
    [confirm, setConfirm] = useState(false),
    [publish, setPublish] = useState(false);
  const load = useCallback(async () => {
    try {
      setData(await api("admin"));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  const program = data?.programs.find((p: any) => p.id === programId),
    draft = data?.imports.find((d: any) => d.id === importId);
  useEffect(() => {
    setName(program?.name || "");
  }, [program?.name, program?.version]);
  useEffect(() => {
    setDraftName(draft?.draft.name || "");
    setConfirm(false);
    setPublish(!!draft?.draft.published);
  }, [draft?.id, draft?.draft.name]);
  async function save(route: string, body: unknown) {
    setError("");
    setNotice("");
    try {
      const result = await api(route, body);
      setNotice(result.message || "Sample updated in this browser.");
      await load();
      return result;
    } catch (e) {
      setError((e as Error).message);
      return null;
    }
  }
  if (!data)
    return (
      <div className="page">
        {error ? <Message error={error} /> : "Loading sample administration."}
      </div>
    );
  const tabs = [
    ["overview", "Overview"],
    ["content", "Content"],
    ["licenses", "Licenses & codes"],
    ["imports", "Document drafts"],
    ["users", "Users & staff"],
    ["reports", "Reports"],
    ["corrections", "Corrections"],
    ["outbox", "Notifications"],
  ];
  return (
    <div className="page admin">
      <Eyebrow>Sample platform administration</Eyebrow>
      <h1>Keep every pathway clear.</h1>
      <p className="lead">
        Explore content, institutional access and review workflows with
        synthetic data.
      </p>
      <div className="callout">
        This is a browser-only simulation. You are not an authenticated
        administrator. Nothing here changes a server, another visitor's data or
        a real program.
      </div>
      <div className="tabs scroll-tabs">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            aria-pressed={tab === key}
            onClick={() => {
              setTab(key);
              setError("");
              setNotice("");
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {error && <Message error={error} />}{" "}
      {notice && (
        <div className="notice" role="status">
          {notice}
        </div>
      )}
      {tab === "overview" && (
        <>
          <div className="cards three stats">
            {[
              ["Institutions", data.institutions.length],
              ["Trade pathways", data.trades.length],
              [
                "Reviewable sample drafts",
                data.imports.filter((d: any) => d.status === "draft").length,
              ],
            ].map(([label, value]) => (
              <div className="card" key={label}>
                <small>{label}</small>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
          <section className="card">
            <h2>Integration readiness</h2>
            {Object.entries(data.integrations).map(([key, value]) => (
              <div className="metric-line" key={key}>
                <b>{key}</b>
                <span>{String(value)}</span>
              </div>
            ))}
          </section>
        </>
      )}
      {tab === "content" && (
        <section className="card">
          <h2>Programs & preparation steps</h2>
          <label>
            Program
            <select
              value={programId}
              onChange={(e) => setProgramId(e.target.value)}
            >
              {data.programs.map((p: any) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          {program && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void save("admin/program", {
                  program: { ...program, name },
                  expectedVersion: program.version,
                });
              }}
            >
              <label>
                Sample program name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  maxLength={120}
                />
              </label>
              <p>
                Stable program and step IDs retain preparation progress when the
                name changes. All program information remains synthetic.
              </p>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Preparation step</th>
                      <th>Stable ID</th>
                      <th>Required</th>
                    </tr>
                  </thead>
                  <tbody>
                    {program.steps.map((step: any) => (
                      <tr key={step.id}>
                        <td>{step.title}</td>
                        <td>{step.id}</td>
                        <td>{step.required ? "Yes" : "Recommended"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button className="btn secondary">Save sample program</button>
            </form>
          )}
        </section>
      )}
      {tab === "licenses" && (
        <>
          <section className="card">
            <h2>Institutions & licenses</h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Institution</th>
                    <th>Type</th>
                    <th>Status</th>
                    <th>Sample end date</th>
                  </tr>
                </thead>
                <tbody>
                  {data.institutions.map((i: any) => (
                    <tr key={i.id}>
                      <td>{i.name}</td>
                      <td>{i.kind}</td>
                      <td>{i.license.active ? "Active" : "Inactive"}</td>
                      <td>{i.license.end.slice(0, 10)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="card">
            <h2>Sample library codes</h2>
            <p>
              LIBRARY-DEMO is a deliberately public sample code. It grants only
              browser-local demo access.
            </p>
            {data.codes.map((c: any) => (
              <div className="metric-line" key={c.id}>
                <span>
                  {c.active ? "Active" : "Revoked"} - {c.users.length} sample
                  redemptions
                </span>
                <button
                  className="btn secondary small"
                  disabled={!c.active}
                  onClick={() =>
                    void save("admin/code-revoke", { codeId: c.id })
                  }
                >
                  Revoke sample code
                </button>
              </div>
            ))}
          </section>
        </>
      )}
      {tab === "imports" && (
        <>
          <section className="card">
            <h2>Review a sample content document</h2>
            <p>
              No files are uploaded or read. Use the built-in synthetic program
              sample to explore a manual draft, version comparison and explicit
              approval. No AI extraction occurs.
            </p>
            <button
              className="btn secondary"
              onClick={() =>
                void save("admin/sample-import", {}).then((r) => {
                  if (r) setImportId(r.id);
                })
              }
            >
              Create sample review draft
            </button>
          </section>
          <section className="card">
            <h2>Review before applying</h2>
            <label>
              Import draft
              <select
                value={importId}
                onChange={(e) => setImportId(e.target.value)}
              >
                {data.imports.map((d: any) => (
                  <option key={d.id} value={d.id}>
                    {d.sourceName} - {d.status}
                  </option>
                ))}
              </select>
            </label>
            {draft && (
              <>
                <div className="callout">{draft.error}</div>
                <details>
                  <summary>Compare current program and sample draft</summary>
                  <div className="diff-grid">
                    <pre>
                      {JSON.stringify(
                        data.programs.find((p: any) => p.id === draft.targetId),
                        null,
                        2,
                      )}
                    </pre>
                    <pre>{JSON.stringify(draft.draft, null, 2)}</pre>
                  </div>
                </details>
                {draft.status === "draft" ? (
                  <>
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        void save("admin/import-review", {
                          id: draft.id,
                          draft: {
                            ...draft.draft,
                            name: draftName,
                            published: publish,
                          },
                        });
                      }}
                    >
                      <label>
                        Reviewed sample name
                        <input
                          value={draftName}
                          onChange={(e) => setDraftName(e.target.value)}
                          required
                          maxLength={120}
                        />
                      </label>
                      <label className="inline-check">
                        <input
                          type="checkbox"
                          checked={publish}
                          onChange={(e) => setPublish(e.target.checked)}
                        />
                        Make this program visible in this browser's sample
                        directory after apply
                      </label>
                      <button className="btn secondary">
                        Save sample draft
                      </button>
                    </form>
                    <label className="inline-check">
                      <input
                        type="checkbox"
                        checked={confirm}
                        onChange={(e) => setConfirm(e.target.checked)}
                      />
                      I reviewed the sample and approve applying these
                      browser-only changes.
                    </label>
                    <button
                      className="btn"
                      disabled={!confirm}
                      onClick={() =>
                        void save("admin/import-apply", {
                          id: draft.id,
                          confirm: true,
                        }).then(() => setConfirm(false))
                      }
                    >
                      Apply reviewed sample
                    </button>
                  </>
                ) : (
                  <p className="notice">
                    Sample applied in this browser. No external content was
                    published.
                  </p>
                )}
              </>
            )}
          </section>
        </>
      )}
      {tab === "users" && (
        <section className="card">
          <h2>Users & sample staff</h2>
          <p>
            Every identity below is synthetic and included in the public demo.
            Role switching is a simulation, not access control.
          </p>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Sample email</th>
                  <th>Role</th>
                  <th>Access</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u: any) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.role}</td>
                    <td>{u.access ? "Active" : "Inactive"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
      {tab === "reports" && <Reports />}
      {tab === "corrections" && (
        <section className="card">
          <h2>Sample content corrections</h2>
          {data.corrections.length ? (
            data.corrections.map((c: any) => (
              <article className="correction-card" key={c.id}>
                <b>{c.programId}</b>
                <p>{c.message}</p>
                <span className="pill">{c.status}</span>
                <button
                  className="btn secondary small"
                  onClick={() =>
                    void save("admin/correction", {
                      id: c.id,
                      status: "resolved",
                    })
                  }
                >
                  Mark sample resolved
                </button>
              </article>
            ))
          ) : (
            <div className="empty">
              No sample corrections saved in this browser yet.
            </div>
          )}
        </section>
      )}
      {tab === "outbox" && (
        <section className="card">
          <h2>Sample notification outbox</h2>
          <div className="callout">
            No email, password token or outbound message is generated. These
            sample notifications exist only in this browser.
          </div>
          {data.outbox.map((m: any) => (
            <article className="outbox-item" key={m.id}>
              <h3>{m.subject}</h3>
              <p>Sample recipient: {m.to}</p>
              <p>{m.body}</p>
              <span className="pill">Not sent - demo</span>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}
