import { test, expect, type Page } from "@playwright/test";
async function go(page: Page, path = "/") {
  await page.goto("#" + path);
}
async function role(page: Page, value = "demo-student") {
  await go(page, "/signin");
  await page.getByLabel("Demo account").selectOption(value);
  await page.getByRole("checkbox", { name: /at least 13/ }).check();
  await page.getByRole("button", { name: "Enter demo", exact: true }).click();
}
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBeTruthy();
}
async function shot(page: Page, name: string) {
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "test-results/" + name + ".png",
    fullPage: true,
  });
}

test("public landing, ten-trade exploration, age affirmation and no personal credential form", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\//.test(r.url())) requests.push(r.url());
  });
  await go(page);
  await expect(
    page.getByRole("heading", { name: "Your future is hands-on." }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Reset demo" })).toBeVisible();
  await shot(page, "landing-desktop");
  await page
    .getByRole("link", { name: "Explore trades", exact: true })
    .first()
    .click();
  await expect(page.locator(".trade-card")).toHaveCount(10);
  await page.getByRole("textbox", { name: "Search trades" }).fill("Welder");
  await expect(page.locator(".trade-card")).toHaveCount(1);
  await go(page, "/signin");
  await expect(
    page.getByRole("button", { name: "Enter demo", exact: true }),
  ).toBeDisabled();
  await expect(
    page.locator(
      'input[type="email"],input[type="password"],input[type="file"]',
    ),
  ).toHaveCount(0);
  await page.setViewportSize({ width: 390, height: 844 });
  await go(page);
  await expect(
    page.getByRole("heading", { name: "Your future is hands-on." }),
  ).toBeVisible();
  await noOverflow(page);
  await shot(page, "landing-mobile");
  expect(requests).toEqual([]);
});

test("student matches, saves, independent checklist persistence and practice summary", async ({
  page,
}) => {
  const requests: string[] = [],
    errors: string[] = [];
  page.on("request", (r) => {
    if (/\/api\//.test(r.url())) requests.push(r.url());
  });
  page.on("pageerror", (e) => errors.push(e.message));
  await role(page);
  await expect(
    page.getByRole("heading", { name: /build your future/ }),
  ).toBeVisible();
  await go(page, "/assessment");
  await page.getByRole("checkbox", { name: /Precision & detail/ }).check();
  await page
    .getByRole("checkbox", { name: /Systems & troubleshooting/ })
    .check();
  await page.getByRole("button", { name: "Show my matches" }).click();
  await expect(
    page.getByRole("heading", { name: "Your top matches" }),
  ).toBeVisible();
  await expect(page.locator(".results")).toContainText("Electrician");
  await go(page, "/trades/electrician");
  await page
    .getByLabel("Select a local program")
    .selectOption("electrician-demo-chicago");
  await page.getByRole("button", { name: /Work toward this program/ }).click();
  await page.getByRole("checkbox").first().check();
  await page.reload();
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page
    .getByLabel("Select a local program")
    .selectOption("electrician-demo-north");
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
  await page
    .getByLabel("Select a local program")
    .selectOption("electrician-demo-chicago");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await page.getByRole("tab", { name: "Practice questions" }).click();
  await page.getByRole("radio", { name: "3 feet", exact: true }).check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByText(/That[’']s right\./)).toBeVisible();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Skip/ }).click();
  await expect(page.getByText("Skipped", { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "See summary" }).click();
  await expect(
    page.getByRole("heading", { name: "Practice summary" }),
  ).toBeVisible();
  await expect(page.locator(".practice-panel")).toContainText("2 of 2");
  await shot(page, "student-practice");
  await go(page, "/dashboard");
  await expect(page.locator(".trade-card")).toContainText("Electrician");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, "dashboard-mobile");
  await page.getByRole("button", { name: /Navigation/ }).click();
  await expect(
    page.getByRole("navigation", { name: "Application navigation" }),
  ).toBeVisible();
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});

test("counselor sample school roster, filters, student detail and browser-generated CSV", async ({
  page,
}) => {
  await role(page, "demo-counselor");
  await expect(
    page.getByRole("heading", { name: "A clearer view of their next steps." }),
  ).toBeVisible();
  await expect(page.getByText("Alex Rivera", { exact: true })).toBeVisible();
  await expect(page.getByText("Taylor Morgan", { exact: true })).toHaveCount(0);
  await page.getByRole("button", { name: "View student" }).first().click();
  await expect(
    page.getByRole("heading", { name: "Recent school activity" }),
  ).toBeVisible();
  const download = page.waitForEvent("download");
  await page.getByRole("link", { name: /Export CSV/ }).click();
  expect((await download).suggestedFilename()).toBe(
    "mytradepathway-synthetic-report.csv",
  );
  await shot(page, "counselor-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, "counselor-mobile");
});

test("admin sample edit and explicit draft review use no uploads, AI or server requests", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\//.test(r.url())) requests.push(r.url());
  });
  await role(page, "demo-admin");
  await expect(
    page.getByRole("heading", { name: "Keep every pathway clear." }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await page
    .getByLabel("Sample program name")
    .fill("Electrician - browser edited sample");
  await page.getByRole("button", { name: "Save sample program" }).click();
  await expect(page.getByRole("status")).toContainText("saved in this browser");
  await page.getByRole("button", { name: "Document drafts" }).click();
  await page
    .getByRole("button", { name: "Create sample review draft" })
    .click();
  await expect(
    page.getByRole("button", { name: "Apply reviewed sample" }),
  ).toBeDisabled();
  await expect(page.locator('input[type="file"]')).toHaveCount(0);
  await page
    .getByLabel("Reviewed sample name")
    .fill("Reviewed Electrician sample");
  await page
    .getByRole("checkbox", { name: /Make this program visible/ })
    .check();
  await page.getByRole("button", { name: "Save sample draft" }).click();
  await expect(page.getByRole("status")).toContainText("has not been applied");
  await page.getByRole("checkbox", { name: /I reviewed the sample/ }).check();
  await page.getByRole("button", { name: "Apply reviewed sample" }).click();
  await expect(
    page.getByText(
      "Sample applied in this browser. No external content was published.",
    ),
  ).toBeVisible();
  await shot(page, "admin-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, "admin-mobile");
  expect(requests).toEqual([]);
});

test("expired access can redeem sample code and reset clears journeys but leaves unrelated storage", async ({
  page,
}) => {
  await role(page, "demo-expired");
  await expect(
    page.getByRole("heading", {
      name: "Your pathway is waiting for active access",
    }),
  ).toBeVisible();
  await go(page, "/account");
  await page.getByRole("button", { name: "Redeem sample code" }).click();
  await expect(page.getByRole("status")).toContainText("restored");
  await go(page, "/trades/electrician");
  await page.getByRole("checkbox").first().check();
  await page.evaluate(() =>
    localStorage.setItem("unrelated-demo-test", "keep"),
  );
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(
    page.getByRole("heading", { name: "Your future is hands-on." }),
  ).toBeVisible();
  expect(
    await page.evaluate(() => localStorage.getItem("unrelated-demo-test")),
  ).toBe("keep");
  await role(page);
  await go(page, "/trades/electrician");
  await page
    .getByLabel("Select a local program")
    .selectOption("electrician-demo-chicago");
  await expect(page.getByRole("checkbox").first()).not.toBeChecked();
});

test("supplied county roadmap, dashboard goal clearing and assessment editing preserve progress", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await role(page);
  await go(page, "/assessment");
  for (const name of [
    "Your interests",
    "Your priorities",
    "Your comfort level",
  ])
    await expect(page.getByRole("group", { name })).toBeVisible();
  await page.getByRole("checkbox", { name: /Precision & detail/ }).check();
  await page
    .getByRole("checkbox", { name: /Systems & troubleshooting/ })
    .check();
  await page.getByRole("button", { name: "Show my matches" }).click();
  await expect(page.getByRole("group")).toHaveCount(0);
  await page.getByRole("button", { name: "Edit your answers" }).click();
  await expect(
    page.getByRole("checkbox", { name: /Precision & detail/ }),
  ).toBeChecked();
  await page.getByRole("button", { name: "Show my matches" }).click();
  await page
    .getByLabel("Local program for Electrician")
    .selectOption("electrician-reference-dupage");
  await page
    .locator(".match-actions .card")
    .filter({
      has: page.getByRole("heading", { name: "Electrician", exact: true }),
    })
    .getByRole("button", { name: "Work toward apprenticeship", exact: true })
    .click();
  await go(page, "/dashboard");
  await expect(page.getByLabel("Active program")).toHaveValue(
    "electrician-reference-dupage",
  );
  await page.getByRole("checkbox").first().check();
  await page.getByRole("button", { name: "Clear active goal" }).click();
  await expect(page.locator(".active-checklist")).toHaveCount(0);
  await expect(page.locator(".trade-card")).toContainText("Electrician");
  await go(page, "/trades/electrician");
  await page
    .getByLabel("Select a local program")
    .selectOption("electrician-reference-dupage");
  await expect(page.getByRole("checkbox").first()).toBeChecked();
  await expect(
    page.getByRole("tab", { name: "Practice questions" }),
  ).toHaveCount(0);
  await page.getByRole("tab", { name: "Program details" }).click();
  await expect(
    page.getByRole("heading", { name: "Program tracks" }),
  ).toBeVisible();
  await expect(page.locator(".reference-notice")).toContainText(
    "not been independently verified",
  );
  await shot(page, "reference-details-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, "reference-details-mobile");
  expect(errors).toEqual([]);
});

test("trade-specific supplied practice uses fifteen questions, review and job-readiness labels", async ({
  page,
}) => {
  await role(page);
  await go(page, "/trades/electrician");
  await expect(page.getByLabel("Select a local program")).toHaveValue(
    "electrician-reference-cook",
  );
  await page.getByRole("tab", { name: "Practice questions" }).click();
  await expect(
    page.getByRole("heading", { name: "Question 1 of 15" }),
  ).toBeVisible();
  await page.getByRole("radio").first().check();
  await page.getByRole("button", { name: "Check answer" }).click();
  await expect(page.getByRole("status")).toBeVisible();
  await page.getByRole("button", { name: /^Next/ }).click();
  await page.getByRole("button", { name: /Back/ }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await page.reload();
  await page.getByRole("tab", { name: "Practice questions" }).click();
  await expect(page.getByRole("radio").first()).toBeChecked();
  await go(page, "/trades/painter");
  await expect(
    page.getByRole("tab", { name: "Practice questions" }),
  ).toHaveCount(0);
  await go(page, "/trades/construction-craft-laborer");
  await page.getByRole("tab", { name: "Try Job-Readiness Questions" }).click();
  await expect(page.locator(".practice-panel")).toContainText(
    "no entrance exam",
  );
  await shot(page, "reference-readiness");
});

test("learning pages provide supplied directories and provider action links on mobile", async ({
  page,
}) => {
  const requests: string[] = [];
  page.on("request", (r) => {
    if (/\/api\//.test(r.url())) requests.push(r.url());
  });
  await role(page, "demo-adult");
  await go(page, "/pre-apprenticeships");
  await expect(
    page.getByRole("link", { name: /Complete HIRE360 assessment/ }),
  ).toHaveAttribute("href", "https://hire360partners.org/assessment/");
  await expect(
    page.getByRole("link", { name: /Register for a CWIT information session/ }),
  ).toHaveAttribute("href", "https://cwit.org/info-session-sign-up/");
  await shot(page, "pre-apprenticeships-desktop");
  await page.setViewportSize({ width: 390, height: 844 });
  await noOverflow(page);
  await shot(page, "pre-apprenticeships-mobile");
  await go(page, "/contacts");
  await expect(page.locator(".detail-card")).toHaveCount(12);
  await noOverflow(page);
  await go(page, "/sources");
  await expect(page.locator(".reference-section")).toHaveCount(10);
  await noOverflow(page);
  await go(page, "/unions");
  await expect(
    page.getByRole("heading", { name: "Chicagoland provider directory" }),
  ).toBeVisible();
  await noOverflow(page);
  expect(requests).toEqual([]);
});

test("admin edits roadmap and reference fields locally without claiming verification", async ({
  page,
}) => {
  await role(page, "demo-admin");
  await page.getByRole("button", { name: "Content", exact: true }).click();
  await page
    .getByRole("combobox", { name: "Program", exact: true })
    .selectOption("electrician-reference-cook");
  await page
    .getByRole("textbox", { name: "Preparation guidance", exact: true })
    .fill("Browser-only reviewed preparation note.");
  await page.locator("details.track-card").first().locator("summary").click();
  await page
    .getByRole("textbox", { name: "Step 1 title", exact: true })
    .fill("Updated browser preparation step");
  await page.getByRole("button", { name: "Save sample program" }).click();
  await expect(page.getByRole("status")).toContainText("saved in this browser");
  await role(page, "demo-student");
  await go(page, "/trades/electrician");
  await expect(
    page.getByText("Updated browser preparation step", { exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "Program details" }).click();
  await expect(
    page.getByText("Browser-only reviewed preparation note.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("Last independently verified: not recorded.", {
      exact: false,
    }),
  ).toBeVisible();
});

test("public demo shell reloads offline within its own Pages scope", async ({
  page,
  context,
}) => {
  await go(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await expect
    .poll(() => page.evaluate(() => !!navigator.serviceWorker.controller))
    .toBeTruthy();
  await context.setOffline(true);
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "Your future is hands-on." }),
  ).toBeVisible();
  await role(page);
  await go(page, "/trades/electrician");
  await expect(page.getByLabel("Select a local program")).toHaveValue(
    "electrician-reference-cook",
  );
  await context.setOffline(false);
});
