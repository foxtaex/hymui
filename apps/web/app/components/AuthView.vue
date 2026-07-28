<script setup lang="ts">
import type { AuthCapabilities } from "@hymui/contracts";
import { HmBadge, HmBrandMark, HmButton, HmIconButton, HmInput, HmLiquidSurface } from "@hymui/ui";
import { Eye, EyeOff } from "@lucide/vue";
import { watch } from "vue";

const props = defineProps<{
  capabilities: AuthCapabilities;
  error: string;
  initializing: boolean;
  submitting: boolean;
}>();

const emit = defineEmits<{
  authenticate: [
    input: {
      displayName: string;
      mode: "login" | "register";
      password: string;
      username: string;
    },
  ];
  clearError: [];
  local: [];
}>();

const { copy } = useHymuiI18n();
const mode = ref<"login" | "register">(props.capabilities.registrationOpen ? "register" : "login");
const username = ref("");
const displayName = ref("");
const password = ref("");
const passwordVisible = ref(false);
const submitted = ref(false);
const normalizedUsername = computed(() => username.value.trim().toLowerCase());
const usernameValid = computed(() =>
  /^[a-z0-9](?:[a-z0-9_-]*[a-z0-9])?$/.test(normalizedUsername.value),
);
const usernameError = computed(() =>
  submitted.value &&
  (normalizedUsername.value.length < 3 ||
    normalizedUsername.value.length > 32 ||
    !usernameValid.value)
    ? copy.value.auth.usernameInvalid
    : "",
);
const displayNameError = computed(() =>
  submitted.value && mode.value === "register" && !displayName.value.trim()
    ? copy.value.auth.displayNameRequired
    : "",
);
const passwordError = computed(() =>
  submitted.value && !password.value
    ? copy.value.auth.passwordRequired
    : submitted.value && mode.value === "register" && password.value.length < 12
      ? copy.value.auth.passwordTooShort
      : "",
);
const editionLabel = computed(() =>
  props.capabilities.edition === "hosted"
    ? copy.value.app.editionHosted
    : props.capabilities.edition === "self-hosted"
      ? copy.value.app.editionSelfHosted
      : copy.value.app.editionLocal,
);

function submit(): void {
  submitted.value = true;
  if (usernameError.value || displayNameError.value || passwordError.value || !password.value) {
    return;
  }
  emit("authenticate", {
    displayName: displayName.value.trim(),
    mode: mode.value,
    password: password.value,
    username: normalizedUsername.value,
  });
}

function switchMode(): void {
  mode.value = mode.value === "register" ? "login" : "register";
  submitted.value = false;
  password.value = "";
  emit("clearError");
}

watch(
  () => props.capabilities.registrationOpen,
  (registrationOpen) => {
    if (!registrationOpen && mode.value === "register") switchMode();
  },
);
</script>

<template>
  <div class="auth-page">
    <HmLiquidSurface v-if="initializing" level="focus" class="auth-card">
      <HmBadge mono>{{ copy.health.checking }}</HmBadge>
    </HmLiquidSurface>

    <HmLiquidSurface v-else level="focus" corner-module class="auth-card">
      <div class="auth-card__heading">
        <HmBrandMark />
        <div>
          <p class="page-heading__eyebrow">{{ editionLabel }}</p>
          <h1>{{ copy.auth.title }}</h1>
          <p>{{ copy.auth.subtitle }}</p>
        </div>
      </div>

      <form class="auth-card__form" novalidate @submit.prevent="submit">
        <HmInput
          id="auth-username"
          v-model="username"
          autocomplete="username"
          :disabled="submitting"
          :error="usernameError"
          :label="copy.auth.username"
          :maxlength="32"
          :minlength="3"
          required
        />
        <HmInput
          v-if="mode === 'register'"
          id="auth-display-name"
          v-model="displayName"
          autocomplete="name"
          :disabled="submitting"
          :error="displayNameError"
          :label="copy.auth.displayName"
          :maxlength="80"
          required
        />
        <HmInput
          id="auth-password"
          v-model="password"
          :autocomplete="mode === 'register' ? 'new-password' : 'current-password'"
          :disabled="submitting"
          :error="passwordError"
          :label="copy.auth.password"
          :maxlength="256"
          :minlength="mode === 'register' ? 12 : 1"
          required
          :type="passwordVisible ? 'text' : 'password'"
        >
          <template #trailing>
            <HmIconButton
              :label="passwordVisible ? copy.auth.hidePassword : copy.auth.showPassword"
              size="sm"
              variant="quiet"
              @click="passwordVisible = !passwordVisible"
            >
              <EyeOff v-if="passwordVisible" :size="16" :stroke-width="1.5" />
              <Eye v-else :size="16" :stroke-width="1.5" />
            </HmIconButton>
          </template>
        </HmInput>
        <p v-if="error" class="form-error" role="alert">{{ error }}</p>
        <HmButton :loading="submitting" type="submit">
          {{ mode === "register" ? copy.auth.createAccount : copy.auth.loginAction }}
        </HmButton>
      </form>

      <div class="auth-card__alternatives">
        <button
          v-if="mode === 'register' || capabilities.registrationOpen"
          class="auth-card__mode"
          type="button"
          @click="switchMode"
        >
          {{ mode === "register" ? copy.auth.existingAccount : copy.auth.newAccount }}
        </button>
        <HmButton
          v-if="capabilities.localProfileAvailable"
          data-testid="local-profile-action"
          :loading="submitting"
          variant="secondary"
          @click="emit('local')"
        >
          {{ copy.auth.localAction }}
        </HmButton>
      </div>
    </HmLiquidSurface>
  </div>
</template>
