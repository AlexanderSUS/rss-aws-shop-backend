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
    ignores: ['node_modules', '.aws-sam', 'cdk.out', '**/*.*.js', '**/*.js', '**/*.d.ts']
  },
  {
    languageOptions: { 
      globals: [globals.node ]},
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