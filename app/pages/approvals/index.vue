<script setup lang="ts">
const { data: vacationRequests, refresh } = await useFetch(`/api/approvals`)
</script>
<template>
  <div class="p-6 max-w-7xl mx-auto">
    <div class="mb-8">
      <div class="flex items-center gap-2 mb-4">
        <UIcon name="i-heroicons-check-badge" class="w-6 h-6 text-primary" />
        <h2 class="text-2xl font-semibold text-gray-900 dark:text-white">
          Approval Requests
        </h2>
      </div>

      <div
        v-if="vacationRequests && vacationRequests.length > 0"
        class="space-y-4"
      >
        <VacationRequestCard
          v-for="request in vacationRequests"
          :key="request.id"
          :vacationRequest="request"
          @requestUpdated="refresh()"
        />
      </div>

      <UCard v-else>
        <div class="text-center py-12">
          <UIcon
            name="i-heroicons-inbox"
            class="w-16 h-16 mx-auto text-gray-400 mb-4"
          />
          <p class="text-gray-600 dark:text-gray-400">
            No approval requests at the moment
          </p>
        </div>
      </UCard>
    </div>
  </div>
</template>
