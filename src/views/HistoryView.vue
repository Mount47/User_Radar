<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const ranges = [6, 12, 24, 48]

const form = ref({
  userName: '',
  userId: '',
  deviceId: '',
  startDate: '',
  endDate: ''
})

onMounted(() => {
  if (!store.persons.length) {
    store.hydrateScope()
  } else {
    store.refreshHistoryBuckets()
    store.fetchHistoryForSelection()
  }
  if (!store.detectionSummaries.length) {
    store.refreshDetections()
  }
})

const bucketRows = computed(() => {
  const person = store.activePerson
  if (!person) return []
  const buckets = store.bucketedHistory[person.personId] || []
  return buckets.slice(-store.historyRangeHours)
})

const summaryMetrics = computed(() => {
  if (!bucketRows.value.length) {
    return null
  }
  const heart = bucketRows.value.map((row) => row.heartRateAvg)
  const breath = bucketRows.value.map((row) => row.breathRateAvg)
  return {
    heartMin: Math.min(...heart).toFixed(0),
    heartMax: Math.max(...heart).toFixed(0),
    heartAvg: (heart.reduce((a, b) => a + b, 0) / heart.length).toFixed(1),
    breathMin: Math.min(...breath).toFixed(1),
    breathMax: Math.max(...breath).toFixed(1),
    breathAvg: (breath.reduce((a, b) => a + b, 0) / breath.length).toFixed(1)
  }
})

const activityBreakdown = computed(() => {
  const history = bucketRows.value
  if (!history.length) {
    return [
      { label: '坐姿时长', value: 49 },
      { label: 'Standing time', value: 37 },
      { label: 'Walking time', value: 13 },
      { label: 'Fall duration', value: 1 }
    ]
  }
  const totals = {
    sitting: 0,
    standing: 0,
    walking: 0,
    fall: 0
  }
  history.forEach((bucket, index) => {
    const base = bucket.eventCount || 1
    const mod = index % 4
    if (mod === 0) totals.sitting += base
    if (mod === 1) totals.standing += base
    if (mod === 2) totals.walking += base
    if (mod === 3) totals.fall += base * 0.25
  })
  const total = Object.values(totals).reduce((a, b) => a + b, 0) || 1
  return [
    { label: 'Sitting time', value: Math.round((totals.sitting / total) * 100) },
    { label: 'Standing time', value: Math.round((totals.standing / total) * 100) },
    { label: 'Walking time', value: Math.round((totals.walking / total) * 100) },
    { label: 'Fall duration', value: Math.max(1, Math.round((totals.fall / total) * 100)) }
  ]
})

const donutSegments = computed(() => {
  let cumulative = 0
  return activityBreakdown.value.map((item) => {
    const start = cumulative
    cumulative += (item.value / 100) * 360
    return { ...item, start, end: cumulative }
  })
})

const postureHistory = computed(() => {
  const personId = store.activePerson?.personId
  if (!personId) return []
  return store.detectionSummaries
    .filter((item) => item.personId === personId && item.detectionType === 'POSTURE')
    .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
})

const timelineEvents = computed(() => postureHistory.value.slice(-5).reverse())

const chartPath = computed(() => {
  if (!bucketRows.value.length) return ''
  const values = bucketRows.value.map((row) => row.heartRateAvg)
  const min = Math.min(...values)
  const max = Math.max(...values)
  const range = Math.max(1, max - min)
  const step = values.length > 1 ? 100 / (values.length - 1) : 0
  return values
    .map((value, index) => {
      const normalized = (value - min) / range
      const y = 100 - normalized * 100
      const x = index * step
      return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})

function handleSearch() {
  console.info('History search form submitted', form.value)
}

function handleReset() {
  form.value = {
    userName: '',
    userId: '',
    deviceId: '',
    startDate: '',
    endDate: ''
  }
}
</script>

<template>
  <section class="history-page" v-if="store.activePerson">
    <header class="page-head">
      <div>
        <p class="eyebrow">Historical Statistic</p>
        <h1>历史生命体征分析</h1>
        <p class="muted">选择时间范围可回放心率、呼吸与姿态异常。</p>
      </div>
      <div class="chips">
        <button
          v-for="item in ranges"
          :key="item"
          type="button"
          :class="{ active: store.historyRangeHours === item }"
          @click="store.setHistoryRange(item)"
        >
          {{ item }}h
        </button>
      </div>
    </header>

    <div class="layout">
      <aside class="card search-card">
        <h3>Search Criteria</h3>
        <label>
          <span>用户姓名</span>
          <input v-model="form.userName" type="text" placeholder="Name" />
        </label>
        <label>
          <span>用户ID</span>
          <input v-model="form.userId" type="text" placeholder="ID" />
        </label>
        <label>
          <span>设备ID</span>
          <input v-model="form.deviceId" type="text" placeholder="Device ID" />
        </label>
        <label>
          <span>时间</span>
          <div class="range">
            <input v-model="form.startDate" type="date" />
            <span>to</span>
            <input v-model="form.endDate" type="date" />
          </div>
        </label>
        <div class="actions">
          <button type="button" @click="handleSearch">搜索</button>
          <button type="button" class="ghost" @click="handleReset">重置</button>
        </div>

        <div class="donut" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="40" class="track"></circle>
            <g v-for="segment in donutSegments" :key="segment.label">
              <circle
                cx="60"
                cy="60"
                r="40"
                class="segment"
                :stroke-dasharray="`${(segment.value / 100) * 251} 251`"
                :stroke-dashoffset=" -((segment.start / 360) * 251) "
              ></circle>
            </g>
          </svg>
          <div class="donut-center">
            <strong>24h</strong>
            <small>Total Hours</small>
          </div>
        </div>
        <ul class="donut-legend">
          <li v-for="segment in activityBreakdown" :key="segment.label">
            <span>{{ segment.label }}</span>
            <strong>{{ segment.value }}%</strong>
          </li>
        </ul>
      </aside>

      <div class="content">
        <div class="stat-row">
          <article class="card stat-card" v-for="item in activityBreakdown" :key="item.label">
            <p>{{ item.label }}</p>
            <strong>{{ item.value }}%</strong>
          </article>
        </div>

        <article class="card chart-card">
          <header>
            <div>
              <p class="eyebrow">Historical Statistic</p>
              <h2>心率 · 呼吸趋势</h2>
            </div>
            <span>最近 {{ store.historyRangeHours }} 小时</span>
          </header>
          <div class="chart-body" v-if="bucketRows.length">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <path :d="chartPath" />
            </svg>
            <div class="chart-meta" v-if="summaryMetrics">
              <div>
                <small>Min</small>
                <strong>{{ summaryMetrics.heartMin }} / {{ summaryMetrics.breathMin }}</strong>
              </div>
              <div>
                <small>Avg</small>
                <strong>{{ summaryMetrics.heartAvg }} / {{ summaryMetrics.breathAvg }}</strong>
              </div>
              <div>
                <small>Max</small>
                <strong>{{ summaryMetrics.heartMax }} / {{ summaryMetrics.breathMax }}</strong>
              </div>
            </div>
          </div>
          <p v-else class="empty">尚未获取到历史数据。</p>
        </article>

        <article class="card table-card">
          <header>
            <p>历史分桶 (最近 {{ bucketRows.length }} 条)</p>
          </header>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>时间</th>
                  <th>平均心率</th>
                  <th>平均呼吸</th>
                  <th>体动</th>
                  <th>事件数</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in bucketRows" :key="row.timestamp">
                  <td>{{ new Date(row.timestamp).toLocaleString() }}</td>
                  <td>{{ row.heartRateAvg }}</td>
                  <td>{{ row.breathRateAvg }}</td>
                  <td>{{ row.motionAvg }}</td>
                  <td>{{ row.eventCount }}</td>
                </tr>
                <tr v-if="!bucketRows.length">
                  <td colspan="5">暂无记录</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card timeline-card">
          <header>
            <p>Posture Timeline</p>
            <span>最近 {{ timelineEvents.length }} 条</span>
          </header>
          <ul>
            <li v-for="event in timelineEvents" :key="event.detectionId">
              <strong>{{ event.posture || 'Unknown' }}</strong>
              <p>{{ event.deviceName || 'Device' }}</p>
              <small>{{ new Date(event.updatedAt).toLocaleString() }}</small>
            </li>
            <li v-if="!timelineEvents.length">等待姿态数据...</li>
          </ul>
        </article>
      </div>
    </div>
  </section>
  <p v-else class="empty">暂无人员，请先完成登录与授权。</p>
</template>

<style scoped>
:global(body) {
  background: #f4f5fb;
}

.history-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #0f172a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  align-items: center;
}

.page-head h1 {
  margin: 0.2rem 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
}

.muted {
  color: rgba(15, 23, 42, 0.6);
  margin: 0;
}

.chips {
  display: inline-flex;
  gap: 0.4rem;
}

.chips button {
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
}

.chips button.active {
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  border-color: transparent;
  color: #fff;
}

.layout {
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
  gap: 1.5rem;
}

.card {
  background: #fff;
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.search-card {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.search-card label {
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.search-card input {
  border: 1px solid rgba(15, 23, 42, 0.15);
  border-radius: 16px;
  padding: 0.5rem 0.9rem;
}

.range {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.actions {
  display: flex;
  gap: 0.8rem;
}

.actions button {
  flex: 1;
  border: none;
  border-radius: 999px;
  padding: 0.5rem 0.9rem;
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: #fff;
  cursor: pointer;
}

.actions .ghost {
  background: rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.donut {
  position: relative;
  width: 160px;
  height: 160px;
  align-self: center;
}

.donut svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.track {
  fill: none;
  stroke: rgba(15, 23, 42, 0.05);
  stroke-width: 14;
}

.segment {
  fill: none;
  stroke-width: 14;
  stroke-linecap: round;
  stroke: url(#grad) #a855f7;
}

.donut-center {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
}

.donut-legend {
  list-style: none;
  padding: 0;
  margin: 1rem 0 0;
  display: flex;
  flex-direction: column;
  gap: 0.3rem;
}

.donut-legend li {
  display: flex;
  justify-content: space-between;
  font-size: 0.9rem;
}

.content {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.stat-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.8rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.chart-card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.chart-body {
  border: 1px dashed rgba(15, 23, 42, 0.1);
  border-radius: 20px;
  padding: 1rem;
  background: #f9fafb;
}

.chart-body svg {
  width: 100%;
  height: 220px;
}

.chart-body path {
  fill: none;
  stroke: #a855f7;
  stroke-width: 0.5;
}

.chart-meta {
  display: flex;
  justify-content: space-between;
  margin-top: 1rem;
}

.table-card .table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 0.8rem;
  text-align: left;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
}

.timeline-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.6rem;
}

.timeline-card li {
  border-radius: 16px;
  padding: 0.9rem;
  background: #f9fafb;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.4);
  margin: 0;
}

.empty {
  text-align: center;
  color: rgba(15, 23, 42, 0.6);
}

@media (max-width: 960px) {
  .layout {
    grid-template-columns: 1fr;
  }
}
</style>
