<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()

onMounted(() => {
  if (!store.persons.length) {
    store.hydrateScope()
  }
  if (!store.activeRealtime && store.activePerson?.personId) {
    store.fetchRealtimeForSelection(store.activePerson.personId)
  }
})

const person = computed(() => store.activePerson)
const snapshot = computed(() => store.activeRealtime)

const trendMax = computed(() => {
  const values = snapshot.value?.trend?.map((item) => item.value) || []
  return values.length ? Math.max(...values) : 100
})
</script>

<template>
  <section class="realtime">
    <header class="page-head">
      <div>
        <p class="eyebrow">实时监测</p>
        <h2>毫米波生命体征</h2>
        <p class="muted">查看当前绑定对象的心率、呼吸和体动趋势。</p>
      </div>
      <div class="chips">
        <span class="chip ghost">自动刷新</span>
        <span class="chip" v-if="snapshot">高置信度 {{ snapshot.confidence }}%</span>
      </div>
    </header>

    <div class="grid" v-if="person">
      <div class="card focus">
        <p class="label">当前对象</p>
        <h3>{{ person.personName }}</h3>
        <p class="muted">{{ person.department }}</p>
        <p class="muted">设备：{{ person.devices.map((d) => d.deviceName).join('、') || '未绑定' }}</p>
      </div>

      <div class="card metrics" v-if="snapshot">
        <div class="metric">
          <p>心率</p>
          <strong>{{ snapshot.heartRate }} bpm</strong>
        </div>
        <div class="metric">
          <p>呼吸</p>
          <strong>{{ snapshot.breathRate }} rpm</strong>
        </div>
        <div class="metric">
          <p>体动</p>
          <strong>{{ snapshot.motion }}</strong>
        </div>
        <div class="metric">
          <p>姿态</p>
          <strong>{{ snapshot.posture }}</strong>
        </div>
        <div class="metric">
          <p>有人在床</p>
          <strong>{{ snapshot.occupancy ? '是' : '否' }}</strong>
        </div>
        <div class="metric">
          <p>刷新时间</p>
          <strong>{{ new Date(snapshot.lastUpdated).toLocaleString() }}</strong>
        </div>
      </div>

      <div class="card spark" v-if="snapshot?.trend?.length">
        <header>
          <p class="label">趋势</p>
          <h3>最近波动</h3>
        </header>
        <div class="spark-list">
          <div v-for="item in snapshot.trend" :key="item.label" class="spark-item">
            <div class="spark-head">
              <p class="name">{{ item.label }}</p>
              <span :class="['delta', item.delta >= 0 ? 'up' : 'down']">{{ item.delta }}</span>
            </div>
            <div class="trend-bar">
              <div class="fill" :style="{ width: `${(item.value / trendMax) * 100}%` }"></div>
              <span class="value">{{ item.value }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <p v-else class="muted">请选择对象以查看实时数据。</p>
  </section>
</template>

<style scoped>
.realtime {
  display: flex;
  flex-direction: column;
  gap: 1.4rem;
  color: #0f172a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 1.2rem 1.6rem;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid rgba(15, 23, 42, 0.06);
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.12);
}

.eyebrow {
  letter-spacing: 0.14em;
  text-transform: uppercase;
  font-size: 0.85rem;
  color: #94a3b8;
}

.muted {
  color: #6b7280;
}

.chips {
  display: flex;
  gap: 0.6rem;
  align-items: center;
}

.chip {
  padding: 0.4rem 0.9rem;
  border-radius: 999px;
  background: linear-gradient(135deg, #6ee7f3, #a855f7);
  color: #0f172a;
  font-weight: 700;
}

.chip.ghost {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(15, 23, 42, 0.08);
  color: #0f172a;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 1rem;
  align-items: start;
}

.card {
  background: rgba(255, 255, 255, 0.94);
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.06);
  padding: 1rem 1.2rem;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.08);
}

.label {
  font-size: 0.9rem;
  color: #94a3b8;
}

.focus h3 {
  margin: 0.2rem 0;
}

.metrics {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 0.8rem;
}

.metric {
  padding: 0.8rem;
  border-radius: 14px;
  background: rgba(248, 250, 252, 0.9);
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.metric p {
  margin: 0;
  color: #6b7280;
}

.metric strong {
  display: block;
  margin-top: 0.3rem;
}

.spark header {
  margin-bottom: 0.6rem;
}

.spark-list {
  display: grid;
  gap: 0.8rem;
}

.spark-item {
  background: rgba(248, 250, 252, 0.9);
  border-radius: 14px;
  padding: 0.7rem;
  border: 1px solid rgba(15, 23, 42, 0.04);
}

.trend-bar {
  position: relative;
  height: 12px;
  border-radius: 999px;
  background: rgba(148, 163, 184, 0.2);
  overflow: hidden;
}

.trend-bar .fill {
  position: absolute;
  inset: 0;
  width: 40%;
  background: linear-gradient(90deg, #22c55e, #8b5cf6);
  border-radius: 999px;
  transition: width 0.3s ease;
}

.trend-bar .value {
  position: absolute;
  right: 8px;
  top: -18px;
  font-size: 0.8rem;
  color: #475569;
}

.spark-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.4rem;
}

.name {
  font-weight: 700;
}

.delta {
  font-weight: 700;
  font-size: 0.9rem;
}

.delta.up {
  color: #16a34a;
}

.delta.down {
  color: #ef4444;
}

@media (max-width: 768px) {
  .page-head {
    flex-direction: column;
  }
}
</style>
