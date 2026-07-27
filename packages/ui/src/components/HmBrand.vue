<script setup lang="ts">
defineEmits<{
  activate: [];
}>();
</script>

<template>
  <button class="hm-brand" type="button" aria-label="Open Projects" @click="$emit('activate')">
    <img src="/logo/hymui/hymui-mark-vivid.svg" alt="" />
    <span>hymui<span class="hm-brand__dot">.</span></span>
  </button>
</template>
