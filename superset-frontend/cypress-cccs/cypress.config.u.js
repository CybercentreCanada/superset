const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.hogwarts.u.azure.chimera.cyber.gc.ca',
    env: {
      datahubBaseUrl: 'https://datahub.hogwarts.u.azure.chimera.cyber.gc.ca'
    },
    'video': false
  }
})

