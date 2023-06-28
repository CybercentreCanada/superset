const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.analysis.cyber.gc.ca/',
    'video': false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})