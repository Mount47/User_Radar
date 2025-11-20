<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useUserStore } from '@/store/user'
import type { DeviceStatus } from '@/types'

type StatusFilter = 'ALL' | DeviceStatus

interface MappingRow {
  id: string
  userId: string
  userName: string
  deviceType: string
  deviceId: string
  deviceName: string
  mappingName: string
  state: DeviceStatus
  lastUpdated: string
  accent: string
}

const palette = ['#8b5cf6', '#0ea5e9', '#f472b6', '#f59e0b', '#10b981', '#14b8a6']

const store = useUserStore()
const mappingSource = computed(() => (store.mappings.length ? store.mappings : []))
const searchTerm = ref('')
const statusFilter = ref<StatusFilter>('ALL')
const page = ref(1)
const pageSize = 5
const selectedRows = ref<string[]>([])

onMounted(() => {
  if (!store.devices.length) {
    store.refreshDevices()
  }
  if (!store.deviceDirectory.length) {
    store.refreshDeviceDirectory({ size: 100 })
  }
  if (!store.personDirectory.length) {
    store.refreshPersonDirectory()
  }
  if (!store.mappings.length) {
    store.refreshMappings()
  }
})

const stateCopy: Record<DeviceStatus, string> = {
  ONLINE: 'Active',
  OFFLINE: 'Deactivate',
  MAINTENANCE: 'Maintenance'
}

function formatLastUpdated(value?: string): string {
  if (!value) return 'N/A'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value || 'N/A'
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  }).format(date)
}

const mappingRows = computed<MappingRow[]>(() => {
  const rows: MappingRow[] = []
  let colorIndex = 0
  const data = mappingSource.value.length ? mappingSource.value : store.devices
  data.forEach((mapping) => {
    const paletteValue = palette[colorIndex % palette.length]
    const accent = paletteValue ?? '#8b5cf6'
    if ('mappingId' in mapping) {
      rows.push({
        id: mapping.mappingId,
        userId: mapping.personId || '未登记',
        userName: mapping.personName || '未分配',
        deviceType: mapping.modelType || '未知型号',
        deviceId: mapping.deviceId,
        deviceName: mapping.deviceName || '未知设备',
        mappingName: `${mapping.deviceName || mapping.deviceId}-${mapping.personName || 'Mapping'}`,
        state: mapping.status,
        lastUpdated: formatLastUpdated(mapping.updatedAt || mapping.createdAt),
        accent
      })
      colorIndex += 1
    } else {
      const device = mapping
      const persons = device.persons?.length ? device.persons : [{ personId: 'NA', personName: '未绑定设备' }]
      persons.forEach((person, personIdx) => {
        const color = palette[(colorIndex + personIdx) % palette.length]
        rows.push({
          id: `${device.deviceId}-${person.personId || personIdx}`,
          userId: person.personId || '未登记',
          userName: person.personName || '未分配',
          deviceType: device.modelType,
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          mappingName: `${device.deviceName}-${person.personName || 'Mapping'}`,
          state: device.status,
          lastUpdated: formatLastUpdated(device.lastHeartbeat || store.profile?.serverTime || ''),
          accent: color ?? '#8b5cf6'
        })
      })
      colorIndex += 1
    }
  })
  return rows
})

const filteredRows = computed(() => {
  const term = searchTerm.value.trim().toLowerCase()
  return mappingRows.value.filter((row) => {
    const matchesStatus = statusFilter.value === 'ALL' || row.state === statusFilter.value
    const matchesTerm =
      !term ||
      [row.userId, row.userName, row.deviceName, row.deviceId, row.mappingName, row.deviceType]
        .filter(Boolean)
        .some((val) => val.toLowerCase().includes(term))
    return matchesStatus && matchesTerm
  })
})

const pageCount = computed(() => Math.max(1, Math.ceil(filteredRows.value.length / pageSize)))

const pagedRows = computed(() => {
  const start = (page.value - 1) * pageSize
  return filteredRows.value.slice(start, start + pageSize)
})

const pageRangeLabel = computed(() => {
  if (!filteredRows.value.length) return 'Showing 0 from 0 data'
  const start = (page.value - 1) * pageSize + 1
  const end = Math.min(page.value * pageSize, filteredRows.value.length)
  return `Showing ${start}-${end} from ${filteredRows.value.length} data`
})

const pageIds = computed(() => pagedRows.value.map((row) => row.id))
const allOnPageSelected = computed(
  () => !!pageIds.value.length && pageIds.value.every((id) => selectedRows.value.includes(id))
)

watch(
  () => filteredRows.value.map((row) => row.id),
  (validIds) => {
    selectedRows.value = selectedRows.value.filter((id) => validIds.includes(id))
  }
)

watch(pageCount, (count) => {
  if (page.value > count) {
    page.value = count
  }
})

function toggleRowSelection(rowId: string) {
  if (selectedRows.value.includes(rowId)) {
    selectedRows.value = selectedRows.value.filter((id) => id !== rowId)
  } else {
    selectedRows.value = [...selectedRows.value, rowId]
  }
}

function toggleSelectAllOnPage() {
  if (allOnPageSelected.value) {
    selectedRows.value = selectedRows.value.filter((id) => !pageIds.value.includes(id))
  } else {
    const union = new Set([...selectedRows.value, ...pageIds.value])
    selectedRows.value = Array.from(union)
  }
}

function goPrev() {
  page.value = Math.max(1, page.value - 1)
}

function goNext() {
  page.value = Math.min(pageCount.value, page.value + 1)
}

function handleAddMapping() {
  console.info('Add mapping for selection', selectedRows.value)
}

function handleRemoveMapping() {
  console.info('Remove mapping for selection', selectedRows.value)
}
</script>

<template>
  <section class="mapping-page">
    <header class="page-head">
      <div>
        <p class="eyebrow">Mapping</p>
        <h1>雷达绑定关系</h1>
        <p class="muted">以表格形式呈现用户、设备、映射名称及状态，贴近示意图交互。</p>
      </div>
      <div class="page-actions">
        <label class="search-field" aria-label="搜索映射">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M15.5 14h-.79l-.28-.27A6 6 0 1 0 14 15.5l.27.28v.79L20 21.49 21.49 20Zm-6 0a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z"
              fill="currentColor"
            />
          </svg>
          <input v-model="searchTerm" type="search" placeholder="Search here..." />
        </label>
        <div class="action-block">
          <button class="circle plus" type="button" @click="handleAddMapping">+</button>
          <button class="circle minus" type="button" @click="handleRemoveMapping">-</button>
          <p>增删映射信息</p>
        </div>
      </div>
    </header>

    <article class="table-shell">
      <div class="table-toolbar">
        <div class="filter">
          <label>状态</label>
          <select v-model="statusFilter">
            <option value="ALL">All</option>
            <option value="ONLINE">Active</option>
            <option value="OFFLINE">Deactivate</option>
            <option value="MAINTENANCE">Maintenance</option>
          </select>
        </div>
        <button class="ghost" type="button" @click="store.refreshDevices()">刷新绑定</button>
      </div>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>
                <label class="checkbox">
                  <input type="checkbox" :checked="allOnPageSelected" @change="toggleSelectAllOnPage" />
                  <span></span>
                </label>
              </th>
              <th>用户ID</th>
              <th>用户姓名</th>
              <th>设备类型</th>
              <th>设备ID</th>
              <th>设备名称</th>
              <th>映射名称</th>
              <th>状态</th>
              <th>最近更新</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in pagedRows"
              :key="row.id"
              :class="{ selected: selectedRows.includes(row.id) }"
              :style="{ '--accent': row.accent }"
            >
              <td>
                <label class="checkbox">
                  <input
                    type="checkbox"
                    :checked="selectedRows.includes(row.id)"
                    @change="toggleRowSelection(row.id)"
                  />
                  <span></span>
                </label>
              </td>
              <td class="user-col">
                <span class="select-bar"></span>
                <strong>{{ row.userId }}</strong>
              </td>
              <td class="muted">{{ row.userName }}</td>
              <td>
                <div class="type-pill">
                  <span class="type-dot" :style="{ background: row.accent }"></span>
                  {{ row.deviceType }}
                </div>
              </td>
              <td>{{ row.deviceId }}</td>
              <td>{{ row.deviceName }}</td>
              <td>{{ row.mappingName }}</td>
              <td>
                <span class="state" :class="row.state.toLowerCase()">{{ stateCopy[row.state] }}</span>
              </td>
              <td>{{ row.lastUpdated }}</td>
              <td class="actions">
                <button type="button" aria-label="More actions">
                  <span></span>
                  <span></span>
                  <span></span>
                </button>
              </td>
            </tr>
            <tr v-if="!pagedRows.length">
              <td colspan="10" class="empty-row">没有匹配的映射记录</td>
            </tr>
          </tbody>
        </table>
      </div>

      <footer class="table-footer">
        <span>{{ pageRangeLabel }}</span>
        <div class="pager">
          <button type="button" :disabled="page === 1" @click="goPrev">‹</button>
          <button
            v-for="index in pageCount"
            :key="`page-${index}`"
            type="button"
            :class="{ current: index === page }"
            @click="page = index"
          >
            {{ index }}
          </button>
          <button type="button" :disabled="page === pageCount" @click="goNext">›</button>
        </div>
      </footer>
    </article>
  </section>
</template>

<style scoped>
:global(body) {
  background: #f4f5fb;
}

.mapping-page {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  color: #0f172a;
}

.page-head {
  display: flex;
  justify-content: space-between;
  gap: 1.5rem;
  flex-wrap: wrap;
}

.page-head h1 {
  margin: 0.2rem 0;
  font-size: clamp(1.5rem, 3vw, 2.2rem);
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

.action-block {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.action-block p {
  margin: 0;
  font-size: 0.85rem;
  color: rgba(15, 23, 42, 0.6);
}

.action-block .circle {
  width: 36px;
  height: 36px;
  border-radius: 12px;
  border: none;
  color: #fff;
  font-size: 1.1rem;
  cursor: pointer;
}

.action-block .plus {
  background: #8b5cf6;
}

.action-block .minus {
  background: #94a3b8;
}

.table-shell {
  background: #fff;
  border-radius: 30px;
  padding: 1.5rem;
  box-shadow: 0 25px 45px rgba(15, 23, 42, 0.08);
  display: flex;
  flex-direction: column;
  gap: 1.2rem;
}

.table-toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.filter {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.filter label {
  font-weight: 600;
  color: rgba(15, 23, 42, 0.6);
}

.filter select {
  border-radius: 16px;
  border: 1px solid rgba(15, 23, 42, 0.15);
  padding: 0.4rem 0.8rem;
  background: #f9fafb;
  color: #0f172a;
}

.ghost {
  border: none;
  background: rgba(124, 58, 237, 0.08);
  color: #7c3aed;
  padding: 0.45rem 1rem;
  border-radius: 999px;
  cursor: pointer;
  font-weight: 600;
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
  padding: 0.85rem 1rem;
  text-align: left;
  vertical-align: middle;
}

tbody tr {
  border-bottom: 1px solid rgba(15, 23, 42, 0.05);
  position: relative;
}

tbody tr.selected {
  background: rgba(139, 92, 246, 0.05);
}

tbody tr.selected::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 4px;
  border-radius: 0 4px 4px 0;
  background: var(--accent);
}

.checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.checkbox input {
  opacity: 0;
  position: absolute;
  width: 0;
  height: 0;
}

.checkbox span {
  width: 18px;
  height: 18px;
  border-radius: 6px;
  border: 1px solid rgba(15, 23, 42, 0.3);
  display: inline-block;
}

.checkbox input:checked + span {
  background: #8b5cf6;
  border-color: #8b5cf6;
}

.user-col {
  display: flex;
  align-items: center;
  gap: 0.6rem;
}

.user-col .select-bar {
  width: 4px;
  height: 28px;
  border-radius: 999px;
  background: var(--accent);
  display: inline-block;
}

.type-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
}

.type-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.state {
  padding: 0.2rem 0.8rem;
  border-radius: 999px;
  font-size: 0.85rem;
  font-weight: 600;
}

.state.online {
  background: rgba(16, 185, 129, 0.15);
  color: #059669;
}

.state.offline {
  background: rgba(248, 113, 113, 0.15);
  color: #dc2626;
}

.state.maintenance {
  background: rgba(251, 191, 36, 0.2);
  color: #b45309;
}

.actions button {
  border: none;
  background: transparent;
  display: inline-flex;
  flex-direction: column;
  gap: 0.2rem;
  cursor: pointer;
}

.actions span {
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: rgba(15, 23, 42, 0.5);
}

.empty-row {
  text-align: center;
  color: rgba(15, 23, 42, 0.6);
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
  align-items: center;
  gap: 0.4rem;
}

.pager button {
  width: 36px;
  height: 36px;
  border-radius: 50%;
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

.eyebrow {
  text-transform: uppercase;
  letter-spacing: 0.25em;
  font-size: 0.75rem;
  color: rgba(15, 23, 42, 0.4);
  margin: 0;
}

@media (max-width: 960px) {
  .table-wrapper {
    overflow-x: auto;
  }
  table {
    min-width: 900px;
  }
}
</style>
