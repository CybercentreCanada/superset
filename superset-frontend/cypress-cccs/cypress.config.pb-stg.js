const { log } = require('console')
const { defineConfig } = require('cypress')

import { graphql_queries } from  'cypress/support/helper';

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset-stg.hogwarts.pb.azure.chimera.cyber.gc.ca',
    env: {
    },
    video: false
  },
  resolve: {
    extensions: ['.ts', '.js'],
  }
})
