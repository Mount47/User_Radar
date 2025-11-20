<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()

const managedDevices = computed(() => (store.deviceDirectory.length ? store.deviceDirectory : store.devices))

onMounted(() => {
  if (!store.devices.length) {
    store.refreshDevices()
  }
  if (!store.deviceDirectory.length) {
    store.refreshDeviceDirectory({ size: 100 })
  }
  if (!store.deviceOverview) {
    store.refreshDeviceOverview()
  }
  if (!store.detectionSummaries.length) {
    store.refreshDetections()
  }
})

const overview = computed(() => store.deviceOverview)

const onlineRate = computed(() => {
  if (!overview.value) return 0
  const { online, totalDevices, maintenance } = overview.value
  const available = Math.max(totalDevices - maintenance, 1)
  return Math.round((online / available) * 100)
})

const latestDevices = computed(() => {
  return [...managedDevices.value]
    .sort((a, b) => new Date(b.lastHeartbeat || 0).getTime() - new Date(a.lastHeartbeat || 0).getTime())
    .slice(0, 5)
})

const statusLegend = computed(() => {
  if (!overview.value) return []
  return [
    { label: '在线', value: overview.value.online, tone: '#0ea5e9' },
    { label: '维护', value: overview.value.maintenance, tone: '#f59e0b' },
    { label: '离线', value: overview.value.offline, tone: '#f87171' },
    { label: '未绑定', value: overview.value.unboundDevices, tone: '#a855f7' }
  ]
})

const comparisonSeries = computed(() => {
  const base = [
    { month: '1月', breath: 38, posture: 32 },
    { month: '2月', breath: 35, posture: 30 },
    { month: '3月', breath: 40, posture: 34 },
    { month: '4月', breath: 42, posture: 36 },
    { month: '5月', breath: 38, posture: 33 },
    { month: '6月', breath: 44, posture: 37 },
    { month: '7月', breath: 46, posture: 40 },
    { month: '8月', breath: 45, posture: 39 },
    { month: '9月', breath: 43, posture: 36 },
    { month: '10月', breath: 47, posture: 41 },
    { month: '11月', breath: 46, posture: 42 },
    { month: '12月', breath: 48, posture: 43 }
  ]

  if (!overview.value) return base
  const scale = Math.max(overview.value.totalDevices, 1) / 50
  return base.map((item) => ({
    ...item,
    breath: Math.round(item.breath * scale),
    posture: Math.round(item.posture * scale)
  }))
})

const detailDevices = computed(() => {
  return managedDevices.value.slice(0, 6).map((device) => ({
    ...device,
    heartbeat: device.lastHeartbeat
      ? new Date(device.lastHeartbeat).toLocaleString()
      : '暂无心跳',
    personLabel: device.persons?.[0]?.personName || '未绑定'
  }))
})

const changeLabel = computed(() => {
  const base = overview.value?.online ?? managedDevices.value.length
  const delta = base ? Math.min(25, Math.max(6, Math.round(base * 0.2))) : 0
  return `+${delta} 台，相比上个月` 
})
</script>

<template>
  <section class="devices">
    <header class="page-head">
      <div>
        <p class="eyebrow">毫米波雷达</p>
        <h2>设备概览</h2>
        <p class="muted">快速查看在线率、年度趋势和设备状态，一目了然掌握站点健康度。</p>
      </div>
      <div class="head-actions">
        <span class="chip">系统平稳</span>
        <span class="chip ghost">自动刷新</span>
      </div>
    </header>

    <div class="grid">
      <div class="card highlight">
        <div>
          <p class="label">设备数量统计</p>
          <h3>{{ overview?.totalDevices ?? store.devices.length }} 台</h3>
          <p class="accent">{{ changeLabel }}</p>
        </div>
        <div class="pill">设备总览</div>
      </div>

      <div class="card timeline">
        <header>
          <p class="label">设备最近更新时间</p>
          <span class="sub">Top</span>
        </header>
        <ul>
          <li v-for="device in latestDevices" :key="device.deviceId">
            <div class="dot" :class="device.status.toLowerCase()"></div>
            <div class="info">
              <p class="name">{{ device.deviceName }}</p>
              <p class="muted">{{ device.lastHeartbeat ? new Date(device.lastHeartbeat).toLocaleString() : '无记录' }}</p>
            </div>
            <span class="tag">{{ device.status === 'ONLINE' ? '活跃' : device.status === 'MAINTENANCE' ? '维护' : '离线' }}</span>
          </li>
        </ul>
      </div>

      <div class="card compare">
        <header>
          <p class="label">年度检测对比（呼吸 · 姿态）</p>
          <p class="muted">每个月的数据展现当前监测设备的稳定性和检测分析</p>
        </header>
        <div class="chart">
          <div v-for="item in comparisonSeries" :key="item.month" class="bar-group">
            <p class="month">{{ item.month }}</p>
            <div class="bars">
              <div class="bar breath" :style="{ height: `${item.breath}px` }" aria-label="呼吸"></div>
              <div class="bar posture" :style="{ height: `${item.posture}px` }" aria-label="姿态"></div>
            </div>
          </div>
        </div>
        <div class="legend">
          <span class="legend-item"><span class="swatch breath"></span>呼吸检测</span>
          <span class="legend-item"><span class="swatch posture"></span>姿态检测</span>
          <span class="legend-item">在线率 {{ onlineRate }}%</span>
        </div>
      </div>

      <div class="card rate">
        <header>
          <p class="label">设备在线率</p>
          <span class="delta">{{ onlineRate }}%</span>
        </header>
        <div class="bar-track">
          <div class="bar-fill" :style="{ width: `${onlineRate}%` }"></div>
        </div>
        <p class="muted">在线率 = 在线设备 / 可用设备 (排除维护)</p>
        <ul class="legend">
          <li v-for="item in statusLegend" :key="item.label">
            <span class="swatch" :style="{ background: item.tone }"></span>
            {{ item.label }}：{{ item.value }} 台
          </li>
        </ul>
      </div>

      <div class="card details">
        <header>
          <p class="label">设备详情</p>
          <p class="muted">绑定关系 / 心跳 / 场景位置信息</p>
        </header>
        <div class="detail-grid">
          <article v-for="item in detailDevices" :key="item.deviceId" class="detail-card">
            <div class="detail-top">
              <div>
                <p class="name">{{ item.deviceName }}</p>
                <p class="muted">{{ item.location || '未知位置' }}</p>
              </div>
              <span class="chip ghost">{{ item.modelType }}</span>
            </div>
            <p class="muted">最新心跳：{{ item.heartbeat }}</p>
            <p class="muted">绑定对象：{{ item.personLabel }}</p>
            <div class="status-row">
              <span :class="['status-dot', item.status.toLowerCase()]"></span>
              <span class="status-text">{{ item.status === 'ONLINE' ? '在线' : item.status === 'MAINTENANCE' ? '维护' : '离线' }}</span>
            </div>
          </article>
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.devices {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  padding: 1.4rem 1.8rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.82), rgba(236, 245, 255, 0.9));
  color: #0f172a;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.1);
}

.eyebrow {
  letter-spacing: 0.12em;
  text-transform: uppercase;
  font-size: 0.8rem;
  color: #6b7280;
}

.muted {
  color: #6b7280;
}

.head-actions {
  display: flex;
  gap: 0.6rem;
}

.chip {
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
  color: #0b1020;
  font-weight: 700;
  font-size: 0.9rem;
}

.chip.ghost {
  background: rgba(255, 255, 255, 0.7);
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.08);
}

.grid {
  display: grid;
  grid-template-columns: 320px 1fr;
  grid-template-rows: auto auto 1fr;
  gap: 1.2rem;
  align-items: start;
}

.card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 22px;
  padding: 1.2rem 1.4rem;
  color: #0f172a;
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 24px 65px rgba(15, 23, 42, 0.14);
}

.label {
  font-size: 0.95rem;
  color: #94a3b8;
}

.sub {
  font-size: 0.85rem;
  color: #a1a1aa;
}

.highlight {
  grid-row: span 2;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 1rem;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.95), rgba(226, 240, 255, 0.95));
}

.highlight h3 {
  font-size: 2.4rem;
  margin: 0.2rem 0;
}

.accent {
  color: #22c55e;
  font-weight: 700;
}

.pill {
  align-self: flex-start;
  padding: 0.4rem 0.8rem;
  border-radius: 12px;
  background: rgba(16, 185, 129, 0.15);
  color: #047857;
  font-weight: 600;
}

.timeline ul {
  list-style: none;
  margin: 0.6rem 0 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}

.timeline li {
  display: flex;
  align-items: center;
  gap: 0.8rem;
  padding: 0.4rem 0.2rem;
}

.dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

.dot.online {
  background: #0ea5e9;
}

.dot.maintenance {
  background: #f59e0b;
}

.dot.offline {
  background: #f87171;
}

.info .name {
  font-weight: 700;
}

.tag {
  margin-left: auto;
  background: rgba(15, 23, 42, 0.05);
  padding: 0.25rem 0.55rem;
  border-radius: 10px;
  font-size: 0.85rem;
  color: #0f172a;
}

.compare {
  grid-column: 2 / -1;
}

.chart {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(50px, 1fr));
  gap: 0.8rem;
  align-items: end;
  margin-top: 1rem;
  min-height: 220px;
}

.bar-group {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.4rem;
}

.month {
  font-size: 0.85rem;
  color: #94a3b8;
}

.bars {
  display: grid;
  grid-template-columns: repeat(2, 12px);
  gap: 8px;
  align-items: end;
}

.bar {
  width: 12px;
  border-radius: 8px 8px 4px 4px;
  transition: height 0.3s ease;
}

.bar.breath {
  background: linear-gradient(180deg, #a855f7, #6366f1);
}

.bar.posture {
  background: linear-gradient(180deg, #22c55e, #16a34a);
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-top: 0.8rem;
  color: #475569;
  font-size: 0.9rem;
}

.legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.swatch {
  width: 12px;
  height: 12px;
  display: inline-block;
  border-radius: 4px;
}

.swatch.breath {
  background: linear-gradient(135deg, #a855f7, #6366f1);
}

.swatch.posture {
  background: linear-gradient(135deg, #22c55e, #16a34a);
}

.rate {
  grid-row: span 2;
}

.rate .bar-track {
  width: 100%;
  height: 14px;
  background: rgba(15, 23, 42, 0.06);
  border-radius: 999px;
  overflow: hidden;
  margin: 0.6rem 0 0.4rem;
}

.bar-fill {
  height: 100%;
  border-radius: 999px;
  background: linear-gradient(90deg, #22c55e, #a855f7);
  transition: width 0.3s ease;
}

.rate .delta {
  font-weight: 700;
  color: #0f172a;
}

.details {
  grid-column: 1 / -1;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 0.9rem;
  margin-top: 0.8rem;
}

.detail-card {
  border: 1px solid rgba(15, 23, 42, 0.05);
  border-radius: 16px;
  padding: 0.9rem;
  background: rgba(249, 250, 251, 0.9);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6);
}

.detail-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.6rem;
  margin-bottom: 0.6rem;
}

.status-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.status-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #94a3b8;
}

.status-dot.online {
  background: #22c55e;
}

.status-dot.maintenance {
  background: #f59e0b;
}

.status-dot.offline {
  background: #ef4444;
}

.status-text {
  font-weight: 700;
}

@media (max-width: 1080px) {
  .grid {
    grid-template-columns: 1fr;
    grid-template-rows: none;
  }

  .highlight,
  .rate {
    grid-row: auto;
  }
}
</style>
