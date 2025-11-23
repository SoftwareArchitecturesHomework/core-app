export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()

    runtimeConfig.public.auth = runtimeConfig.public.auth || {}

    runtimeConfig.public.auth.baseURL = '/api/auth'
})