<script setup lang="ts">
import type { AuthSession, DiagnosticJob, HealthResponse, Project } from "@hymui/contracts";
import {
  HmAvatar,
  HmBadge,
  HmButton,
  HmIconButton,
  HmInput,
  HmLiquidSurface,
  HmPanel,
} from "@hymui/ui";
import {
  Archive,
  ChevronRight,
  CircleAlert,
  CircleCheck,
  ExternalLink,
  Folder,
  GitBranch,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
} from "@lucide/vue";
import { AnimatePresence, LayoutGroup, motion } from "motion-v";
import { nextTick, watch } from "vue";

const MotionPanel = motion.create(HmPanel);

const props = defineProps<{
  actor: AuthSession["actor"];
  diagnosticError: boolean;
  health: HealthResponse | null;
  healthError: boolean;
  job: DiagnosticJob | null;
  notice: string;
  projectError: string;
  projects: ReadonlyArray<Project>;
  projectsLoading: boolean;
  updatingProjectIds: ReadonlyArray<string>;
}>();

const emit = defineEmits<{
  archive: [project: Project];
  create: [];
  deleteProject: [input: { name: string; project: Project; revision: number }];
  edit: [project: Project];
  open: [project: Project];
  restore: [project: Project];
  runDiagnostic: [];
}>();

const { copy, locale } = useHymuiI18n();
const query = ref("");
const archiveOpen = ref(false);
const archiveGrid = ref<HTMLElement | null>(null);
const deleteProjectId = ref<string | null>(null);
const deleteConfirmation = ref("");
const deleteSubmitted = ref(false);
let archiveResizeObserver: ResizeObserver | null = null;

const filteredProjects = computed(() => {
  const needle = query.value.trim().toLowerCase();
  if (!needle) return props.projects;
  return props.projects.filter(
    (project) =>
      project.name.toLowerCase().includes(needle) ||
      project.description.toLowerCase().includes(needle) ||
      project.links.some(
        (link) =>
          link.label.toLowerCase().includes(needle) || link.url.toLowerCase().includes(needle),
      ),
  );
});

const activeProjects = computed(() =>
  filteredProjects.value.filter((project) => !project.archived),
);
const archivedProjects = computed(() => props.projects.filter((project) => project.archived));

const healthLabel = computed(() => {
  if (props.healthError) return copy.value.health.degraded;
  if (!props.health) return copy.value.health.checking;
  return props.health.worker === "ready" ? copy.value.health.ready : copy.value.health.degraded;
});

const diagnosticLabel = computed(() => {
  if (props.diagnosticError) return copy.value.diagnostic.failed;
  if (!props.job) return copy.value.diagnostic.idle;
  if (props.job.status === "completed") return copy.value.diagnostic.completed;
  return copy.value.diagnostic.running;
});

function formatProjectDate(value: string): string {
  return new Intl.DateTimeFormat(locale.value, {
    dateStyle: "medium",
  }).format(new Date(value));
}

function handleEmptyAction(): void {
  if (query.value) {
    query.value = "";
    return;
  }
  emit("create");
}

function isUpdating(project: Project): boolean {
  return props.updatingProjectIds.includes(project.id);
}

function showDeleteConfirmation(project: Project): void {
  deleteProjectId.value = project.id;
  deleteConfirmation.value = "";
  deleteSubmitted.value = false;
}

function closeDeleteConfirmation(): void {
  deleteProjectId.value = null;
  deleteConfirmation.value = "";
  deleteSubmitted.value = false;
}

function submitDelete(project: Project): void {
  deleteSubmitted.value = true;
  if (deleteConfirmation.value !== project.name) return;
  emit("deleteProject", {
    name: deleteConfirmation.value,
    project,
    revision: project.revision,
  });
}

function updateArchiveItemSpan(item: HTMLElement): void {
  const grid = archiveGrid.value;
  if (!grid) return;

  const gridStyle = window.getComputedStyle(grid);
  const rowHeight = Number.parseFloat(gridStyle.gridAutoRows);
  const rowGap = Number.parseFloat(gridStyle.rowGap);
  const cardGap = Number.parseFloat(gridStyle.columnGap);
  if (!rowHeight || Number.isNaN(rowGap) || Number.isNaN(cardGap)) return;

  const span = Math.ceil((item.getBoundingClientRect().height + cardGap) / (rowHeight + rowGap));
  item.style.gridRowEnd = `span ${span}`;
}

async function observeArchiveCards(): Promise<void> {
  await nextTick();
  archiveResizeObserver?.disconnect();

  const grid = archiveGrid.value;
  if (!grid || !archiveResizeObserver) return;

  grid
    .querySelectorAll<HTMLElement>(".project-card--archived, .project-archive__empty")
    .forEach((item) => {
      updateArchiveItemSpan(item);
      archiveResizeObserver?.observe(item);
    });
}

onMounted(() => {
  archiveResizeObserver = new ResizeObserver((entries) => {
    entries.forEach((entry) => updateArchiveItemSpan(entry.target as HTMLElement));
  });
  void observeArchiveCards();
});

watch([archiveOpen, archivedProjects], () => void observeArchiveCards(), { flush: "post" });

onBeforeUnmount(() => archiveResizeObserver?.disconnect());
</script>

<template>
  <div class="projects-page">
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
          <HmButton @click="emit('create')">
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

      <LayoutGroup id="project-cards">
        <HmButton
          :aria-expanded="archiveOpen"
          class="archive-row"
          size="md"
          variant="quiet"
          @click="archiveOpen = !archiveOpen"
        >
          <template #icon>
            <Folder :size="17" :stroke-width="1.5" />
          </template>
          <strong>{{ copy.projects.archive }}</strong>
          <span>{{ copy.projects.archivedCount }} · {{ archivedProjects.length }}</span>
          <template #trailing>
            <ChevronRight
              class="archive-row__chevron"
              :class="{ 'archive-row__chevron--open': archiveOpen }"
              :size="16"
              :stroke-width="1.5"
            />
          </template>
        </HmButton>

        <AnimatePresence :initial="false">
          <motion.div
            v-if="archiveOpen"
            key="project-archive"
            class="project-archive-stage"
            :initial="{ height: 0, opacity: 0, y: -10 }"
            :animate="{ height: 'auto', opacity: 1, y: 0 }"
            :exit="{ height: 0, opacity: 0, y: -10 }"
            :transition="{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }"
          >
            <section
              ref="archiveGrid"
              class="project-archive"
              :aria-label="copy.projects.archivedCount"
            >
              <p v-if="archivedProjects.length === 0" class="project-archive__empty">
                {{ copy.projects.archiveEmpty }}
              </p>
              <AnimatePresence :initial="false">
                <MotionPanel
                  v-for="project in archivedProjects"
                  :key="project.id"
                  layout
                  :layout-id="`project-${project.id}`"
                  class="project-card project-card--archived"
                  :class="{ 'project-card--expanded': deleteProjectId === project.id }"
                  :layout-dependency="deleteProjectId"
                  :initial="{ opacity: 0, scale: 0.97, y: -8 }"
                  :animate="{ opacity: 1, scale: 1, y: 0 }"
                  :exit="{ opacity: 0, scale: 0.97, y: 8 }"
                  :transition="{
                    layout: { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 },
                    opacity: { duration: 0.18 },
                    scale: { duration: 0.22 },
                  }"
                >
                  <div class="project-card__heading">
                    <div>
                      <h2>{{ project.name }}</h2>
                      <p>{{ project.description }}</p>
                    </div>
                    <div class="project-card__actions">
                      <HmIconButton
                        :disabled="isUpdating(project)"
                        :label="copy.projects.restoreProject"
                        size="sm"
                        variant="quiet"
                        @click="emit('restore', project)"
                      >
                        <RotateCcw :size="15" :stroke-width="1.6" />
                      </HmIconButton>
                      <HmIconButton
                        :disabled="isUpdating(project)"
                        :label="copy.projects.deleteProject"
                        size="sm"
                        variant="danger"
                        @click.stop="showDeleteConfirmation(project)"
                      >
                        <Trash2 :size="15" :stroke-width="1.6" />
                      </HmIconButton>
                    </div>
                  </div>
                  <AnimatePresence :initial="false">
                    <motion.form
                      v-if="deleteProjectId === project.id"
                      :key="`delete-${project.id}`"
                      class="project-card__delete-confirmation"
                      :initial="{ height: 0, opacity: 0, y: -8 }"
                      :animate="{ height: 'auto', opacity: 1, y: 0 }"
                      :exit="{ height: 0, opacity: 0, y: -8 }"
                      :transition="{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }"
                      novalidate
                      @submit.prevent="submitDelete(project)"
                    >
                      <div class="project-card__delete-warning">
                        <Trash2 :size="17" :stroke-width="1.6" aria-hidden="true" />
                        <div>
                          <strong>{{ copy.projects.deleteTitle }}</strong>
                          <p>{{ copy.projects.deleteWarning }}</p>
                        </div>
                      </div>
                      <p class="project-card__delete-instruction">
                        {{ copy.projects.deleteConfirmation }}
                        <strong>{{ project.name }}</strong>
                      </p>
                      <HmInput
                        :id="`archive-delete-${project.id}`"
                        v-model="deleteConfirmation"
                        autocomplete="off"
                        :disabled="isUpdating(project)"
                        :error="
                          deleteSubmitted && deleteConfirmation !== project.name
                            ? copy.projects.deleteConfirmationMismatch
                            : ''
                        "
                        :label="copy.projects.deleteNameLabel"
                        :maxlength="120"
                        required
                      />
                      <div class="project-card__delete-actions">
                        <HmButton
                          :disabled="isUpdating(project)"
                          size="sm"
                          variant="secondary"
                          @click="closeDeleteConfirmation"
                        >
                          {{ copy.projects.cancel }}
                        </HmButton>
                        <HmButton
                          :disabled="deleteConfirmation !== project.name"
                          :loading="isUpdating(project)"
                          size="sm"
                          type="submit"
                          variant="danger"
                        >
                          <template #icon>
                            <Trash2 :size="15" :stroke-width="1.6" />
                          </template>
                          {{ copy.projects.deleteProject }}
                        </HmButton>
                      </div>
                    </motion.form>
                  </AnimatePresence>
                  <div class="project-card__meta">
                    <span>{{ formatProjectDate(project.updatedAt) }}</span>
                    <span class="project-card__dot" aria-hidden="true" />
                    <span>{{ copy.projects.revision }} {{ project.revision }}</span>
                  </div>
                </MotionPanel>
              </AnimatePresence>
            </section>
          </motion.div>
        </AnimatePresence>

        <section class="project-grid" :aria-label="copy.projects.region">
          <p v-if="projectsLoading" class="projects-empty">{{ copy.health.checking }}</p>
          <div v-else-if="activeProjects.length === 0" class="projects-empty">
            <span class="projects-empty__icon" aria-hidden="true">
              <Folder :size="22" :stroke-width="1.5" />
            </span>
            <strong>{{ query ? copy.projects.emptySearch : copy.projects.emptyTitle }}</strong>
            <p>{{ query ? copy.projects.emptySearchHint : copy.projects.empty }}</p>
            <HmButton size="md" variant="secondary" @click="handleEmptyAction">
              {{ query ? copy.projects.clearSearch : copy.projects.new }}
            </HmButton>
          </div>
          <AnimatePresence :initial="false">
            <MotionPanel
              v-for="project in activeProjects"
              :key="project.id"
              layout
              :layout-id="`project-${project.id}`"
              interactive
              class="project-card"
              :initial="{ opacity: 0, scale: 0.97, y: 10 }"
              :animate="{ opacity: 1, scale: 1, y: 0 }"
              :exit="{ opacity: 0, scale: 0.97, y: -10 }"
              :transition="{
                layout: { type: 'spring', stiffness: 360, damping: 34, mass: 0.8 },
                opacity: { duration: 0.18 },
                scale: { duration: 0.22 },
              }"
              tabindex="0"
              @click="emit('open', project)"
              @keydown.enter.self="emit('open', project)"
            >
              <div class="project-card__heading">
                <div>
                  <h2>{{ project.name }}</h2>
                  <p>{{ project.description }}</p>
                </div>
                <div class="project-card__actions">
                  <HmBadge tone="accent" mono>
                    {{ copy.projects.revision }} {{ project.revision }}
                  </HmBadge>
                  <HmIconButton
                    :disabled="isUpdating(project)"
                    :label="copy.projects.editProject"
                    size="sm"
                    variant="quiet"
                    @click.stop="emit('edit', project)"
                  >
                    <Pencil :size="15" :stroke-width="1.6" />
                  </HmIconButton>
                  <HmIconButton
                    :disabled="isUpdating(project)"
                    :label="copy.projects.archiveProject"
                    size="sm"
                    variant="quiet"
                    @click.stop="emit('archive', project)"
                  >
                    <Archive :size="15" :stroke-width="1.6" />
                  </HmIconButton>
                </div>
              </div>
              <div v-if="project.links.length" class="project-card__links">
                <a
                  v-for="link in project.links"
                  :key="`${link.kind}:${link.url}`"
                  :href="link.url"
                  rel="noreferrer"
                  target="_blank"
                  @click.stop
                >
                  <GitBranch
                    v-if="link.kind === 'repository'"
                    :size="14"
                    :stroke-width="1.6"
                    aria-hidden="true"
                  />
                  <ExternalLink v-else :size="14" :stroke-width="1.6" aria-hidden="true" />
                  <span>{{ link.label }}</span>
                </a>
              </div>
              <div class="project-card__meta">
                <div class="project-card__members">
                  <HmAvatar :name="actor.displayName" size="md" />
                </div>
                <span class="project-card__dot" aria-hidden="true" />
                <span>{{ copy.projects.owner }} · @{{ actor.username }}</span>
                <span class="project-card__dot" aria-hidden="true" />
                <span>{{ formatProjectDate(project.updatedAt) }}</span>
              </div>
            </MotionPanel>
          </AnimatePresence>
        </section>
      </LayoutGroup>

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
          @click="emit('runDiagnostic')"
        >
          {{ copy.diagnostic.action }}
        </HmButton>
      </HmLiquidSurface>
    </div>
  </div>
</template>
