const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.analysis.cyber.gc.ca/',
    env: {
    },
    'video': false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})