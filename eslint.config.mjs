import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import prettier from "eslint-config-prettier/flat";

/**
 * ESLint 9 flat config.
 *
 * Next 16 removed `next lint` and the `eslint` key in next.config.js, so
 * linting now runs through the ESLint CLI: `npm run lint`.
 * This replaces the old `.eslintrc.json`, which ESLint 9 ignores — delete it.
 */
const eslintConfig = defineConfig([
  ...nextVitals,
  // Keep ESLint out of Prettier's way on formatting rules.
  prettier,
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
  ]),
]);

export default eslintConfig;
