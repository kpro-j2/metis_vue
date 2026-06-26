<template>
  <div>
    <h2 class="text-xl font-bold">HV Control and Monitor</h2>
    <div v-if="!apiBase" class="text-red-700 font-semibold">
      API is not registered for part 'hv-monitor'. Configure it in UI Setting.
    </div>
    <div v-else>
      <p class="mb-2">Registered API: {{ apiBase }}</p>
      <p class="text-gray-700">HV panel componentization is in progress. API is reachable and tab is now enabled.</p>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HvDashboard',
  props: {
    apiBase: {
      type: String,
      default: '',
    },
  },
};
</script>
