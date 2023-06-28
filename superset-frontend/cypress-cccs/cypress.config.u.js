const { defineConfig } = require('cypress')

module.exports = defineConfig({
  e2e: {
    baseUrl: 'https://superset.hogwarts.u.azure.chimera.cyber.gc.ca',
    env: {
      AUTH_TENANT_ID: 'da9cbe40-ec1e-4997-afb3-17d87574571a',
      AUTH_BASE_URL: 'https://login.microsoftonline.com',
      AUTH_RETURN_URL: 'https://superset.hogwarts.u.azure.chimera.cyber.gc.ca/oauth-authorized/azure',
      AUTH_CLIENT_ID: 'b6b222a3-8f4b-40a9-b683-d9d932047053',
      AUTH_SCOPE: 'b6b222a3-8f4b-40a9-b683-d9d932047053/.default profile openid email offline_access'
    },
    'video': false
  }
})

