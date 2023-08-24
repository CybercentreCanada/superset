const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.dev.analysis.cyber.gc.ca/',
    env: {
      datahubBaseUrl: 'https://datahub.dev.analysis.cyber.gc.ca/'
    },
    video: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})

