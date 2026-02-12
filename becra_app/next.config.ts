// @ts-check

import eslint from "@eslint/js";
import tsEslint from "typescript-eslint";
import reactPlugin from "eslint-plugin-react";
import reactPluginHooks from "eslint-plugin-react-hooks";
import globals from "globals";
import nextPlugin from "@next/eslint-plugin-next";
import { defineConfig } from "eslint/config";

export default defineConfig({
  languageOptions: {
    parserOptions: {
      ecmaVersion: "latest",
      projectService: true,
      project: ["./tsconfig.json"],
      tsconfigRootDir: import.meta.dirname,
    },
  },
  extends: [
    reactPluginHooks.configs.recommended,
    eslint.configs.recommended,
    tsEslint.configs.recommendedTypeChecked,
    {
      files: ["**/*.{js,mjs,cjs,jsx,mjsx,ts,tsx,mtsx}"],
      ...reactPlugin.configs.flat.recommended,
      // Required when using React 17+.
      ...reactPlugin.configs.flat["jsx-runtime"],
      languageOptions: {
        ...reactPlugin.configs.flat.recommended.languageOptions,
        globals: {
          ...globals.serviceworker,
          ...globals.browser,
        },
      },
      rules: {
        "jsx-quotes": ["error", "prefer-double"],
        "react/jsx-curly-brace-presence": [
          "error",
          {
            props: "never",
            children: "never",
          },
        ],
        "@typescript-eslint/consistent-type-imports": "error",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-unused-vars": [
          "error",
          {
            argsIgnorePattern: "^_",
            varsIgnorePattern: "^_",
            caughtErrorsIgnorePattern: "^_",
          },
        ],
      },
    },
    {
      plugins: {
        "@next/next": nextPlugin,
      },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs["core-web-vitals"].rules,
      },
    },
    {
      ignores: [
        "tailwind.config.js",
        "postcss.config.js",
        "eslint.config.mjs",
        ".next/*",
      ],
    },
  ],
});
