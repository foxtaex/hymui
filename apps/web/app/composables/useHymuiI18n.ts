import { messages, type Locale } from "@hymui/i18n";

export function useHymuiI18n() {
  const locale = useState<Locale>("hymui-locale", () => "en");
  const copy = computed(() => messages[locale.value]);

  function setLocale(next: Locale): void {
    locale.value = next;
    if (import.meta.client) {
      localStorage.setItem("hymui.locale", next);
      document.documentElement.lang = next;
    }
  }

  onMounted(() => {
    const saved = localStorage.getItem("hymui.locale");
    if (saved === "en" || saved === "de") {
      setLocale(saved);
      return;
    }
    setLocale(navigator.language.toLowerCase().startsWith("de") ? "de" : "en");
  });

  return { copy, locale, setLocale };
}
