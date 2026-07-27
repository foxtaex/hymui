// src/index.ts
var messages = {
  en: {
    app: {
      appearance: "Appearance",
      colorScheme: "Color scheme",
      edition: "Local edition",
      eyebrow: "Local instance \xB7 studio north \xB7 7 peers",
      language: "Language",
      navigationBottom: "Bottom",
      navigationLeft: "Left",
      navigationPosition: "Desktop navigation position",
      navigationRight: "Right",
      navigationTop: "Top",
      profile: "Local profile",
      settings: "User settings",
      signOut: "Sign out",
      themeDark: "Use dark theme",
      themeDarkName: "Dark",
      themeLight: "Use light theme",
      themeLightName: "Light",
      themeSystem: "Follow the system appearance",
      themeSystemName: "System",
      title: "Projects"
    },
    auth: {
      createAccount: "Create account",
      displayName: "Display name",
      existingAccount: "Already have an account?",
      localAction: "Continue with a local profile",
      loginAction: "Sign in",
      newAccount: "Create the first owner account",
      password: "Password",
      subtitle: "Your account owns projects, sessions, and approvals from the first record.",
      title: "Welcome to Hymui",
      username: "Username"
    },
    diagnostic: {
      action: "Run diagnostic",
      completed: "Foundation verified",
      description: "Send one bounded job through Web, API, and the separate Worker.",
      failed: "Diagnostic unavailable",
      idle: "Ready for a complete application-boundary check.",
      running: "Checking application boundaries",
      title: "Foundation diagnostic"
    },
    health: {
      checking: "Checking services",
      degraded: "Worker unavailable",
      ready: "All services ready"
    },
    nav: {
      agents: "Agents",
      board: "Board",
      docs: "Docs",
      planner: "Planner",
      projects: "Projects",
      whiteboard: "Whiteboard"
    },
    projects: {
      archive: "Archive 2026",
      archiveEmpty: "There are no archived projects yet.",
      archivedCount: "Archived projects",
      cancel: "Cancel",
      clearSearch: "Clear search",
      create: "Create project",
      created: "Project created.",
      createTitle: "New project",
      description: "Description",
      empty: "Create the first persistent project.",
      emptySearch: "No matching projects",
      emptySearchHint: "Try another name or clear the current search.",
      emptyTitle: "No projects yet",
      new: "New project",
      owner: "Owner",
      progress: "Progress",
      region: "Projects",
      revision: "Revision",
      search: "Search projects\u2026"
    }
  },
  de: {
    app: {
      appearance: "Darstellung",
      colorScheme: "Farbschema",
      edition: "Local-Edition",
      eyebrow: "Lokale Instanz \xB7 studio north \xB7 7 Peers",
      language: "Sprache",
      navigationBottom: "Unten",
      navigationLeft: "Links",
      navigationPosition: "Position der Desktop-Navigation",
      navigationRight: "Rechts",
      navigationTop: "Oben",
      profile: "Lokales Profil",
      settings: "Benutzereinstellungen",
      signOut: "Abmelden",
      themeDark: "Dunkles Theme verwenden",
      themeDarkName: "Dunkel",
      themeLight: "Helles Theme verwenden",
      themeLightName: "Hell",
      themeSystem: "Darstellung des Systems verwenden",
      themeSystemName: "System",
      title: "Projekte"
    },
    auth: {
      createAccount: "Konto erstellen",
      displayName: "Anzeigename",
      existingAccount: "Du hast bereits ein Konto?",
      localAction: "Mit lokalem Profil fortfahren",
      loginAction: "Anmelden",
      newAccount: "Erstes Owner-Konto erstellen",
      password: "Passwort",
      subtitle: "Dein Konto besitzt Projekte, Sitzungen und Freigaben ab dem ersten Datensatz.",
      title: "Willkommen bei Hymui",
      username: "Benutzername"
    },
    diagnostic: {
      action: "Diagnose starten",
      completed: "Fundament best\xE4tigt",
      description: "Sende einen begrenzten Auftrag durch Web, API und den separaten Worker.",
      failed: "Diagnose nicht verf\xFCgbar",
      idle: "Bereit f\xFCr die vollst\xE4ndige Pr\xFCfung der Anwendungsgrenzen.",
      running: "Anwendungsgrenzen werden gepr\xFCft",
      title: "Foundation-Diagnose"
    },
    health: {
      checking: "Dienste werden gepr\xFCft",
      degraded: "Worker nicht verf\xFCgbar",
      ready: "Alle Dienste bereit"
    },
    nav: {
      agents: "Agents",
      board: "Board",
      docs: "Docs",
      planner: "Planner",
      projects: "Projekte",
      whiteboard: "Whiteboard"
    },
    projects: {
      archive: "Archiv 2026",
      archiveEmpty: "Es gibt noch keine archivierten Projekte.",
      archivedCount: "Archivierte Projekte",
      cancel: "Abbrechen",
      clearSearch: "Suche leeren",
      create: "Projekt erstellen",
      created: "Projekt wurde erstellt.",
      createTitle: "Neues Projekt",
      description: "Beschreibung",
      empty: "Erstelle das erste persistente Projekt.",
      emptySearch: "Keine passenden Projekte",
      emptySearchHint: "Versuche einen anderen Namen oder leere die aktuelle Suche.",
      emptyTitle: "Noch keine Projekte",
      new: "Neues Projekt",
      owner: "Owner",
      progress: "Fortschritt",
      region: "Projekte",
      revision: "Revision",
      search: "Projekte durchsuchen\u2026"
    }
  }
};
var localeOptions = [
  { label: "English", value: "en" },
  { label: "Deutsch", value: "de" }
];
export {
  localeOptions,
  messages
};
