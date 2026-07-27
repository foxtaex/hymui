<script setup lang="ts">
import type {
  AuthSession,
  DiagnosticJob,
  HealthResponse,
  Project,
  ProjectList,
} from "@hymui/contracts";
import { localeOptions, type Locale } from "@hymui/i18n";
import {
  AppShell,
  HmAvatar,
  HmBadge,
  HmButton,
  HmFloatingWindow,
  HmIconButton,
  HmInput,
  HmLiquidSurface,
  HmPanel,
  HmSegmentedControl,
  HmSelect,
  type AppNavItem,
  type AppNavPosition,
  type SegmentedOption,
} from "@hymui/ui";
import {
  Bot,
  CalendarDays,
  CircleAlert,
  CircleCheck,
  ChevronRight,
  Columns3,
  FileText,
  Folder,
  LayoutGrid,
  LogOut,
  Monitor,
  Moon,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  PenTool,
  Plus,
  Search,
  Sun,
  UserRound,
  X,
} from "@lucide/vue";

const { copy, locale, setLocale } = useHymuiI18n();
const runtime = useRuntimeConfig();
const active = ref("projects");
type ResolvedTheme = "dark" | "light";
type ThemeMode = ResolvedTheme | "system";

const theme = ref<ResolvedTheme>("dark");
const themeMode = ref<ThemeMode>("dark");
const navPosition = ref<AppNavPosition>("bottom");
const query = ref("");
const authSession = ref<AuthSession | null>(null);
const authLoading = ref(true);
const authMode = ref<"login" | "register">("register");
const authUsername = ref("");
const authDisplayName = ref("");
const authPassword = ref("");
const authError = ref("");
const projects = ref<Project[]>([]);
const projectsLoading = ref(false);
const projectCreating = ref(false);
const newProjectOpen = ref(false);
const newProjectName = ref("");
const newProjectDescription = ref("");
const projectError = ref("");
const health = ref<HealthResponse | null>(null);
const healthError = ref(false);
const job = ref<DiagnosticJob | null>(null);
const diagnosticError = ref(false);
const notice = ref("");
const settingsOpen = ref(false);
let pollTimer: ReturnType<typeof setTimeout> | undefined;
let noticeTimer: ReturnType<typeof setTimeout> | undefined;
let systemThemeQuery: MediaQueryList | undefined;

const nav = computed<ReadonlyArray<AppNavItem>>(() => [
  { icon: LayoutGrid, id: "projects", label: copy.value.nav.projects },
  { icon: Columns3, id: "board", label: copy.value.nav.board },
  { icon: FileText, id: "docs", label: copy.value.nav.docs },
  { icon: CalendarDays, id: "planner", label: copy.value.nav.planner },
  { icon: PenTool, id: "whiteboard", label: copy.value.nav.whiteboard },
  { icon: Bot, id: "agents", label: copy.value.nav.agents },
]);
const navPositionOptions = computed<ReadonlyArray<SegmentedOption>>(() => [
  { icon: PanelTop, label: copy.value.app.navigationTop, value: "top" },
  { icon: PanelBottom, label: copy.value.app.navigationBottom, value: "bottom" },
  { icon: PanelLeft, label: copy.value.app.navigationLeft, value: "left" },
  { icon: PanelRight, label: copy.value.app.navigationRight, value: "right" },
]);
const themeModeOptions = computed<ReadonlyArray<SegmentedOption>>(() => [
  { icon: Sun, label: copy.value.app.themeLightName, value: "light" },
  { icon: Monitor, label: copy.value.app.themeSystemName, value: "system" },
  { icon: Moon, label: copy.value.app.themeDarkName, value: "dark" },
]);
const settingsPlacement = computed(() =>
  navPosition.value === "right" ? "bottom-start" : "bottom-end",
);

const activeLabel = computed(() => nav.value.find((item) => item.id === active.value)?.label ?? "");
const filteredProjects = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return projects.value;
  return projects.value.filter(
    (project) =>
      project.name.toLowerCase().includes(needle) ||
      project.description.toLowerCase().includes(needle),
  );
});
const activeProjects = computed(() =>
  filteredProjects.value.filter((project) => !project.archived),
);
const archivedProjectCount = computed(
  () => projects.value.filter((project) => project.archived).length,
);
const healthLabel = computed(() => {
  if (healthError.value) return copy.value.health.degraded;
  if (!health.value) return copy.value.health.checking;
  return health.value.worker === "ready" ? copy.value.health.ready : copy.value.health.degraded;
});
const diagnosticLabel = computed(() => {
  if (diagnosticError.value) return copy.value.diagnostic.failed;
  if (!job.value) return copy.value.diagnostic.idle;
  if (job.value.status === "completed") return copy.value.diagnostic.completed;
  return copy.value.diagnostic.running;
});

async function loadHealth(): Promise<void> {
  try {
    health.value = await $fetch<HealthResponse>(`${runtime.public.apiBase}/api/v1/health`);
    healthError.value = false;
  } catch {
    healthError.value = true;
  }
}

async function pollJob(id: string): Promise<void> {
  try {
    job.value = await $fetch<DiagnosticJob>(
      `${runtime.public.apiBase}/api/v1/diagnostics/jobs/${id}`,
    );
    if (job.value.status === "queued" || job.value.status === "running") {
      pollTimer = setTimeout(() => void pollJob(id), 160);
    }
  } catch {
    diagnosticError.value = true;
  }
}

async function runDiagnostic(): Promise<void> {
  diagnosticError.value = false;
  if (pollTimer) clearTimeout(pollTimer);
  try {
    job.value = await $fetch<DiagnosticJob>(`${runtime.public.apiBase}/api/v1/diagnostics/jobs`, {
      body: { message: "Verify Hymui Foundation Plan 01" },
      method: "POST",
    });
    await pollJob(job.value.id);
  } catch {
    diagnosticError.value = true;
  }
}

async function loadProjects(): Promise<void> {
  if (!authSession.value) return;
  projectsLoading.value = true;
  projectError.value = "";
  try {
    const response = await $fetch<ProjectList>(`${runtime.public.apiBase}/api/v1/projects`, {
      credentials: "include",
    });
    projects.value = response.projects;
  } catch {
    projectError.value =
      locale.value === "de"
        ? "Projekte konnten nicht geladen werden."
        : "Projects could not be loaded.";
  } finally {
    projectsLoading.value = false;
  }
}

async function initializeSession(): Promise<void> {
  authLoading.value = true;
  try {
    authSession.value = await $fetch<AuthSession>(`${runtime.public.apiBase}/api/v1/auth/session`, {
      credentials: "include",
    });
    await loadProjects();
  } catch {
    authSession.value = null;
  } finally {
    authLoading.value = false;
  }
}

async function submitAuth(): Promise<void> {
  authLoading.value = true;
  authError.value = "";
  try {
    const endpoint = authMode.value === "register" ? "register" : "login";
    const body =
      authMode.value === "register"
        ? {
            displayName: authDisplayName.value.trim(),
            password: authPassword.value,
            username: authUsername.value.trim().toLowerCase(),
          }
        : {
            password: authPassword.value,
            username: authUsername.value.trim().toLowerCase(),
          };
    authSession.value = await $fetch<AuthSession>(
      `${runtime.public.apiBase}/api/v1/auth/${endpoint}`,
      {
        body,
        credentials: "include",
        method: "POST",
      },
    );
    authPassword.value = "";
    await loadProjects();
  } catch {
    authError.value =
      locale.value === "de"
        ? "Anmeldung fehlgeschlagen. Prüfe die Angaben oder nutze das lokale Profil."
        : "Authentication failed. Check the details or use the local profile.";
  } finally {
    authLoading.value = false;
  }
}

async function continueLocally(): Promise<void> {
  authLoading.value = true;
  authError.value = "";
  try {
    authSession.value = await $fetch<AuthSession>(`${runtime.public.apiBase}/api/v1/auth/local`, {
      credentials: "include",
      method: "POST",
    });
    await loadProjects();
  } catch {
    authError.value =
      locale.value === "de"
        ? "Das lokale Profil konnte nicht geöffnet werden."
        : "The local profile could not be opened.";
  } finally {
    authLoading.value = false;
  }
}

async function signOut(): Promise<void> {
  await $fetch(`${runtime.public.apiBase}/api/v1/auth/logout`, {
    credentials: "include",
    method: "POST",
  });
  authSession.value = null;
  projects.value = [];
  settingsOpen.value = false;
  authMode.value = "login";
}

async function createProject(): Promise<void> {
  if (projectCreating.value) return;
  projectError.value = "";
  projectCreating.value = true;
  try {
    const project = await $fetch<Project>(`${runtime.public.apiBase}/api/v1/projects`, {
      body: {
        description: newProjectDescription.value.trim(),
        name: newProjectName.value.trim(),
      },
      credentials: "include",
      method: "POST",
    });
    projects.value = [...projects.value, project];
    newProjectName.value = "";
    newProjectDescription.value = "";
    newProjectOpen.value = false;
    showNotice(copy.value.projects.created);
  } catch {
    projectError.value =
      locale.value === "de"
        ? "Das Projekt konnte nicht erstellt werden."
        : "The project could not be created.";
  } finally {
    projectCreating.value = false;
  }
}

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function selectLocale(value: string): void {
  setLocale(value as Locale);
}

function selectNavPosition(value: string): void {
  if (value !== "top" && value !== "bottom" && value !== "left" && value !== "right") return;
  navPosition.value = value;
  localStorage.setItem("hymui.navPosition", value);
}

function resolvedSystemTheme(): ResolvedTheme {
  return systemThemeQuery?.matches ? "dark" : "light";
}

function applyTheme(nextTheme: ResolvedTheme, animate = true): void {
  const root = document.documentElement;
  const commitTheme = (): void => {
    theme.value = nextTheme;
    root.dataset.theme = nextTheme;
  };
  const startViewTransition = document.startViewTransition?.bind(document);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (!animate || reducedMotion || theme.value === nextTheme || !startViewTransition) {
    commitTheme();
    return;
  }

  const source = document.querySelector<HTMLElement>(".user-settings__theme-control");
  const bounds = source?.getBoundingClientRect();
  const x = bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2;
  const y = bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2;
  const radius = Math.hypot(
    Math.max(x, window.innerWidth - x),
    Math.max(y, window.innerHeight - y),
  );

  root.style.setProperty("--theme-transition-x", `${x}px`);
  root.style.setProperty("--theme-transition-y", `${y}px`);
  root.style.setProperty("--theme-transition-radius", `${radius}px`);
  root.dataset.themeTransition = "active";

  const transition = startViewTransition(commitTheme);
  void transition.finished.finally(() => {
    delete root.dataset.themeTransition;
    root.style.removeProperty("--theme-transition-x");
    root.style.removeProperty("--theme-transition-y");
    root.style.removeProperty("--theme-transition-radius");
  });
}

function saveThemeMode(mode: ThemeMode): void {
  localStorage.setItem("hymui.themeMode", mode);
  if (mode !== "system") localStorage.setItem("hymui.theme", mode);
}

function selectThemeMode(value: string): void {
  if (value !== "light" && value !== "dark" && value !== "system") return;
  themeMode.value = value;
  saveThemeMode(themeMode.value);
  applyTheme(value === "system" ? resolvedSystemTheme() : value);
}

function handleSystemThemeChange(event: MediaQueryListEvent): void {
  if (themeMode.value === "system") applyTheme(event.matches ? "dark" : "light");
}

function openProject(): void {
  active.value = "board";
}

function showNewProjectNotice(): void {
  projectError.value = "";
  newProjectOpen.value = true;
}

function handleEmptyProjectsAction(): void {
  if (query.value) {
    query.value = "";
    return;
  }
  showNewProjectNotice();
}

function showNotice(message: string): void {
  if (noticeTimer) clearTimeout(noticeTimer);
  notice.value = message;
  noticeTimer = setTimeout(() => {
    notice.value = "";
    noticeTimer = undefined;
  }, 3200);
}

onMounted(() => {
  systemThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
  systemThemeQuery.addEventListener("change", handleSystemThemeChange);
  const savedThemeMode = localStorage.getItem("hymui.themeMode");
  const legacyTheme = localStorage.getItem("hymui.theme");
  if (savedThemeMode === "light" || savedThemeMode === "dark" || savedThemeMode === "system") {
    themeMode.value = savedThemeMode;
  } else if (legacyTheme === "light" || legacyTheme === "dark") {
    themeMode.value = legacyTheme;
  }
  applyTheme(themeMode.value === "system" ? resolvedSystemTheme() : themeMode.value, false);
  const savedNavPosition = localStorage.getItem("hymui.navPosition");
  if (
    savedNavPosition === "top" ||
    savedNavPosition === "bottom" ||
    savedNavPosition === "left" ||
    savedNavPosition === "right"
  ) {
    navPosition.value = savedNavPosition;
  }
  void loadHealth();
  void initializeSession();
});

onBeforeUnmount(() => {
  if (pollTimer) clearTimeout(pollTimer);
  if (noticeTimer) clearTimeout(noticeTimer);
  systemThemeQuery?.removeEventListener("change", handleSystemThemeChange);
});
</script>

<template>
  <AppShell :active="active" :nav="nav" :nav-position="navPosition" @navigate="active = $event">
    <template #actions>
      <div v-if="authSession" class="user-settings">
        <HmIconButton
          :aria-expanded="settingsOpen"
          :class="{ 'user-settings__trigger--active': settingsOpen }"
          data-testid="user-settings-action"
          :label="copy.app.settings"
          variant="quiet"
          @click="settingsOpen = !settingsOpen"
        >
          <UserRound :size="18" :stroke-width="1.5" />
        </HmIconButton>

        <HmFloatingWindow
          v-if="settingsOpen"
          class="user-settings__panel"
          :initial-placement="settingsPlacement"
          :label="copy.app.settings"
          size="sm"
        >
          <template #titlebar>
            <header class="user-settings__header">
              <div class="user-settings__profile">
                <HmAvatar :name="authSession.actor.displayName" size="md" />
                <div>
                  <strong>{{ authSession.actor.displayName }}</strong>
                  <span>@{{ authSession.actor.username }}</span>
                </div>
              </div>
              <HmIconButton
                :label="locale === 'de' ? 'Einstellungen schließen' : 'Close settings'"
                size="md"
                variant="quiet"
                @click="settingsOpen = false"
              >
                <X :size="17" :stroke-width="1.5" />
              </HmIconButton>
            </header>
          </template>

          <div class="user-settings__field">
            <span>{{ copy.app.language }}</span>
            <HmSelect
              id="language"
              :label="copy.app.language"
              :model-value="locale"
              :options="localeOptions"
              hide-label
              @update:model-value="selectLocale"
            />
          </div>

          <div class="user-settings__field user-settings__field--stacked">
            <span>{{ copy.app.appearance }}</span>
            <div class="user-settings__appearance">
              <div
                class="user-settings__appearance-row user-settings__appearance-row--desktop-navigation user-settings__appearance-row--stacked"
              >
                <span>{{ copy.app.navigationPosition }}</span>
                <HmSegmentedControl
                  id="navigation-position"
                  class="user-settings__navigation-control"
                  :label="copy.app.navigationPosition"
                  :model-value="navPosition"
                  :options="navPositionOptions"
                  @update:model-value="selectNavPosition"
                />
              </div>

              <div class="user-settings__appearance-row user-settings__appearance-row--stacked">
                <span>{{ copy.app.colorScheme }}</span>
                <HmSegmentedControl
                  id="theme-mode"
                  class="user-settings__theme-control"
                  :label="copy.app.colorScheme"
                  :model-value="themeMode"
                  :options="themeModeOptions"
                  @update:model-value="selectThemeMode"
                />
              </div>
            </div>
          </div>

          <HmButton size="md" variant="secondary" @click="signOut">
            <template #icon>
              <LogOut :size="16" :stroke-width="1.5" />
            </template>
            {{ copy.app.signOut }}
          </HmButton>
        </HmFloatingWindow>
      </div>
    </template>

    <HmFloatingWindow
      v-if="newProjectOpen && authSession"
      class="new-project-window"
      :label="copy.projects.createTitle"
      size="sm"
    >
      <template #titlebar>
        <header class="new-project-window__header">
          <strong>{{ copy.projects.createTitle }}</strong>
          <HmIconButton
            :label="copy.projects.cancel"
            size="md"
            variant="quiet"
            @click="newProjectOpen = false"
          >
            <X :size="17" :stroke-width="1.5" />
          </HmIconButton>
        </header>
      </template>
      <form class="new-project-window__form" @submit.prevent="createProject">
        <HmInput
          id="new-project-name"
          v-model="newProjectName"
          :label="copy.projects.createTitle"
        />
        <HmInput
          id="new-project-description"
          v-model="newProjectDescription"
          :label="copy.projects.description"
        />
        <p v-if="projectError" class="form-error" role="alert">{{ projectError }}</p>
        <div class="new-project-window__actions">
          <HmButton variant="secondary" @click="newProjectOpen = false">
            {{ copy.projects.cancel }}
          </HmButton>
          <HmButton :disabled="!newProjectName.trim()" :loading="projectCreating" type="submit">
            {{ copy.projects.create }}
          </HmButton>
        </div>
      </form>
    </HmFloatingWindow>

    <div v-if="authLoading" class="auth-page">
      <HmLiquidSurface level="focus" class="auth-card">
        <HmBadge mono>{{ copy.health.checking }}</HmBadge>
      </HmLiquidSurface>
    </div>

    <div v-else-if="!authSession" class="auth-page">
      <HmLiquidSurface level="focus" corner-module class="auth-card">
        <div class="auth-card__heading">
          <img src="/logo/hymui/hymui-mark-vivid.svg" alt="" />
          <div>
            <p class="page-heading__eyebrow">{{ copy.app.edition }}</p>
            <h1>{{ copy.auth.title }}</h1>
            <p>{{ copy.auth.subtitle }}</p>
          </div>
        </div>

        <form class="auth-card__form" @submit.prevent="submitAuth">
          <HmInput id="auth-username" v-model="authUsername" :label="copy.auth.username" />
          <HmInput
            v-if="authMode === 'register'"
            id="auth-display-name"
            v-model="authDisplayName"
            :label="copy.auth.displayName"
          />
          <HmInput
            id="auth-password"
            v-model="authPassword"
            :label="copy.auth.password"
            type="password"
          />
          <p v-if="authError" class="form-error" role="alert">{{ authError }}</p>
          <HmButton
            :disabled="
              !authUsername.trim() ||
              !authPassword ||
              (authMode === 'register' && !authDisplayName.trim())
            "
            type="submit"
          >
            {{ authMode === "register" ? copy.auth.createAccount : copy.auth.loginAction }}
          </HmButton>
        </form>

        <div class="auth-card__alternatives">
          <button
            class="auth-card__mode"
            type="button"
            @click="authMode = authMode === 'register' ? 'login' : 'register'"
          >
            {{ authMode === "register" ? copy.auth.existingAccount : copy.auth.newAccount }}
          </button>
          <span aria-hidden="true" />
          <HmButton data-testid="local-profile-action" variant="secondary" @click="continueLocally">
            {{ copy.auth.localAction }}
          </HmButton>
        </div>
      </HmLiquidSurface>
    </div>

    <div v-else-if="active === 'projects'" class="projects-page">
      <div class="projects-page__inner">
        <header class="page-heading">
          <div>
            <p class="page-heading__eyebrow">{{ copy.app.eyebrow }}</p>
            <h1>{{ copy.app.title }}</h1>
          </div>
          <div class="page-heading__actions">
            <HmInput
              id="project-search"
              v-model="query"
              class="projects-search"
              :label="copy.projects.search"
              :placeholder="copy.projects.search"
              type="search"
            >
              <template #icon>
                <Search :size="16" :stroke-width="1.5" />
              </template>
            </HmInput>
            <HmButton @click="showNewProjectNotice">
              <template #icon>
                <Plus :size="16" :stroke-width="1.7" />
              </template>
              {{ copy.projects.new }}
            </HmButton>
          </div>
        </header>

        <Transition name="projects-notice">
          <p
            v-if="notice || projectError"
            class="projects-notice"
            :class="{ 'projects-notice--error': projectError }"
            :role="projectError ? 'alert' : 'status'"
            aria-live="polite"
          >
            <CircleAlert v-if="projectError" :size="16" :stroke-width="1.7" aria-hidden="true" />
            <CircleCheck v-else :size="16" :stroke-width="1.7" aria-hidden="true" />
            <span>{{ projectError || notice }}</span>
          </p>
        </Transition>

        <HmButton
          class="archive-row"
          size="md"
          variant="quiet"
          @click="showNotice(copy.projects.archiveEmpty)"
        >
          <template #icon>
            <Folder :size="17" :stroke-width="1.5" />
          </template>
          <strong>{{ copy.projects.archive }}</strong>
          <span>{{ copy.projects.archivedCount }} · {{ archivedProjectCount }}</span>
          <template #trailing>
            <ChevronRight :size="16" :stroke-width="1.5" />
          </template>
        </HmButton>

        <section class="project-grid" :aria-label="copy.projects.region">
          <p v-if="projectsLoading" class="projects-empty">{{ copy.health.checking }}</p>
          <div v-else-if="activeProjects.length === 0" class="projects-empty">
            <span class="projects-empty__icon" aria-hidden="true">
              <Folder :size="22" :stroke-width="1.5" />
            </span>
            <strong>{{ query ? copy.projects.emptySearch : copy.projects.emptyTitle }}</strong>
            <p>{{ query ? copy.projects.emptySearchHint : copy.projects.empty }}</p>
            <HmButton size="md" variant="secondary" @click="handleEmptyProjectsAction">
              {{ query ? copy.projects.clearSearch : copy.projects.new }}
            </HmButton>
          </div>
          <HmPanel
            v-for="project in activeProjects"
            :key="project.id"
            interactive
            class="project-card"
            tabindex="0"
            @click="openProject"
            @keydown.enter="openProject"
          >
            <div class="project-card__heading">
              <div>
                <h2>{{ project.name }}</h2>
                <p>{{ project.description }}</p>
              </div>
              <HmBadge tone="accent" mono>
                {{ copy.projects.revision }} {{ project.revision }}
              </HmBadge>
            </div>
            <div class="project-card__meta">
              <div class="project-card__members">
                <HmAvatar :name="authSession.actor.displayName" size="md" />
              </div>
              <span class="project-card__dot" aria-hidden="true" />
              <span>{{ copy.projects.owner }} · @{{ authSession.actor.username }}</span>
              <span class="project-card__dot" aria-hidden="true" />
              <span>{{ formatProjectDate(project.updatedAt) }}</span>
            </div>
          </HmPanel>
        </section>

        <HmLiquidSurface level="panel" corner-module class="diagnostic-card">
          <div class="diagnostic-card__copy">
            <p class="diagnostic-card__eyebrow">FOUNDATION · WEB → API → WORKER</p>
            <h2>{{ copy.diagnostic.title }}</h2>
            <p>{{ copy.diagnostic.description }}</p>
          </div>
          <div class="diagnostic-card__state">
            <HmBadge
              :tone="health?.worker === 'ready' ? 'success' : healthError ? 'danger' : 'neutral'"
              mono
            >
              {{ healthLabel }}
            </HmBadge>
            <p role="status">{{ diagnosticLabel }}</p>
            <code v-if="job?.result">{{ job.result }}</code>
          </div>
          <HmButton
            :loading="job?.status === 'queued' || job?.status === 'running'"
            @click="runDiagnostic"
          >
            {{ copy.diagnostic.action }}
          </HmButton>
        </HmLiquidSurface>
      </div>
    </div>

    <div v-else class="feature-placeholder">
      <HmLiquidSurface level="panel" corner-module class="feature-placeholder__panel">
        <p class="page-heading__eyebrow">FOUNDATION · RESERVED PRODUCT AREA</p>
        <h1>{{ activeLabel }}</h1>
        <p>
          {{
            locale === "de"
              ? "Die Navigation und Komponenten stehen. Dieses Produktmodul folgt nach dem technischen Fundament."
              : "Navigation and shared components are ready. This product module follows the technical foundation."
          }}
        </p>
        <HmButton variant="secondary" @click="active = 'projects'">
          {{ copy.nav.projects }}
        </HmButton>
      </HmLiquidSurface>
    </div>
  </AppShell>
</template>
