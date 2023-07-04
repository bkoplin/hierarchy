/* eslint-env node */

module.exports = {
  extends: [ '@antfu', ],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: [ './tsconfig.json', ],
    tsconfigRootDir: __dirname,
  },
  rules: {
    '@typescript-eslint/comma-dangle': [
      'error',
      {
        arrays: 'always',
        exports: 'always',
        functions: 'never',
        imports: 'always',
        objects: 'always',
      },
    ],
    '@typescript-eslint/lines-between-class-members': [
      'error',
      'always',
      {
        exceptAfterOverload: true,
        exceptAfterSingleLine: true,
      },
    ],
    '@typescript-eslint/no-shadow': [
      'error',
      { ignoreFunctionTypeParameterNameValueShadow: true, },
    ],
    '@typescript-eslint/padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        next: [
          'interface',
          'type',
        ],
        prev: '*',
      },
    ],
    '@typescript-eslint/no-this-alias': [
      'error',
      {
        allowedNames: [
          'node',
          'start',
          'end',
        ],
      },
    ],
    '@typescript-eslint/ban-ts-comment': 'off',
    '@typescript-eslint/prefer-ts-expect-error': 'off',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/array-type': [
      'error',
      { default: 'array-simple', },
    ],
    '@typescript-eslint/member-ordering': [
      'error',
      {
        classes: {
          memberTypes: [
            'signature',
            'constructor',
            'field',
            [
              'get',
              'set',
            ],
            'method',
          ],
          order: 'alphabetically',
        },
      },
    ],
    'array-bracket-spacing': [
      'error',
      'always',
    ],
    'array-bracket-newline': [
      'error',
      { minItems: 2, },
    ],
    'array-element-newline': [
      'error',
      'always',
      { minItems: 2, },
    ],
    'arrow-parens': 'error',
    'comma-dangle': 'off',
    'function-call-argument-newline': [
      'error',
      'always',
    ],
    'function-paren-newline': 'error',
    'no-cond-assign': 'off',
    'indent': [
      'error',
      2,
      {
        ObjectExpression: 'first',
        ArrayExpression: 'first',
      },
    ],
    'newline-per-chained-call': [
      'error',
      { ignoreChainWithDepth: 2, },
    ],
    'no-console': 'warn',
    'object-curly-newline': [
      'error',
      {
        multiline: true,
        minProperties: 2,
      },
    ],
    'object-property-newline': [
      'error',
      { allowMultiplePropertiesPerLine: false, },
    ],
    'prefer-template': 'error',
    'prefer-const': [
      1,
      { destructuring: 'all', },
    ],
    'sort-keys': 0,
    'operator-linebreak': [
      'error',
      'after',
    ],
    'padding-line-between-statements': [
      'error',
      {
        blankLine: 'always',
        prev: [
          'const',
          'let',
          'var',
          'export',
        ],
        next: '*',
      },
      {
        blankLine: 'never',
        prev: [
          'const',
          'let',
          'var',
        ],
        next: [
          'const',
          'let',
          'var',
        ],
      },
      {
        blankLine: 'never',
        prev: [ 'export', ],
        next: [ 'export', ],
      },
    ],
    'comma-spacing': 'off',
    'max-statements-per-line': [
      'error',
      { max: 2, },
    ],
  },
}
