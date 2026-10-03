# MyTradePathway interactive demo

Public, browser-only product preview: **https://nilkamal11.github.io/mytradepathway-demo/**

This separate repository deliberately contains only public demo source, original synthetic fixtures and static build/test configuration. It does not contain the private application's server routes, database migrations, proposal, handover documents, credentials, uploads, runtime databases or Git history. The main application repository remains private.

## Try it

1. Select **Try a demo account**, choose **Student**, affirm 13+ and click **Enter demo**.
2. Use **Find my match** to select interests and see up to three sample trade matches.
3. Explore ten trades, select a sample program, save a pathway and mark preparation steps. Switch Electrician locations to see independent progress.
4. Try practice questions, feedback, next/back, skip and summary.
5. Switch to **Counselor** for synthetic Prairie School roster, student detail, reports and CSV export.
6. Switch to **Administrator** for sample content edits, licenses/codes, reports, corrections, notifications and a built-in manual draft review. Applying a draft requires explicit approval and changes this browser only.
7. **Reset demo** restores sample data, clears this demo's storage key and signs out. It leaves unrelated browser storage untouched.

## Demo boundaries

- Original UI components and styles are reused with hash-based static navigation, including desktop and mobile layouts.
- State is stored in this browser's `localStorage`; it survives refreshes on the same origin/browser. Different visitors do not share state. If storage is blocked/full, the demo continues in memory with a notice. Resetting/clearing site data removes progress.
- All people, emails, schools, activity, programs and practice content are synthetic. Sample program details are not verified eligibility, wage, examination or admissions guidance.
- Selecting a role is a simulation, not authentication or authorization. The complete sample data is public. No real registration, password, Google/Microsoft sign-in, email, payment, license purchase, AI extraction, file upload or server mutation is available.
- Reports/CSV are generated locally from synthetic state. Corrections and sample inquiries are not sent anywhere.
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

The automated suites cover 13 state tests and five browser journeys: public/mobile browsing and age affirmation; assessment/save/checklist persistence/practice; counselor detail/report/CSV; admin editing and explicit manual review; expired access and reset. Browser suites assert no `/api/` requests and responsive page widths. Generated screenshots/logs stay ignored and are not published.

## Deployment

`.github/workflows/pages.yml` validates the exact pushed commit, builds Vite static assets, runs Chromium browser journeys, and deploys only `dist` through GitHub Pages. No custom domain or paid upgrade is needed for this public repository. GitHub's workflow token is supplied by Actions; no persistent credential is stored in source.

Paths use `/mytradepathway-demo/` as the build base and `#/...` for navigation, so shared program links and refreshes work without a server rewrite. Updating `main` publishes only after validation passes.
