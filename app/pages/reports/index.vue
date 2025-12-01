<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { ReportRestClient } from '~~/client/report_client';

useHead({
    title: 'Reports',
});

const { userId } = useUser(); 
const report = ref(null as any);
const loading = ref(true);
const error = ref(null as string | null);

const restClient = new ReportRestClient

async function fetchReportData() {
    
    // NOTE: Assuming the logged-in user (userId) is the manager whose report we want (managerId)
    const managerId = userId.value; 

    if(!managerId){
      return
    }

    try {
        report.value = await restClient.getManagerPDF(managerId) as any;

    } catch (e: any) {
        error.value = `Failed to fetch report: ${e.message}`;
    } finally {
        loading.value = false;
    }
}

onMounted(() => {
    fetchReportData();
});
</script>

<template>
  <div class="p-6 max-w-4xl mx-auto">
    <h1 class="text-4xl font-bold text-center text-primary-600 mb-6">Manager Reports</h1>

    <UCard class="mb-8">
      <div class="text-center py-4">
        <UIcon name="i-heroicons-document-text-solid" class="w-10 h-10 text-gray-400 mb-4" />
        <p class="text-lg font-semibold text-gray-800 dark:text-gray-200">
          Here you can download/open the **latest report** in HTML and PDF format.
        </p>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">
          Monthly reports will be generated and distributed via email after the closed month.
        </p>
      </div>
    </UCard>
    
    <div v-if="loading" class="text-center py-10">
      <UIcon name="i-heroicons-arrow-path" class="w-8 h-8 animate-spin text-primary-500" />
      <p class="mt-2 text-primary-500">Loading Report Data...</p>
    </div>

    <UCard v-else-if="error" class="bg-red-50 dark:bg-red-900/20 border-red-400">
      <div class="flex items-center gap-3">
        <UIcon name="i-heroicons-exclamation-triangle" class="w-6 h-6 text-red-500" />
        <p class="text-red-700 dark:text-red-300">Error loading report: {{ error }}</p>
      </div>
    </UCard>

    <div v-else-if="report" class="space-y-4">
      <ReportFileItem
        title="PDF Report (Downloadable)"
        icon="i-heroicons-document-arrow-down"
        :data-url="report.pdf"
        file-name="report"
        mime-type="application/pdf"
        :can-download="true"
        :can-open="true"
      />
    </div>

    <UCard v-else>
      <p class="text-center text-gray-500">No current manager report available.</p>
    </UCard>
    
  </div>
</template>

<style scoped>
/* Optional: Add minimal styling */
</style>