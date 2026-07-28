<script setup lang="ts">
withDefaults(
  defineProps<{
    tone?: "neutral" | "accent" | "success" | "warning" | "danger";
    mono?: boolean;
  }>(),
  {
    mono: false,
    tone: "neutral",
  },
);
</script>

<template>
  <span class="hm-badge" :class="[`hm-badge--${tone}`, { 'hm-badge--mono': mono }]">
    <slot />
  </span>
</template>
