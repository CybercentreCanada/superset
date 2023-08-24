const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.hogwarts.pb.azure.chimera.cyber.gc.ca',
    env: {
      datahubBaseUrl: 'https://datahub.hogwarts.pb.azure.chimera.cyber.gc.ca/'
    },
    'video': false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})
