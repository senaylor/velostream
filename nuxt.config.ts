// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
    modules: [
        '@nuxtjs/tailwindcss',
    ],
    compatibilityDate: '2025-07-15',
    devtools: {enabled: true},

    runtimeConfig: {
        r2BucketName: process.env.R2_BUCKET_NAME || 'velostream-assets',
        r2EndpointUrl: process.env.R2_ENDPOINT_URL,
        r2AccessKeyId: process.env.R2_ACCESS_KEY_ID,
        r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY,
    }
})
