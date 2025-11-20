<script setup lang="ts">
const props = defineProps<{ label: string; value: string | number; unit?: string; accent?: string }>()
</script>

<template>
  <div class="metric-card" :style="{ borderColor: props.accent || '#7dd3fc' }">
    <p>{{ props.label }}</p>
    <strong :style="{ color: props.accent || '#7dd3fc' }">
      {{ props.value }}
      <small v-if="props.unit">{{ props.unit }}</small>
    </strong>
  </div>
</template>

<style scoped>
.metric-card {
  border: 1px solid rgba(125, 211, 252, 0.6);
  border-radius: 20px;
  padding: 1rem 1.2rem;
  background: rgba(15, 23, 42, 0.6);
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

strong {
  font-size: 2rem;
  display: flex;
  align-items: baseline;
  gap: 0.2rem;
}

small {
  font-size: 0.85rem;
}
</style>
