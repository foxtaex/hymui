<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    name: string;
    size?: "sm" | "md" | "lg";
  }>(),
  {
    size: "md",
  },
);

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join(""),
);
</script>

<template>
  <span class="hm-avatar" :class="`hm-avatar--${size}`" :aria-label="name" role="img">
    {{ initials }}
  </span>
</template>
