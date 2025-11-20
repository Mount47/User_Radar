<script setup lang="ts">
import type { CaregiverPerson } from '@/types'

const props = defineProps<{ person: CaregiverPerson; isActive?: boolean }>()
const emit = defineEmits<{ select: [string] }>()

const genderCopy: Record<CaregiverPerson['gender'], string> = {
  M: '男',
  F: '女'
}
</script>

<template>
  <article class="person-card" :class="{ active: isActive }" @click="emit('select', props.person.personId)">
    <header>
      <div>
        <p class="eyebrow">{{ props.person.department }}</p>
        <h3>{{ props.person.personName }}</h3>
      </div>
      <span class="status">{{ genderCopy[props.person.gender] }} · {{ props.person.age }} 岁</span>
    </header>
    <p class="location">绑定设备：{{ props.person.devices.map((item) => item.deviceName).join('、') || '暂无' }}</p>
    <dl class="vital-grid" v-if="props.person.latestOverview">
      <div>
        <dt>心率</dt>
        <dd>{{ props.person.latestOverview.heartRate }} <small>bpm</small></dd>
      </div>
      <div>
        <dt>呼吸</dt>
        <dd>{{ props.person.latestOverview.breathRate }} <small>rpm</small></dd>
      </div>
      <div>
        <dt>体动</dt>
        <dd>{{ props.person.latestOverview.motion }} <small>指数</small></dd>
      </div>
    </dl>
    <footer>
      <ul>
        <li v-for="tag in props.person.tags || []" :key="tag">{{ tag }}</li>
      </ul>
      <small v-if="props.person.lastAlertAt">
        最近告警：{{ new Date(props.person.lastAlertAt).toLocaleString() }}
      </small>
    </footer>
  </article>
</template>

<style scoped>
.person-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 26px;
  padding: 1.4rem;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: #111827;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
  cursor: pointer;
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.person-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.15);
}

.person-card.active {
  box-shadow: 0 25px 60px rgba(99, 102, 241, 0.35);
  border-color: rgba(99, 102, 241, 0.4);
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.7rem;
  color: #9ca3af;
}

.status {
  padding: 0.25rem 0.9rem;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  font-size: 0.8rem;
  white-space: nowrap;
}

.location {
  color: #6b7280;
  font-size: 0.95rem;
}

.vital-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1rem;
}

dl {
  margin: 0;
}

dl div {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

dt {
  font-size: 0.75rem;
  color: #9ca3af;
}

dd {
  font-size: 1.2rem;
  font-weight: 600;
}

footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
}

footer ul {
  list-style: none;
  display: flex;
  gap: 0.4rem;
  flex-wrap: wrap;
  padding: 0;
  margin: 0;
}

footer li {
  padding: 0.2rem 0.6rem;
  border-radius: 999px;
  background: rgba(99, 102, 241, 0.12);
  font-size: 0.75rem;
}

small {
  color: #9ca3af;
}
</style>
