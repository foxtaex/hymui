<script setup lang="ts">
import type { Project, ProjectLink } from "@hymui/contracts";
import { HmButton, HmFloatingWindow, HmIconButton, HmInput } from "@hymui/ui";
import { X } from "@lucide/vue";

const props = defineProps<{
  error: string;
  loading: boolean;
  project: Project;
}>();

const emit = defineEmits<{
  close: [];
  save: [
    input: {
      description: string;
      links: ProjectLink[];
      name: string;
      revision: number;
    },
  ];
}>();

const { copy } = useHymuiI18n();
const name = ref(props.project.name);
const description = ref(props.project.description);
const links = ref<ProjectLink[]>(props.project.links.map((link) => ({ ...link })));
const submitted = ref(false);

function linkIsValid(link: ProjectLink): boolean {
  if (!link.label.trim()) return false;
  try {
    const url = new URL(link.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function submit(): void {
  submitted.value = true;
  if (!name.value.trim() || links.value.some((link) => !linkIsValid(link))) return;
  emit("save", {
    description: description.value.trim(),
    links: links.value.map((link) => ({
      kind: link.kind,
      label: link.label.trim(),
      url: link.url.trim(),
    })),
    name: name.value.trim(),
    revision: props.project.revision,
  });
}
</script>

<template>
  <HmFloatingWindow class="edit-project-window" :label="copy.projects.editProject" size="lg">
    <template #titlebar>
      <header class="edit-project-window__header">
        <strong>{{ copy.projects.editProject }}</strong>
        <HmIconButton
          :label="copy.projects.cancel"
          size="md"
          variant="quiet"
          @click="emit('close')"
        >
          <X :size="17" :stroke-width="1.5" />
        </HmIconButton>
      </header>
    </template>

    <form class="edit-project-window__form" novalidate @submit.prevent="submit">
      <HmInput
        id="edit-project-name"
        v-model="name"
        :disabled="loading"
        :error="submitted && !name.trim() ? copy.projects.nameRequired : ''"
        :label="copy.projects.name"
        :maxlength="120"
        required
      />
      <HmInput
        id="edit-project-description"
        v-model="description"
        :disabled="loading"
        :label="copy.projects.description"
        :maxlength="2000"
      />

      <ProjectLinksEditor
        id-prefix="edit-project"
        v-model="links"
        :disabled="loading"
        :submitted="submitted"
      />

      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="edit-project-window__actions">
        <HmButton :disabled="loading" variant="secondary" @click="emit('close')">
          {{ copy.projects.cancel }}
        </HmButton>
        <HmButton :loading="loading" type="submit">
          {{ copy.projects.save }}
        </HmButton>
      </div>
    </form>
  </HmFloatingWindow>
</template>
