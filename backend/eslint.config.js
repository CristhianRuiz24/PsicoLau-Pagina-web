/**
 * eslint.config.js
 * Configuración ligera y moderna (Flat Config) para ESLint en Node.js (Spec 020).
 */

module.exports = [
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'coverage/**',
      '**/*.log'
    ]
  },
  {
    files: ['src/**/*.js', 'scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'commonjs',
      globals: {
        process: 'readonly',
        Buffer: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        module: 'readonly',
        require: 'readonly',
        exports: 'writable',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly',
        URL: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
      }],
      'no-undef': 'error',
      'no-unreachable': 'error',
      'no-duplicate-case': 'error',
      'no-empty': ['warn', { allowEmptyCatch: true }]
    }
  },
  {
    files: ['scripts/**/*.mjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      globals: {
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        fetch: 'readonly',
        AbortSignal: 'readonly'
      }
    },
    rules: {
      'no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_', 
        varsIgnorePattern: '^_',
        caughtErrors: 'none'
      }],
      'no-undef': 'error'
    }
  }
];
