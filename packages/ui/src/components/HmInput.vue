<script setup lang="ts">
withDefaults(
  defineProps<{
    id: string;
    label: string;
    modelValue: string;
    placeholder?: string;
    type?: "text" | "search" | "email" | "password" | "url";
    disabled?: boolean;
    error?: string;
    autocomplete?: string | undefined;
    maxlength?: number | undefined;
    minlength?: number | undefined;
    required?: boolean;
  }>(),
  {
    autocomplete: undefined,
    disabled: false,
    error: "",
    maxlength: undefined,
    minlength: undefined,
    placeholder: "",
    required: false,
    type: "text",
  },
);

defineEmits<{
  "update:modelValue": [value: string];
}>();
</script>

<template>
  <label class="hm-field" :for="id">
    <span class="hm-field__label">{{ label }}</span>
    <span class="hm-input" :class="{ 'hm-input--error': error }">
      <span v-if="$slots.icon" class="hm-input__icon" aria-hidden="true">
        <slot name="icon" />
      </span>
      <input
        :id="id"
        :value="modelValue"
        :placeholder="placeholder"
        :type="type"
        :disabled="disabled"
        :autocomplete="autocomplete"
        :maxlength="maxlength"
        :minlength="minlength"
        :required="required"
        :aria-invalid="Boolean(error)"
        :aria-describedby="error ? `${id}-error` : undefined"
        @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      />
      <span v-if="$slots.trailing" class="hm-input__trailing">
        <slot name="trailing" />
      </span>
    </span>
    <span v-if="error" :id="`${id}-error`" class="hm-field__error">{{ error }}</span>
  </label>
</template>
