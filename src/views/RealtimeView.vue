<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()
const activeTab = ref<'vitals' | 'posture'>('vitals')

onMounted(() => {
  if (!store.persons.length) {
    store.hydrateScope()
  } else {
    store.fetchRealtimeForSelection()
    if (store.activePerson?.personId) {
      store.fetchHistoryForSelection(store.activePerson.personId)
    }
  }
  if (!store.detectionSummaries.length) {
    store.refreshDetections()
  }
})

function onSelectChange(event: Event) {
  const target = event.target as HTMLSelectElement
  store.selectPerson(target.value)
}

const historySlice = computed(() => {
  const person = store.activePerson
  if (!person) return []
  const data = store.histories[person.personId] || []
  return data.slice(-40)
})

const chartPaths = computed(() => {
  const data = historySlice.value
  if (!data.length) return { heart: '', breath: '' }
  const heart = data.map((item) => Number(item.heartRate ?? 0))
  const breath = data.map((item) => Number(item.breathRate ?? 0))
  const all = [...heart, ...breath]
  const max = Math.max(...all, 0)
  const min = Math.min(...all, 0)
  const range = Math.max(1, max - min)
  const build = (values: number[]) => {
    if (!values.length) return ''
    const step = values.length > 1 ? 100 / (values.length - 1) : 0
    return values
      .map((value, index) => {
        const normalized = (value - min) / range
        const y = 100 - normalized * 100
        const x = index * step
        return `${index === 0 ? 'M' : 'L'}${x.toFixed(2)},${y.toFixed(2)}`
      })
      .join(' ')
  }
  return {
    heart: build(heart),
    breath: build(breath)
  }
})

const trendDeltas = computed(() => {
  const data = historySlice.value
  if (data.length < 2) {
    return { heart: 0, breath: 0 }
  }
  const last = data[data.length - 1]!
  const prev = data[data.length - 2]!
  return {
    heart: Number(last.heartRate ?? 0) - Number(prev.heartRate ?? 0),
    breath: Number(last.breathRate ?? 0) - Number(prev.breathRate ?? 0)
  }
})

const monitoringStatus = computed(() => {
  if (!store.activeRealtime) return { label: '未知', detail: '等待设备上线' }
  return store.activeRealtime.occupancy
    ? { label: '有人在场', detail: '当前检测到有人体活动' }
    : { label: '无人占床', detail: '未检测到在床人员' }
})

const exceptionAlerts = computed(() => {
  return store.scopedAlerts.slice(0, 4).map((alert) => ({
    id: alert.alertId,
    userName: alert.personName || store.activePerson?.personName || '未知人员',
    deviceId: alert.deviceId,
    deviceName: alert.alertType || alert.category || '告警',
    description: alert.description || alert.alertType || '有异常需要处理',
    severity: alert.severity
  }))
})

const exceptionSummary = computed(() => ({
  total: store.scopedAlerts.length,
  critical: store.scopedAlerts.filter((item) => item.severity === 'CRITICAL' || item.severity === 'HIGH').length
}))

const activeDevice = computed(() => {
  const person = store.activePerson
  if (!person) return null
  const bound = person.devices[0]
  if (bound?.deviceId) {
    return (
      store.devices.find((device) => device.deviceId === bound.deviceId) || {
        deviceId: bound.deviceId,
        deviceName: bound.deviceName,
        modelType: bound.modelType || 'N/A',
        status: 'ONLINE',
        lastHeartbeat: store.profile?.serverTime || ''
      }
    )
  }
  return store.devices.find((device) => device.persons?.some((item) => item.personId === person.personId)) || null
})

const postureDetection = computed(() => {
  const personId = store.activePerson?.personId
  if (!personId) return null
  return store.detectionSummaries.find(
    (item) => item.personId === personId && item.detectionType === 'POSTURE'
  )
})

function formatDate(value?: string) {
  if (!value) return '暂无'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}
</script>

<template>
  <section class="realtime-page" v-if="store.activePerson">
    <header class="page-head">
      <div>
        <p class="eyebrow">实时监测</p>
        <h1>实时数据监控中心</h1>
        <p class="muted">切换模式查看呼吸心跳波形或人体位姿</p>
      </div>
      <div class="controls">
        <label class="select-field">
          <span>选择人员</span>
          <select v-model="store.selectedPersonId" @change="onSelectChange">
            <option v-for="person in store.persons" :key="person.personId" :value="person.personId">
              {{ person.personName }} · {{ person.devices[0]?.deviceName || '未绑定' }}
            </option>
          </select>
        </label>
        <div class="tab-bar">
          <button type="button" :class="{ active: activeTab === 'vitals' }" @click="activeTab = 'vitals'">
            实时体征
          </button>
          <button type="button" :class="{ active: activeTab === 'posture' }" @click="activeTab = 'posture'">
            人体位姿
          </button>
        </div>
      </div>
    </header>

    <div v-if="activeTab === 'vitals'" class="tab-panel">
      <div class="vitals-grid">
        <article class="card chart-card waveform-card">
          <div class="chart-head">
            <div>
              <p class="eyebrow">实时波形趋势</p>
              <h2>呼吸 · 心跳数据</h2>
              <p class="muted">下图为实时数据波形，可快速识别呼吸与心跳异常。</p>
            </div>
            <div class="chart-legend">
              <span><i class="dot heart"></i> 心跳 Heartbeat</span>
              <span><i class="dot breath"></i> 呼吸 Respiratory</span>
            </div>
          </div>
          <div class="chart-body" v-if="historySlice.length">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none">
              <defs>
                <linearGradient id="heartStroke" x1="0%" x2="100%">
                  <stop offset="0%" stop-color="#f43f5e"></stop>
                  <stop offset="100%" stop-color="#fb7185"></stop>
                </linearGradient>
                <linearGradient id="breathStroke" x1="0%" x2="100%">
                  <stop offset="0%" stop-color="#a855f7"></stop>
                  <stop offset="100%" stop-color="#38bdf8"></stop>
                </linearGradient>
              </defs>
              <path :d="chartPaths.heart" stroke="url(#heartStroke)" fill="none" stroke-width="0.6" />
              <path :d="chartPaths.breath" stroke="url(#breathStroke)" fill="none" stroke-width="0.6" />
            </svg>
          </div>
          <p v-else class="empty">等待设备推送实时波形...</p>
          <div class="chart-footer">
            <span>下图展示了数据的波形</span>
            <span>可根据实时数据判断患者呼吸心跳状态</span>
          </div>
        </article>

        <aside class="side-panel">
          <article class="card info-card user-card">
            <header>
              <span>人员信息</span>
              <strong>{{ store.activePerson.personName }}</strong>
            </header>
            <dl>
              <div>
                <dt>人员 ID</dt>
                <dd>{{ store.activePerson.personId }}</dd>
              </div>
              <div>
                <dt>性别</dt>
                <dd>{{ store.activePerson.gender === 'M' ? '男' : '女' }}</dd>
              </div>
              <div>
                <dt>所属科室</dt>
                <dd>{{ store.activePerson.department }}</dd>
              </div>
              <div>
                <dt>标签</dt>
                <dd>{{ store.activePerson.tags?.[0] || '未设置' }}</dd>
              </div>
              <div>
                <dt>最近采集</dt>
                <dd>{{ formatDate(store.activePerson.latestOverview?.collectedAt) }}</dd>
              </div>
            </dl>
          </article>

          <article class="card info-card device-card" v-if="activeDevice">
            <header>
              <span>设备信息</span>
              <strong>{{ activeDevice.deviceName }}</strong>
            </header>
            <dl>
              <div>
                <dt>设备 ID</dt>
                <dd>{{ activeDevice.deviceId }}</dd>
              </div>
              <div>
                <dt>设备类型</dt>
                <dd>{{ activeDevice.modelType }}</dd>
              </div>
              <div>
                <dt>当前状态</dt>
                <dd>{{ activeDevice.status }}</dd>
              </div>
              <div>
                <dt>最近心跳</dt>
                <dd>{{ formatDate(activeDevice.lastHeartbeat) }}</dd>
              </div>
            </dl>
          </article>
          <article v-else class="card info-card muted-card">
            <p>暂无设备绑定，请检查硬件状态。</p>
          </article>

          <article class="card alert-table compact">
            <header>
              <div>
                <p>异常告警列表</p>
                <span>{{ exceptionSummary.total }} 条告警，点击处理</span>
              </div>
              <button type="button">去处理</button>
            </header>
            <div class="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>人员</th>
                    <th>设备 ID</th>
                    <th>设备名称</th>
                    <th>说明</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in exceptionAlerts" :key="item.id">
                    <td>{{ item.userName }}</td>
                    <td>{{ item.deviceId }}</td>
                    <td>{{ item.deviceName }}</td>
                    <td>{{ item.description }}</td>
                  </tr>
                  <tr v-if="!exceptionAlerts.length">
                    <td colspan="4">暂无异常记录</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </article>
        </aside>
      </div>

      <div class="status-grid inline">
        <article class="card mini-card">
          <p>监测状态</p>
          <strong>{{ monitoringStatus.label }}</strong>
          <span>{{ monitoringStatus.detail }}</span>
        </article>
        <article class="card mini-card">
          <p>异常数量</p>
          <strong>{{ exceptionSummary.total }}</strong>
          <span>{{ exceptionSummary.critical }} 条高优先级待处理</span>
        </article>
        <article class="card mini-card">
          <p>呼吸 Respiratory</p>
          <strong>{{ store.activeRealtime?.breathRate ?? '--' }} 次/分</strong>
          <span :class="{ up: trendDeltas.breath >= 0, down: trendDeltas.breath < 0 }">
            {{ trendDeltas.breath >= 0 ? '+' : '' }}{{ trendDeltas.breath }} vs 上一次
          </span>
        </article>
        <article class="card mini-card">
          <p>心率 Heartbeat</p>
          <strong>{{ store.activeRealtime?.heartRate ?? '--' }} 次/分</strong>
          <span :class="{ up: trendDeltas.heart >= 0, down: trendDeltas.heart < 0 }">
            {{ trendDeltas.heart >= 0 ? '+' : '' }}{{ trendDeltas.heart }} vs 上一次
          </span>
        </article>
      </div>
    </div>
    <div v-else class="tab-panel posture-panel">
      <article class="card chart-card" v-if="postureDetection">
        <div class="chart-head">
          <div>
            <p class="eyebrow">人体位姿监测</p>
            <h2>位姿概览</h2>
            <p class="muted">最新更新 · {{ formatDate(postureDetection.updatedAt) }}</p>
          </div>
          <div class="chart-legend">
            <span>{{ postureDetection.fallRisk ? '检测到跌倒风险' : '姿态稳定' }}</span>
          </div>
        </div>
        <div class="posture-layout">
          <div class="posture-visual">
            <div class="posture-cloud">
              <p>3D 点云</p>
              <span>下图展示了点云</span>
              <em>云图实时更新，可查看坐站行走姿态</em>
            </div>
            <div class="posture-state">
              <p>监测状态</p>
              <strong>{{ postureDetection.presence ? 'Monitoring status' : '未检测到人体' }}</strong>
              <span>State：{{ postureDetection.posture || '未知' }}</span>
            </div>
          </div>
          <aside class="posture-side">
            <article class="card info-card user-card">
              <header>
                <span>人员信息</span>
                <strong>{{ store.activePerson.personName }}</strong>
              </header>
              <dl>
                <div>
                  <dt>人员 ID</dt>
                  <dd>{{ store.activePerson.personId }}</dd>
                </div>
                <div>
                  <dt>性别</dt>
                  <dd>{{ store.activePerson.gender === 'M' ? '男' : '女' }}</dd>
                </div>
              </dl>
            </article>
            <article class="card info-card device-card" v-if="activeDevice">
              <header>
                <span>设备信息</span>
                <strong>{{ activeDevice.deviceName }}</strong>
              </header>
              <dl>
                <div>
                  <dt>设备 ID</dt>
                  <dd>{{ activeDevice.deviceId }}</dd>
                </div>
                <div>
                  <dt>设备类型</dt>
                  <dd>{{ activeDevice.modelType }}</dd>
                </div>
                <div>
                  <dt>更新时间</dt>
                  <dd>{{ formatDate(activeDevice.lastHeartbeat) }}</dd>
                </div>
              </dl>
            </article>
            <article v-else class="card info-card muted-card">
              <p>暂无设备绑定，请检查硬件状态。</p>
            </article>
            <article class="card mini-card posture-cta">
              <p>姿态跟踪</p>
              <strong>{{ postureDetection.posture || '未知' }}</strong>
              <span>{{ postureDetection.fallRisk ? '存在跌倒风险' : '姿态稳定' }}</span>
            </article>
          </aside>
        </div>
        <div class="status-grid inline">
          <article class="card mini-card">
            <p>位姿状态</p>
            <strong>{{ postureDetection.posture || '未知' }}</strong>
            <span>实时推理</span>
          </article>
          <article class="card mini-card">
            <p>有人/无人</p>
            <strong>{{ postureDetection.presence ? '有人' : '无人' }}</strong>
            <span>{{ postureDetection.presence ? '监测中' : '未占床' }}</span>
          </article>
          <article class="card mini-card">
            <p>心率</p>
            <strong>{{ postureDetection.heartRate ?? '--' }} 次/分</strong>
            <span>传感器快照</span>
          </article>
          <article class="card mini-card">
            <p>呼吸</p>
            <strong>{{ postureDetection.breathRate ?? '--' }} 次/分</strong>
            <span>传感器快照</span>
          </article>
        </div>
        <div class="posture-meta">
          <p>设备 · {{ postureDetection?.deviceName }} · {{ postureDetection?.deviceId }}</p>
          <p>人员 · {{ postureDetection?.personName || store.activePerson.personName }}</p>
        </div>
      </article>
      <article v-else class="card chart-card muted-card">
        <h2>暂未收到位姿数据</h2>
        <p>等待设备推送最新的人体位姿检测结果。</p>
      </article>
    </div>
  </section>
</template>

<style scoped>
.realtime-page {
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.page-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  padding: 1.3rem 1.5rem;
  border-radius: 24px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.92), rgba(240, 245, 255, 0.92));
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.1);
}

.controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.select-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.6rem 0.8rem;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.85);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.select-field select {
  border: none;
  background: transparent;
  font-weight: 700;
  color: #0f172a;
  outline: none;
}

.tab-bar {
  display: inline-flex;
  padding: 0.25rem;
  border-radius: 14px;
  background: rgba(15, 23, 42, 0.05);
  gap: 0.3rem;
}

.tab-bar button {
  border: none;
  padding: 0.55rem 1.2rem;
  border-radius: 12px;
  background: transparent;
  color: #0f172a;
  font-weight: 700;
}

.tab-bar button.active {
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
  color: #0b1020;
  box-shadow: 0 10px 25px rgba(168, 85, 247, 0.25);
}

.tab-panel {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.vitals-grid {
  display: grid;
  grid-template-columns: 1.5fr 1fr;
  gap: 1rem;
  align-items: stretch;
}

.card {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 1rem 1.2rem;
  border: 1px solid rgba(15, 23, 42, 0.05);
  box-shadow: 0 18px 48px rgba(15, 23, 42, 0.12);
  color: #0f172a;
}

.waveform-card {
  position: relative;
  overflow: hidden;
}

.waveform-card::after {
  content: '';
  position: absolute;
  inset: 0;
  background: radial-gradient(circle at 20% 20%, rgba(110, 231, 243, 0.12), transparent 45%),
    radial-gradient(circle at 80% 10%, rgba(168, 85, 247, 0.12), transparent 45%);
  pointer-events: none;
}

.chart-card {
  min-height: 320px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.chart-head {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
}

.eyebrow {
  text-transform: uppercase;
  color: #9ca3af;
  letter-spacing: 0.1em;
  font-size: 0.8rem;
}

.muted {
  color: #6b7280;
}

.chart-legend {
  display: flex;
  gap: 0.8rem;
  align-items: center;
  color: #475569;
}

.chart-legend .dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 0.25rem;
}

.chart-legend .heart {
  background: linear-gradient(135deg, #f43f5e, #fb7185);
}

.chart-legend .breath {
  background: linear-gradient(135deg, #a855f7, #22c55e);
}

.chart-body {
  flex: 1;
  background: linear-gradient(180deg, rgba(99, 102, 241, 0.06), rgba(14, 165, 233, 0.04));
  border-radius: 18px;
  padding: 0.6rem;
}

.chart-body svg {
  width: 100%;
  height: 100%;
}

.chart-footer {
  display: flex;
  justify-content: space-between;
  color: #6b7280;
  font-size: 0.9rem;
}

.empty {
  margin: 0;
  color: #94a3b8;
}

.status-grid.inline {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.8rem;
}

.mini-card {
  padding: 0.8rem 1rem;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(237, 242, 255, 0.95));
}

.mini-card strong {
  font-size: 1.4rem;
}

.mini-card span.up {
  color: #16a34a;
}

.mini-card span.down {
  color: #ef4444;
}

.side-panel {
  display: grid;
  grid-template-rows: auto auto 1fr;
  gap: 0.8rem;
}

.info-card header {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  margin-bottom: 0.6rem;
}

.info-card dl {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0.6rem;
  margin: 0;
}

.info-card dt {
  color: #94a3b8;
  font-size: 0.9rem;
}

.info-card dd {
  margin: 0;
  font-weight: 700;
}

.muted-card {
  color: #9ca3af;
  background: rgba(248, 250, 252, 0.9);
}

.alert-table header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.alert-table header span {
  color: #94a3b8;
  font-size: 0.9rem;
}

.alert-table button {
  border: none;
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
  color: #0b1020;
  padding: 0.4rem 0.9rem;
  border-radius: 12px;
  font-weight: 700;
}

.table-wrapper {
  overflow: auto;
  margin-top: 0.6rem;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 0.6rem 0.4rem;
}

thead th {
  color: #94a3b8;
  font-weight: 600;
  border-bottom: 1px solid rgba(15, 23, 42, 0.06);
}

tbody tr + tr {
  border-top: 1px solid rgba(15, 23, 42, 0.04);
}

.posture-panel .chart-card {
  gap: 1rem;
}

.posture-layout {
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 0.9rem;
  align-items: stretch;
}

.posture-visual {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.8rem;
}

.posture-cloud {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(208, 229, 255, 0.9));
  border: 1px dashed rgba(99, 102, 241, 0.35);
  border-radius: 16px;
  padding: 1rem;
  text-align: center;
  color: #4b5563;
}

.posture-cloud p {
  margin: 0;
  font-weight: 700;
}

.posture-cloud span {
  color: #94a3b8;
}

.posture-cloud em {
  display: block;
  color: #a855f7;
  margin-top: 0.4rem;
}

.posture-state {
  background: #0f172a;
  color: white;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.posture-state span {
  color: rgba(255, 255, 255, 0.8);
}

.posture-side {
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.7rem;
}

.posture-cta {
  background: linear-gradient(135deg, rgba(110, 231, 243, 0.2), rgba(168, 85, 247, 0.2));
}

.posture-meta {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  color: #6b7280;
}

@media (max-width: 1080px) {
  .vitals-grid {
    grid-template-columns: 1fr;
  }

  .controls {
    flex-direction: column;
    align-items: flex-start;
  }

  .tab-bar {
    align-self: flex-end;
  }

  .posture-layout {
    grid-template-columns: 1fr;
  }
}
</style>
