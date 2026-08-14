import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    http: {
      storeCors: process.env.STORE_CORS!,
      adminCors: process.env.ADMIN_CORS!,
      authCors: process.env.AUTH_CORS!,
      jwtSecret: process.env.JWT_SECRET,
      cookieSecret: process.env.COOKIE_SECRET,
    }
  },
  modules: [
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
          // Medusa's default manual provider, kept so existing/admin-only
          // fulfillment flows keep working.
          {
            resolve: '@medusajs/medusa/fulfillment-manual',
            id: 'manual',
          },
          {
            resolve: './src/modules/nova-poshta-fulfillment',
            id: 'nova-poshta',
            options: {
              apiKey: process.env.NOVA_POSHTA_API_KEY,
              senderCityRef: process.env.NOVA_POSHTA_SENDER_CITY_REF,
            },
          },
          {
            resolve: './src/modules/ukrposhta-fulfillment',
            id: 'ukrposhta',
            options: {
              apiBaseUrl: process.env.UKRPOSHTA_API_BASE_URL,
              bearerToken: process.env.UKRPOSHTA_BEARER_TOKEN,
              userToken: process.env.UKRPOSHTA_USER_TOKEN,
              senderCityRef: process.env.UKRPOSHTA_SENDER_CITY_REF,
            },
          },
        ],
      },
    },
  ],
})
