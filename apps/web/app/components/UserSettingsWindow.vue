<script setup lang="ts">
import type { AuthSession } from "@hymui/contracts";
import { localeOptions, type Locale } from "@hymui/i18n";
import {
  HmAvatar,
  HmButton,
  HmFloatingWindow,
  HmIconButton,
  HmSegmentedControl,
  HmSelect,
  type AppNavPosition,
  type SegmentedOption,
} from "@hymui/ui";
import {
  LogOut,
  Monitor,
  Moon,
  PanelBottom,
  PanelLeft,
  PanelRight,
  PanelTop,
  Sun,
  X,
} from "@lucide/vue";

type ThemeMode = "dark" | "light" | "system";

const props = defineProps<{
  actor: AuthSession["actor"];
  locale: Locale;
  navPosition: AppNavPosition;
  themeMode: ThemeMode;
}>();

const emit = defineEmits<{
  close: [];
  signOut: [];
  "update:locale": [value: Locale];
  "update:navPosition": [value: AppNavPosition];
  "update:themeMode": [value: ThemeMode];
}>();

const { copy } = useHymuiI18n();

const navPositionOptions = computed<ReadonlyArray<SegmentedOption>>(() => [
  { icon: PanelTop, label: copy.value.app.navigationTop, value: "top" },
  { icon: PanelBottom, label: copy.value.app.navigationBottom, value: "bottom" },
  { icon: PanelLeft, label: copy.value.app.navigationLeft, value: "left" },
  { icon: PanelRight, label: copy.value.app.navigationRight, value: "right" },
]);

const themeModeOptions = computed<ReadonlyArray<SegmentedOption>>(() => [
  { icon: Sun, label: copy.value.app.themeLightName, value: "light" },
  { icon: Monitor, label: copy.value.app.themeSystemName, value: "system" },
  { icon: Moon, label: copy.value.app.themeDarkName, value: "dark" },
]);

const placement = computed(() => (props.navPosition === "right" ? "bottom-start" : "bottom-end"));

function selectLocale(value: string): void {
  if (value === "de" || value === "en") emit("update:locale", value);
}

function selectNavPosition(value: string): void {
  if (value === "top" || value === "bottom" || value === "left" || value === "right") {
    emit("update:navPosition", value);
  }
}

function selectThemeMode(value: string): void {
  if (value === "light" || value === "dark" || value === "system") {
    emit("update:themeMode", value);
  }
}
</script>

<template>
  <HmFloatingWindow
    class="user-settings__panel"
    :initial-placement="placement"
    :label="copy.app.settings"
    size="sm"
  >
    <template #titlebar>
      <header class="user-settings__header">
        <div class="user-settings__profile">
          <HmAvatar :name="actor.displayName" size="md" />
          <div>
            <strong>{{ actor.displayName }}</strong>
            <span>@{{ actor.username }}</span>
          </div>
        </div>
        <HmIconButton
          :label="locale === 'de' ? 'Einstellungen schließen' : 'Close settings'"
          size="md"
          variant="quiet"
          @click="emit('close')"
        >
          <X :size="17" :stroke-width="1.5" />
        </HmIconButton>
      </header>
    </template>

    <div class="user-settings__field">
      <span>{{ copy.app.language }}</span>
      <HmSelect
        id="language"
        :label="copy.app.language"
        :model-value="locale"
        :options="localeOptions"
        hide-label
        @update:model-value="selectLocale"
      />
    </div>

    <div class="user-settings__field user-settings__field--stacked">
      <span>{{ copy.app.appearance }}</span>
      <div class="user-settings__appearance">
        <div
          class="user-settings__appearance-row user-settings__appearance-row--desktop-navigation user-settings__appearance-row--stacked"
        >
          <span>{{ copy.app.navigationPosition }}</span>
          <HmSegmentedControl
            id="navigation-position"
            class="user-settings__navigation-control"
            :label="copy.app.navigationPosition"
            :model-value="navPosition"
            :options="navPositionOptions"
            @update:model-value="selectNavPosition"
          />
        </div>

        <div class="user-settings__appearance-row user-settings__appearance-row--stacked">
          <span>{{ copy.app.colorScheme }}</span>
          <HmSegmentedControl
            id="theme-mode"
            class="user-settings__theme-control"
            :label="copy.app.colorScheme"
            :model-value="themeMode"
            :options="themeModeOptions"
            @update:model-value="selectThemeMode"
          />
        </div>
      </div>
    </div>

    <HmButton size="md" variant="secondary" @click="emit('signOut')">
      <template #icon>
        <LogOut :size="16" :stroke-width="1.5" />
      </template>
      {{ copy.app.signOut }}
    </HmButton>
  </HmFloatingWindow>
</template>
