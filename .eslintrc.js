module.exports = {
  env: {
    node: true,
    es2021: true,
    jest: true,
  },
  extends: ['eslint:recommended', 'prettier'],
  parserOptions: {
    ecmaVersion: 2021,
  },
  rules: {
    // Possible Errors
    'no-console': [
      'error',
      {
        allow: ['warn', 'error'],
      },
    ],

    // Best Practices
    curly: ['error', 'all'],
    eqeqeq: ['error', 'always'],

    // Variables
    'no-unused-vars': [
      'error',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
      },
    ],
    'no-var': 'error',
    'prefer-const': 'error',

    // Stylistic Issues
    indent: ['error', 2],
    'linebreak-style': ['error', 'unix'],
    quotes: ['error', 'double'],
    semi: ['error', 'always'],
    'keyword-spacing': [
      'error',
      {
        before: true,
      },
    ],
    'object-curly-spacing': ['error', 'always'],
    'comma-spacing': [
      'error',
      {
        before: false,
        after: true,
      },
    ],

    // ECMAScript 6
    'arrow-spacing': [
      'error',
      {
        before: true,
        after: true,
      },
    ],
    'template-curly-spacing': ['error', 'never'],
  },
};
