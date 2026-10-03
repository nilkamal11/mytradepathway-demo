import { useCallback, useEffect, useState } from "react";
import { Link, usePathname, useRouter } from "@/lib/router";
import { demoApi, resetDemo, storageNotice } from "@/lib/demo";

import type { Program, Trade, Match, Step } from "@/lib/model";
import { Admin } from "./Admin";
import { ChecklistToggle } from "./ChecklistToggle";
import { Counselor, Reports } from "./Staff";
export const api = demoApi;
export function Icon({ name, size = 20 }: { name: string; size?: number }) {
  const shapes: Record<string, React.ReactNode> = {
    home: (
      <>
        <path d="m3 10 9-7 9 7v10H3Z" />
        <path d="M9 20v-7h6v7" />
      </>
    ),
    grid: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1" />
        <rect x="14" y="3" width="7" height="7" rx="1" />
        <rect x="3" y="14" width="7" height="7" rx="1" />
        <rect x="14" y="14" width="7" height="7" rx="1" />
      </>
    ),
    arrow: <path d="M4 12h15m-6-6 6 6-6 6" />,
    check: <path d="m5 12 4 4L19 6" />,
    bookmark: <path d="M6 3h12v18l-6-4-6 4Z" />,
    compass: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="m16 8-3 5-5 3 3-5Z" />
      </>
    ),
    user: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21v-3c0-5 16-5 16 0v3" />
      </>
    ),
    book: (
      <>
        <path d="M12 5c-4-3-9-2-9 0v15c3-2 6-2 9 0 3-2 6-2 9 0V5c0-2-5-3-9 0Z" />
        <path d="M12 5v15" />
      </>
    ),
    gear: (
      <>
        <circle cx="12" cy="12" r="8" />
        <circle cx="12" cy="12" r="3" />
      </>
    ),
    bolt: <path d="m13 2-8 12h6l-1 8 9-13h-7Z" />,
    search: (
      <>
        <circle cx="10" cy="10" r="6" />
        <path d="m15 15 6 6" />
      </>
    ),
    users: (
      <>
        <circle cx="9" cy="8" r="3" />
        <path d="M3 21v-4c0-5 12-5 12 0v4m1-16c5 0 5 6 0 6m2 3c4 0 4 4 4 7" />
      </>
    ),
  };
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {shapes[name] || shapes.compass}
    </svg>
  );
}
type Session = {
  user: any;
  access: boolean;
  fixtures: { id: string; label: string }[];
};
type Catalog = {
  pricing?: {
    priceCents: number;
    currency: "USD";
    billingModel: "one_time" | "annual" | null;
    durationDays: number | null;
  };
  trades: Trade[];
  programs: Program[];
  interests: { id: string; name: string; description: string }[];
  access: boolean;
};
export default function App() {
  const path = usePathname(),
    router = useRouter();
  const [session, setSession] = useState<Session>({
      user: null,
      access: false,
      fixtures: [],
    }),
    [catalog, setCatalog] = useState<Catalog>({
      trades: [],
      programs: [],
      interests: [],
      access: false,
    }),
    [dash, setDash] = useState<any>(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState(false),
    [busy, setBusy] = useState(false);
  const reload = useCallback(async () => {
    setError("");
    try {
      const [s, c] = await Promise.all([api("session"), api("catalog")]);
      setSession(s);
      setCatalog(c);
      setDash(s.access ? await api("dashboard") : null);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    setMenu(false);
  }, [path]);
  async function act(route: string, body: unknown) {
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const result = await api(route, body);
      if (result.message) setNotice(result.message);
      await reload();
      return result;
    } catch (e) {
      setError((e as Error).message);
      throw e;
    } finally {
      setBusy(false);
    }
  }
  const publicPage =
    path === "/" ||
    path === "/pricing" ||
    path === "/institutions" ||
    path.startsWith("/legal/");
  const nav = [
    ["/dashboard", "home", "My pathway"],
    ["/trades", "grid", "Explore trades"],
    ["/assessment", "compass", "Find my match"],
    ["/resources", "book", "Resources"],
    ...(session.user?.role === "counselor"
      ? [["/counselor", "users", "School dashboard"]]
      : []),
    ...(session.user?.role === "admin"
      ? [["/admin", "gear", "Administration"]]
      : []),
    ["/account", "user", "My account"],
  ];
  const user = session.user;
  const greeting = user?.name.split(" ")[0] || "there";
  let content: React.ReactNode;
  if (loading) content = <div className="empty">Loading your pathway…</div>;
  else if (path === "/") content = <Landing trades={catalog.trades} />;
  else if (path === "/pricing")
    content = (
      <div className="page">
        <Eyebrow>Access that meets you where you are</Eyebrow>
        <h1>One pathway. Three ways in.</h1>
        <p className="lead">
          Explore through your school, participating library, or individual
          access.
        </p>
        <div className="cards three">
          <div className="card">
            <Icon name="user" />
            <h2>Individual</h2>
            <div className="price">
              {new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
              }).format((catalog.pricing?.priceCents ?? 4900) / 100)}{" "}
              <small>intended launch price</small>
            </div>
            <p>
              The client will approve either one-time access with a duration or
              an annual plan. Checkout is not activated in this review.
            </p>
            <Link className="btn" href="/account">
              Review individual access <Icon name="arrow" />
            </Link>
          </div>
          <div className="card">
            <Icon name="book" />
            <h2>School access</h2>
            <p>
              A verified school email and active institutional license connect
              students to their pathway. Shared district domains use enrollment
              codes.
            </p>
            <Link href="/institutions" className="btn secondary">
              School inquiry
            </Link>
          </div>
          <div className="card">
            <Icon name="grid" />
            <h2>Library access</h2>
            <p>
              Redeem a code from a participating library with an active license.
              Codes provide access without validating a library card.
            </p>
            <Link href="/account" className="btn secondary">
              Redeem a code
            </Link>
          </div>
        </div>
      </div>
    );
  else if (path === "/institutions")
    content = <Inquiry act={act} busy={busy} />;
  else if (path.startsWith("/legal/"))
    content = (
      <div className="page narrow">
        <Eyebrow>Launch content required</Eyebrow>
        <h1>
          {path.endsWith("privacy")
            ? "Privacy"
            : path.endsWith("terms")
              ? "Terms"
              : "Disclaimer"}
        </h1>
        <div className="callout">
          Client-approved wording has not been supplied. This placeholder is for
          public demo and is not a published policy.
        </div>
        <p>
          Preparation progress is user-recorded and does not establish
          eligibility, official examination results, or apprenticeship
          acceptance. Applications take place through official union or provider
          processes.
        </p>
        <p>
          No student application-document uploads are offered. All data in the
          supplied demonstration accounts is synthetic. Final privacy, terms,
          refunds and retention policies require client review before launch.
        </p>
      </div>
    );
  else if (path === "/signin")
    content = (
      <Auth
        session={session}
        act={act}
        busy={busy}
        onSignedIn={(route = "/dashboard") => router.push(route)}
      />
    );
  else if (path === "/account")
    content = <Account session={session} act={act} busy={busy} />;
  else if (path === "/admin")
    content =
      user?.role === "admin" ? (
        <Admin />
      ) : (
        <Gate label="Administrator access required" />
      );
  else if (path === "/counselor")
    content =
      user?.role === "counselor" ? (
        <Counselor trades={catalog.trades} />
      ) : (
        <Gate label="Approved school staff access required" />
      );
  else if (path === "/trades" && !session.access)
    content = <Directory catalog={catalog} dash={dash} act={act} />;
  else if (!session.access)
    content = (
      <Gate
        label={
          user
            ? "Your pathway is waiting for active access"
            : "Sign in to start your pathway"
        }
      />
    );
  else if (path === "/dashboard")
    content = (
      <div className="page">
        <div className="row between">
          <div>
            <Eyebrow>Your next chapter</Eyebrow>
            <h1>Let’s build your future, {greeting}.</h1>
            <p className="lead">
              Small steps today. A clearer pathway tomorrow.
            </p>
          </div>
          <span className="pill positive">
            <span className="dot" /> Active access
          </span>
        </div>
        <div className="dashboard-grid">
          <div>
            <div className="feature-panel">
              <div>
                <span className="eyebrow">Start with what interests you</span>
                <h2>Find work that feels like you.</h2>
                <p>
                  Explore your interests and discover up to three trade matches.
                </p>
                <Link href="/assessment" className="btn lime">
                  {dash?.assessment
                    ? "Update my interests"
                    : "Find my trade match"}{" "}
                  <Icon name="arrow" />
                </Link>
              </div>
              <div className="abstract-compass">
                <Icon name="compass" size={115} />
              </div>
            </div>
            <div className="section-title">
              <h2>Your saved trades</h2>
              <Link href="/trades">
                Explore all <span aria-hidden="true">↗</span>
              </Link>
            </div>
            {!dash?.saved?.length ? (
              <div className="empty card">
                <Icon name="bookmark" size={30} />
                <h3>Make room for possibility.</h3>
                <p>
                  Save a trade that catches your eye. Your progress stays with
                  each program.
                </p>
                <Link href="/trades" className="textlink">
                  Discover the ten trades →
                </Link>
              </div>
            ) : (
              <div className="cards two">
                {catalog.trades
                  .filter((t) => dash.saved.includes(t.id))
                  .map((t) => (
                    <TradeCard
                      key={t.id}
                      trade={t}
                      saved
                      onSave={() =>
                        act("save", { tradeId: t.id, saved: false })
                      }
                    />
                  ))}
              </div>
            )}
            {dash?.assessment && (
              <>
                <div className="section-title">
                  <h2>Your interest matches</h2>
                  <span className="pill">Demo rules v1</span>
                </div>
                <Matches
                  matches={dash.assessment.matches}
                  trades={catalog.trades}
                />
              </>
            )}
          </div>
          <aside>
            <div className="card pathway-card">
              <Eyebrow>Focus for today</Eyebrow>
              <h2>Your preparation</h2>
              {dash?.selection ? (
                (() => {
                  const p = catalog.programs.find(
                    (p) => p.id === dash.selection,
                  );
                  const progress = dash.progress.find(
                    (r: any) => r.programId === p?.id,
                  );
                  return (
                    <>
                      <p>{p?.name}</p>
                      <Progress value={progress?.percent || 0} />
                      <p>
                        {progress?.done} of {progress?.required} required steps
                      </p>
                      <Link
                        className="btn secondary"
                        href={"/trades/" + p?.tradeId}
                      >
                        Continue preparation <Icon name="arrow" />
                      </Link>
                    </>
                  );
                })()
              ) : (
                <>
                  <p>
                    Choose a program to turn your interests into a preparation
                    plan.
                  </p>
                  <div className="step-list">
                    <span>
                      01 <b>Discover a trade</b>
                    </span>
                    <span>
                      02 <b>Select a local program</b>
                    </span>
                    <span>
                      03 <b>Track your next steps</b>
                    </span>
                  </div>
                  <Link className="btn secondary" href="/trades">
                    Choose a pathway <Icon name="arrow" />
                  </Link>
                </>
              )}
            </div>
            <div className="small-note">
              <Icon name="book" />
              <p>
                Your progress records preparation. Official providers determine
                eligibility and acceptance.
              </p>
            </div>
            {user?.audience === "adult" && (
              <div className="card">
                <Eyebrow>Another way to begin</Eyebrow>
                <h3>Pre-apprenticeship resources</h3>
                <p>
                  Explore the HIRE360 and Chicago Women in Trades content areas.
                </p>
                <Link href="/resources" className="textlink">
                  See resources →
                </Link>
              </div>
            )}
          </aside>
        </div>
      </div>
    );
  else if (path === "/assessment")
    content = (
      <Assessment catalog={catalog} dash={dash} act={act} busy={busy} />
    );
  else if (path === "/trades")
    content = <Directory catalog={catalog} dash={dash} act={act} />;
  else if (path.startsWith("/trades/"))
    content = (
      <TradeDetail
        key={path}
        trade={catalog.trades.find((t) => t.id === path.split("/")[2])}
        catalog={catalog}
        dash={dash}
        act={act}
      />
    );
  else if (path === "/resources")
    content = (
      <div className="page">
        <Eyebrow>Learn the landscape</Eyebrow>
        <h1>A little guidance goes a long way.</h1>
        <p className="lead">
          Understand apprenticeships, unions, and ways to prepare.
        </p>
        <div className="cards three">
          {dash?.resources?.map((r: any) => (
            <div className="card" key={r.id}>
              <span className="pill">{r.category}</span>
              <h2>{r.title}</h2>
              <p>{r.body}</p>
              {r.url ? (
                <a
                  href={r.url}
                  target="_blank"
                  rel="noreferrer"
                  className="textlink"
                >
                  Visit source ↗
                </a>
              ) : (
                <span className="muted">Approved source link pending</span>
              )}
            </div>
          ))}
        </div>
        <div className="callout">
          These are sample resource areas for the product preview. Their
          eligibility and application guidance have not been supplied or
          verified.
        </div>
      </div>
    );
  else
    content = (
      <div className="empty">
        <h1>Page not found</h1>
        <Link href="/">Return home</Link>
      </div>
    );
  return (
    <>
      <a
        className="skip"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
          document.getElementById("main")?.scrollIntoView();
        }}
      >
        Skip to content
      </a>
      <div className="review-banner">
        PUBLIC DEMO <span>• Sample data • Progress stays in your browser</span>
        <Link href="/signin">Try a demo account →</Link>
        <button
          className="demo-reset"
          onClick={() => {
            resetDemo();
            router.push("/");
            window.location.reload();
          }}
        >
          Reset demo
        </button>
        {storageNotice() && <span role="status">{storageNotice()}</span>}
      </div>
      {publicPage ? (
        <>
          <header className="public-header">
            <Link href="/" className="brand">
              <span className="brand-mark">
                <Icon name="compass" />
              </span>
              MyTradePathway<span className="brand-dot">.</span>
            </Link>
            <nav aria-label="Public navigation">
              <Link href="/trades">Explore trades</Link>
              <Link href="/institutions">For institutions</Link>
              <Link href="/pricing">Access & pricing</Link>
              <Link
                className="btn small"
                href={user ? "/dashboard" : "/signin"}
              >
                {user ? "My pathway" : "Get started"}{" "}
                <Icon name="arrow" size={16} />
              </Link>
            </nav>
          </header>
          <main id="main" tabIndex={-1}>
            {error && <Message error={error} />} {content}
          </main>
          <footer>
            <Link href="/" className="brand">
              MyTradePathway.
            </Link>
            <p>Explore your options. Build your next chapter.</p>
            <div>
              <Link href="/legal/privacy">Privacy</Link>
              <Link href="/legal/terms">Terms</Link>
              <Link href="/legal/disclaimer">Disclaimer</Link>
            </div>
            <small>
              Public synthetic demo · Client-approved content required before
              launch.
            </small>
          </footer>
        </>
      ) : (
        <div className="app-shell">
          <button
            className="mobile-menu"
            aria-expanded={menu}
            onClick={() => setMenu(!menu)}
          >
            {menu ? "Close navigation" : "☰ Navigation"}
          </button>
          <aside className={"sidebar " + (menu ? "open" : "")}>
            <Link href="/" className="brand">
              <span className="brand-mark">
                <Icon name="compass" />
              </span>
              <span>
                MyTrade
                <br />
                Pathway<span className="brand-dot">.</span>
              </span>
            </Link>
            <div className="sidebar-label">YOUR JOURNEY</div>
            <nav aria-label="Application navigation">
              {nav.map(([href, icon, label]) => (
                <Link
                  key={href}
                  href={href}
                  className={
                    path === href ||
                    (href === "/trades" && path.startsWith("/trades/"))
                      ? "selected"
                      : ""
                  }
                >
                  <Icon name={icon} />
                  {label}
                  {path === href && <span className="nav-dot" />}
                </Link>
              ))}
            </nav>
            <div className="sidebar-bottom">
              <div className="sidebar-tip">
                <Icon name="bolt" />
                <b>You don’t need every answer.</b>
                <p>Just take the next step.</p>
              </div>
              {user ? (
                <>
                  <div className="profile-chip">
                    <span className="avatar">{user.name.slice(0, 1)}</span>
                    <div>
                      <b>{user.name}</b>
                      <small>
                        {user.role === "member" ? user.audience : user.role} ·
                        browser demo
                      </small>
                    </div>
                  </div>
                  <button
                    className="logout"
                    onClick={() => {
                      void act("logout", {}).catch(() => {});
                    }}
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link href="/signin" className="btn lime">
                  Sign in <Icon name="arrow" />
                </Link>
              )}
            </div>
          </aside>
          <div className="workspace">
            <header className="workspace-header">
              <span>YOUR PATH STARTS HERE</span>
              <Link href="/signin" className="demo-switch">
                Switch demo account <Icon name="user" size={16} />
              </Link>
            </header>
            <main id="main" tabIndex={-1}>
              {error && <Message error={error} />}{" "}
              {notice && (
                <div className="notice" role="status">
                  {notice}
                </div>
              )}
              {content}
            </main>
          </div>
        </div>
      )}
    </>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return <div className="eyebrow">{children}</div>;
}
export function Message({ error }: { error: string }) {
  return (
    <div className="error" role="alert">
      {error}
    </div>
  );
}
export function Gate({ label }: { label: string }) {
  return (
    <div className="page narrow">
      <span className="big-icon">
        <Icon name="compass" size={44} />
      </span>
      <h1>{label}</h1>
      <p className="lead">
        Sign in, verify your email, and connect an active school, library or
        individual access grant. Existing progress is retained when access ends.
      </p>
      <div className="row">
        <Link className="btn" href="/signin">
          Sign in or try the demo <Icon name="arrow" />
        </Link>
        <Link href="/account" className="btn secondary">
          Manage access
        </Link>
      </div>
    </div>
  );
}
function Landing({ trades }: { trades: Trade[] }) {
  return (
    <>
      <section className="hero">
        <div>
          <div className="hero-kicker">
            <span className="dot" /> Skilled trades. Real possibilities.
          </div>
          <h1>
            Your future
            <br />
            is <em>hands-on.</em>
          </h1>
          <p>
            Find a skilled trade that fits your interests.
            <br />
            Understand the path. Prepare for your next step.
          </p>
          <div className="row">
            <Link href="/signin" className="btn">
              Find my pathway <Icon name="arrow" />
            </Link>
            <Link href="/trades" className="btn secondary">
              Explore the trades
            </Link>
          </div>
          <div className="hero-proof">
            <span>10 trade pathways</span>
            <span>School & library access</span>
            <span>At your own pace</span>
          </div>
        </div>
        <div className="hero-visual">
          <div className="blueprint-grid" />
          <span className="visual-label">A FUTURE YOU CAN BUILD</span>
          <div className="pathway-art">
            <div className="art-circle">
              <Icon name="compass" size={130} />
            </div>
            <div className="art-route">
              <div>
                <span>01</span>
                <b>Discover your strengths</b>
                <Icon name="check" />
              </div>
              <div>
                <span>02</span>
                <b>Explore the possibilities</b>
                <Icon name="check" />
              </div>
              <div>
                <span>03</span>
                <b>Build your pathway</b>
                <Icon name="arrow" />
              </div>
            </div>
          </div>
          <div className="visual-bottom">
            Your next chapter starts with one step. <span>↗</span>
          </div>
        </div>
      </section>
      <section className="home-section">
        <div className="section-title">
          <div>
            <Eyebrow>There’s more than one way forward</Eyebrow>
            <h2>Find your kind of work.</h2>
          </div>
          <Link href="/trades" className="textlink">
            Explore all trades →
          </Link>
        </div>
        <div className="cards three">
          {trades.slice(0, 3).map((t) => (
            <TradeCard key={t.id} trade={t} />
          ))}
        </div>
        <div className="home-note">
          Ten illustrative trade pathways. Descriptions and program details in
          this edition are synthetic examples.
        </div>
      </section>
      <section className="home-section how">
        <Eyebrow>A clearer path, one step at a time</Eyebrow>
        <h2>From “what if?” to “what’s next.”</h2>
        <div className="cards three">
          {[
            [
              "01",
              "Start with your interests",
              "A short interest assessment helps you explore trade matches.",
            ],
            [
              "02",
              "See the pathway",
              "Compare local programs and understand the preparation steps.",
            ],
            [
              "03",
              "Keep moving forward",
              "Save your trades and track a checklist for each program.",
            ],
          ].map(([n, title, text]) => (
            <div key={n}>
              <span className="number">{n}</span>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="institution-strip">
        <div>
          <Eyebrow>For schools & libraries</Eyebrow>
          <h2>Help your community see what’s possible.</h2>
          <p>
            Institutional access and school engagement tools support the next
            generation of skilled trades.
          </p>
        </div>
        <Link href="/institutions" className="btn lime">
          Connect with us <Icon name="arrow" />
        </Link>
      </section>
    </>
  );
}
function TradeCard({
  trade,
  saved,
  onSave,
}: {
  trade: Trade;
  saved?: boolean;
  onSave?: () => Promise<any>;
}) {
  return (
    <article className="card trade-card">
      <div className="row between">
        <span className={"trade-icon icon-" + trade.id}>
          <Icon
            name={trade.id === "electrician" ? "bolt" : "compass"}
            size={27}
          />
        </span>
        {onSave && (
          <button
            aria-label={(saved ? "Unsave " : "Save ") + trade.name}
            className={"save-button " + (saved ? "is-saved" : "")}
            onClick={() => void onSave().catch(() => {})}
          >
            <Icon name="bookmark" />
          </button>
        )}
      </div>
      <span className="tiny-label">SKILLED TRADE</span>
      <h3>
        <Link href={"/trades/" + trade.id}>{trade.name}</Link>
      </h3>
      <p>{trade.preview}</p>
      <Link href={"/trades/" + trade.id} className="card-bottom">
        Explore pathway <Icon name="arrow" size={18} />
      </Link>
    </article>
  );
}
function Directory({
  catalog,
  dash,
  act,
}: {
  catalog: Catalog;
  dash: any;
  act: Act;
}) {
  const [search, setSearch] = useState(""),
    [tag, setTag] = useState("");
  const trades = catalog.trades.filter(
    (t) =>
      (t.name + " " + t.preview).toLowerCase().includes(search.toLowerCase()) &&
      (!tag || t.tags.includes(tag)),
  );
  return (
    <div className="page">
      <Eyebrow>Discover your possibilities</Eyebrow>
      <h1>Good work comes in many forms.</h1>
      <p className="lead">
        Explore ten skilled trades. Save the ones that spark your curiosity.
      </p>
      <div className="directory-toolbar">
        <label className="searchbox">
          <Icon name="search" />
          <input
            aria-label="Search trades"
            placeholder="Search a trade…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          aria-label="Filter trades by interest"
          value={tag}
          onChange={(e) => setTag(e.target.value)}
        >
          <option value="">All interests</option>
          {catalog.interests.map((i) => (
            <option value={i.id} key={i.id}>
              {i.name}
            </option>
          ))}
        </select>
        <span>{trades.length} trades</span>
      </div>
      <div className="cards three">
        {trades.map((t) => (
          <TradeCard
            key={t.id}
            trade={t}
            saved={dash?.saved?.includes(t.id)}
            onSave={() =>
              act("save", {
                tradeId: t.id,
                saved: !dash?.saved?.includes(t.id),
              })
            }
          />
        ))}
      </div>
      {!trades.length && (
        <div className="empty">
          No trades match. Try another search or interest.
        </div>
      )}
      <div className="callout">
        Demo content is for exploring the application workflow. Actual program
        requirements and wage data need client-supplied, verified sources.
      </div>
    </div>
  );
}
type Act = (route: string, body: unknown) => Promise<any>;
function Matches({ matches, trades }: { matches: Match[]; trades: Trade[] }) {
  return (
    <div className="match-list">
      {matches.length ? (
        matches.map((m, i) => (
          <Link href={"/trades/" + m.tradeId} key={m.tradeId} className="match">
            <span className="match-rank">0{i + 1}</span>
            <div>
              <b>{trades.find((t) => t.id === m.tradeId)?.name}</b>
              <small>
                Demo interest affinity · not an admission prediction
              </small>
            </div>
            <strong>{m.score}%</strong>
            <Icon name="arrow" />
          </Link>
        ))
      ) : (
        <div className="empty">
          No overlap found. Update your interests to explore other matches.
        </div>
      )}
    </div>
  );
}
function Assessment({
  catalog,
  dash,
  act,
  busy,
}: {
  catalog: Catalog;
  dash: any;
  act: Act;
  busy: boolean;
}) {
  const [answers, setAnswers] = useState<string[]>(
      dash?.assessment?.answers || [],
    ),
    [submitted, setSubmitted] = useState(!!dash?.assessment);
  return (
    <div className="page narrow">
      <Eyebrow>Find your trade match</Eyebrow>
      <h1>What brings out your best?</h1>
      <p className="lead">
        Choose the interests that feel like you. There’s room to change your
        mind.
      </p>
      <div className="callout">
        The supplied assessment has not been provided. This is a synthetic
        six-interest demonstration using versioned tag matching.
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void act("assessment", { answers })
            .then(() => setSubmitted(true))
            .catch(() => {});
        }}
      >
        <div className="interest-grid">
          {catalog.interests.map((i) => (
            <label
              key={i.id}
              className={
                "interest " + (answers.includes(i.id) ? "checked" : "")
              }
            >
              <input
                type="checkbox"
                checked={answers.includes(i.id)}
                onChange={(e) => {
                  setAnswers(
                    e.target.checked
                      ? [...answers, i.id]
                      : answers.filter((x) => x !== i.id),
                  );
                  setSubmitted(false);
                }}
              />
              <span>
                <b>{i.name}</b>
                <small>{i.description}</small>
              </span>
            </label>
          ))}
        </div>
        <button className="btn" disabled={!answers.length || busy}>
          Show my matches <Icon name="arrow" />
        </button>
      </form>
      {submitted && dash?.assessment && (
        <section className="results" aria-live="polite">
          <div className="section-title">
            <h2>Your top matches</h2>
            <span className="pill">Up to 3 pathways</span>
          </div>
          <Matches matches={dash.assessment.matches} trades={catalog.trades} />
          <p className="muted">
            Scores reflect demo tag overlap. Your preferences and official
            program requirements matter more than a score.
          </p>
        </section>
      )}
    </div>
  );
}
export function Progress({ value }: { value: number }) {
  return (
    <div className="progress-block">
      <div className="row between">
        <b>Required preparation</b>
        <strong>{value}%</strong>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label="Required checklist progress"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span style={{ width: value + "%" }} />
      </div>
    </div>
  );
}
function TradeDetail({
  trade,
  catalog,
  dash,
  act,
}: {
  trade: Trade | undefined;
  catalog: Catalog;
  dash: any;
  act: Act;
}) {
  const programs = catalog.programs.filter((p) => p.tradeId === trade?.id);
  const [selected, setSelected] = useState(
      dash?.selection && programs.some((p) => p.id === dash.selection)
        ? dash.selection
        : programs[0]?.id,
    ),
    [tab, setTab] = useState("pathway"),
    [correction, setCorrection] = useState("");
  if (!trade) return <Gate label="Trade not found" />;
  const p = programs.find((p) => p.id === selected);
  const progress = dash?.progress?.find((x: any) => x.programId === p?.id);
  return (
    <div className="page">
      <Link className="breadcrumb" href="/trades">
        ← All trades
      </Link>
      <div className="row between">
        <div>
          <Eyebrow>Explore a skilled trade</Eyebrow>
          <h1>{trade.name}</h1>
          <p className="lead">{trade.preview}</p>
        </div>
        <button
          className="btn secondary"
          onClick={() =>
            void act("save", {
              tradeId: trade.id,
              saved: !dash?.saved?.includes(trade.id),
            }).catch(() => {})
          }
        >
          <Icon name="bookmark" />{" "}
          {dash?.saved?.includes(trade.id) ? "Saved trade" : "Save trade"}
        </button>
      </div>
      {!p ? (
        <div className="empty card">
          No published programs are available for this trade yet.
        </div>
      ) : (
        <>
          <div className="program-picker">
            <label>
              Select a local program
              <select
                value={selected}
                onChange={(e) => setSelected(e.target.value)}
              >
                {programs.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} · {p.location}
                  </option>
                ))}
              </select>
            </label>
            <button
              className="btn"
              onClick={() =>
                void act("select", { programId: p.id }).catch(() => {})
              }
            >
              {dash.selection === p.id
                ? "Current pathway"
                : "Work toward this program"}{" "}
              <Icon name="arrow" />
            </button>
          </div>
          <div className="callout">
            {p.synthetic
              ? "Synthetic program — not a real union or training-provider listing. No verified wage or eligibility claims are made."
              : "Verify all requirements with the official provider before applying."}
          </div>
          <div className="tabs" role="tablist" aria-label="Program sections">
            {[
              ["pathway", "My preparation"],
              ["details", "Program details"],
              ["practice", "Practice questions"],
            ].map(([key, label]) => (
              <button
                role="tab"
                aria-selected={tab === key}
                key={key}
                onClick={() => setTab(key)}
              >
                {label}
              </button>
            ))}
          </div>
          {tab === "pathway" ? (
            <div className="dashboard-grid">
              <section className="card">
                <h2>Your next steps</h2>
                <p>Track preparation for this program and location.</p>
                {p.steps.length ? (
                  p.steps.map((step: Step, i: number) => (
                    <div className="checklist-item" key={step.id}>
                      <span className="step-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        {step.checklist ? (
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
                        ) : (
                          <b>{step.title}</b>
                        )}
                        <p>{step.explanation}</p>
                        <span
                          className={
                            "pill " + (step.required ? "required" : "")
                          }
                        >
                          {step.required ? "Required" : "Recommended"}
                          {!step.checklist ? " · information only" : ""}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty">
                    Preparation steps have not been supplied.
                  </div>
                )}
              </section>
              <aside className="card">
                <Eyebrow>Your preparation plan</Eyebrow>
                <h2>One step closer.</h2>
                <Progress value={progress?.percent || 0} />
                <p>
                  {progress?.done || 0} of {progress?.required || 0} required
                  items completed.
                </p>
                {!progress?.required && (
                  <p>
                    No required checklist items configured; displayed progress
                    is 0%.
                  </p>
                )}
                <p className="muted">
                  Recommended items do not change the percentage. Progress is
                  recorded separately for every program, and persists when you
                  switch.
                </p>
                {p.officialUrl ? (
                  <a
                    className="btn secondary"
                    href={p.officialUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Official application ↗
                  </a>
                ) : (
                  <div className="small-note">
                    Official application link awaiting verified content.
                  </div>
                )}
              </aside>
            </div>
          ) : tab === "practice" ? (
            <Practice key={p.id} program={p} dash={dash} act={act} />
          ) : (
            <div className="cards two">
              {[
                ["Provider & contact", p.provider + "\n" + p.contact],
                ["Location & program length", p.location + "\n" + p.length],
                ["Tracks", p.tracks.join(", ") || "Awaiting content"],
                [
                  "Wage progression",
                  p.wages || "No verified wage data supplied",
                ],
                [
                  "Eligibility & required documents",
                  p.eligibility + "\n" + p.documents,
                ],
                [
                  "Applications & entrance exams",
                  p.applicationDates + "\n" + p.exam,
                ],
                ["Preparation guidance", p.preparation],
                [
                  "Sources & verification",
                  p.sourceUrl || "No verified source supplied",
                ],
              ].map(([title, text]) => (
                <div className="card detail-card" key={title}>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  {title === "Sources & verification" && p.sourceUrl && (
                    <>
                      <a href={p.sourceUrl} target="_blank" rel="noreferrer">
                        View source ↗
                      </a>
                      <p>Last verified: {p.verifiedAt || "Not recorded"}</p>
                    </>
                  )}
                </div>
              ))}
              {p.videos.map((v) => (
                <a
                  className="card"
                  href={v}
                  target="_blank"
                  rel="noreferrer"
                  key={v}
                >
                  Supplied video ↗
                </a>
              ))}
            </div>
          )}
          <details className="correction">
            <summary>Spot something to correct?</summary>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void act("correction", { programId: p.id, message: correction })
                  .then(() => setCorrection(""))
                  .catch(() => {});
              }}
            >
              <label>
                Describe the correction
                <textarea
                  required
                  minLength={10}
                  value={correction}
                  onChange={(e) => setCorrection(e.target.value)}
                />
              </label>
              <button className="btn secondary">Save sample correction</button>
            </form>
          </details>
        </>
      )}
    </div>
  );
}
function Practice({
  program,
  dash,
  act,
}: {
  program: Program;
  dash: any;
  act: Act;
}) {
  const [index, setIndex] = useState(0),
    [answer, setAnswer] = useState<number | null>(null),
    [feedback, setFeedback] = useState<any>(null),
    [complete, setComplete] = useState(false);
  const q = program.questions[index];
  const attempts = dash.practice?.[program.id] || {};
  const answered = Object.keys(attempts).length;
  async function submit(value: number | null) {
    try {
      const result = await act("practice", {
        programId: program.id,
        questionId: q.id,
        answer: value,
      });
      setFeedback(result);
    } catch {}
  }
  if (!q)
    return (
      <div className="card empty">
        Practice questions have not been supplied.
      </div>
    );
  return (
    <div className="card practice-panel">
      <span className="pill">
        Original synthetic practice · not an official examination
      </span>
      <h2>
        {complete
          ? "Practice summary"
          : `Question ${index + 1} of ${program.questions.length}`}
      </h2>
      {complete ? (
        <>
          <p>
            {answered} of {program.questions.length} questions have an answer or
            a recorded skip.{" "}
            {Object.values(attempts).filter((v) => v === null).length} skipped.
          </p>
          <p>
            Preparation is a learning activity, not a certification or
            admissions score.
          </p>
          <button
            className="btn secondary"
            onClick={() => {
              setComplete(false);
              setIndex(0);
              setAnswer(null);
              setFeedback(null);
            }}
          >
            Review questions
          </button>
        </>
      ) : (
        <>
          <h3>{q.prompt}</h3>
          <div className="question-options">
            {q.options.map((o, i) => (
              <label
                key={i}
                className={"interest " + (answer === i ? "checked" : "")}
              >
                <input
                  type="radio"
                  name="practice-answer"
                  value={i}
                  checked={answer === i}
                  onChange={() => {
                    setAnswer(i);
                    setFeedback(null);
                  }}
                />
                <span>{o}</span>
              </label>
            ))}
          </div>
          <div className="row">
            <button
              className="btn"
              disabled={answer === null}
              onClick={() => void submit(answer)}
            >
              Check answer
            </button>
            <button className="btn secondary" onClick={() => void submit(null)}>
              Skip question
            </button>
          </div>
          {feedback && (
            <div
              role="status"
              className={"feedback " + (feedback.correct ? "correct" : "")}
            >
              <b>
                {feedback.skipped
                  ? "Skipped"
                  : feedback.correct
                    ? "That’s right."
                    : "Keep learning."}
              </b>
              <p>{feedback.explanation}</p>
            </div>
          )}
          <div className="row between question-nav">
            <button
              className="btn secondary"
              disabled={index === 0}
              onClick={() => {
                setIndex(index - 1);
                setAnswer(null);
                setFeedback(null);
              }}
            >
              ← Back
            </button>
            <span>{answered} recorded</span>
            <button
              className="btn secondary"
              onClick={() => {
                if (index === program.questions.length - 1) setComplete(true);
                else setIndex(index + 1);
                setAnswer(null);
                setFeedback(null);
              }}
            >
              {index === program.questions.length - 1
                ? "See summary"
                : "Next →"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
function Auth({
  session,
  act,
  busy,
  onSignedIn,
}: {
  session: Session;
  act: Act;
  busy: boolean;
  onSignedIn: (route?: string) => void;
}) {
  const [fixture, setFixture] = useState("demo-student"),
    [age, setAge] = useState(false);
  return (
    <div className="page auth-page">
      <div>
        <Eyebrow>A fresh start</Eyebrow>
        <h1>
          Your pathway
          <br />
          starts here.
        </h1>
        <p className="lead">
          Explore the product with sample people, schools and programs.
        </p>
        <div className="card demo-panel">
          <h3>Choose a demo role</h3>
          <p>
            No account, email or password is needed. All changes stay in this
            browser. These role switches simulate product journeys; they do not
            authenticate anyone.
          </p>
          <label>
            Demo account
            <select
              value={fixture}
              onChange={(e) => setFixture(e.target.value)}
            >
              {session.fixtures.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.label}
                </option>
              ))}
            </select>
          </label>
          <label className="inline-check">
            <input
              type="checkbox"
              checked={age}
              onChange={(e) => setAge(e.target.checked)}
            />
            I affirm that I am at least 13 years old.
          </label>
          <button
            className="btn"
            disabled={busy || !age}
            onClick={() =>
              void act("fixture-session", {
                fixtureId: fixture,
                ageAffirmed: age,
              })
                .then(() =>
                  onSignedIn(
                    fixture === "demo-admin"
                      ? "/admin"
                      : fixture === "demo-counselor"
                        ? "/counselor"
                        : "/dashboard",
                  ),
                )
                .catch(() => {})
            }
          >
            Enter demo <Icon name="arrow" />
          </button>
        </div>
      </div>
      <div className="card">
        <h2>A working product preview</h2>
        <p>
          As a student, find trade matches, choose a program, save your pathway,
          track steps and try practice questions.
        </p>
        <p>
          Switch to Counselor to see sample school reporting, or Administrator
          to try browser-only content editing and a built-in sample document
          review.
        </p>
        <div className="callout">
          Real account creation, Google/Microsoft sign-in, payments, email and
          AI extraction are not connected. Do not enter personal information.
        </div>
        <Link className="textlink" href="/trades">
          Browse the ten trades <Icon name="arrow" />
        </Link>
      </div>
    </div>
  );
}
function Account({
  session,
  act,
  busy,
}: {
  session: Session;
  act: Act;
  busy: boolean;
}) {
  const [code, setCode] = useState("LIBRARY-DEMO");
  return (
    <div className="page">
      <Eyebrow>Sample identity & access</Eyebrow>
      <h1>Your account & access.</h1>
      <p className="lead">
        A simulated role, with progress kept only in your browser.
      </p>
      {session.user ? (
        <div className="cards two">
          <div className="card">
            <h2>Demo profile</h2>
            <p>
              <b>{session.user.name}</b>
            </p>
            <p>{session.user.email}</p>
            <span className="pill">Synthetic identity</span>
            <p>Role: {session.user.role}</p>
            <Link className="btn secondary" href="/signin">
              Switch demo account
            </Link>
          </div>
          <div className="card">
            <h2>Access status</h2>
            <span className="pill">
              {session.access ? "Active access" : "Access required or expired"}
            </span>
            <p>
              License/grant behavior is simulated. Expired access retains saved
              progress.
            </p>
            <label>
              Sample library code
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={40}
              />
            </label>
            <button
              className="btn secondary"
              disabled={busy}
              onClick={() => void act("redeem", { code }).catch(() => {})}
            >
              Redeem sample code
            </button>
            <p className="muted">
              Use LIBRARY-DEMO to restore access for the expired sample role. No
              real library-card validation or billing occurs.
            </p>
          </div>
        </div>
      ) : (
        <Gate label="Choose a demo role to continue" />
      )}
      <div className="callout">
        No real authentication, password recovery, email delivery or checkout is
        available in this public preview.
      </div>
    </div>
  );
}
function Inquiry({ act, busy }: { act: Act; busy: boolean }) {
  return (
    <div className="page narrow">
      <Eyebrow>For schools & libraries</Eyebrow>
      <h1>Open a pathway for your community.</h1>
      <p className="lead">
        This screen represents the school and library inquiry journey.
      </p>
      <div className="card">
        <h2>Sample institutional inquiry</h2>
        <p>Prairie School - synthetic organization</p>
        <p>
          See how an inquiry appears in the administrator's sample notification
          queue. No message is sent and no contact details are collected.
        </p>
        <button
          className="btn"
          disabled={busy}
          onClick={() => void act("inquiry", {}).catch(() => {})}
        >
          Simulate sample inquiry <Icon name="arrow" />
        </button>
      </div>
    </div>
  );
}
