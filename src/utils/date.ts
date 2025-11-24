const toDate = (input?: Date | string | number | null) => {
  if (!input) return null
  return input instanceof Date ? input : new Date(input)
}

export const formatDate = (input?: Date | string | number | null, format = 'YYYY-MM-DD HH:mm') => {
  const date = toDate(input)
  if (!date) return ''

  const pad = (n: number) => n.toString().padStart(2, '0')

  const replacements: Record<string, string> = {
    YYYY: String(date.getFullYear()),
    MM: pad(date.getMonth() + 1),
    DD: pad(date.getDate()),
    HH: pad(date.getHours()),
    mm: pad(date.getMinutes()),
    ss: pad(date.getSeconds())
  }

  return Object.entries(replacements).reduce(
    (acc, [token, value]) => acc.replace(token, value),
    format
  )
}

export const timeAgo = (input?: Date | string | number | null) => {
  const date = toDate(input)
  if (!date) return ''

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / (1000 * 60))
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes} 分钟前`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} 小时前`

  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} 天前`

  const weeks = Math.floor(days / 7)
  if (weeks < 4) return `${weeks} 周前`

  const months = Math.floor(days / 30)
  if (months < 12) return `${months} 个月前`

  const years = Math.floor(days / 365)
  return `${years} 年前`
}

export const isStale = (timestamp?: number, ttl = 60_000) => {
  if (!timestamp) return true
  return Date.now() - timestamp > ttl
}
