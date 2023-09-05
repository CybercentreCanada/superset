const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca',
    env: {
      datahubBaseUrl: 'https://datahub-stg.hogwarts.pb.azure.chimera.cyber.gc.ca',
      glossaryTermsUrns: ['urn:li:glossaryTerm:Superset.Import to Superset'],
      domainsUrns: []
    },
    video: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})
