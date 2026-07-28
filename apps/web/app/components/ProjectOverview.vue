<script setup lang="ts">
import type { AuthSession, Project } from "@hymui/contracts";
import { HmAvatar, HmBadge, HmButton, HmIconButton, HmLiquidSurface, HmPanel } from "@hymui/ui";
import { Archive, ArrowLeft, ExternalLink, FolderKanban, GitBranch, Pencil } from "@lucide/vue";

const props = defineProps<{
  actor: AuthSession["actor"];
  project: Project;
  updating: boolean;
}>();

const emit = defineEmits<{
  archive: [project: Project];
  back: [];
  edit: [project: Project];
}>();

const { copy, locale } = useHymuiI18n();
const updatedAt = computed(() =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }).format(
    new Date(props.project.updatedAt),
  ),
);
</script>

<template>
  <div class="project-overview-page">
    <div class="project-overview-page__inner">
      <header class="project-overview__header">
        <HmButton size="md" variant="quiet" @click="emit('back')">
          <template #icon>
            <ArrowLeft :size="16" :stroke-width="1.6" />
          </template>
          {{ copy.projects.allProjects }}
        </HmButton>

        <div class="project-overview__actions">
          <HmButton size="md" variant="secondary" @click="emit('edit', project)">
            <template #icon>
              <Pencil :size="15" :stroke-width="1.6" />
            </template>
            {{ copy.projects.editProject }}
          </HmButton>
          <HmIconButton
            :disabled="updating"
            :label="copy.projects.archiveProject"
            size="md"
            variant="danger"
            @click="emit('archive', project)"
          >
            <Archive :size="16" :stroke-width="1.6" />
          </HmIconButton>
        </div>
      </header>

      <HmLiquidSurface level="panel" corner-module class="project-overview__hero">
        <div>
          <p class="page-heading__eyebrow">{{ copy.projects.projectOverview }}</p>
          <h1>{{ project.name }}</h1>
          <p v-if="project.description">{{ project.description }}</p>
        </div>
        <HmBadge tone="accent" mono> {{ copy.projects.revision }} {{ project.revision }} </HmBadge>
        <div class="project-overview__meta">
          <HmAvatar :name="actor.displayName" size="md" />
          <span>{{ copy.projects.owner }} · @{{ actor.username }}</span>
          <span class="project-card__dot" aria-hidden="true" />
          <span>{{ copy.projects.updatedAt }} · {{ updatedAt }}</span>
        </div>
      </HmLiquidSurface>

      <div class="project-overview__grid">
        <HmPanel class="project-overview__section">
          <header>
            <GitBranch :size="18" :stroke-width="1.5" aria-hidden="true" />
            <h2>{{ copy.projects.connectedResources }}</h2>
          </header>
          <p v-if="project.links.length === 0" class="project-overview__empty">
            {{ copy.projects.noLinks }}
          </p>
          <div v-else class="project-overview__links">
            <a
              v-for="link in project.links"
              :key="`${link.kind}:${link.url}`"
              :href="link.url"
              rel="noreferrer"
              target="_blank"
            >
              <GitBranch
                v-if="link.kind === 'repository'"
                :size="16"
                :stroke-width="1.6"
                aria-hidden="true"
              />
              <ExternalLink v-else :size="16" :stroke-width="1.6" aria-hidden="true" />
              <span>{{ link.label }}</span>
            </a>
          </div>
        </HmPanel>

        <HmPanel class="project-overview__section">
          <header>
            <FolderKanban :size="18" :stroke-width="1.5" aria-hidden="true" />
            <h2>{{ copy.projects.projectContents }}</h2>
          </header>
          <p class="project-overview__empty">
            {{ copy.projects.projectContentsEmpty }}
          </p>
        </HmPanel>
      </div>
    </div>
  </div>
</template>
