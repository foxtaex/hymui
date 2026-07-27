declare const messages: {
    readonly en: {
        readonly app: {
            readonly appearance: "Appearance";
            readonly edition: "Local edition";
            readonly eyebrow: "Local instance · studio north · 7 peers";
            readonly language: "Language";
            readonly navigationBottom: "Bottom";
            readonly navigationPosition: "Navigation position";
            readonly navigationTop: "Top";
            readonly profile: "Local profile";
            readonly settings: "User settings";
            readonly signOut: "Sign out";
            readonly themeDark: "Use dark theme";
            readonly themeDarkName: "Dark";
            readonly themeLight: "Use light theme";
            readonly themeLightName: "Light";
            readonly themeSystem: "Follow the system appearance";
            readonly themeSystemName: "System";
            readonly title: "Projects";
        };
        readonly auth: {
            readonly createAccount: "Create account";
            readonly displayName: "Display name";
            readonly existingAccount: "Already have an account?";
            readonly localAction: "Continue with a local profile";
            readonly loginAction: "Sign in";
            readonly newAccount: "Create the first owner account";
            readonly password: "Password";
            readonly subtitle: "Your account owns projects, sessions, and approvals from the first record.";
            readonly title: "Welcome to Hymui";
            readonly username: "Username";
        };
        readonly diagnostic: {
            readonly action: "Run diagnostic";
            readonly completed: "Foundation verified";
            readonly description: "Send one bounded job through Web, API, and the separate Worker.";
            readonly failed: "Diagnostic unavailable";
            readonly idle: "Ready for a complete application-boundary check.";
            readonly running: "Checking application boundaries";
            readonly title: "Foundation diagnostic";
        };
        readonly health: {
            readonly checking: "Checking services";
            readonly degraded: "Worker unavailable";
            readonly ready: "All services ready";
        };
        readonly nav: {
            readonly agents: "Agents";
            readonly board: "Board";
            readonly docs: "Docs";
            readonly planner: "Planner";
            readonly projects: "Projects";
            readonly whiteboard: "Whiteboard";
        };
        readonly projects: {
            readonly archive: "Archive 2026";
            readonly archivedCount: "Archived projects";
            readonly cancel: "Cancel";
            readonly create: "Create project";
            readonly createTitle: "New project";
            readonly description: "Description";
            readonly empty: "Create the first persistent project.";
            readonly new: "New project";
            readonly owner: "Owner";
            readonly progress: "Progress";
            readonly region: "Projects";
            readonly revision: "Revision";
            readonly search: "Search projects…";
        };
    };
    readonly de: {
        readonly app: {
            readonly appearance: "Darstellung";
            readonly edition: "Local-Edition";
            readonly eyebrow: "Lokale Instanz · studio north · 7 Peers";
            readonly language: "Sprache";
            readonly navigationBottom: "Unten";
            readonly navigationPosition: "Position der Navigation";
            readonly navigationTop: "Oben";
            readonly profile: "Lokales Profil";
            readonly settings: "Benutzereinstellungen";
            readonly signOut: "Abmelden";
            readonly themeDark: "Dunkles Theme verwenden";
            readonly themeDarkName: "Dunkel";
            readonly themeLight: "Helles Theme verwenden";
            readonly themeLightName: "Hell";
            readonly themeSystem: "Darstellung des Systems verwenden";
            readonly themeSystemName: "System";
            readonly title: "Projekte";
        };
        readonly auth: {
            readonly createAccount: "Konto erstellen";
            readonly displayName: "Anzeigename";
            readonly existingAccount: "Du hast bereits ein Konto?";
            readonly localAction: "Mit lokalem Profil fortfahren";
            readonly loginAction: "Anmelden";
            readonly newAccount: "Erstes Owner-Konto erstellen";
            readonly password: "Passwort";
            readonly subtitle: "Dein Konto besitzt Projekte, Sitzungen und Freigaben ab dem ersten Datensatz.";
            readonly title: "Willkommen bei Hymui";
            readonly username: "Benutzername";
        };
        readonly diagnostic: {
            readonly action: "Diagnose starten";
            readonly completed: "Fundament bestätigt";
            readonly description: "Sende einen begrenzten Auftrag durch Web, API und den separaten Worker.";
            readonly failed: "Diagnose nicht verfügbar";
            readonly idle: "Bereit für die vollständige Prüfung der Anwendungsgrenzen.";
            readonly running: "Anwendungsgrenzen werden geprüft";
            readonly title: "Foundation-Diagnose";
        };
        readonly health: {
            readonly checking: "Dienste werden geprüft";
            readonly degraded: "Worker nicht verfügbar";
            readonly ready: "Alle Dienste bereit";
        };
        readonly nav: {
            readonly agents: "Agents";
            readonly board: "Board";
            readonly docs: "Docs";
            readonly planner: "Planner";
            readonly projects: "Projekte";
            readonly whiteboard: "Whiteboard";
        };
        readonly projects: {
            readonly archive: "Archiv 2026";
            readonly archivedCount: "Archivierte Projekte";
            readonly cancel: "Abbrechen";
            readonly create: "Projekt erstellen";
            readonly createTitle: "Neues Projekt";
            readonly description: "Beschreibung";
            readonly empty: "Erstelle das erste persistente Projekt.";
            readonly new: "Neues Projekt";
            readonly owner: "Owner";
            readonly progress: "Fortschritt";
            readonly region: "Projekte";
            readonly revision: "Revision";
            readonly search: "Projekte durchsuchen…";
        };
    };
};
type Locale = keyof typeof messages;
type MessageTree = (typeof messages)["en"];
declare const localeOptions: ReadonlyArray<{
    label: string;
    value: Locale;
}>;

export { type Locale, type MessageTree, localeOptions, messages };
