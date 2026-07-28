type SavedThemeMode = "dark" | "light" | "system";

export default defineNuxtPlugin(() => {
  const root = document.documentElement;
  const savedMode = localStorage.getItem("hymui.themeMode");
  const legacyTheme = localStorage.getItem("hymui.theme");
  const mode: SavedThemeMode =
    savedMode === "dark" || savedMode === "light" || savedMode === "system"
      ? savedMode
      : legacyTheme === "light" || legacyTheme === "dark"
        ? legacyTheme
        : "dark";

  root.dataset.theme =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
});
