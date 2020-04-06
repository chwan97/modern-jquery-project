const BABEL_ENV = process.env.BABEL_ENV || process.env.NODE_ENV || null;

const presets = [
  [
    '@babel/preset-env',
    {
      modules: false,
      targets: {
        ie: '11',
      },
    },
  ],
];

// include stage 3 proposals
const plugins = [
  '@babel/plugin-syntax-dynamic-import',
  '@babel/plugin-syntax-import-meta',
  '@babel/plugin-proposal-class-properties',
  '@babel/plugin-proposal-json-strings',
  '@babel/plugin-proposal-private-methods',
];

// add code coverage tooling if necessary
if (BABEL_ENV === 'coverage') {
  plugins.push([
    'babel-plugin-istanbul'
  ]);
}

module.exports = { presets, plugins };
