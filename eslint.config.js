const typescriptParser = require("@typescript-eslint/parser");
const typescriptPlugin = require("@typescript-eslint/eslint-plugin");
const eslintConfigPrettier = require("eslint-config-prettier");

module.exports = [
  {
    // Global ignore patterns
    ignores: [
      "**/dist/**",
      "**/node_modules/**",
      "**/coverage/**",
      "eslint.config.js"
    ]
  },
  {
    // Targeting TypeScript files inside all service folders
    files: ["services/*/src/**/*.ts"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module"
      }
    },
    plugins: {
      "@typescript-eslint": typescriptPlugin
    },
    rules: {
      ...typescriptPlugin.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/ban-ts-comment": "off"
    }
  },
  eslintConfigPrettier
];
