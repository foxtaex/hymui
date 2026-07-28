<script setup lang="ts">
import type { ProjectLink } from "@hymui/contracts";
import { HmIconButton, HmInput, HmSegmentedControl, type SegmentedOption } from "@hymui/ui";
import { ExternalLink, GitBranch, Link, Plus, Trash2 } from "@lucide/vue";

const props = withDefaults(
  defineProps<{
    disabled?: boolean;
    idPrefix: string;
    modelValue: ProjectLink[];
    submitted?: boolean;
  }>(),
  {
    disabled: false,
    submitted: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [links: ProjectLink[]];
}>();

const { copy } = useHymuiI18n();
const linkTypeOptions = computed<ReadonlyArray<SegmentedOption>>(() => [
  { icon: GitBranch, label: copy.value.projects.repository, value: "repository" },
  { icon: ExternalLink, label: copy.value.projects.externalLink, value: "external" },
]);

function addLink(): void {
  if (props.modelValue.length >= 20) return;
  emit("update:modelValue", [
    ...props.modelValue,
    {
      kind: "repository",
      label: "",
      url: "",
    },
  ]);
}

function removeLink(index: number): void {
  emit(
    "update:modelValue",
    props.modelValue.filter((_, linkIndex) => linkIndex !== index),
  );
}

function selectLinkType(index: number, value: string): void {
  const link = props.modelValue[index];
  if (!link || (value !== "external" && value !== "repository")) return;
  emit(
    "update:modelValue",
    props.modelValue.map((item, linkIndex) =>
      linkIndex === index ? { ...item, kind: value } : item,
    ),
  );
}

function updateLinkText(index: number, field: "label" | "url", value: string): void {
  emit(
    "update:modelValue",
    props.modelValue.map((link, linkIndex) =>
      linkIndex === index ? { ...link, [field]: value } : link,
    ),
  );
}

function linkIsValid(link: ProjectLink): boolean {
  if (!link.label.trim()) return false;
  try {
    const url = new URL(link.url);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}
</script>

<template>
  <section class="project-links-editor" :aria-label="copy.projects.links">
    <div class="project-links-editor__heading">
      <span>{{ copy.projects.links }}</span>
      <HmIconButton
        :disabled="disabled || modelValue.length >= 20"
        :label="copy.projects.addLink"
        size="sm"
        variant="quiet"
        @click="addLink"
      >
        <Plus :size="15" :stroke-width="1.6" />
      </HmIconButton>
    </div>

    <p v-if="modelValue.length === 0" class="project-links-editor__empty">
      {{ copy.projects.noLinks }}
    </p>

    <div v-for="(link, index) in modelValue" :key="index" class="project-links-editor__row">
      <HmSegmentedControl
        :id="`${idPrefix}-link-type-${index}`"
        class="project-links-editor__type"
        :disabled="disabled"
        :label="copy.projects.linkType"
        :model-value="link.kind"
        :options="linkTypeOptions"
        @update:model-value="selectLinkType(index, $event)"
      />
      <HmInput
        :id="`${idPrefix}-link-label-${index}`"
        class="project-links-editor__label"
        :disabled="disabled"
        :error="submitted && !linkIsValid(link) ? copy.projects.linkInvalid : ''"
        :label="copy.projects.linkLabel"
        :maxlength="80"
        :model-value="link.label"
        @update:model-value="updateLinkText(index, 'label', $event)"
      >
        <template #icon>
          <Link :size="15" :stroke-width="1.5" />
        </template>
      </HmInput>
      <HmInput
        :id="`${idPrefix}-link-url-${index}`"
        autocomplete="url"
        class="project-links-editor__url"
        :disabled="disabled"
        :label="copy.projects.linkUrl"
        :maxlength="2048"
        :model-value="link.url"
        placeholder="https://"
        type="url"
        @update:model-value="updateLinkText(index, 'url', $event)"
      />
      <HmIconButton
        :disabled="disabled"
        :label="copy.projects.removeLink"
        size="sm"
        variant="danger"
        @click="removeLink(index)"
      >
        <Trash2 :size="15" :stroke-width="1.6" />
      </HmIconButton>
    </div>
  </section>
</template>
