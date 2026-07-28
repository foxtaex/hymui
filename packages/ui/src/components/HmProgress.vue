<script setup lang="ts">
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    label: string;
    value?: number;
  }>(),
  {
    value: 0,
  },
);

const safeValue = computed(() => Math.min(100, Math.max(0, props.value)));
</script>

<template>
  <div class="hm-progress">
    <div class="hm-progress__meta">
      <span>{{ label }}</span>
      <span>{{ safeValue }}%</span>
    </div>
    <progress class="hm-progress__track" :aria-label="label" :value="safeValue" max="100" />
  </div>
</template>
