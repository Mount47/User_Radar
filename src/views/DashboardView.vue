<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import PersonSummaryCard from '@/components/PersonSummaryCard.vue'
import AlertTimeline from '@/components/AlertTimeline.vue'
import SparkLine from '@/components/SparkLine.vue'

const store = useUserStore()

onMounted(() => {
  if (!store.persons.length) {
    store.hydrateScope()
  }
  if (!store.alerts.length) {
    store.refreshAlerts()
  }
  if (!store.deviceOverview) {
    store.refreshDeviceOverview()
  }
  if (!store.detectionSummaries.length) {
    store.refreshDetections()
  }
})

const activeHistory = computed(() => {
  const person = store.activePerson
  if (!person) return []
  return store.histories[person.personId] || []
})

const detectionRows = computed(() => store.detectionSummaries.slice(0, 4))
</script>

<template>
  <section class="dashboard">
    <div class="hero">
      <div>
        <p class="eyebrow">您好，{{ store.username }}</p>
        <h2>我的照护范围</h2>
        <p class="muted">
          上次同步时间：
          {{
            store.summaryStats.serverTime
              ? new Date(store.summaryStats.serverTime).toLocaleString()
              : '暂无'
          }}
        </p>
      </div>
      <div class="hero-stats">
        <div>
          <span>人员</span>
          <strong>{{ store.summaryStats.personCount }}</strong>
        </div>
        <div>
          <span>设备</span>
          <strong>{{ store.summaryStats.deviceCount }}</strong>
        </div>
        <div>
          <span>角色</span>
          <strong>{{ store.summaryStats.role }}</strong>
        </div>
      </div>
    </div>

    <div class="status-grid" v-if="store.deviceOverview">
      <div class="status-card">
        <p>在线设备</p>
        <strong>{{ store.deviceOverview.online }}</strong>
      </div>
      <div class="status-card warning">
        <p>离线 / 维护</p>
        <strong>{{ store.deviceOverview.offline + store.deviceOverview.maintenance }}</strong>
      </div>
      <div class="status-card">
        <p>活跃映射</p>
        <strong>{{ store.deviceOverview.activeMappings }}</strong>
      </div>
      <div class="status-card">
        <p>平均心跳延迟</p>
        <strong>{{ store.deviceOverview.avgHeartbeatDelaySec }}s</strong>
      </div>
    </div>

    <div class="focus-card" v-if="store.activePerson">
      <div>
        <p class="eyebrow">当前聚焦</p>
        <h3>{{ store.activePerson.personName }} · {{ store.activePerson.department }}</h3>
        <p class="muted">
          绑定设备：{{ store.activePerson.devices.map((item) => item.deviceName).join('、') || '暂无' }}
        </p>
      </div>
      <div class="hero-stats" v-if="store.activePerson.latestOverview">
        <div>
          <span>心率</span>
          <strong>{{ store.activePerson.latestOverview?.heartRate }} bpm</strong>
        </div>
        <div>
          <span>呼吸</span>
          <strong>{{ store.activePerson.latestOverview?.breathRate }} rpm</strong>
        </div>
        <div>
          <span>体动</span>
          <strong>{{ store.activePerson.latestOverview?.motion }}</strong>
        </div>
      </div>
    </div>

    <div class="grid">
      <div class="cards">
        <PersonSummaryCard
          v-for="person in store.persons"
          :key="person.personId"
          :person="person"
          :is-active="store.activePerson?.personId === person.personId"
          @select="store.selectPerson"
        />
      </div>
      <div class="right-panel">
        <div class="history" v-if="activeHistory.length">
          <header>
            <p class="eyebrow">24 小时趋势</p>
            <h3>生命体征走势</h3>
          </header>
          <div class="chart-row">
            <div>
              <p>心率</p>
              <SparkLine :data="activeHistory" field="heartRate" color="#fb7185" />
            </div>
            <div>
              <p>呼吸</p>
              <SparkLine :data="activeHistory" field="breathRate" color="#34d399" />
            </div>
            <div>
              <p>体动</p>
              <SparkLine :data="activeHistory" field="motion" color="#818cf8" />
            </div>
          </div>
        </div>

        <div class="detection" v-if="detectionRows.length">
          <header>
            <p class="eyebrow">检测看板</p>
            <h3>姿态 / Vital / 在离床</h3>
          </header>
          <table>
            <thead>
              <tr>
                <th>设备</th>
                <th>人员</th>
                <th>类型</th>
                <th>状态</th>
                <th>刷新</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in detectionRows" :key="item.detectionId">
                <td>{{ item.deviceName }}</td>
                <td>{{ item.personName || '未绑定' }}</td>
                <td>{{ item.detectionType }}</td>
                <td>
                  <span v-if="item.detectionType === 'PRESENCE'">
                    {{ item.presence ? '有人' : '无人' }}
                  </span>
                  <span v-else-if="item.detectionType === 'VITAL'">
                    {{ item.heartRate }} bpm / {{ item.breathRate }} rpm
                  </span>
                  <span v-else>
                    {{ item.posture || '未知' }}
                    <strong v-if="item.fallRisk" class="tag">跌倒风险</strong>
                  </span>
                </td>
                <td>{{ new Date(item.updatedAt).toLocaleTimeString() }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <AlertTimeline :items="store.scopedAlerts.slice(0, 6)" />
      </div>
    </div>
  </section>
</template>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.hero,
.focus-card {
  background: rgba(255, 255, 255, 0.92);
  border-radius: 26px;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 1.8rem;
  color: #111827;
  display: flex;
  justify-content: space-between;
  gap: 2rem;
  flex-wrap: wrap;
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.2em;
  font-size: 0.8rem;
  color: #6b7280;
}

.muted {
  color: #6b7280;
}

.hero-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 1rem;
}

.hero-stats span {
  font-size: 0.75rem;
  color: #9ca3af;
}

.hero-stats strong {
  font-size: 1.4rem;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 1rem;
}

.status-card {
  padding: 1rem;
  border-radius: 20px;
  background: rgba(12, 15, 28, 0.85);
  border: 1px solid rgba(255, 255, 255, 0.12);
}

.status-card.warning {
  border-color: rgba(248, 113, 113, 0.4);
}

.status-card p {
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.6);
}

.status-card strong {
  display: block;
  font-size: 1.8rem;
}

.grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 1.8rem;
}

.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 1.5rem;
}

.right-panel {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.history,
.detection {
  background: rgba(12, 15, 28, 0.85);
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.12);
  padding: 1.2rem;
}

.chart-row {
  display: grid;
  gap: 1rem;
}

.chart-row > div {
  background: rgba(255, 255, 255, 0.08);
  border-radius: 18px;
  padding: 0.8rem;
}

.detection table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 0.8rem;
}

.detection th,
.detection td {
  padding: 0.6rem 0.4rem;
  text-align: left;
  font-size: 0.85rem;
}

.tag {
  color: #f87171;
  margin-left: 0.4rem;
  font-size: 0.75rem;
}

@media (max-width: 960px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
