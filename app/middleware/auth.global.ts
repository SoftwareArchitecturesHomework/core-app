export default defineNuxtRouteMiddleware((to) => {
    const { status } = useAuth()

    const publicRoutes = ['/login']

    if (status.value !== 'authenticated' && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }

    if (to.path === '/') {
        return navigateTo('/projects')
    }
})
