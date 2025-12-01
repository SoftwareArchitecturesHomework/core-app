export function useUser() {
  const { data: session } = useAuth()
  const user = computed(() => session.value?.user)
  const userId = computed(() => user.value?.id)
  const userRole = computed(() => user.value?.role)
  const canManage = computed(() => userRole.value === 'MANAGER')

  return {
    user,
    userId,
    userRole,
    canManage,
  }
}
