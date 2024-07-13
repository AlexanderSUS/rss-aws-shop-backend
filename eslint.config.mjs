import globals from 'globals';
import pluginJs from '@eslint/js';
import tseslint from 'typescript-eslint';
import jestPlugin from 'eslint-plugin-jest';

//** @type {import('eslint').Linter.FlatConfig[]} */
export default [
  {
    files: ['**/*.ts'],
    rules: {
      quotes: ['warn', 'single', { 'allowTemplateLiterals': true }],
      semi: ['warn', 'always'],
    },
  },
  {
    ignores: ['.aws-sam', 'cdk.out', '**/*.config.js']
  },
  {
    languageOptions: { 
      globals: [globals.node, globals.jest
    ]},
  },
  {
    files: ["**/*.test.ts"],
    ...jestPlugin.configs['flat/recommended'],
    rules: {
      ...jestPlugin.configs['flat/recommended'].rules,
    }
  },
  pluginJs.configs.recommended,
  ...tseslint.configs.recommended,
];