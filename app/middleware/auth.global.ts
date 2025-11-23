export default defineNuxtRouteMiddleware((to) => {
    const { status } = useAuth()

    // Public routes that don't require authentication
    const publicRoutes = ['/login']

    // If user is not authenticated and trying to access a protected route
    if (status.value !== 'authenticated' && !publicRoutes.includes(to.path)) {
        return navigateTo('/login')
    }

    // Redirect root to /projects
    if (to.path === '/') {
        return navigateTo('/projects')
    }
})
