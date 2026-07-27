import { expect, test } from "@playwright/test";

test("opens a persisted profile, runs diagnostics, and switches language", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/");

  const welcomeHeading = page
    .getByRole("heading", { level: 1, name: "Welcome to Hymui" })
    .or(page.getByRole("heading", { level: 1, name: "Willkommen bei Hymui" }));
  const projectsHeading = page.getByRole("heading", { level: 1, name: "Projects" });
  const projekteHeading = page.getByRole("heading", { level: 1, name: "Projekte" });
  await expect(welcomeHeading.or(projectsHeading).or(projekteHeading)).toBeVisible();
  if (await welcomeHeading.isVisible()) {
    await page.getByTestId("local-profile-action").click();
  }

  await expect(projectsHeading.or(projekteHeading)).toBeVisible();

  const profileAction = page.getByTestId("user-settings-action");
  await profileAction.click();
  await expect(profileAction).toHaveAttribute("aria-expanded", "true");
  await expect(profileAction).toHaveClass(/user-settings__trigger--active/);
  await expect(profileAction).toHaveCSS("color", "rgb(13, 18, 17)");
  await expect(page.locator(".user-settings__appearance")).toBeVisible();
  await expect(page.locator(".user-settings__profile .hm-avatar")).toHaveCSS("width", "28px");
  await expect(page.locator(".user-settings__panel .hm-segmented").first()).toHaveCSS(
    "min-height",
    "36px",
  );
  await expect(page.getByRole("button", { name: "Sign out" })).toHaveCSS("min-height", "36px");
  await expect(page.locator(".user-settings__status")).toHaveCount(0);
  await expect(page.getByText("Agent ready", { exact: true })).toHaveCount(0);
  await expect(page.getByText("Agent bereit", { exact: true })).toHaveCount(0);
  await expect(page.locator(".user-settings__panel")).toHaveCSS("box-shadow", "none");
  await expect(page.locator(".user-settings__panel")).toHaveCSS("border-top-width", "1px");
  await expect
    .poll(() =>
      page
        .locator(".user-settings__panel")
        .evaluate((element) => getComputedStyle(element, "::after").inset),
    )
    .toBe("0px");
  await expect
    .poll(() =>
      page
        .locator(".user-settings__panel")
        .evaluate((element) => getComputedStyle(element).backdropFilter),
    )
    .toContain("blur");

  await page.getByRole("radio", { name: "Light" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "light");

  await page.getByRole("radio", { name: "System" }).click();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.getByRole("radio", { name: "System" })).toHaveAttribute("aria-checked", "true");

  await page.getByRole("radio", { name: "Dark" }).click();
  await expect(page.getByRole("radio", { name: "Dark" })).toHaveAttribute("aria-checked", "true");

  const floatingWindow = page.locator(".hm-floating-window");
  const titlebar = page.locator(".hm-floating-window__titlebar");
  const beforeMove = await floatingWindow.boundingBox();
  const dragArea = await titlebar.boundingBox();
  if (!beforeMove || !dragArea) throw new Error("Floating settings window is not measurable");

  await page.mouse.move(dragArea.x + dragArea.width / 2, dragArea.y + 8);
  await page.mouse.down();
  await page.mouse.move(dragArea.x + dragArea.width / 2 - 60, dragArea.y - 42, { steps: 4 });
  await page.mouse.up();

  const afterMove = await floatingWindow.boundingBox();
  expect(afterMove?.x).toBeLessThan(beforeMove.x);
  await expect(floatingWindow).toHaveCSS("transform", "none");

  await page.locator("#language").click();
  await page.getByRole("option", { name: "English" }).click();
  await expect(projectsHeading).toBeVisible();

  await page.getByRole("radio", { name: "Right" }).click();
  await expect(page.locator(".hm-app-shell")).toHaveClass(/hm-app-shell--nav-right/);
  await expect(page.locator(".hm-app-shell__bar")).toHaveCSS("flex-direction", "column");
  await expect(page.locator(".hm-app-shell__bar .hm-brand > span")).toBeHidden();
  await expect(page.getByRole("radio", { name: "Right" })).toHaveAttribute("aria-checked", "true");
  await expect
    .poll(async () => (await floatingWindow.boundingBox())?.x ?? Number.POSITIVE_INFINITY)
    .toBeLessThan(80);

  await expect(page.locator("#navigation-position-listbox")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Sign out" })).toBeVisible();

  await page.getByRole("radio", { name: "Top" }).click();
  await expect(page.locator(".hm-app-shell")).toHaveClass(/hm-app-shell--nav-top/);

  await page.reload();
  await expect(projectsHeading).toBeVisible();
  await expect(page.locator(".hm-app-shell")).toHaveClass(/hm-app-shell--nav-top/);

  await page.getByRole("button", { name: "Archive 2026" }).click();
  await expect(page.getByText("There are no archived projects yet.")).toBeVisible();

  await page.locator("#project-search").fill("project-that-does-not-exist");
  await expect(page.getByText("No matching projects")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await expect(page.locator("#project-search")).toHaveValue("");

  await expect(page.getByText("All services ready")).toBeVisible();

  await page.getByRole("button", { name: "Run diagnostic" }).click();
  await expect(page.getByText("Foundation verified")).toBeVisible();
  await expect(page.getByText("Web → API → Worker completed", { exact: false })).toBeVisible();

  await page.getByTestId("user-settings-action").click();
  await page.getByRole("button", { name: "English" }).click();
  await page.getByRole("option", { name: "Deutsch" }).click();
  await expect(projekteHeading).toBeVisible();

  const desktopIndicator = page.locator(".hm-app-shell__nav-indicator");
  const indicatorBefore = await desktopIndicator.evaluate(
    (element) => getComputedStyle(element).transform,
  );
  await page.getByRole("button", { exact: true, name: "Board" }).click();
  await expect
    .poll(() => desktopIndicator.evaluate((element) => getComputedStyle(element).transform))
    .not.toBe(indicatorBefore);
  await expect(page.getByText("Dieses Produktmodul folgt", { exact: false })).toBeVisible();
});

test("allows the mobile navigation to slide horizontally", async ({ page }) => {
  await page.setViewportSize({ height: 844, width: 390 });
  await page.goto("/");

  const welcomeHeading = page
    .getByRole("heading", { level: 1, name: "Welcome to Hymui" })
    .or(page.getByRole("heading", { level: 1, name: "Willkommen bei Hymui" }));
  const projectsHeading = page
    .getByRole("heading", { level: 1, name: "Projects" })
    .or(page.getByRole("heading", { level: 1, name: "Projekte" }));
  await expect(welcomeHeading.or(projectsHeading)).toBeVisible();
  if (await welcomeHeading.isVisible()) {
    await page.getByTestId("local-profile-action").click();
  }
  await expect(projectsHeading).toBeVisible();

  const mobileNavigation = page.locator(".hm-app-shell__mobile-nav");
  await expect(mobileNavigation).toBeVisible();
  const profileAction = page.getByTestId("user-settings-action");
  await profileAction.click();
  await expect(page.getByText("Desktop navigation position", { exact: true })).toBeHidden();
  await expect(page.getByRole("radio", { name: "Top" })).toBeHidden();
  await expect(mobileNavigation).toHaveCSS("bottom", "12px");
  await expect(page.locator(".hm-app-shell__bar-wrap")).toHaveCSS("top", "8px");
  await profileAction.click();

  await expect(mobileNavigation).toHaveCSS("overflow-x", "auto");
  await expect(mobileNavigation).toHaveCSS("scroll-snap-type", "inline mandatory");
  await expect(mobileNavigation).toHaveCSS("--hm-mobile-active-index", "0");
  await expect(page.locator(".hm-app-shell__mobile-item span").first()).toBeHidden();

  const dimensions = await mobileNavigation.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeGreaterThan(dimensions.clientWidth);

  await mobileNavigation.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
  await expect
    .poll(() => mobileNavigation.evaluate((element) => element.scrollLeft))
    .toBeGreaterThan(0);

  await page.locator('.hm-app-shell__mobile-item[aria-label="Board"]').click();
  await expect(mobileNavigation).toHaveCSS("--hm-mobile-active-index", "1");
  await expect
    .poll(() =>
      mobileNavigation.evaluate((element) => getComputedStyle(element, "::before").backgroundImage),
    )
    .toContain("linear-gradient");
});
