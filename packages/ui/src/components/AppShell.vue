<script lang="ts">
import type { Component } from "vue";

export interface AppNavItem {
  icon: Component;
  id: string;
  label: string;
}

export type AppNavPosition = "bottom" | "top";
</script>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from "vue";

import HmBrand from "./HmBrand.vue";
import HmLiquidSurface from "./HmLiquidSurface.vue";
import HmNavItem from "./HmNavItem.vue";

const props = withDefaults(
  defineProps<{
    active: string;
    nav: ReadonlyArray<AppNavItem>;
    navPosition?: AppNavPosition;
  }>(),
  {
    navPosition: "bottom",
  },
);

const activeIndex = computed(() =>
  Math.max(
    0,
    props.nav.findIndex((item) => item.id === props.active),
  ),
);
const desktopNav = ref<HTMLElement | null>(null);
const desktopIndicatorReady = ref(false);
const desktopIndicatorWidth = ref(0);
const desktopIndicatorX = ref(0);
let desktopNavResizeObserver: ResizeObserver | undefined;

function updateDesktopIndicator(): void {
  const activeItem = desktopNav.value?.querySelector<HTMLElement>(
    ".hm-app-shell__nav-item--active",
  );
  if (!activeItem || activeItem.offsetWidth === 0) return;

  desktopIndicatorWidth.value = activeItem.offsetWidth;
  desktopIndicatorX.value = activeItem.offsetLeft;
  desktopIndicatorReady.value = true;
}

watch([() => props.active, () => props.nav], () => void nextTick(updateDesktopIndicator));

onMounted(() => {
  void nextTick(updateDesktopIndicator);
  if (typeof ResizeObserver !== "undefined") {
    desktopNavResizeObserver = new ResizeObserver(updateDesktopIndicator);
    if (desktopNav.value) desktopNavResizeObserver.observe(desktopNav.value);
  }
  void document.fonts?.ready.then(updateDesktopIndicator);
});

onBeforeUnmount(() => {
  desktopNavResizeObserver?.disconnect();
});

defineEmits<{
  navigate: [id: string];
}>();
</script>

<template>
  <div class="hm-app-shell" :class="`hm-app-shell--nav-${navPosition}`">
    <header class="hm-app-shell__bar-wrap">
      <HmLiquidSurface level="bar" class="hm-app-shell__bar">
        <HmBrand @activate="$emit('navigate', 'projects')" />
        <span class="hm-app-shell__separator" aria-hidden="true" />
        <nav
          ref="desktopNav"
          class="hm-app-shell__nav"
          :class="{ 'hm-app-shell__nav--indicator-ready': desktopIndicatorReady }"
          aria-label="Primary navigation"
        >
          <span
            class="hm-app-shell__nav-indicator"
            :style="{
              '--hm-nav-indicator-width': `${desktopIndicatorWidth}px`,
              '--hm-nav-indicator-x': `${desktopIndicatorX}px`,
            }"
            aria-hidden="true"
          />
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
      </HmLiquidSurface>
    </header>

    <main class="hm-app-shell__content">
      <slot />
    </main>

    <HmLiquidSurface
      level="bar"
      class="hm-app-shell__mobile-nav"
      :style="{ '--hm-mobile-active-index': activeIndex }"
    >
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
