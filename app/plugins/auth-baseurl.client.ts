export default defineNuxtPlugin(() => {
    const runtimeConfig = useRuntimeConfig()

    // NuxtAuth reads runtimeConfig.public.auth.baseURL on the client.
    // In Nuxt 4, this sometimes incorrectly becomes "/" or undefined.
    // We override it here to ensure correct routing.
    // @ts-expect-error runtimeConfig is mutable at runtime
    runtimeConfig.public.auth = runtimeConfig.public.auth || {}

    // @ts-expect-error override injected baseURL
    runtimeConfig.public.auth.baseURL = '/api/auth'
})