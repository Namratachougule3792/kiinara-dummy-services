export default defineNuxtConfig({
  modules: ['@nuxtjs/tailwindcss'],

  runtimeConfig: {
    public: {
      supabaseUrl: process.env.SUPABASE_URL || '',
      supabaseKey: process.env.SUPABASE_KEY || ''
    }
  },

  nitro: {
    preset: 'aws_amplify'
  },

  compatibilityDate: '2025-01-01'
})
