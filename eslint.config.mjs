import config from 'eslint-config-kyle';

config.push({
  rules: {
    'react-hooks/set-state-in-effect': 'off',
    '@eslint-react/set-state-in-effect': 'off',
  },
});

export { default } from 'eslint-config-kyle';
