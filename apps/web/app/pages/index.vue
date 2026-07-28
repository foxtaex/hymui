<script setup lang="ts">
import type {
  AuthCapabilities,
  AuthSession,
  DiagnosticJob,
  ErrorResponse,
  HealthResponse,
  Project,
  ProjectAttachment,
  ProjectAttachmentList,
  ProjectLink,
  ProjectList,
} from "@hymui/contracts";
import type { Locale } from "@hymui/i18n";
import {
  AppShell,
  HmButton,
  HmIconButton,
  HmLiquidSurface,
  type AppNavItem,
  type AppNavPosition,
} from "@hymui/ui";
import { Bot, CalendarDays, Columns3, FileText, LayoutGrid, PenTool, UserRound } from "@lucide/vue";
import { AnimatePresence, motion } from "motion-v";
import { watch } from "vue";

const { copy, locale, setLocale } = useHymuiI18n();
const runtime = useRuntimeConfig();
const active = ref("projects");
type ResolvedTheme = "dark" | "light";
type ThemeMode = ResolvedTheme | "system";

const theme = ref<ResolvedTheme>("dark");
const themeMode = ref<ThemeMode>("dark");
const navPosition = ref<AppNavPosition>("bottom");
type AuthErrorCode =
  | "AUTH_FAILED"
  | "INVALID_CREDENTIALS"
  | "INVALID_REQUEST"
  | "LOCAL_AUTH_DISABLED"
  | "LOCAL_PROFILE_CONFLICT"
  | "REGISTRATION_CLOSED"
  | "USERNAME_TAKEN";

const authSession = ref<AuthSession | null>(null);
const authCapabilities = ref<AuthCapabilities | null>(null);
const authInitializing = ref(true);
const authSubmitting = ref(false);
const authErrorCode = ref<AuthErrorCode | "">("");
const projects = ref<Project[]>([]);
const attachments = ref<ProjectAttachment[]>([]);
const attachmentsLoading = ref(false);
const attachmentUploading = ref(false);
const attachmentDeletingIds = ref<string[]>([]);
const attachmentDownloadingIds = ref<string[]>([]);
const attachmentError = ref("");
const selectedProjectId = ref<string | null>(null);
const projectsLoading = ref(false);
const projectCreating = ref(false);
const editingProject = ref<Project | null>(null);
const deletingProject = ref<Project | null>(null);
const projectDeleting = ref(false);
const projectDeleteError = ref("");
const updatingProjectIds = ref<string[]>([]);
const newProjectOpen = ref(false);
const newProjectFormKey = ref(0);
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

const activeLabel = computed(() => nav.value.find((item) => item.id === active.value)?.label ?? "");
const selectedProject = computed(
  () => projects.value.find((project) => project.id === selectedProjectId.value) ?? null,
);
const effectiveAuthCapabilities = computed<AuthCapabilities>(
  () =>
    authCapabilities.value ?? {
      edition: health.value?.edition ?? "local",
      localProfileAvailable: (health.value?.edition ?? "local") === "local",
      registrationOpen: true,
    },
);
const authError = computed(() => {
  switch (authErrorCode.value) {
    case "INVALID_CREDENTIALS":
      return copy.value.auth.invalidCredentials;
    case "INVALID_REQUEST":
      return copy.value.auth.invalidRequest;
    case "USERNAME_TAKEN":
      return copy.value.auth.usernameTaken;
    case "REGISTRATION_CLOSED":
      return copy.value.auth.registrationClosed;
    case "LOCAL_AUTH_DISABLED":
    case "LOCAL_PROFILE_CONFLICT":
      return copy.value.auth.localUnavailable;
    case "AUTH_FAILED":
      return copy.value.auth.genericError;
    default:
      return "";
  }
});

function authCodeFrom(error: unknown): AuthErrorCode {
  const code = responseCodeFrom(error);
  if (
    code === "INVALID_CREDENTIALS" ||
    code === "INVALID_REQUEST" ||
    code === "LOCAL_AUTH_DISABLED" ||
    code === "LOCAL_PROFILE_CONFLICT" ||
    code === "REGISTRATION_CLOSED" ||
    code === "USERNAME_TAKEN"
  ) {
    return code;
  }
  return "AUTH_FAILED";
}

function responseCodeFrom(error: unknown): string | undefined {
  if (typeof error !== "object" || error === null || !("data" in error)) return undefined;
  const data = (error as { data?: unknown }).data;
  if (typeof data !== "object" || data === null || !("code" in data)) return undefined;
  return (data as ErrorResponse).code;
}

async function loadHealth(): Promise<void> {
  try {
    health.value = await $fetch<HealthResponse>(`${runtime.public.apiBase}/api/v1/health`);
    healthError.value = false;
  } catch {
    healthError.value = true;
  }
}

async function refreshAuthCapabilities(): Promise<void> {
  try {
    authCapabilities.value = await $fetch<AuthCapabilities>(
      `${runtime.public.apiBase}/api/v1/auth/capabilities`,
    );
  } catch {
    // Keep the last known capabilities while the API reconnects.
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

async function loadAttachments(projectId: string): Promise<void> {
  if (!authSession.value) return;
  attachmentsLoading.value = true;
  attachmentError.value = "";
  try {
    const response = await $fetch<ProjectAttachmentList>(
      `${runtime.public.apiBase}/api/v1/projects/${projectId}/attachments`,
      { credentials: "include" },
    );
    if (selectedProjectId.value === projectId) attachments.value = response.attachments;
  } catch {
    if (selectedProjectId.value === projectId) {
      attachments.value = [];
      attachmentError.value = copy.value.projects.attachmentLoadFailed;
    }
  } finally {
    if (selectedProjectId.value === projectId) attachmentsLoading.value = false;
  }
}

async function uploadAttachment(file: File): Promise<void> {
  const projectId = selectedProjectId.value;
  if (!projectId || attachmentUploading.value) return;
  if (file.size > 20 * 1_024 * 1_024) {
    attachmentError.value = copy.value.projects.attachmentTooLarge;
    return;
  }
  attachmentUploading.value = true;
  attachmentError.value = "";
  try {
    const attachment = await $fetch<ProjectAttachment>(
      `${runtime.public.apiBase}/api/v1/projects/${projectId}/attachments`,
      {
        body: file,
        credentials: "include",
        headers: {
          "content-type": "application/octet-stream",
          "x-hymui-file-content-type": file.type || "application/octet-stream",
          "x-hymui-file-name": encodeURIComponent(file.name),
        },
        method: "POST",
      },
    );
    if (selectedProjectId.value === projectId)
      attachments.value = [...attachments.value, attachment];
  } catch {
    attachmentError.value = copy.value.projects.attachmentUploadFailed;
  } finally {
    attachmentUploading.value = false;
  }
}

async function downloadAttachment(attachment: ProjectAttachment): Promise<void> {
  if (attachmentDownloadingIds.value.includes(attachment.id)) return;
  attachmentDownloadingIds.value = [...attachmentDownloadingIds.value, attachment.id];
  attachmentError.value = "";
  try {
    const body = await $fetch<Blob>(
      `${runtime.public.apiBase}/api/v1/attachments/${attachment.id}/content`,
      {
        credentials: "include",
        responseType: "blob",
      },
    );
    const url = URL.createObjectURL(body);
    const link = document.createElement("a");
    link.href = url;
    link.download = attachment.fileName;
    link.click();
    URL.revokeObjectURL(url);
  } catch {
    attachmentError.value = copy.value.projects.attachmentDownloadFailed;
  } finally {
    attachmentDownloadingIds.value = attachmentDownloadingIds.value.filter(
      (id) => id !== attachment.id,
    );
  }
}

async function deleteAttachment(attachment: ProjectAttachment): Promise<void> {
  if (attachmentDeletingIds.value.includes(attachment.id)) return;
  attachmentDeletingIds.value = [...attachmentDeletingIds.value, attachment.id];
  attachmentError.value = "";
  try {
    await $fetch(`${runtime.public.apiBase}/api/v1/attachments/${attachment.id}`, {
      credentials: "include",
      method: "DELETE",
    });
    attachments.value = attachments.value.filter((item) => item.id !== attachment.id);
  } catch {
    attachmentError.value = copy.value.projects.attachmentDeleteFailed;
  } finally {
    attachmentDeletingIds.value = attachmentDeletingIds.value.filter((id) => id !== attachment.id);
  }
}

async function initializeSession(): Promise<void> {
  authInitializing.value = true;
  const [sessionResult, capabilitiesResult] = await Promise.allSettled([
    $fetch<AuthSession>(`${runtime.public.apiBase}/api/v1/auth/session`, {
      credentials: "include",
    }),
    $fetch<AuthCapabilities>(`${runtime.public.apiBase}/api/v1/auth/capabilities`),
  ]);

  if (capabilitiesResult.status === "fulfilled") {
    authCapabilities.value = capabilitiesResult.value;
  }
  if (sessionResult.status === "fulfilled") {
    authSession.value = sessionResult.value;
    await loadProjects();
  } else {
    authSession.value = null;
  }
  authInitializing.value = false;
}

async function submitAuth(input: {
  displayName: string;
  mode: "login" | "register";
  password: string;
  username: string;
}): Promise<void> {
  authSubmitting.value = true;
  authErrorCode.value = "";
  try {
    const endpoint = input.mode === "register" ? "register" : "login";
    const body =
      input.mode === "register"
        ? {
            displayName: input.displayName,
            password: input.password,
            username: input.username,
          }
        : {
            password: input.password,
            username: input.username,
          };
    authSession.value = await $fetch<AuthSession>(
      `${runtime.public.apiBase}/api/v1/auth/${endpoint}`,
      {
        body,
        credentials: "include",
        method: "POST",
      },
    );
    await loadProjects();
  } catch (error) {
    authErrorCode.value = authCodeFrom(error);
  } finally {
    authSubmitting.value = false;
  }
}

async function continueLocally(): Promise<void> {
  authSubmitting.value = true;
  authErrorCode.value = "";
  try {
    authSession.value = await $fetch<AuthSession>(`${runtime.public.apiBase}/api/v1/auth/local`, {
      credentials: "include",
      method: "POST",
    });
    await loadProjects();
  } catch (error) {
    authErrorCode.value = authCodeFrom(error);
  } finally {
    authSubmitting.value = false;
  }
}

async function signOut(): Promise<void> {
  await $fetch(`${runtime.public.apiBase}/api/v1/auth/logout`, {
    credentials: "include",
    method: "POST",
  });
  authSession.value = null;
  projects.value = [];
  attachments.value = [];
  settingsOpen.value = false;
  authErrorCode.value = "";
  await refreshAuthCapabilities();
}

async function createProject(input: {
  description: string;
  links: ProjectLink[];
  name: string;
}): Promise<void> {
  if (projectCreating.value) return;
  projectError.value = "";
  projectCreating.value = true;
  try {
    const project = await $fetch<Project>(`${runtime.public.apiBase}/api/v1/projects`, {
      body: input,
      credentials: "include",
      method: "POST",
    });
    projects.value = [...projects.value, project];
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

function openProject(project: Project): void {
  selectedProjectId.value = project.id;
}

watch(selectedProjectId, (projectId) => {
  attachments.value = [];
  attachmentError.value = "";
  if (projectId) void loadAttachments(projectId);
});

function navigateTo(section: string): void {
  active.value = section;
  if (section === "projects") selectedProjectId.value = null;
}

function showNewProjectNotice(): void {
  projectError.value = "";
  newProjectFormKey.value += 1;
  newProjectOpen.value = true;
}

function showProjectEditor(project: Project): void {
  projectError.value = "";
  editingProject.value = project;
}

function showProjectDelete(project: Project): void {
  projectDeleteError.value = "";
  deletingProject.value = project;
}

function showNotice(message: string): void {
  if (noticeTimer) clearTimeout(noticeTimer);
  notice.value = message;
  noticeTimer = setTimeout(() => {
    notice.value = "";
    noticeTimer = undefined;
  }, 3200);
}

async function updateProjectArchived(project: Project, archived: boolean): Promise<void> {
  if (updatingProjectIds.value.includes(project.id)) return;
  projectError.value = "";
  updatingProjectIds.value = [...updatingProjectIds.value, project.id];
  try {
    const updated = await $fetch<Project>(
      `${runtime.public.apiBase}/api/v1/projects/${project.id}`,
      {
        body: {
          archived,
          revision: project.revision,
        },
        credentials: "include",
        method: "PATCH",
      },
    );
    projects.value = projects.value.map((item) => (item.id === updated.id ? updated : item));
    if (archived && selectedProjectId.value === updated.id) selectedProjectId.value = null;
    showNotice(archived ? copy.value.projects.archived : copy.value.projects.restored);
  } catch {
    await loadProjects();
    projectError.value = copy.value.projects.updateFailed;
  } finally {
    updatingProjectIds.value = updatingProjectIds.value.filter((id) => id !== project.id);
  }
}

async function saveProjectDetails(input: {
  description: string;
  links: ProjectLink[];
  name: string;
  revision: number;
}): Promise<void> {
  const project = editingProject.value;
  if (!project || updatingProjectIds.value.includes(project.id)) return;
  projectError.value = "";
  updatingProjectIds.value = [...updatingProjectIds.value, project.id];
  try {
    const updated = await $fetch<Project>(
      `${runtime.public.apiBase}/api/v1/projects/${project.id}`,
      {
        body: input,
        credentials: "include",
        method: "PATCH",
      },
    );
    projects.value = projects.value.map((item) => (item.id === updated.id ? updated : item));
    editingProject.value = null;
    showNotice(copy.value.projects.updated);
  } catch (error) {
    const conflict = responseCodeFrom(error) === "PROJECT_REVISION_CONFLICT";
    if (conflict) {
      await loadProjects();
      editingProject.value = projects.value.find((item) => item.id === project.id) ?? null;
    }
    projectError.value = conflict
      ? copy.value.projects.updateConflict
      : copy.value.projects.updateFailed;
  } finally {
    updatingProjectIds.value = updatingProjectIds.value.filter((id) => id !== project.id);
  }
}

async function deleteProject(input: { name: string; revision: number }): Promise<void> {
  const project = deletingProject.value;
  if (!project || projectDeleting.value) return;
  projectDeleting.value = true;
  projectDeleteError.value = "";
  try {
    await $fetch(`${runtime.public.apiBase}/api/v1/projects/${project.id}`, {
      body: input,
      credentials: "include",
      method: "DELETE",
    });
    projects.value = projects.value.filter((item) => item.id !== project.id);
    deletingProject.value = null;
    showNotice(copy.value.projects.deleted);
  } catch {
    await loadProjects();
    projectDeleteError.value = copy.value.projects.deleteFailed;
  } finally {
    projectDeleting.value = false;
  }
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
  <AppShell
    :active="active"
    :nav="nav"
    :nav-position="navPosition"
    :navigation-visible="Boolean(authSession)"
    @navigate="navigateTo"
  >
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

        <AnimatePresence>
          <UserSettingsWindow
            v-if="settingsOpen"
            :actor="authSession.actor"
            :locale="locale"
            :nav-position="navPosition"
            :theme-mode="themeMode"
            @close="settingsOpen = false"
            @sign-out="signOut"
            @update:locale="selectLocale"
            @update:nav-position="selectNavPosition"
            @update:theme-mode="selectThemeMode"
          />
        </AnimatePresence>
      </div>
    </template>

    <AnimatePresence>
      <NewProjectWindow
        v-if="newProjectOpen && authSession"
        :error="projectError"
        :loading="projectCreating"
        :reset-token="newProjectFormKey"
        @close="newProjectOpen = false"
        @create="createProject"
      />
    </AnimatePresence>

    <AnimatePresence>
      <EditProjectWindow
        v-if="editingProject"
        :key="`${editingProject.id}-${editingProject.revision}`"
        :error="projectError"
        :loading="updatingProjectIds.includes(editingProject.id)"
        :project="editingProject"
        @close="editingProject = null"
        @save="saveProjectDetails"
      />
    </AnimatePresence>

    <AnimatePresence>
      <DeleteProjectWindow
        v-if="deletingProject"
        :key="`${deletingProject.id}-${deletingProject.revision}`"
        :error="projectDeleteError"
        :loading="projectDeleting"
        :project="deletingProject"
        @close="deletingProject = null"
        @delete="deleteProject"
      />
    </AnimatePresence>

    <AnimatePresence mode="wait" :initial="false">
      <motion.div
        v-if="authInitializing || !authSession"
        key="auth"
        class="hm-view-stage"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
      >
        <AuthView
          :capabilities="effectiveAuthCapabilities"
          :error="authError"
          :initializing="authInitializing"
          :submitting="authSubmitting"
          @authenticate="submitAuth"
          @clear-error="authErrorCode = ''"
          @local="continueLocally"
        />
      </motion.div>

      <motion.div
        v-else-if="active === 'projects'"
        key="projects"
        class="hm-view-stage"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
      >
        <ProjectOverview
          v-if="selectedProject"
          :actor="authSession.actor"
          :attachment-deleting-ids="attachmentDeletingIds"
          :attachment-downloading-ids="attachmentDownloadingIds"
          :attachment-error="attachmentError"
          :attachments="attachments"
          :attachments-loading="attachmentsLoading"
          :attachment-uploading="attachmentUploading"
          :project="selectedProject"
          :updating="updatingProjectIds.includes(selectedProject.id)"
          @archive="updateProjectArchived($event, true)"
          @back="selectedProjectId = null"
          @delete-attachment="deleteAttachment"
          @download-attachment="downloadAttachment"
          @edit="showProjectEditor"
          @upload-attachment="uploadAttachment"
        />
        <ProjectsWorkspace
          v-else
          :actor="authSession.actor"
          :diagnostic-error="diagnosticError"
          :health="health"
          :health-error="healthError"
          :job="job"
          :notice="notice"
          :project-error="projectError"
          :projects="projects"
          :projects-loading="projectsLoading"
          :updating-project-ids="updatingProjectIds"
          @archive="updateProjectArchived($event, true)"
          @create="showNewProjectNotice"
          @delete="showProjectDelete"
          @edit="showProjectEditor"
          @open="openProject"
          @restore="updateProjectArchived($event, false)"
          @run-diagnostic="runDiagnostic"
        />
      </motion.div>

      <motion.div
        v-else
        :key="active"
        class="hm-view-stage"
        :initial="{ opacity: 0, y: 8 }"
        :animate="{ opacity: 1, y: 0 }"
        :exit="{ opacity: 0, y: -6 }"
      >
        <div class="feature-placeholder">
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
      </motion.div>
    </AnimatePresence>
  </AppShell>
</template>
