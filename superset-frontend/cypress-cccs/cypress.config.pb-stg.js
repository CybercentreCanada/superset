const { log } = require('console')
const { defineConfig } = require('cypress')

import { graphql_queries } from  'cypress/support/helper';

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca',
    env: {
      datahubBaseUrl: 'https://datahub-stg.hogwarts.pb.azure.chimera.cyber.gc.ca',
      glossaryTermsUrns: ['urn:li:glossaryTerm:Superset.Import to Superset'],
      domainsUrns: ['urn:li:domain:05eb46e7-ab79-40cd-9385-5d4b9552a043'],
      datahubEntitiesFilename: 'datahubEntities.json'
    },
    video: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})
