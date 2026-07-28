<script setup lang="ts">
import { MotionConfig } from "motion-v";
</script>

<template>
  <MotionConfig
    reduced-motion="user"
    :transition="{ type: 'spring', stiffness: 380, damping: 32, mass: 0.75 }"
  >
    <NuxtPage />
  </MotionConfig>
</template>
