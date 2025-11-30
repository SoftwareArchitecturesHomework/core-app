export function useUser() {
  const { data: session } = useAuth()
  const user = computed(() => session.value?.user)
  const userId = computed(() => user.value?.id)
  const userRole = computed(() => user.value?.role)
  const canCreateProject = computed(() => {
    return userRole.value === 'MANAGER' || userRole.value === 'ADMIN'
  })
  const isAdmin = computed(() => userRole.value === 'ADMIN')

  return {
    user,
    userId,
    userRole,
    canCreateProject,
    isAdmin,
  }
}
