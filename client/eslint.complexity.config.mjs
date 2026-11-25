// SQA 3.4 — reports the cyclomatic complexity of every function (threshold 1 = report all).
// Run: npm run lint:complexity --workspace=client
import tseslint from 'typescript-eslint'

export default [
  {
    files: ['**/*.ts'],
    languageOptions: { parser: tseslint.parser },
    rules: { complexity: ['warn', 1] },
  },
]
