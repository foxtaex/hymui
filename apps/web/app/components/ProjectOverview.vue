<script setup lang="ts">
import type { AuthSession, Project, ProjectAttachment } from "@hymui/contracts";
import { HmAvatar, HmBadge, HmButton, HmIconButton, HmLiquidSurface, HmPanel } from "@hymui/ui";
import {
  Archive,
  ArrowLeft,
  Download,
  ExternalLink,
  File,
  FolderKanban,
  GitBranch,
  Paperclip,
  Pencil,
  Trash2,
  Upload,
} from "@lucide/vue";

const props = defineProps<{
  actor: AuthSession["actor"];
  attachmentDeletingIds: ReadonlyArray<string>;
  attachmentDownloadingIds: ReadonlyArray<string>;
  attachmentError: string;
  attachments: ReadonlyArray<ProjectAttachment>;
  attachmentsLoading: boolean;
  attachmentUploading: boolean;
  project: Project;
  updating: boolean;
}>();

const emit = defineEmits<{
  archive: [project: Project];
  back: [];
  deleteAttachment: [attachment: ProjectAttachment];
  downloadAttachment: [attachment: ProjectAttachment];
  edit: [project: Project];
  uploadAttachment: [file: File];
}>();

const { copy, locale } = useHymuiI18n();
const attachmentInput = ref<HTMLInputElement | null>(null);
const updatedAt = computed(() =>
  new Intl.DateTimeFormat(locale.value, { dateStyle: "medium" }).format(
    new Date(props.project.updatedAt),
  ),
);

function formatByteLength(value: number): string {
  return new Intl.NumberFormat(locale.value, {
    maximumFractionDigits: value >= 1_024 * 1_024 ? 1 : 0,
    style: "unit",
    unit: value >= 1_024 * 1_024 ? "megabyte" : "kilobyte",
    unitDisplay: "short",
  }).format(value >= 1_024 * 1_024 ? value / (1_024 * 1_024) : Math.max(value / 1_024, 0.1));
}

function chooseAttachment(): void {
  attachmentInput.value?.click();
}

function selectAttachment(event: Event): void {
  const input = event.currentTarget as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (file) emit("uploadAttachment", file);
}
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

      <HmPanel class="project-overview__section project-overview__attachments">
        <header>
          <Paperclip :size="18" :stroke-width="1.5" aria-hidden="true" />
          <h2>{{ copy.projects.attachments }}</h2>
          <HmButton
            class="project-overview__attachment-upload"
            :loading="attachmentUploading"
            size="sm"
            variant="secondary"
            @click="chooseAttachment"
          >
            <template #icon>
              <Upload :size="15" :stroke-width="1.6" />
            </template>
            {{ copy.projects.attachmentUpload }}
          </HmButton>
          <input
            ref="attachmentInput"
            class="project-overview__file-input"
            type="file"
            @change="selectAttachment"
          />
        </header>

        <p v-if="attachmentError" class="project-overview__attachment-error" role="alert">
          {{ attachmentError }}
        </p>
        <p
          v-else-if="!attachmentsLoading && attachments.length === 0"
          class="project-overview__empty"
        >
          {{ copy.projects.attachmentEmpty }}
        </p>
        <div v-else-if="attachmentsLoading" class="project-overview__attachment-loading">
          <span v-for="index in 2" :key="index" />
        </div>
        <ul v-else class="project-overview__attachment-list">
          <li v-for="attachment in attachments" :key="attachment.id">
            <span class="project-overview__attachment-icon" aria-hidden="true">
              <File :size="17" :stroke-width="1.5" />
            </span>
            <span class="project-overview__attachment-copy">
              <strong>{{ attachment.fileName }}</strong>
              <small
                >{{ formatByteLength(attachment.byteLength) }} · {{ attachment.contentType }}</small
              >
            </span>
            <div class="project-overview__attachment-actions">
              <HmIconButton
                :disabled="attachmentDownloadingIds.includes(attachment.id)"
                :label="copy.projects.attachmentDownload"
                size="sm"
                variant="quiet"
                @click="emit('downloadAttachment', attachment)"
              >
                <Download :size="16" :stroke-width="1.6" />
              </HmIconButton>
              <HmIconButton
                :disabled="attachmentDeletingIds.includes(attachment.id)"
                :label="copy.projects.attachmentDelete"
                size="sm"
                variant="danger"
                @click="emit('deleteAttachment', attachment)"
              >
                <Trash2 :size="16" :stroke-width="1.6" />
              </HmIconButton>
            </div>
          </li>
        </ul>
      </HmPanel>
    </div>
  </div>
</template>
