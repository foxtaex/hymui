import js from "@eslint/js";
import prettier from "eslint-config-prettier";
import pluginVue from "eslint-plugin-vue";
import globals from "globals";
import tseslint from "typescript-eslint";
import vueParser from "vue-eslint-parser";

export default tseslint.config(
  {
    ignores: [
      "**/.nuxt/**",
      "**/.output/**",
      "**/coverage/**",
      "**/dist/**",
      "**/node_modules/**",
      "design-qa.md",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  {
    files: ["**/*.{ts,mts,cts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/no-explicit-any": "error",
    },
  },
  {
    files: ["**/*.vue"],
    languageOptions: {
      globals: {
        ...globals.browser,
        $fetch: "readonly",
        computed: "readonly",
        onBeforeUnmount: "readonly",
        onMounted: "readonly",
        ref: "readonly",
        useHymuiI18n: "readonly",
        useRuntimeConfig: "readonly",
      },
      parser: vueParser,
      parserOptions: {
        extraFileExtensions: [".vue"],
        parser: tseslint.parser,
      },
    },
    rules: {
      "vue/attributes-order": "off",
      "vue/multi-word-component-names": "off",
    },
  },
  prettier,
);
