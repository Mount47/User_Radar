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
        <p class="muted">切换不同模式可查看呼吸心跳或人体位姿的即时状态。</p>
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
            呼吸心跳
          </button>
          <button type="button" :class="{ active: activeTab === 'posture' }" @click="activeTab = 'posture'">
            人体位姿
          </button>
        </div>
      </div>
    </header>

    <div v-if="activeTab === 'vitals'" class="tab-panel">
      <div class="vitals-grid">
        <div class="chart-column">
          <article class="card chart-card">
            <div class="chart-head">
              <div>
                <p class="eyebrow">Real-time data waveform chart</p>
                <h2>实时波形</h2>
              </div>
              <div class="chart-legend">
                <span><i class="dot heart"></i> Heartbeat</span>
                <span><i class="dot breath"></i> Respiratory</span>
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
                <path :d="chartPaths.heart" stroke="url(#heartStroke)" fill="none" stroke-width="2.5" />
                <path :d="chartPaths.breath" stroke="url(#breathStroke)" fill="none" stroke-width="2.5" />
              </svg>
            </div>
            <p v-else class="empty">等待设备推送实时波形...</p>
          </article>

          <div class="status-grid inline">
            <article class="card mini-card">
              <p>占床状态</p>
              <strong>{{ monitoringStatus.label }}</strong>
              <span>{{ monitoringStatus.detail }}</span>
            </article>
            <article class="card mini-card">
              <p>异常数量</p>
              <strong>{{ exceptionSummary.total }}</strong>
              <span>{{ exceptionSummary.critical }} 条高优先级待处理</span>
            </article>
            <article class="card mini-card">
              <p>呼吸次数</p>
              <strong>{{ store.activeRealtime?.breathRate ?? '--' }} 次/分</strong>
              <span :class="{ up: trendDeltas.breath >= 0, down: trendDeltas.breath < 0 }">
                {{ trendDeltas.breath >= 0 ? '+' : '' }}{{ trendDeltas.breath }} vs 上一次
              </span>
            </article>
            <article class="card mini-card">
              <p>心率</p>
              <strong>{{ store.activeRealtime?.heartRate ?? '--' }} 次/分</strong>
              <span :class="{ up: trendDeltas.heart >= 0, down: trendDeltas.heart < 0 }">
                {{ trendDeltas.heart >= 0 ? '+' : '' }}{{ trendDeltas.heart }} vs 上一次
              </span>
            </article>
          </div>
        </div>

        <div class="info-blocks">
          <div class="info-pair">
            <article class="card info-card">
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

            <article class="card info-card" v-if="activeDevice">
              <header>
                <span>设备信息</span>
                <strong>{{ activeDevice.deviceName }}</strong>
              </header>
              <dl>
                <div>
                  <dt>Device ID</dt>
                  <dd>{{ activeDevice.deviceId }}</dd>
                </div>
                <div>
                  <dt>类型</dt>
                  <dd>{{ activeDevice.modelType }}</dd>
                </div>
                <div>
                  <dt>状态</dt>
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
          </div>

          <article class="card alert-table compact">
            <header>
              <div>
                <p>异常告警列表</p>
                <span>Primary notification example</span>
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
        </div>
      </div>
    </div>
    <div v-else class="tab-panel posture-panel">
      <article class="card chart-card" v-if="postureDetection">
        <div class="chart-head">
          <div>
            <p class="eyebrow">Posture monitoring</p>
            <h2>Posture overview</h2>
            <p class="muted">Last update · {{ formatDate(postureDetection.updatedAt) }}</p>
          </div>
          <div class="chart-legend">
            <span>{{ postureDetection.fallRisk ? 'Fall risk detected' : 'Stable posture' }}</span>
          </div>
        </div>
        <div class="status-grid inline">
          <article class="card mini-card">
            <p>Current posture</p>
            <strong>{{ postureDetection.posture || 'Unknown' }}</strong>
            <span>Realtime inference</span>
          </article>
          <article class="card mini-card">
            <p>Presence</p>
            <strong>{{ postureDetection.presence ? 'On bed' : 'Not detected' }}</strong>
            <span>{{ postureDetection.presence ? 'Occupancy confirmed' : 'No occupancy' }}</span>
          </article>
          <article class="card mini-card">
            <p>Heart rate</p>
            <strong>{{ postureDetection.heartRate ?? '--' }} bpm</strong>
            <span>Sensor snapshot</span>
          </article>
          <article class="card mini-card">
            <p>Breath rate</p>
            <strong>{{ postureDetection.breathRate ?? '--' }} rpm</strong>
            <span>Sensor snapshot</span>
          </article>
        </div>
        <div class="posture-meta">
          <p>Device · {{ postureDetection.deviceName }} · {{ postureDetection.deviceId }}</p>
          <p>Person · {{ postureDetection.personName || store.activePerson.personName }}</p>
        </div>
      </article>
      <article v-else class="card chart-card muted-card">
        <h2>No posture data yet</h2>
        <p>Waiting for the device to publish the latest posture detection.</p>
      </article>
    </div>
  </section>
</template>
