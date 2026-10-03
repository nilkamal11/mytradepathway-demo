# MyTradePathway interactive demo

Public, browser-only product preview: **https://nilkamal11.github.io/mytradepathway-demo/**

This separate repository contains public demo source, synthetic account/activity fixtures, an approved trade-reference snapshot and static build/test configuration. It excludes private application routes, migrations, credentials, runtime databases, email correspondence, original attachments and private Git history. The main application repository remains private.

The attachment update keeps the existing design and excludes the sender's HTML. It adds ten trades' supplied content, twelve local programs, 135 original practice questions, grouped assessment, active-goal preparation, contact/source directories, expanded content editing and an offline public demo shell. See [requirements and assumptions](docs/ATTACHMENT_UPDATE.md).

## Try it

1. Select **Try a demo account**, choose **Student**, affirm 13+ and click **Enter demo**.
2. Use **Find my match** to select interests, priorities and comfort level, submit and see up to three preference matches. Edit answers or choose a local program from a match card.
3. Explore ten trades, select a local program, review the unverified supplied details and mark preparation steps. Electrician and Sheet Metal have separate Cook/DuPage roadmaps and progress. The dashboard's required/recommended checklist supports clearing the active goal while retaining saved trades and progress.
4. Try practice questions, feedback, next/back, skip and summary.
5. Explore **Unions & apprenticeships**, **Pre-apprenticeships**, school contacts and trade-grouped sources. HIRE360 and CWIT links lead to their providers' own action pages.
6. Switch to **Counselor** for the six-student synthetic Prairie School roster, detail, reports and CSV export.
7. Switch to **Administrator** for sample content edits, licenses/codes, reports, corrections, notifications and a built-in manual draft review. Applying a draft requires explicit approval and changes this browser only.
8. **Reset demo** restores sample data, clears this demo's storage key and signs out. It leaves unrelated browser storage untouched.

## Demo boundaries

- Original UI components and styles are reused with hash-based static navigation, including desktop and mobile layouts.
- State is stored in this browser's `localStorage`; it survives refreshes on the same origin/browser. Different visitors do not share state. If storage is blocked/full, the demo continues in memory with a notice. Resetting/clearing site data removes progress.
- All people, emails, schools and activity are synthetic. Twelve program records and 135 original questions come from supplied reference content. Wages, fees, eligibility, selection and deadlines have **not been independently verified**. Receipt date is not a verification date. Some listed windows have closed; check the provider before planning or applying.
- Eleven earlier synthetic programs retain stable IDs and remain labelled demonstration pathways. Existing v1 browser journeys migrate to v2 while retaining saves, edits, grants and progress. New trade visits default to the supplied local program. DuPage question banks are absent rather than copied from Cook's different exam.
- Selecting a role is a simulation, not authentication or authorization. The complete sample data is public. No real registration, password, Google/Microsoft sign-in, email, payment, license purchase, AI extraction, file upload or server mutation is available.
- Reports/CSV are generated locally from synthetic state. Corrections and sample inquiries are not sent anywhere.
- A manifest and service worker cache this deliberately public demo shell and its static assets within `/mytradepathway-demo/`. External sites and personal data are not cached by the worker. Desktop offline reload is tested; physical iOS/Android installation is not yet tested. Production gated content requires separate caching rules.
- Do not enter personal information. This app has no analytics, external API calls or data submission. GitHub Pages still handles normal hosting requests/logs under its own policies.
- This is a functional demonstration of representative journeys, not the production application or a hosted SQLite service.

## Develop and validate

Node 24 and npm:

```sh
npm ci --ignore-scripts
npm test
npm run build
npm run preview
```

Open `http://127.0.0.1:3200/mytradepathway-demo/`. Development: `npm run dev`.

Browser validation uses an isolated browser, not the owner's browser/profile:

```sh
# Windows with installed Microsoft Edge
npm run test:e2e

# Linux CI
npx playwright install --with-deps chromium
CI=true npm run test:e2e

# Verify a live deployment (Windows PowerShell)
$env:LIVE_DEMO_URL='https://nilkamal11.github.io/mytradepathway-demo/'
npm run test:e2e
```

The automated suites cover 20 state tests and ten browser journeys, including earlier journeys, retained v1 state, grouped assessment editing, county roadmaps, practice review, expanded administration, contacts/sources and offline shell reload. Browser suites assert responsive page widths and no app `/api/` traffic. Generated screenshots/logs stay ignored and are not published.

## Deployment

`.github/workflows/pages.yml` validates the exact pushed commit, builds Vite static assets, runs Chromium browser journeys, and deploys only `dist` through GitHub Pages. No custom domain or paid upgrade is needed for this public repository. GitHub's workflow token is supplied by Actions; no persistent credential is stored in source.

Paths use `/mytradepathway-demo/` as the build base and `#/...` for navigation, so shared program links and refreshes work without a server rewrite. Updating `main` publishes only after validation passes.
