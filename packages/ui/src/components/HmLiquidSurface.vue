<script setup lang="ts">
withDefaults(
  defineProps<{
    level?: "bar" | "panel" | "overlay" | "focus";
    cornerModule?: boolean;
    centerDot?: boolean;
  }>(),
  {
    centerDot: false,
    cornerModule: false,
    level: "panel",
  },
);
</script>

<template>
  <div
    class="hm-liquid"
    :class="[
      `hm-liquid--${level}`,
      { 'hm-liquid--corner': cornerModule, 'hm-liquid--dot': centerDot },
    ]"
  >
    <slot />
  </div>
</template>
