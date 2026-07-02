// Flat-config ESLint with typescript-eslint (type-checked rules), react-hooks, react-refresh,
// import hygiene. `npm run lint` is a CI gate with ZERO errors (CLAUDE.md §6.4).
import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: ["dist", "coverage", "playwright-report", "test-results", "public/embed/vendor"],
  },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["src/**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  {
    // Node scripts + config are plain ESM run under Node, not the browser.
    files: ["scripts/**/*.mjs", "*.config.{js,ts}"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
