<script lang="ts">
export interface SelectOption {
  label: string;
  value: string;
}
</script>

<script setup lang="ts">
import { ChevronDown, Check } from "@lucide/vue";
import { computed, onBeforeUnmount, onMounted, ref, useTemplateRef } from "vue";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    options: ReadonlyArray<SelectOption>;
    disabled?: boolean;
    hideLabel?: boolean;
  }>(),
  {
    disabled: false,
    hideLabel: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const open = ref(false);
const activeIndex = ref(0);
const root = useTemplateRef<HTMLElement>("root");
const selected = computed(() => props.options.find((option) => option.value === props.modelValue));

function close(): void {
  open.value = false;
}

function toggle(): void {
  if (props.disabled) return;
  const selectedIndex = props.options.findIndex((option) => option.value === props.modelValue);
  activeIndex.value = selectedIndex >= 0 ? selectedIndex : 0;
  open.value = !open.value;
}

function select(option: SelectOption): void {
  emit("update:modelValue", option.value);
  close();
}

function onKeydown(event: KeyboardEvent): void {
  if (props.disabled) return;
  if (event.key === "Escape") {
    close();
    return;
  }
  if (!open.value && ["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
    event.preventDefault();
    toggle();
    return;
  }
  if (!open.value) return;
  if (event.key === "ArrowDown") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value + 1) % props.options.length;
  }
  if (event.key === "ArrowUp") {
    event.preventDefault();
    activeIndex.value = (activeIndex.value - 1 + props.options.length) % props.options.length;
  }
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    const option = props.options[activeIndex.value];
    if (option) select(option);
  }
}

function onDocumentPointerDown(event: PointerEvent): void {
  if (root.value && !root.value.contains(event.target as Node)) close();
}

onMounted(() => document.addEventListener("pointerdown", onDocumentPointerDown));
onBeforeUnmount(() => document.removeEventListener("pointerdown", onDocumentPointerDown));
</script>

<template>
  <div ref="root" class="hm-select" :class="{ 'hm-select--open': open }" @keydown="onKeydown">
    <span class="hm-select__label" :class="{ 'hm-visually-hidden': hideLabel }">{{ label }}</span>
    <button
      :id="id"
      class="hm-select__trigger"
      type="button"
      :disabled="disabled"
      :aria-expanded="open"
      :aria-controls="`${id}-listbox`"
      aria-haspopup="listbox"
      @click="toggle"
    >
      <span>{{ selected?.label ?? label }}</span>
      <ChevronDown :size="16" :stroke-width="1.5" aria-hidden="true" />
    </button>
    <div
      v-if="open"
      class="hm-select__backdrop"
      aria-hidden="true"
      @pointerdown.prevent.stop="close"
    />
    <Transition name="hm-depth">
      <div
        v-if="open"
        :id="`${id}-listbox`"
        class="hm-select__list"
        role="listbox"
        :aria-label="label"
        @pointerdown.stop
      >
        <button
          v-for="(option, index) in options"
          :key="option.value"
          class="hm-select__option"
          :class="{ 'hm-select__option--active': index === activeIndex }"
          type="button"
          role="option"
          :aria-selected="option.value === modelValue"
          @pointerenter="activeIndex = index"
          @click="select(option)"
        >
          <Check
            class="hm-select__check"
            :class="{ 'hm-select__check--visible': option.value === modelValue }"
            :size="15"
            :stroke-width="1.8"
            aria-hidden="true"
          />
          <span>{{ option.label }}</span>
        </button>
      </div>
    </Transition>
  </div>
</template>
