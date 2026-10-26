import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Service worker : script navigateur hors TypeScript, servi tel quel.
    "public/sw.js",
  ]),
  {
    rules: {
      // L'interface est entièrement en français : les apostrophes sont
      // partout. Les échapper en &apos; rendrait les textes illisibles dans le
      // code sans rien apporter — une apostrophe dans du texte JSX est valide.
      // On ne conserve donc que les deux caractères réellement ambigus, « > »
      // et « } », qui peuvent casser le balisage.
      "react/no-unescaped-entities": [
        "error",
        { forbid: [">", "}"] },
      ],
    },
  },
  {
    // Les générateurs de documents manipulent les objets jsPDF et autoTable,
    // dont les types publics sont incomplets. On tolère `any` ici plutôt que
    // de disséminer des assertions non vérifiables.
    files: ["src/lib/generer-pdf.ts", "src/lib/generer-bons.ts", "src/lib/import-export-clients.ts"],
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",
    },
  },
]);

export default eslintConfig;
