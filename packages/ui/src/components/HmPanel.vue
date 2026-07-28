<script setup lang="ts">
withDefaults(
  defineProps<{
    interactive?: boolean;
  }>(),
  {
    interactive: false,
  },
);
</script>

<template>
  <section class="hm-panel" :class="{ 'hm-panel--interactive': interactive }">
    <slot />
  </section>
</template>
