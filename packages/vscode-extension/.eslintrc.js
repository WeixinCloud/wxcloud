module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: './tsconfig.json',
  },
	extends: ['@tencent/eslint-config-tencent', '@tencent/eslint-config-tencent/ts'],
	rules: {
		'max-len': 0,
	},
};
