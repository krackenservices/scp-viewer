import globals from "globals";
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        languageOptions: {
            ecmaVersion: 2022,
            sourceType: "module",
            globals: {
                ...globals.node,
            }
        },
        rules: {
            "no-unused-vars": ["error", { "argsIgnorePattern": "^_" }]
        }
    }
];
