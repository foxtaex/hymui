<div align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="./public/logo/hymui/mark-subtle.svg">
    <img src="./public/logo/hymui/mark-vivid.svg" width="120" alt="Hymui-Logo">
  </picture>
  <h1>Hymui</h1>
  <p><strong>Plane alles. Gemeinsam.</strong></p>
</div>

**Deutsch** · [English](./README.md)

Hymui ist ein local-first Projektplanungstool, in dem Menschen und AI-Agents
gemeinsam an beliebigen Projekten arbeiten. Boards, Dokumente, Termine, Links
und Agent-Läufe gehören zu einem zusammenhängenden Projektmodell und nicht zu
voneinander getrennten Werkzeugen.

> [!IMPORTANT]
> **Hymui startet mit einer neuen Codebasis.** Nützliche Produktideen und
> Erkenntnisse aus früheren Planungsexperimenten fließen ein; Architektur und
> Implementierung entstehen von Grund auf neu.

Hymui befindet sich in der aktiven Foundation-Entwicklung. Der aktuelle
Development-Build enthält die Nuxt-Web-Shell, Fastify-API, einen getrennten
Worker, gemeinsame Verträge, wiederverwendbare Vue-Komponenten,
Deutsch/Englisch und das Liquid-Glass-Token-System. Plan 02 ergänzt jetzt den
ersten persistenten Local-Schnitt: PGlite-Migrationen, Owner- oder
passwortfreies Local-Profil, sichere persistente Sessions und
Owner-autorisierte Projekte mit Dateianhängen sowie wiederaufnehmbare Worker-Jobs mit
persistenten Leases. Das ist noch keine stabile Veröffentlichung.

## Warum Hymui?

Projektarbeit ist heute häufig über mehrere Dienste verteilt: Anforderungen
liegen in Dokumenten, Aufgaben auf Boards, Termine in einem Kalender und
Entscheidungen in Chats. AI-Assistenten kommen oft als weiterer isolierter Chat
hinzu. Ihnen fehlen ein verlässlicher Projektkontext, kontrollierte Werkzeuge
und nachvollziehbare Freigaben.

Gleichzeitig müssen sich Nutzer häufig zwischen Komfort und Kontrolle
entscheiden:

- Gehostete Plattformen sind bequem, binden Daten und Identitäten aber oft an
  einen Anbieter.
- Self-hosted Software gibt Kontrolle zurück, verhält sich jedoch häufig wie
  ein anderes Produkt.
- Lokale Anwendungen funktionieren offline, lassen sich aber schwer in
  portable Zusammenarbeit integrieren.
- AI-Automatisierung kann Zeit sparen, ohne klare Grenzen aber unkontrollierte
  Änderungen, Kosten und Risiken erzeugen.

Hymui soll diese Trennung auflösen:

- **Ein Projektmodell:** Board, Docs, Planner, Links und Agents teilen denselben
  Kontext.
- **Local-first:** Persönliche Projekte funktionieren lokal, offline und ohne
  Pflichtkonto.
- **Eine Anwendung, drei Editionen:** Local, Self-hosted und Hosted verwenden
  dieselbe Web-App, dieselbe API und dieselbe Fachlogik.
- **Portabel statt gefangen:** Projekte lassen sich in einem
  datenbankneutralen `.hymui`-Format exportieren und wiederherstellen.
- **Agents mit Grenzen:** Agents erstellen überprüfbare Vorschläge. Menschen
  bestimmen, was tatsächlich verändert oder nach außen gesendet wird.
- **Dezentrale Zusammenarbeit:** Self-hosted Instanzen benötigen keine zentrale
  Hymui-Benutzerdatenbank.

## Warum der Name?

**Hymui** ist bewusst kein Name für ein einzelnes Feature. Er legt das Produkt
weder auf Kanban, Softwareentwicklung noch auf AI fest. Dadurch kann Hymui für
persönliche, kreative, organisatorische und technische Projekte verwendet
werden.

Die Marke steht für unabhängige Teile, die gemeinsam ein funktionierendes
System bilden: Menschen, Projekte, Dokumente, Boards, Agents, Plugins und
Instanzen.

## Das gemeinsame Projektmodell

Ein Projekt ist der Rahmen für Ziele, Beteiligte, Inhalte und Arbeit. Es kann
frei beginnen oder eine Vorlage verwenden und enthält:

- Boards und Karten
- Markdown-Dokumente
- Planner-Einträge
- externe Links
- optionale Repository-Verbindungen
- Agent-Läufe, Vorschläge und Freigaben

Software- und Webentwicklung bilden das erste umfangreiche Vorlagen- und
Agent-Paket. Ein Projekt muss jedoch vollständig ohne Repository, Programmcode
oder technische Begriffe funktionieren.

## Geplante Produktbereiche

### Board

- Kanban-Boards mit frei sortierbaren Spalten und Karten
- Archivierung und Wiederherstellung
- Suche über Karten, Metadaten und verknüpfte Docs
- Docs als Kartenbeschreibung oder Anhang
- Board-Einstellungen für Darstellung, Sichtbarkeit und Sprache

### Docs

- Markdown-Editor und Reader
- synchronisierte Schreib-, Vorschau- und Split-Ansicht
- sichere Markdown-Ausgabe
- Codeblöcke mit Syntaxhervorhebung
- Bilder und Anhänge
- robuste Speicherung während langer Sitzungen

### Planner

- Termine und Aufgaben aus Projekten und Board-Karten
- eindeutige Typ- und Herkunftsanzeige
- Verlinkung zum ursprünglichen Projekt, Board oder zur Karte
- konsistente Sprache, Zeitzone und Datumsdarstellung

### AI-Agents

Hymui behandelt einen Agent nicht als unkontrollierten Chat. Jeder Lauf besitzt
einen Scope, einen sichtbaren Zustand, ein Budget, erlaubte Werkzeuge und eine
Freigaberichtlinie.

```text
Projektziel
  -> Agent analysiert den freigegebenen Kontext
      -> Agent erstellt einen überprüfbaren Vorschlag
          -> Mensch prüft und genehmigt
              -> Hymui übernimmt Docs, Meilensteine oder Karten
```

Geplante allgemeine Agent-Profile:

- Goal Agent
- Planning Agent
- Research Agent
- Risk Agent
- Review Agent
- Documentation Agent

Ein optionales Entwicklungspaket ergänzt Requirements-, Architecture-,
Repository-, Implementation- und Code-Review-Agents.

Schreibende Aktionen, Befehle, Repository-Änderungen und externe Nachrichten
benötigen eine ausdrückliche Freigabe. Agents dürfen ihre Berechtigungen nicht
selbst erweitern.

## Drei gleichwertige Editionen

| Edition | Gedacht für | Betrieb und Daten |
| --- | --- | --- |
| **Local** | persönliche und vollständig lokale Projekte | Docker-frei, PGlite, lokales Dateisystem und offline nutzbar |
| **Self-hosted** | Teams auf eigener Infrastruktur | getrennte Dienste, PostgreSQL/MySQL/MariaDB oder experimentell MSSQL, lokaler oder S3-kompatibler Speicher |
| **Hosted** | verwaltete Nutzung ohne eigenen Serverbetrieb | Google Cloud Run, Cloud SQL für PostgreSQL, Cloud Storage und verwaltete Backups |

Die Editionen werden nicht als getrennte Forks entwickelt. Local startet die
gleichen Bausteine gemeinsam; Self-hosted und Hosted können sie unabhängig
betreiben und skalieren.

## Local-first und kein Lock-in

Alle Editionen sollen dasselbe versionierte Archiv lesen und schreiben:

```text
workspace.hymui
  manifest.json
  data/
    records.ndjson
  uploads/
  checksums.json
```

Das Archiv enthält keine datenbankspezifischen SQL-Dumps. Geplant sind
getestete Importpfade zwischen PGlite, PostgreSQL, MySQL, MariaDB und
experimentell Microsoft SQL Server.

Local verwendet das Dateisystem. Hosted nutzt einen nativen Adapter für Google
Cloud Storage. Self-hosted unterstützt das Dateisystem und S3-kompatiblen
Objektspeicher einschließlich MinIO. Alle Speicheranbieter liegen hinter
demselben Port. Dadurch bleiben Projektarchive portabel und Hymui Core hängt
nicht von Google Cloud ab.

## Dezentrale Identität

Ein Account gehört zu seiner Heimatinstanz. Self-hosted Instanzen benötigen
kein zentrales Hymui-Konto. Für sichtbare Hymui-Identitäten ist eine eindeutige
Form vorgesehen:

```text
§hymui.example@bob
```

Im normalen Frontend kann ein eindeutiger lokaler Benutzer als `@bob`
erscheinen. Einladungen, Backend-Aktionen, Audit-Logs und sicherheitsrelevante
Ansichten verwenden immer die vollständige Identität beziehungsweise die
unveränderliche Actor-ID.

Die Föderation orientiert sich an ActivityPub und ergänzt ein versioniertes
Hymui-Profil für Projekte, Mitgliedschaften und Freigaben. Sie bleibt auf
Self-hosted Instanzen vollständig abschaltbar sowie über Allow- und Blocklisten
kontrollierbar.

## Zielarchitektur

```text
Nuxt 4 / Vue 3 Frontend
          |
          | /api/v1 + Events
          v
Fastify Backend API
          |
          +-- Hymui Core
          +-- Agent Runtime
          +-- Database Ports
          +-- Storage Ports
          +-- Federation Port
          +-- Repository Port
          |
          v
       Worker
```

Verbindliche Grundlagen des Neuaufbaus:

- **Frontend:** Nuxt 4, Vue 3 und TypeScript
- **Backend:** Fastify und TypeScript
- **Worker:** eigener Prozess für Agents und lange Hintergrundaufgaben
- **Datenzugriff:** Drizzle ORM hinter einer Repository-Schicht
- **Local-Datenbank:** PGlite
- **Server-Datenbanken:** PostgreSQL, MySQL, MariaDB und experimentell MSSQL
- **Styling:** eigenständige SCSS-Dateien
- **Sprachen:** Deutsch und Englisch ab dem ersten Setup
- **Erweiterbarkeit:** Plugin-Vertrag und Extension Points von Beginn an
- **Qualität:** Unit-, Contract-, Integrations- und Browser-Tests

### Hosted-Referenzbetrieb

Google Cloud ist die Referenzplattform für die verwaltete Hosted-Edition:

- [Cloud Run](https://docs.cloud.google.com/run/docs/overview/what-is-cloud-run)
  betreibt Web-Frontend, API und isolierte Hintergrundaufgaben.
- [Cloud SQL für PostgreSQL](https://docs.cloud.google.com/sql/docs/postgres/introduction)
  stellt die verwaltete primäre Datenbank bereit.
- [Cloud Storage](https://docs.cloud.google.com/storage/docs/introduction)
  speichert Uploads, Exporte und Backups.

Das sind Deployment-Adapter und keine Abhängigkeiten von Hymui Core. Local und
Self-hosted bleiben ohne Google-Cloud-Konto vollständig nutzbar.

### Nicht Teil der neuen Grundlage

- Astro
- React
- Prisma
- Tailwind
- CSS-in-JS
- Inline-CSS in Vue- oder TypeScript-Dateien
- fachliche Serverlogik in Nuxt-Routen

Frontend, Backend und Worker bleiben auch im Monorepo getrennte Anwendungen.
Vue-Komponenten greifen niemals direkt auf Datenbanken, Speicheranbieter oder
Modellanbieter zu.

## Designprinzipien

- ruhig, dunkel und leicht macOS-inspiriert, aber plattformneutral
- wiederverwendbare Komponenten statt kopierter Controls
- zugänglich mit Maus, Touch und Tastatur
- keine fest eingebauten UI-Texte außerhalb des Übersetzungssystems
- zentrale Design-Tokens und eigenständige SCSS-Module
- Plugin-fähige Bausteine statt fest verdrahteter Einzellösungen

## Entwicklungsweg

Hymui beginnt mit technischen Beweisen, bevor Produktfunktionen gebaut werden:

1. identische Web-App für Local, Self-hosted und Hosted
2. getrenntes Frontend, Backend und Worker
3. portable Datenbank- und Speicheradapter
4. dockerfreie Local-Paketierung für macOS und Linux
5. kontrollierte, abbrechbare und wiederaufnehmbare Agent-Läufe
6. Föderation zwischen zwei unabhängigen Instanzen
7. erst danach Projekte, Boards, Docs und Planner

Das verhindert, dass Portabilität, Local-Betrieb, Sicherheit oder
Providerneutralität später nachträglich an eine festgefahrene Architektur
angebaut werden.

## Geplante erste Plattformen

- Web: moderne Browser auf macOS, Linux und Windows
- Local/Desktop: zuerst macOS, danach Linux
- Windows Local/Desktop: nach dem ersten stabilen Release
- Self-hosted: Docker Compose auf amd64 und arm64

## Projektstatus

Foundation Plan 01 ist als lauffähiges Monorepo umgesetzt. Plan 02 läuft:
Local speichert jetzt Actors, passwortgestützte oder kontofreie Profile,
gehashte Sessions, Owner-autorisierte Projekte in PGlite und per Prüfsumme
verifizierte Objekte im lokalen Dateispeicher. Login, Logout,
Projektanlage, Persistenz nach dem Neuladen und die Web → API →
Worker-Diagnose sind durch automatisierte Integrations- und Browser-Tests
abgedeckt. Diagnose-Jobs behalten ihre Correlation-ID und werden nach einer
abgelaufenen Worker-Lease bei einem Neustart wiederaufgenommen.

Cloud-Object-Storage-Adapter, Server-Datenbankadapter, Föderation und
produktive Deployment-Werkzeuge bleiben bewusst spätere Teilabschnitte.

Entwicklungssetup und Prüfungen sind in
[`docs/development.md`](./docs/development.md) dokumentiert. Self-hosting,
Backups, Updates und die Installation für Endnutzer sind noch nicht
veröffentlicht.

Die geplante SemVer-Version des ersten Dev-Releases ist `6.0.0-dev.0`.

## Produktpläne

Die aktuellen Architektur- und Feature-Pläne liegen unter
[`docs/hymui`](./docs/hymui/README.md). Sie definieren die aktuelle
Produktausrichtung von Hymui und ihr neues technisches Fundament.

## Mitwirken

In dieser frühen Phase sind besonders Rückmeldungen zu folgenden Themen
hilfreich:

- Local-first Installation und Updates
- Datenbank- und Speicherportabilität
- sichere Agent-Freigaben
- dezentrale Identität und Föderation
- barrierefreie, wiederverwendbare UI-Komponenten
- allgemeine Projektvorlagen außerhalb der Softwareentwicklung

Bitte beachte, dass noch keine stabile Plugin- oder Integrations-API
veröffentlicht wurde.
