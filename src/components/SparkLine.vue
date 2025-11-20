<script setup lang="ts">
import { computed } from 'vue'
import type { VitalDataPoint } from '@/types'

const props = defineProps<{ data: VitalDataPoint[]; field: keyof VitalDataPoint; color?: string }>()

const points = computed(() => {
  const values = props.data.map((item) => Number(item[props.field]))
  if (!values.length) return ''
  const max = Math.max(...values)
  const min = Math.min(...values)
  const range = max - min || 1
  return values
    .map((value, index) => {
      const x = values.length === 1 ? 0 : (index / (values.length - 1)) * 100
      const y = 100 - ((value - min) / range) * 100
      return x.toFixed(2) + ',' + y.toFixed(2)
    })
    .join(' ')
})
</script>

<template>
  <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
    <polyline :points="points" :stroke="color || '#818cf8'" fill="none" stroke-width="3" stroke-linecap="round" />
  </svg>
</template>

<style scoped>
svg {
  width: 100%;
  height: 80px;
}
</style>
