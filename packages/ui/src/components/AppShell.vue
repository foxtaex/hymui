<script lang="ts">
import type { Component } from "vue";

export interface AppNavItem {
  icon: Component;
  id: string;
  label: string;
}

export type AppNavPosition = "bottom" | "left" | "right" | "top";
</script>

<script setup lang="ts">
import { motion } from "motion-v";

import HmBrand from "./HmBrand.vue";
import HmLiquidSurface from "./HmLiquidSurface.vue";
import HmNavItem from "./HmNavItem.vue";

withDefaults(
  defineProps<{
    active: string;
    nav: ReadonlyArray<AppNavItem>;
    navPosition?: AppNavPosition;
    navigationVisible?: boolean;
  }>(),
  {
    navigationVisible: true,
    navPosition: "bottom",
  },
);

const MotionLiquidSurface = motion.create(HmLiquidSurface);

defineEmits<{
  navigate: [id: string];
}>();
</script>

<template>
  <div
    class="hm-app-shell"
    :class="[
      `hm-app-shell--nav-${navPosition}`,
      { 'hm-app-shell--navigation-hidden': !navigationVisible },
    ]"
  >
    <header v-if="navigationVisible" class="hm-app-shell__bar-wrap">
      <MotionLiquidSurface
        layout
        :layout-dependency="navPosition"
        level="bar"
        class="hm-app-shell__bar"
      >
        <HmBrand @activate="$emit('navigate', 'projects')" />
        <span class="hm-app-shell__separator" aria-hidden="true" />
        <nav class="hm-app-shell__nav" aria-label="Primary navigation">
          <HmNavItem
            v-for="item in nav"
            :key="item.id"
            :active="item.id === active"
            :icon="item.icon"
            :label="item.label"
            @activate="$emit('navigate', item.id)"
          />
        </nav>
        <span
          class="hm-app-shell__separator hm-app-shell__separator--trailing"
          aria-hidden="true"
        />
        <div class="hm-app-shell__actions">
          <slot name="actions" />
        </div>
      </MotionLiquidSurface>
    </header>

    <main class="hm-app-shell__content">
      <slot />
    </main>

    <HmLiquidSurface v-if="navigationVisible" level="bar" class="hm-app-shell__mobile-nav">
      <HmNavItem
        v-for="item in nav"
        :key="item.id"
        :active="item.id === active"
        :icon="item.icon"
        :label="item.label"
        mobile
        @activate="$emit('navigate', item.id)"
      />
    </HmLiquidSurface>
  </div>
</template>
