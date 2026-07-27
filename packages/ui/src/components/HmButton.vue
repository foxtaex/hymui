<script setup lang="ts">
withDefaults(
  defineProps<{
    disabled?: boolean;
    loading?: boolean;
    size?: "sm" | "md" | "lg";
    type?: "button" | "submit" | "reset";
    variant?: "primary" | "secondary" | "quiet" | "danger";
  }>(),
  {
    disabled: false,
    loading: false,
    size: "lg",
    type: "button",
    variant: "primary",
  },
);

defineEmits<{
  click: [event: MouseEvent];
}>();
</script>

<template>
  <button
    class="hm-button"
    :class="[`hm-button--${variant}`, `hm-button--${size}`]"
    :disabled="disabled || loading"
    :type="type"
    :aria-busy="loading"
    @click="$emit('click', $event)"
  >
    <span v-if="$slots.icon" class="hm-button__icon" aria-hidden="true">
      <slot name="icon" />
    </span>
    <span class="hm-button__label">
      <slot />
    </span>
    <span v-if="$slots.trailing" class="hm-button__trailing" aria-hidden="true">
      <slot name="trailing" />
    </span>
    <span v-if="loading" class="hm-button__loading" aria-hidden="true" />
  </button>
</template>
