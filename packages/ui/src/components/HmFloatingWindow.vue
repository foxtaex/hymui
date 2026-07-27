<script setup lang="ts">
import { GripHorizontal } from "@lucide/vue";
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  useTemplateRef,
  watch,
} from "vue";

import HmLiquidSurface from "./HmLiquidSurface.vue";

defineOptions({ inheritAttrs: false });

const props = withDefaults(
  defineProps<{
    initialPlacement?: "center" | "bottom-end" | "bottom-start";
    label: string;
    level?: "overlay" | "focus";
    size?: "sm" | "md" | "lg";
  }>(),
  {
    initialPlacement: "center",
    level: "focus",
    size: "md",
  },
);

const windowElement = useTemplateRef<HTMLElement>("window");
const position = reactive({ x: 24, y: 24 });
const dragging = ref(false);
let dragOrigin = { pointerX: 0, pointerY: 0, windowX: 0, windowY: 0 };

const positionStyle = computed(() => ({
  left: `${position.x}px`,
  top: `${position.y}px`,
}));

function clampPosition(x: number, y: number): { x: number; y: number } {
  const bounds = windowElement.value?.getBoundingClientRect();
  const width = bounds?.width ?? 0;
  const height = bounds?.height ?? 0;
  const gutter = 16;

  return {
    x: Math.min(Math.max(gutter, x), Math.max(gutter, window.innerWidth - width - gutter)),
    y: Math.min(Math.max(gutter, y), Math.max(gutter, window.innerHeight - height - gutter)),
  };
}

async function placeWindow(): Promise<void> {
  await nextTick();
  const bounds = windowElement.value?.getBoundingClientRect();
  if (!bounds) return;

  const gutter = 24;
  const dockClearance = 112;
  const centeredX = (window.innerWidth - bounds.width) / 2;
  const centeredY = (window.innerHeight - bounds.height) / 2;
  const nextPosition =
    props.initialPlacement === "bottom-end"
      ? {
          x: window.innerWidth - bounds.width - gutter,
          y: window.innerHeight - bounds.height - dockClearance,
        }
      : props.initialPlacement === "bottom-start"
        ? { x: gutter, y: window.innerHeight - bounds.height - dockClearance }
        : { x: centeredX, y: centeredY };

  Object.assign(position, clampPosition(nextPosition.x, nextPosition.y));
}

function onPointerMove(event: PointerEvent): void {
  if (!dragging.value) return;
  const nextPosition = clampPosition(
    dragOrigin.windowX + event.clientX - dragOrigin.pointerX,
    dragOrigin.windowY + event.clientY - dragOrigin.pointerY,
  );
  Object.assign(position, nextPosition);
}

function stopDragging(): void {
  dragging.value = false;
  document.removeEventListener("pointermove", onPointerMove);
  document.removeEventListener("pointerup", stopDragging);
  document.removeEventListener("pointercancel", stopDragging);
}

function startDragging(event: PointerEvent): void {
  if (event.button !== 0) return;
  const interactiveTarget = (event.target as HTMLElement).closest(
    "button, a, input, select, textarea, [role='button']",
  );
  if (interactiveTarget) return;

  event.preventDefault();
  dragging.value = true;
  dragOrigin = {
    pointerX: event.clientX,
    pointerY: event.clientY,
    windowX: position.x,
    windowY: position.y,
  };
  document.addEventListener("pointermove", onPointerMove);
  document.addEventListener("pointerup", stopDragging);
  document.addEventListener("pointercancel", stopDragging);
}

function onResize(): void {
  Object.assign(position, clampPosition(position.x, position.y));
}

onMounted(() => {
  void placeWindow();
  window.addEventListener("resize", onResize);
});

watch(
  () => props.initialPlacement,
  () => void placeWindow(),
);

onBeforeUnmount(() => {
  stopDragging();
  window.removeEventListener("resize", onResize);
});
</script>

<template>
  <Teleport to="body">
    <div
      ref="window"
      class="hm-floating-window"
      :class="[`hm-floating-window--${size}`, { 'hm-floating-window--dragging': dragging }]"
      :style="positionStyle"
    >
      <HmLiquidSurface
        v-bind="$attrs"
        :level="level"
        class="hm-floating-window__surface"
        role="dialog"
        :aria-label="label"
      >
        <div class="hm-floating-window__titlebar" @pointerdown="startDragging">
          <GripHorizontal
            class="hm-floating-window__drag-indicator"
            :size="18"
            :stroke-width="1.5"
            aria-hidden="true"
          />
          <slot name="titlebar" />
        </div>
        <div class="hm-floating-window__content">
          <slot />
        </div>
      </HmLiquidSurface>
    </div>
  </Teleport>
</template>
