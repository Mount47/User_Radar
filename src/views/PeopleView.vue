<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/store/user'

const store = useUserStore()

const people = computed(() => (store.personDirectory.length ? store.personDirectory : store.persons))

const keyword = ref('')
const tableKeyword = ref('')
const genderFilter = ref<'all' | 'M' | 'F'>('all')
const departmentFilter = ref('all')
const page = ref(1)
const pageSize = 5

onMounted(() => {
  if (!people.value.length) {
    store.hydrateScope()
  }
  if (!store.personDirectory.length) {
    store.refreshPersonDirectory()
  }
})

const departments = computed(() => {
  const values = Array.from(new Set(people.value.map((person) => person.department).filter(Boolean)))
  return ['all', ...values]
})

const filtered = computed(() => {
  const globalTerm = keyword.value.trim().toLowerCase()
  const listTerm = tableKeyword.value.trim().toLowerCase()

  return people.value.filter((person) => {
    const baseTarget = `${person.personName} ${person.department} ${person.personId}`.toLowerCase()
    const deviceTarget = person.devices.map((device) => `${device.deviceId} ${device.deviceName}`.toLowerCase()).join(' ')
    const matchesKeyword = !globalTerm || baseTarget.includes(globalTerm) || deviceTarget.includes(globalTerm)
    const matchesTableKeyword = !listTerm || baseTarget.includes(listTerm) || deviceTarget.includes(listTerm)
    const matchesGender = genderFilter.value === 'all' || person.gender === genderFilter.value
    const matchesDepartment = departmentFilter.value === 'all' || person.department === departmentFilter.value
    return matchesKeyword && matchesTableKeyword && matchesGender && matchesDepartment
  })
})

watch(
  () => [filtered.value.length, pageSize],
  () => {
    page.value = 1
  }
)

const pageCount = computed(() => Math.max(1, Math.ceil(filtered.value.length / pageSize)))
const pagedPersons = computed(() => {
  const start = (page.value - 1) * pageSize
  return filtered.value.slice(start, start + pageSize)
})

const pageRangeLabel = computed(() => {
  if (!filtered.value.length) {
    return 'Showing 0 results'
  }
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, filtered.value.length)
  return `Showing ${start}-${end} of ${filtered.value.length}`
})

const totalUsers = computed(() => people.value.length)
const activeUsers = computed(() => people.value.filter((person) => person.devices.length > 0).length)
const inactiveUsers = computed(() => Math.max(0, totalUsers.value - activeUsers.value))
const activeRate = computed(() => {
  if (!totalUsers.value) return 0
  return Math.round((activeUsers.value / totalUsers.value) * 100)
})

const genderStats = computed(() => {
  return people.value.reduce(
    (acc, person) => {
      acc[person.gender] += 1
      return acc
    },
    { M: 0, F: 0 }
  )
})

const genderRate = computed(() => {
  const total = genderStats.value.M + genderStats.value.F
  if (!total) {
    return { male: 0, female: 0 }
  }
  return {
    male: Math.round((genderStats.value.M / total) * 100),
    female: Math.round((genderStats.value.F / total) * 100)
  }
})

const ageBuckets = computed(() => {
  const config = [
    { label: '60-', min: 0, max: 60 },
    { label: '61-65', min: 61, max: 65 },
    { label: '66-70', min: 66, max: 70 },
    { label: '71-75', min: 71, max: 75 },
    { label: '76-80', min: 76, max: 80 },
    { label: '81+', min: 81, max: Infinity }
  ]
  return config.map((bucket) => {
    const male = people.value.filter(
      (person) => person.gender === 'M' && person.age >= bucket.min && person.age <= bucket.max
    ).length
    const female = people.value.filter(
      (person) => person.gender === 'F' && person.age >= bucket.min && person.age <= bucket.max
    ).length
    return { ...bucket, male, female, total: male + female }
  })
})

const newUsers = computed(() => {
  const tagged = people.value.filter((person) =>
    (person.tags || []).some((tag) => /new|新|recent/i.test(tag))
  ).length
  if (tagged) return tagged
  return Math.min(activeUsers.value, Math.ceil(activeUsers.value * 0.35))
})

const returningUsers = computed(() => Math.max(activeUsers.value - newUsers.value, 0))
const newRate = computed(() => {
  if (!activeUsers.value) return 0
  return Math.round((newUsers.value / activeUsers.value) * 100)
})

const sparklinePoints = computed(() => {
  const fallback = [20, 35, 45, 30, 50, 65, 48, 72]
  if (!people.value.length) return fallback
  return people.value.slice(0, 8).map((person, index) => {
    const normalized = (person.age % 50) + 20 + (index % 3) * 5
    return Math.min(90, normalized)
  })
})

const sparklinePath = computed(() => {
  const points = sparklinePoints.value
  if (!points.length) return ''
  const step = 100 / (points.length - 1 || 1)
  return points
    .map((value, index) => {
      const x = index * step
      const y = 100 - value
      return `${index === 0 ? 'M' : 'L'}${x},${y}`
    })
    .join(' ')
})

const selectedPerson = computed(() => store.activePerson)

const userAlerts = computed(() => {
  if (!store.alerts.length) return []
  const target = selectedPerson.value?.personId
  const scoped = target ? store.alerts.filter((alert) => alert.personId === target) : store.alerts
  return scoped.slice(0, 4)
})

const timelineItems = computed(() => {
  if (userAlerts.value.length) {
    return userAlerts.value.map((alert) => ({
      id: alert.alertId,
      title: alert.alertType || alert.category || 'Exception',
      type: alert.category || 'alert',
      detail: alert.description || `Device ${alert.deviceId}`,
      time: formatDate(alert.detectedAt)
    }))
  }

  if (selectedPerson.value) {
    return selectedPerson.value.devices.map((device, index) => ({
      id: `${device.deviceId}-${index}`,
      title: '设备绑定',
      type: 'device',
      detail: `${device.deviceName} · ${device.modelType || 'mmWave'}`,
      time: device.deviceId
    }))
  }

  return []
})

const latestTransactions = computed(() => {
  if (userAlerts.value.length) {
    return userAlerts.value.map((alert) => ({
      id: `alert-${alert.alertId}`,
      title: alert.alertType || '信息更新',
      label: alert.category || 'VITALS',
      time: formatDate(alert.detectedAt),
      tone: alert.severity === 'CRITICAL' || alert.severity === 'HIGH' ? 'danger' : 'info'
    }))
  }

  const person = selectedPerson.value
  if (person) {
    return (person.devices || []).map((device, index) => ({
      id: `${device.deviceId}-${index}`,
      title: 'Equipment use',
      label: device.deviceName,
      time: `绑定 ID ${device.deviceId}`,
      tone: 'success'
    }))
  }

  return [
    { id: 1, title: 'Equipment use', label: '示例设备', time: '2 November 2025, 13:45 PM', tone: 'success' },
    { id: 2, title: 'Information update', label: '示例操作', time: '2 November 2025, 12:15 PM', tone: 'info' }
  ]
})

const avatarInitials = computed(() => {
  if (!selectedPerson.value) return '--'
  return (selectedPerson.value.personName || '--').slice(0, 2).toUpperCase()
})

function goPrevPage() {
  page.value = Math.max(1, page.value - 1)
}

function goNextPage() {
  page.value = Math.min(pageCount.value, page.value + 1)
}

function selectRow(personId: string) {
  store.selectPerson(personId)
}

function formatGender(value: 'M' | 'F') {
  return value === 'M' ? '男' : '女'
}

function formatDate(value?: string) {
  if (!value) return 'N/A'
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
  <section class="people-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Users</p>
        <h1>人员分析与管理</h1>
        <p class="muted">参考示意图构建的人员洞察与明细面板，可继续接入真实统计。</p>
      </div>
      <div class="page-actions">
        <label class="search-field" aria-label="搜索人员">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6 6 0 1 0 14 15.5l.27.28v.79L20 21.49 21.49 20Zm-6 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              fill="currentColor"
            />
          </svg>
          <input v-model="keyword" type="search" placeholder="搜索姓名/设备" />
        </label>
        <button class="outline-btn" type="button">导出列表</button>
      </div>
    </header>

    <section class="insight-grid">
      <article class="card highlight">
        <header>
          <p>人员状态</p>
          <span>{{ activeRate }}%</span>
        </header>
        <div class="donut">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="44" class="track" />
            <circle
              cx="60"
              cy="60"
              r="44"
              class="progress"
              :style="{ '--value': activeRate + 'deg' }"
              stroke-dasharray="276"
              stroke-dashoffset="calc(276 - (276 * var(--percent)) / 100)"
            />
          </svg>
          <div class="donut-copy">
            <strong>{{ activeUsers }}</strong>
            <small> / {{ totalUsers }}</small>
          </div>
        </div>
        <p class="secondary">绑定设备即视为活跃，随着数据刷新自动更新。</p>
        <div class="legend">
          <div>
            <span class="dot violet"></span>
            活跃 {{ activeUsers }}
          </div>
          <div>
            <span class="dot gray"></span>
            未使用 {{ inactiveUsers }}
          </div>
        </div>
      </article>

      <article class="card gender-card">
        <header>
          <p>人员性别</p>
          <span>{{ genderRate.male }}% · {{ genderRate.female }}%</span>
        </header>
        <div class="gender">
          <div class="gender-donut male">
            <strong>{{ genderStats.M }}</strong>
            <small>Male</small>
            <span>{{ genderRate.male }}%</span>
          </div>
          <div class="gender-donut female">
            <strong>{{ genderStats.F }}</strong>
            <small>Female</small>
            <span>{{ genderRate.female }}%</span>
          </div>
        </div>
        <p class="secondary">用于评估属性查找体验，和示意图保持一致。</p>
      </article>

      <article class="card age-card">
        <header>
          <p>人员年龄</p>
          <span>Male vs Female</span>
        </header>
        <ul>
          <li v-for="bucket in ageBuckets" :key="bucket.label">
            <span>{{ bucket.label }}</span>
            <div class="bars">
              <div class="bar male" :style="{ width: activeUsers ? (bucket.male / totalUsers) * 100 + '%' : '0%' }"></div>
              <div
                class="bar female"
                :style="{ width: activeUsers ? (bucket.female / totalUsers) * 100 + '%' : '0%' }"
              ></div>
            </div>
            <strong>{{ bucket.total }}</strong>
          </li>
        </ul>
      </article>

      <article class="card new-users">
        <header>
          <p>New Users</p>
          <span>{{ newRate }}% of active</span>
        </header>
        <div class="sparkline">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none">
            <path :d="sparklinePath" />
          </svg>
        </div>
        <div class="new-summary">
          <div>
            <small>New</small>
            <strong>{{ newUsers }}</strong>
          </div>
          <div>
            <small>Returning</small>
            <strong>{{ returningUsers }}</strong>
          </div>
        </div>
        <p class="secondary">可对接真实创建时间/访问记录，示意图中的折线已呈现。</p>
      </article>
    </section>

    <section class="panel-grid">
      <article class="card table-card">
        <header class="table-head">
          <div>
            <p class="eyebrow">User Details</p>
            <h2>人员列表</h2>
          </div>
          <div class="filters">
            <select v-model="departmentFilter">
              <option value="all">全部科室</option>
              <option v-for="item in departments.slice(1)" :key="item" :value="item">{{ item }}</option>
            </select>
            <select v-model="genderFilter">
              <option value="all">全部性别</option>
              <option value="F">女性</option>
              <option value="M">男性</option>
            </select>
            <label class="table-search">
              <svg viewBox="0 0 24 24">
                <path
                  d="M15.5 14h-.79l-.28-.27A6 6 0 1 0 14 15.5l.27.28v.79L20 21.49 21.49 20Zm-6 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
                  fill="currentColor"
                />
              </svg>
              <input v-model="tableKeyword" type="search" placeholder="Search here..." />
            </label>
            <div class="table-actions">
              <button class="circle" type="button">+</button>
              <button class="circle" type="button">-</button>
            </div>
          </div>
        </header>

        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>姓名</th>
                <th>性别</th>
                <th>年龄</th>
                <th>科室</th>
                <th>绑定设备</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="person in pagedPersons"
                :key="person.personId"
                :class="{ active: store.activePerson?.personId === person.personId }"
                @click="selectRow(person.personId)"
              >
                <td>
                  <div class="user-cell">
                    <span class="avatar-chip">{{ person.personName.slice(0, 1) }}</span>
                    <div>
                      <strong>{{ person.personName }}</strong>
                      <small>ID：{{ person.personId }}</small>
                    </div>
                  </div>
                </td>
                <td>{{ formatGender(person.gender) }}</td>
                <td>{{ person.age }}</td>
                <td>{{ person.department }}</td>
                <td>{{ person.devices.map((item) => item.deviceName).join('、') || '未绑定' }}</td>
              </tr>
              <tr v-if="!pagedPersons.length">
                <td colspan="5">没有符合条件的数据</td>
              </tr>
            </tbody>
          </table>
        </div>

        <footer class="table-footer">
          <span>{{ pageRangeLabel }}</span>
          <div class="pager">
            <button type="button" :disabled="page === 1" @click="goPrevPage">‹</button>
            <button
              v-for="index in pageCount"
              :key="`page-${index}`"
              type="button"
              :class="{ current: index === page }"
              @click="page = index"
            >
              {{ index }}
            </button>
            <button type="button" :disabled="page === pageCount" @click="goNextPage">›</button>
          </div>
        </footer>
      </article>

      <aside class="detail-stack">
        <article class="card detail-card">
          <template v-if="selectedPerson">
            <div class="profile">
              <div class="avatar">{{ avatarInitials }}</div>
              <div>
                <h3>{{ selectedPerson.personName }}</h3>
                <p>{{ selectedPerson.department }}</p>
                <small>{{ formatGender(selectedPerson.gender) }} · {{ selectedPerson.age }} 岁</small>
              </div>
            </div>

            <dl class="detail-grid">
              <div>
                <dt>User ID</dt>
                <dd>{{ selectedPerson.personId }}</dd>
              </div>
              <div>
                <dt>Identity</dt>
                <dd>{{ selectedPerson.tags?.[0] || 'family' }}</dd>
              </div>
              <div>
                <dt>Created Time</dt>
                <dd>{{ selectedPerson.latestOverview?.collectedAt || 'N/A' }}</dd>
              </div>
              <div>
                <dt>绑定设备</dt>
                <dd>{{ selectedPerson.devices.length || '0' }}</dd>
              </div>
            </dl>

            <div class="timeline">
              <h4>Latest Activity</h4>
              <ul>
                <li v-for="item in timelineItems" :key="item.id">
                  <div class="icon" :class="item.type"></div>
                  <div>
                    <strong>{{ item.title }}</strong>
                    <p>{{ item.detail }}</p>
                  </div>
                  <small>{{ item.time }}</small>
                </li>
                <li v-if="!timelineItems.length">暂无操作记录</li>
              </ul>
            </div>
          </template>
          <template v-else>
            <div class="empty-state">
              <h3>暂无人员</h3>
              <p>等待数据同步完成后即可在此查看人员档案。</p>
            </div>
          </template>
        </article>

        <article class="card transaction-card">
          <header>
            <p>Lastest Transaction</p>
            <button type="button">查看全部</button>
          </header>
          <ul>
            <li v-for="item in latestTransactions" :key="item.id" :class="item.tone">
              <div class="badge"></div>
              <div>
                <strong>{{ item.title }}</strong>
                <p>{{ item.label }}</p>
              </div>
              <small>{{ item.time }}</small>
            </li>
          </ul>
        </article>
      </aside>
    </section>
  </section>
</template>

<style scoped>
:global(body) {
  background: #f4f5fb;
}

.people-page {
  display: flex;
  flex-direction: column;
  gap: 1.75rem;
  color: #0f172a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  align-items: center;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0.3rem 0;
  font-size: clamp(1.6rem, 3vw, 2.2rem);
}

.muted {
  color: rgba(15, 23, 42, 0.6);
  margin: 0;
}

.page-actions {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.search-field {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  background: #fff;
  border-radius: 999px;
  padding: 0.5rem 1rem;
  border: 1px solid rgba(15, 23, 42, 0.1);
}

.search-field svg {
  width: 18px;
  height: 18px;
  color: rgba(15, 23, 42, 0.5);
}

.search-field input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 0.95rem;
  color: #0f172a;
}

.outline-btn {
  border-radius: 999px;
  border: 1px solid rgba(126, 34, 206, 0.3);
  padding: 0.6rem 1.4rem;
  background: rgba(126, 34, 206, 0.07);
  color: #6d28d9;
  font-weight: 600;
  cursor: pointer;
}

.outline-btn:hover {
  border-color: rgba(126, 34, 206, 0.6);
}

.insight-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(230px, 1fr));
  gap: 1rem;
}

.card {
  background: #fff;
  border-radius: 28px;
  padding: 1.5rem;
  box-shadow: 0 25px 50px rgba(15, 23, 42, 0.07);
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.card header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
}

.card header p {
  margin: 0;
  font-weight: 600;
  color: rgba(15, 23, 42, 0.7);
}

.card header span {
  color: #7c3aed;
  font-weight: 600;
}

.donut {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140px;
  height: 140px;
  align-self: center;
}

.donut svg {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.donut circle {
  fill: none;
  stroke-width: 12px;
  stroke-linecap: round;
}

.donut .track {
  stroke: rgba(124, 58, 237, 0.1);
}

.donut .progress {
  stroke: url(#grad) #7c3aed;
  --percent: 0;
  transition: stroke-dashoffset 0.5s ease;
}

.donut-copy {
  position: absolute;
  text-align: center;
}

.legend {
  display: flex;
  gap: 1rem;
  font-size: 0.9rem;
  color: rgba(15, 23, 42, 0.6);
}

.legend .dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  display: inline-flex;
  margin-right: 0.3rem;
}

.legend .violet {
  background: #8b5cf6;
}

.legend .gray {
  background: #d1d5db;
}

.secondary {
  color: rgba(15, 23, 42, 0.6);
  margin: 0;
}

.gender-card .gender {
  display: flex;
  gap: 1rem;
}

.gender-donut {
  flex: 1;
  border-radius: 24px;
  padding: 1rem;
  background: linear-gradient(135deg, #f8f5ff, #fdf4ff);
  text-align: center;
  position: relative;
}

.gender-donut span {
  display: block;
  margin-top: 0.25rem;
  color: rgba(15, 23, 42, 0.5);
}

.gender-donut.male {
  background: linear-gradient(135deg, #dbeafe, #c7d2fe);
}

.gender-donut.female {
  background: linear-gradient(135deg, #fde7f3, #fce7f3);
}

.age-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.age-card li {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.age-card .bars {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}

.age-card .bar {
  height: 6px;
  border-radius: 999px;
}

.age-card .bar.male {
  background: linear-gradient(90deg, #38bdf8, #6366f1);
}

.age-card .bar.female {
  background: linear-gradient(90deg, #f472b6, #c084fc);
}

.new-users .sparkline {
  height: 90px;
}

.new-users svg {
  width: 100%;
  height: 100%;
}

.new-users path {
  fill: none;
  stroke: #a855f7;
  stroke-width: 3;
  stroke-linecap: round;
}

.new-summary {
  display: flex;
  gap: 1rem;
}

.new-summary > div {
  flex: 1;
  background: #f9fafb;
  padding: 0.8rem 1rem;
  border-radius: 18px;
}

.new-summary small {
  color: rgba(15, 23, 42, 0.5);
  text-transform: uppercase;
  letter-spacing: 0.1em;
}

.panel-grid {
  display: grid;
  grid-template-columns: minmax(0, 2fr) minmax(320px, 1fr);
  gap: 1.5rem;
}

.table-card {
  gap: 1.2rem;
}

.table-head {
  gap: 1.5rem;
  align-items: flex-end;
}

.filters {
  display: flex;
  gap: 0.8rem;
  flex-wrap: wrap;
  align-items: center;
}

select {
  border-radius: 18px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.5rem 0.9rem;
  background: #f9fafb;
  color: #0f172a;
}

.table-search {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.4rem 0.8rem;
  border: 1px solid rgba(15, 23, 42, 0.12);
  border-radius: 16px;
  background: #fff;
}

.table-search svg {
  width: 16px;
  height: 16px;
  color: rgba(15, 23, 42, 0.4);
}

.table-search input {
  border: none;
  outline: none;
  background: transparent;
}

.table-actions {
  display: inline-flex;
  gap: 0.4rem;
}

.table-actions .circle {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  border: none;
  background: #ede9fe;
  color: #6d28d9;
  cursor: pointer;
  font-size: 1.2rem;
}

.table-wrapper {
  border: 1px solid rgba(15, 23, 42, 0.08);
  border-radius: 24px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

thead {
  background: #f1f5f9;
}

th,
td {
  padding: 0.9rem 1rem;
  text-align: left;
}

tbody tr {
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  cursor: pointer;
}

tbody tr:hover {
  background: rgba(124, 58, 237, 0.05);
}

tbody tr.active {
  background: rgba(124, 58, 237, 0.08);
}

.user-cell {
  display: flex;
  align-items: center;
  gap: 0.8rem;
}

.avatar-chip {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: rgba(124, 58, 237, 0.15);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  color: #5b21b6;
}

.user-cell small {
  color: rgba(15, 23, 42, 0.5);
}

.table-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.8rem;
  color: rgba(15, 23, 42, 0.6);
}

.pager {
  display: inline-flex;
  gap: 0.4rem;
  align-items: center;
}

.pager button {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  background: #f3f4f6;
  color: #0f172a;
  cursor: pointer;
}

.pager button.current {
  background: #7c3aed;
  color: #fff;
}

.pager button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.detail-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.detail-card {
  gap: 1rem;
}

.profile {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.profile .avatar {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  background: linear-gradient(135deg, #a855f7, #ec4899);
  color: #fff;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

.detail-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
}

dt {
  font-size: 0.8rem;
  color: rgba(15, 23, 42, 0.5);
  margin-bottom: 0.1rem;
}

dd {
  margin: 0;
  font-weight: 600;
}

.timeline h4 {
  margin-bottom: 0.5rem;
}

.timeline ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.timeline li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.8rem;
  align-items: center;
}

.timeline .icon {
  width: 32px;
  height: 32px;
  border-radius: 12px;
  background: #f3f4f6;
}

.timeline .icon.alert {
  background: #fee2e2;
}

.timeline .icon.device {
  background: #e0f2fe;
}

.timeline p {
  margin: 0;
  color: rgba(15, 23, 42, 0.6);
}

.timeline small {
  color: rgba(15, 23, 42, 0.45);
}

.transaction-card header {
  align-items: center;
}

.transaction-card header button {
  border: none;
  background: rgba(124, 58, 237, 0.1);
  color: #7c3aed;
  border-radius: 999px;
  padding: 0.4rem 0.9rem;
  cursor: pointer;
}

.transaction-card ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}

.transaction-card li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.6rem;
  align-items: center;
  padding: 0.7rem 1rem;
  border-radius: 18px;
  background: #f9fafb;
}

.transaction-card li .badge {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  background: #e0f2fe;
}

.transaction-card li.success .badge {
  background: #dcfce7;
}

.transaction-card li.danger .badge {
  background: #fee2e2;
}

.transaction-card li p {
  margin: 0;
  color: rgba(15, 23, 42, 0.5);
}

.transaction-card small {
  color: rgba(15, 23, 42, 0.45);
}

.empty-state {
  text-align: center;
  color: rgba(15, 23, 42, 0.7);
}

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.4);
  margin: 0;
}

@media (max-width: 960px) {
  .panel-grid {
    grid-template-columns: 1fr;
  }
}
</style>
