import { loadEnv, defineConfig } from '@medusajs/framework/utils'

loadEnv(process.env.NODE_ENV || 'development', process.cwd())

const isProduction = process.env.NODE_ENV === 'production'

module.exports = defineConfig({
  projectConfig: {
    databaseUrl: process.env.DATABASE_URL,
    databaseDriverOptions: isProduction ? {
     connection: {
       ssl: { rejectUnauthorized: false },
     },
     pool: {
       min: 2,
       max: 10,
     },
    } : {},
    redisUrl: process.env.REDIS_URL,
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
      resolve: './src/modules/page-content',
    },
    {
      resolve: '@medusajs/medusa/notification',
      options: {
        providers: [
          {
            resolve: './src/modules/resend',
            id: 'resend',
            options: {
              channels: ['email'],
              api_key: process.env.RESEND_API_KEY,
              from: process.env.RESEND_FROM_EMAIL,
            },
          },
        ],
      },
    },
    {
      resolve: '@medusajs/medusa/fulfillment',
      options: {
        providers: [
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
    {
      resolve: "@medusajs/medusa/file",
      options: {
        providers: [{
          resolve: "@medusajs/medusa/file-s3",
          id: "s3",
          options: {
            file_url: process.env.S3_FILE_URL,
            access_key_id: process.env.S3_ACCESS_KEY_ID,
            secret_access_key: process.env.S3_SECRET_ACCESS_KEY,
            region: process.env.S3_REGION,
            bucket: process.env.S3_BUCKET,
            endpoint: process.env.S3_ENDPOINT,
            additional_client_config: {
              forcePathStyle: true,
            },
          },
        }],
      },
    },
    {
      resolve: "@medusajs/medusa/payment",
      options: {
        providers: [
          {
            resolve: "./src/modules/mono-payment",
            id: "mono",
            options: {
              token: process.env.MONO_TOKEN,
              apiBaseUrl: process.env.MONO_API_BASE_URL,
              redirectUrl: process.env.MONO_REDIRECT_URL,
              webhookUrl: process.env.MONO_WEBHOOK_URL,
              validitySeconds: process.env.MONO_VALIDITY_SECONDS
                ? Number(process.env.MONO_VALIDITY_SECONDS)
                : undefined,
              paymentType: (process.env.MONO_PAYMENT_TYPE || undefined) as "debit" | "hold" | undefined,
            },
          },
        ],
      },
    },
    {
    resolve: "@medusajs/medusa/event-bus-redis",
    options: { redisUrl: process.env.REDIS_URL },
    },
    {
      resolve: "@medusajs/medusa/workflow-engine-redis",
      options: { redis: { redisUrl: process.env.REDIS_URL } },
    },
    {
      resolve: "@medusajs/medusa/locking",
      options: {
        providers: [{
          resolve: "@medusajs/medusa/locking-redis",
          id: "locking-redis",
          is_default: true,
          options: { redisUrl: process.env.REDIS_URL },
        }],
      },
    },
    {
      resolve: "@medusajs/medusa/cache-redis",
      options: { 
        redisUrl: process.env.REDIS_URL 
      },
    },
  ],
})
