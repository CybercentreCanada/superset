const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset-stg.hogwarts.u.azure.chimera.cyber.gc.ca/',
    env: {
      datahubBaseUrl: 'https://datahub-stg.hogwarts.u.azure.chimera.cyber.gc.ca',
      glossaryTermsUrns: ['urn:li:glossaryTerm:Superset.Import to Superset'],
      domainsUrns: ['urn:li:domain:c128ac31-cdad-434b-9a58-cba49e2b15c6']
    },
    'video': false
  }
})

