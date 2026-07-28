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
    await expect(page.locator(".auth-card .hm-brand-mark")).toBeVisible();
    await expect(page.locator(".auth-card img")).toHaveCount(0);
    await expect(page.locator(".hm-app-shell__bar-wrap")).toHaveCount(0);
    await expect(page.locator(".hm-app-shell__mobile-nav")).toHaveCount(0);
    const passwordInput = page.locator("#auth-password");
    await expect(passwordInput).toHaveAttribute("type", "password");
    await page.getByRole("button", { name: /Show password|Passwort anzeigen/ }).click();
    await expect(passwordInput).toHaveAttribute("type", "text");
    await page
      .getByRole("button", { name: /Sign in|Create account|Anmelden|Konto erstellen/ })
      .click();
    await expect(page.locator("#auth-username-error")).toBeVisible();
    await expect(page.locator("#auth-password-error")).toBeVisible();
    await page.getByTestId("local-profile-action").click();
  }

  await expect(projectsHeading.or(projekteHeading)).toBeVisible();
  await expect(page.locator(".hm-app-shell__bar-wrap")).toBeVisible();

  await page
    .locator(".page-heading__actions")
    .getByRole("button", { name: /New project|Neues Projekt/ })
    .click();
  await expect(page.locator(".new-project-window")).toBeVisible();
  await expect(page.locator('label[for="new-project-name"]')).toContainText(
    /Project name|Projektname/,
  );
  await page.getByRole("button", { name: /Create project|Projekt erstellen/ }).click();
  await expect(page.locator("#new-project-name-error")).toBeVisible();
  await page.getByRole("button", { name: /Add link|Link hinzufügen/ }).click();
  await expect(page.locator("#new-project-link-type-0-repository")).toBeVisible();
  await page.getByRole("radio", { name: /External link|Externer Link/ }).click();
  await expect(page.locator(".new-project-window")).toBeVisible();
  await expect(page.getByRole("radio", { name: /External link|Externer Link/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await page.locator("#new-project-link-label-0").fill("New project repository");
  await page.locator("#new-project-link-url-0").fill("https://github.com/hymui/core");

  await page
    .locator(".page-heading__actions")
    .getByRole("button", { name: /New project|Neues Projekt/ })
    .click();
  await expect(page.locator(".new-project-window")).toBeVisible();
  await expect(page.locator("#new-project-name-error")).toHaveCount(0);
  await expect(page.locator('[id^="new-project-link-type-"]')).toHaveCount(0);

  const retryProjectName = `Creation retry ${Date.now()}`;
  await page.locator("#new-project-name").fill(retryProjectName);
  await page.locator("#new-project-description").fill("Created after an invalid first attempt");
  await page.getByRole("button", { name: /Create project|Projekt erstellen/ }).click();
  await expect(page.locator(".new-project-window")).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: retryProjectName })).toBeVisible();

  let editProjectAction = page
    .getByRole("button", { name: /Edit project|Projekt bearbeiten/ })
    .first();
  if ((await editProjectAction.count()) === 0) {
    await page
      .locator(".page-heading__actions")
      .getByRole("button", { name: /New project|Neues Projekt/ })
      .click();
    await page.locator("#new-project-name").fill("Browser project");
    await page.locator("#new-project-description").fill("Created by the browser flow");
    await page.getByRole("button", { name: /Create project|Projekt erstellen/ }).click();
    editProjectAction = page
      .getByRole("button", { name: /Edit project|Projekt bearbeiten/ })
      .first();
  }

  const projectHasBrowserLink =
    (await page.getByRole("link", { name: "Browser test link" }).count()) > 0;
  await editProjectAction.click();
  await expect(page.locator(".edit-project-window")).toBeVisible();
  if (!projectHasBrowserLink) {
    await page.getByRole("button", { name: /Add link|Link hinzufügen/ }).click();
    await page.locator('[id^="edit-project-link-label-"]').last().fill("Browser test link");
    await page.locator('[id^="edit-project-link-url-"]').last().fill("https://example.com/hymui");
  }
  await page.getByRole("button", { name: /Save changes|Änderungen speichern/ }).click();
  await expect(page.locator(".edit-project-window")).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Browser test link" })).toBeVisible();

  await page
    .locator(".project-card:not(.project-card--archived)")
    .first()
    .click({
      position: { x: 24, y: 24 },
    });
  await expect(page.locator(".project-overview-page")).toBeVisible();
  await expect(
    page.locator('.hm-app-shell__nav-item--active[aria-label="Projects"]'),
  ).toBeVisible();
  await expect(page.locator('.hm-app-shell__nav-item--active[aria-label="Board"]')).toHaveCount(0);

  const overviewName = await page.locator(".project-overview__hero h1").innerText();
  await page.getByRole("button", { name: /Edit project|Projekt bearbeiten/ }).click();
  await expect(page.locator(".edit-project-window")).toBeVisible();
  await expect(page.locator("#edit-project-name")).toHaveValue(overviewName);
  await page.locator("#edit-project-description").fill("Edited from the project overview");
  await page.getByRole("button", { name: /Save changes|Änderungen speichern/ }).click();
  await expect(page.locator(".edit-project-window")).toHaveCount(0);
  await expect(page.locator(".project-overview__hero")).toContainText(
    "Edited from the project overview",
  );
  await expect(page.locator(".project-overview__hero h1")).toHaveText(overviewName);

  await page.getByRole("button", { name: /All projects|Alle Projekte/ }).click();
  await expect(page.locator(".projects-page")).toBeVisible();

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
  await expect(page.getByRole("button", { name: "Archive 2026" })).toHaveAttribute(
    "aria-expanded",
    "true",
  );
  await expect(page.locator(".project-archive")).toBeVisible();

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

  await page.setViewportSize({ height: 800, width: 820 });
  const activeDesktopItem = page.locator(".hm-app-shell__nav-item--active");
  await expect(activeDesktopItem.locator(".hm-app-shell__item-indicator")).toBeVisible();
  const indicatorBefore = await activeDesktopItem.boundingBox();
  await page.getByRole("button", { exact: true, name: "Board" }).click();
  await expect(activeDesktopItem).toContainText("Board");
  await expect(activeDesktopItem.locator(".hm-app-shell__item-indicator")).toBeVisible();
  await expect
    .poll(async () => (await activeDesktopItem.boundingBox())?.x ?? 0)
    .toBeGreaterThan(indicatorBefore?.x ?? 0);
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
    await expect(page.locator(".hm-app-shell__bar-wrap")).toHaveCount(0);
    await expect(page.locator(".hm-app-shell__mobile-nav")).toHaveCount(0);
    await page.getByTestId("local-profile-action").click();
  }
  await expect(projectsHeading).toBeVisible();

  await page
    .locator(".page-heading__actions")
    .getByRole("button", { name: /New project|Neues Projekt/ })
    .click();
  await page.getByRole("button", { name: /Add link|Link hinzufügen/ }).click();
  await page.getByRole("radio", { name: /External link|Externer Link/ }).click();
  await expect(page.locator(".new-project-window")).toBeVisible();
  await expect(page.getByRole("radio", { name: /External link|Externer Link/ })).toHaveAttribute(
    "aria-checked",
    "true",
  );
  await expect(page.locator("#new-project-link-label-0")).toBeVisible();
  await page
    .getByRole("button", { name: /Cancel|Abbrechen/ })
    .last()
    .click();

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
  await expect(
    page.locator('.hm-app-shell__mobile-item--active[aria-label="Projects"]'),
  ).toBeVisible();
  await expect(
    page.locator(".hm-app-shell__mobile-item .hm-app-shell__item-label").first(),
  ).toBeHidden();

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
  const activeMobileItem = page.locator('.hm-app-shell__mobile-item--active[aria-label="Board"]');
  await expect(activeMobileItem).toBeVisible();
  await expect
    .poll(() =>
      activeMobileItem
        .locator(".hm-app-shell__item-indicator")
        .evaluate((element) => getComputedStyle(element).backgroundImage),
    )
    .toContain("linear-gradient");
});
