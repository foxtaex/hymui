<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: boolean;
    disabled?: boolean;
    hideLabel?: boolean;
  }>(),
  {
    disabled: false,
    hideLabel: false,
  },
);

defineEmits<{
  "update:modelValue": [value: boolean];
}>();
</script>

<template>
  <label class="hm-switch" :class="{ 'hm-switch--disabled': disabled }" :for="id">
    <input
      :id="id"
      type="checkbox"
      role="switch"
      :checked="modelValue"
      :disabled="disabled"
      @change="$emit('update:modelValue', ($event.target as HTMLInputElement).checked)"
    />
    <span class="hm-switch__track" aria-hidden="true">
      <span class="hm-switch__thumb" />
    </span>
    <span class="hm-switch__label" :class="{ 'hm-visually-hidden': hideLabel }">{{ label }}</span>
  </label>
</template>
