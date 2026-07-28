<script setup lang="ts">
import type { Project } from "@hymui/contracts";
import { HmButton, HmFloatingWindow, HmIconButton, HmInput } from "@hymui/ui";
import { ClipboardPaste, Trash2, TriangleAlert, X } from "@lucide/vue";

const props = defineProps<{
  error: string;
  loading: boolean;
  project: Project;
}>();

const emit = defineEmits<{
  close: [];
  delete: [input: { name: string; revision: number }];
}>();

const { copy } = useHymuiI18n();
const confirmation = ref("");
const submitted = ref(false);
const matches = computed(() => confirmation.value === props.project.name);

function useProjectName(): void {
  confirmation.value = props.project.name;
  submitted.value = false;
}

function submit(): void {
  submitted.value = true;
  if (!matches.value) return;
  emit("delete", {
    name: confirmation.value,
    revision: props.project.revision,
  });
}
</script>

<template>
  <HmFloatingWindow class="delete-project-window" :label="copy.projects.deleteTitle" size="md">
    <template #titlebar>
      <header class="delete-project-window__header">
        <strong>{{ copy.projects.deleteTitle }}</strong>
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

    <form
      class="delete-project-window__form"
      novalidate
      @keydown.stop
      @pointerdown.stop
      @submit.prevent="submit"
    >
      <div class="delete-project-window__warning">
        <TriangleAlert :size="19" :stroke-width="1.6" aria-hidden="true" />
        <p>{{ copy.projects.deleteWarning }}</p>
      </div>
      <p class="delete-project-window__confirmation">
        {{ copy.projects.deleteConfirmation }}
        <span class="delete-project-window__project-name">
          <strong>{{ project.name }}</strong>
          <HmButton size="sm" variant="secondary" @click.stop="useProjectName">
            <template #icon>
              <ClipboardPaste :size="15" :stroke-width="1.6" />
            </template>
            {{ copy.projects.deleteUseName }}
          </HmButton>
        </span>
      </p>
      <HmInput
        id="delete-project-name"
        v-model="confirmation"
        autocomplete="off"
        :disabled="loading"
        :error="submitted && !matches ? copy.projects.deleteConfirmationMismatch : ''"
        :label="copy.projects.deleteNameLabel"
        :maxlength="120"
        required
      />
      <p v-if="error" class="form-error" role="alert">{{ error }}</p>
      <div class="delete-project-window__actions">
        <HmButton :disabled="loading" variant="secondary" @click="emit('close')">
          {{ copy.projects.cancel }}
        </HmButton>
        <HmButton :disabled="!matches" :loading="loading" type="submit" variant="danger">
          <template #icon>
            <Trash2 :size="16" :stroke-width="1.6" />
          </template>
          {{ copy.projects.deleteProject }}
        </HmButton>
      </div>
    </form>
  </HmFloatingWindow>
</template>
