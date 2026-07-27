<script lang="ts">
import type { Component } from "vue";
</script>

<script setup lang="ts">
defineProps<{
  active?: boolean;
  icon: Component;
  label: string;
  mobile?: boolean;
}>();

defineEmits<{
  activate: [];
}>();
</script>

<template>
  <button
    :class="[
      mobile ? 'hm-app-shell__mobile-item' : 'hm-app-shell__nav-item',
      {
        'hm-app-shell__mobile-item--active': mobile && active,
        'hm-app-shell__nav-item--active': !mobile && active,
      },
    ]"
    type="button"
    :aria-label="mobile ? label : undefined"
    :aria-current="active ? 'page' : undefined"
    @click="$emit('activate')"
  >
    <component :is="icon" :size="mobile ? 19 : 17" :stroke-width="1.5" aria-hidden="true" />
    <span>{{ label }}</span>
  </button>
</template>
