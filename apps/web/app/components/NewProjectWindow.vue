<script setup lang="ts">
import type { ProjectLink } from "@hymui/contracts";
import { HmButton, HmFloatingWindow, HmIconButton, HmInput } from "@hymui/ui";
import { X } from "@lucide/vue";
import { watch } from "vue";

const props = defineProps<{
  error: string;
  loading: boolean;
  resetToken: number;
}>();

const emit = defineEmits<{
  close: [];
  create: [input: { description: string; links: ProjectLink[]; name: string }];
}>();

const { copy } = useHymuiI18n();
const name = ref("");
const description = ref("");
const links = ref<ProjectLink[]>([]);
const submitted = ref(false);

watch(
  () => props.resetToken,
  () => {
    name.value = "";
    description.value = "";
    links.value = [];
    submitted.value = false;
  },
);

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
  const normalizedName = name.value.trim();
  if (!normalizedName || links.value.some((link) => !linkIsValid(link))) return;
  emit("create", {
    description: description.value.trim(),
    links: links.value.map((link) => ({
      kind: link.kind,
      label: link.label.trim(),
      url: link.url.trim(),
    })),
    name: normalizedName,
  });
}
</script>

<template>
  <HmFloatingWindow class="new-project-window" :label="copy.projects.createTitle" size="lg">
    <template #titlebar>
      <header class="new-project-window__header">
        <strong>{{ copy.projects.createTitle }}</strong>
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
    <form class="new-project-window__form" novalidate @submit.prevent="submit">
      <HmInput
        id="new-project-name"
        v-model="name"
        autocomplete="off"
        :disabled="loading"
        :error="submitted && !name.trim() ? copy.projects.nameRequired : ''"
        :label="copy.projects.name"
        :maxlength="120"
        required
      />
      <HmInput
        id="new-project-description"
        v-model="description"
        autocomplete="off"
        :disabled="loading"
        :label="copy.projects.description"
        :maxlength="2000"
      />
      <ProjectLinksEditor
        id-prefix="new-project"
        v-model="links"
        :disabled="loading"
        :submitted="submitted"
      />
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="new-project-window__actions">
        <HmButton variant="secondary" @click="emit('close')">
          {{ copy.projects.cancel }}
        </HmButton>
        <HmButton :loading="loading" type="submit">
          {{ copy.projects.create }}
        </HmButton>
      </div>
    </form>
  </HmFloatingWindow>
</template>
