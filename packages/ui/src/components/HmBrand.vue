<script setup lang="ts">
import HmBrandMark from "./HmBrandMark.vue";

defineEmits<{
  activate: [];
}>();
</script>

<template>
  <button class="hm-brand" type="button" aria-label="Open Projects" @click="$emit('activate')">
    <HmBrandMark />
    <span>hymui<span class="hm-brand__dot">.</span></span>
  </button>
</template>
