<script setup lang="ts">
withDefaults(
  defineProps<{
    label: string;
    disabled?: boolean;
    size?: "sm" | "md" | "lg";
    variant?: "glass" | "quiet" | "danger";
  }>(),
  {
    disabled: false,
    size: "lg",
    variant: "glass",
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    class="hm-icon-button"
    :class="[`hm-icon-button--${variant}`, `hm-icon-button--${size}`]"
    :aria-label="label"
    :disabled="disabled"
    type="button"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>
