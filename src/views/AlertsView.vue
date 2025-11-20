<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import type { AlertCategory, AlertStatus } from '@/types'

const store = useUserStore()

const categoryFilters: Array<{ label: string; value: AlertCategory | 'ALL' }> = [
  { label: '全部类型', value: 'ALL' },
  { label: '生命体征', value: 'VITALS' },
  { label: '姿态 / 跌倒', value: 'POSTURE' },
  { label: '设备', value: 'DEVICE' }
]

const statusFilters: Array<{ label: string; value: AlertStatus | 'ALL' }> = [
  { label: '活跃', value: 'ACTIVE' },
  { label: '已确认', value: 'ACKED' },
  { label: '已关闭', value: 'RESOLVED' },
  { label: '全部', value: 'ALL' }
]

const scopeFilters = [
  { label: '当前关注人员', value: 'CURRENT' },
  { label: '全部人员', value: 'ALL' }
]

onMounted(() => {
  if (!store.alerts.length) {
    store.refreshAlerts()
  }
})

const severityStats = computed(() => {
  const summary = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 }
  store.scopedAlerts.forEach((alert) => {
    summary[alert.severity] = (summary[alert.severity] || 0) + 1
  })
  const total = store.scopedAlerts.length || 1
  return Object.entries(summary).map(([severity, count]) => ({
    severity,
    count,
    percent: Math.round((count / total) * 100)
  }))
})

const timelineAlerts = computed(() => {
  return store.scopedAlerts.slice(0, 6)
})

const tableItems = computed(() => store.scopedAlerts)

async function handleCategoryChange(value: AlertCategory | 'ALL') {
  await store.setAlertFilter({ category: value })
}

async function handleStatusChange(value: AlertStatus | 'ALL') {
  await store.setAlertFilter({ status: value })
}

async function handleScopeChange(value: 'CURRENT' | 'ALL') {
  await store.setAlertFilter({ personScope: value })
}

async function handleAction(alertId: number, status: AlertStatus) {
  await store.changeAlertStatus(alertId, status)
}
</script>

<template>
  <section class="alerts-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Exception Status</p>
        <h1>异常状态与闭环</h1>
        <p class="muted">监控生命体征、姿态、设备状态，快速定位高优先级事件。</p>
      </div>
      <div class="summary-cards">
        <div>
          <small>Active Alerts</small>
          <strong>{{ store.alertStats.active }}</strong>
        </div>
        <div>
          <small>Critical</small>
          <strong>{{ store.alertStats.critical }}</strong>
        </div>
        <div>
          <small>Total</small>
          <strong>{{ store.alertStats.total }}</strong>
        </div>
      </div>
    </header>

    <div class="filter-bar">
      <div class="pill-set">
        <span>类型</span>
        <button
          v-for="item in categoryFilters"
          :key="item.value"
          :class="{ active: store.alertFilters.category === item.value }"
          type="button"
          @click="handleCategoryChange(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="pill-set">
        <span>状态</span>
        <button
          v-for="item in statusFilters"
          :key="item.value"
          :class="{ active: store.alertFilters.status === item.value }"
          type="button"
          @click="handleStatusChange(item.value)"
        >
          {{ item.label }}
        </button>
      </div>
      <div class="pill-set">
        <span>范围</span>
        <button
          v-for="item in scopeFilters"
          :key="item.value"
          :class="{ active: store.alertFilters.personScope === item.value }"
          type="button"
          @click="handleScopeChange(item.value as 'CURRENT' | 'ALL')"
        >
          {{ item.label }}
        </button>
      </div>
    </div>

    <div class="grid">
      <article class="card severity-card">
        <header>
          <p class="eyebrow">Severity Overview</p>
          <span>{{ tableItems.length }} alerts</span>
        </header>
        <ul>
          <li v-for="item in severityStats" :key="item.severity">
            <div>
              <strong>{{ item.severity }}</strong>
              <small>{{ item.count }} 条</small>
            </div>
            <div class="bar">
              <div :style="{ width: item.percent + '%' }"></div>
            </div>
          </li>
        </ul>
      </article>

      <article class="card timeline-card">
        <header>
          <p class="eyebrow">Exception Timeline</p>
          <span>最新 6 条</span>
        </header>
        <ul>
          <li v-for="alert in timelineAlerts" :key="alert.alertId">
            <div>
              <strong>{{ alert.personName || '未知人员' }}</strong>
              <small>{{ alert.alertType || alert.description || alert.category }}</small>
            </div>
            <div>
              <p>{{ new Date(alert.detectedAt).toLocaleString() }}</p>
              <span class="severity" :class="alert.severity.toLowerCase()">{{ alert.severity }}</span>
            </div>
          </li>
          <li v-if="!timelineAlerts.length">等待新告警...</li>
        </ul>
      </article>

      <article class="card action-card">
        <header>
          <p class="eyebrow">异常处理</p>
          <h2>闭环追踪</h2>
        </header>
        <p class="muted">
          选择过滤条件后，可在下方表格中快速对异常进行确认 / 关闭，以便生成处理记录。
        </p>
        <div class="status-grid">
          <div>
            <small>Active</small>
            <strong>{{ store.alertStats.active }}</strong>
          </div>
          <div>
            <small>Critical</small>
            <strong>{{ store.alertStats.critical }}</strong>
          </div>
          <div>
            <small>Resolved</small>
            <strong>{{ store.alerts.filter((item) => item.status === 'RESOLVED').length }}</strong>
          </div>
        </div>
      </article>
    </div>

    <article class="card alerts-table">
      <header>
        <div>
          <p>Exception warning Details</p>
          <span>Primary notification example</span>
        </div>
      </header>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>人员 · 设备</th>
              <th>类型</th>
              <th>严重度</th>
              <th>状态</th>
              <th>时间</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in tableItems" :key="item.alertId">
              <td>
                <strong>{{ item.personName || 'Unknown' }}</strong>
                <small>{{ item.deviceId }}</small>
              </td>
              <td>{{ item.alertType || item.category }}</td>
              <td>
                <span class="severity" :class="item.severity.toLowerCase()">{{ item.severity }}</span>
              </td>
              <td>
                <span class="status" :class="(item.status || 'ACTIVE').toLowerCase()">{{ item.status || 'ACTIVE' }}</span>
              </td>
              <td>{{ new Date(item.detectedAt).toLocaleString() }}</td>
              <td class="actions">
                <button type="button" @click="handleAction(item.alertId, 'ACKED')">确认</button>
                <button type="button" @click="handleAction(item.alertId, 'RESOLVED')">关闭</button>
              </td>
            </tr>
            <tr v-if="!tableItems.length">
              <td colspan="6">暂无告警</td>
            </tr>
          </tbody>
        </table>
      </div>
    </article>
  </section>
</template>

<style scoped>
:global(body) {
  background: #f4f5fb;
}

.alerts-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #0f172a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 1rem;
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

.summary-cards {
  display: flex;
  gap: 1rem;
}

.summary-cards > div {
  padding: 1rem 1.2rem;
  border-radius: 20px;
  background: #fff;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
  min-width: 120px;
}

.summary-cards small {
  color: rgba(15, 23, 42, 0.5);
  display: block;
}

.filter-bar {
  background: #fff;
  border-radius: 28px;
  padding: 1rem;
  box-shadow: 0 15px 35px rgba(15, 23, 42, 0.05);
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
}

.pill-set {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  flex-wrap: wrap;
}

.pill-set span {
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.pill-set button {
  border: 1px solid rgba(15, 23, 42, 0.2);
  background: #fff;
  border-radius: 999px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
}

.pill-set button.active {
  background: linear-gradient(135deg, #8b5cf6, #22d3ee);
  border-color: transparent;
  color: #fff;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
}

.card {
  background: #fff;
  border-radius: 28px;
  padding: 1.4rem;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.08);
}

.severity-card ul,
.timeline-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.severity-card li {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.bar {
  flex: 1;
  height: 8px;
  border-radius: 999px;
  background: #f3f4f6;
  overflow: hidden;
}

.bar div {
  height: 100%;
  background: linear-gradient(90deg, #f43f5e, #fcd34d);
}

.timeline-card li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem;
  border-radius: 16px;
  background: #f9fafb;
}

.action-card .status-grid {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}

.status-grid > div {
  flex: 1;
  background: #f9fafb;
  border-radius: 16px;
  padding: 0.9rem;
}

.alerts-table header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alerts-table .table-wrapper {
  overflow-x: auto;
  margin-top: 1rem;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 720px;
}

th,
td {
  padding: 0.85rem 0.7rem;
  border-bottom: 1px solid rgba(15, 23, 42, 0.08);
  text-align: left;
}

td small {
  display: block;
  color: rgba(15, 23, 42, 0.5);
}

.severity {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
}

.severity.critical {
  background: rgba(244, 63, 94, 0.15);
  color: #f43f5e;
}

.severity.high {
  background: rgba(249, 115, 22, 0.15);
  color: #f97316;
}

.severity.medium {
  background: rgba(251, 191, 36, 0.2);
  color: #f59e0b;
}

.severity.low {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
}

.status {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  font-size: 0.75rem;
  text-transform: uppercase;
  background: rgba(15, 23, 42, 0.05);
}

.status.active {
  color: #f43f5e;
}

.status.acked {
  color: #06b6d4;
}

.status.resolved {
  color: #10b981;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.actions button {
  border: none;
  border-radius: 10px;
  padding: 0.45rem 0.9rem;
  cursor: pointer;
  background: rgba(15, 23, 42, 0.08);
}

.actions button:last-child {
  background: linear-gradient(135deg, #7c3aed, #ec4899);
  color: #fff;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.4);
  margin: 0;
}

@media (max-width: 960px) {
  .filter-bar {
    flex-direction: column;
  }
}
</style>
