<script lang="ts">
import type { Component } from "vue";
</script>

<script setup lang="ts">
import { motion } from "motion-v";

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
    :aria-label="label"
    :aria-current="active ? 'page' : undefined"
    @click="$emit('activate')"
  >
    <motion.span
      v-if="active"
      class="hm-app-shell__item-indicator"
      :layout-id="mobile ? 'hymui-mobile-nav-active' : 'hymui-desktop-nav-active'"
      :transition="{ type: 'spring', stiffness: 440, damping: 34, mass: 0.7 }"
      aria-hidden="true"
    />
    <component :is="icon" :size="mobile ? 19 : 17" :stroke-width="1.5" aria-hidden="true" />
    <span class="hm-app-shell__item-label">{{ label }}</span>
  </button>
</template>
