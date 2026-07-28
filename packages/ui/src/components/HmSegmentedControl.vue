<script lang="ts">
import type { Component } from "vue";

export interface SegmentedOption {
  icon?: Component;
  label: string;
  value: string;
}
</script>

<script setup lang="ts">
import { motion } from "motion-v";
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    options: ReadonlyArray<SegmentedOption>;
    disabled?: boolean;
  }>(),
  {
    disabled: false,
  },
);

const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const activeIndex = computed(() =>
  Math.max(
    0,
    props.options.findIndex((option) => option.value === props.modelValue),
  ),
);

function select(value: string): void {
  if (props.disabled) return;
  emit("update:modelValue", value);
}

function onKeydown(event: KeyboardEvent, index: number): void {
  if (props.disabled) return;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
  event.preventDefault();

  const lastIndex = props.options.length - 1;
  const nextIndex =
    event.key === "Home"
      ? 0
      : event.key === "End"
        ? lastIndex
        : event.key === "ArrowLeft"
          ? (index - 1 + props.options.length) % props.options.length
          : (index + 1) % props.options.length;
  const nextOption = props.options[nextIndex];
  if (!nextOption) return;

  select(nextOption.value);
  const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll("button");
  buttons?.item(nextIndex).focus();
}
</script>

<template>
  <div
    class="hm-segmented"
    role="radiogroup"
    :aria-label="label"
    :style="{
      '--hm-segment-count': options.length,
      '--hm-segment-index': activeIndex,
    }"
  >
    <motion.span
      class="hm-segmented__indicator"
      :initial="false"
      :animate="{ x: `${activeIndex * 100}%` }"
      :transition="{ type: 'spring', stiffness: 420, damping: 34, mass: 0.72 }"
      aria-hidden="true"
    />
    <button
      v-for="(option, index) in options"
      :id="`${id}-${option.value}`"
      :key="option.value"
      class="hm-segmented__option"
      :class="{ 'hm-segmented__option--active': option.value === modelValue }"
      :disabled="disabled"
      type="button"
      role="radio"
      :aria-checked="option.value === modelValue"
      @click="select(option.value)"
      @keydown="onKeydown($event, index)"
    >
      <component
        :is="option.icon"
        v-if="option.icon"
        :size="15"
        :stroke-width="1.6"
        aria-hidden="true"
      />
      <span>{{ option.label }}</span>
    </button>
  </div>
</template>
