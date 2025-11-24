type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
}

const DEFAULT_LEVEL: LogLevel =
  (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_LOG_LEVEL as LogLevel)) ||
  'info'

export class Logger {
  constructor(private scope: string, private level: LogLevel = DEFAULT_LEVEL) {}

  private shouldLog(level: LogLevel) {
    return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[this.level]
  }

  private formatMessage(level: LogLevel, message: string) {
    const timestamp = new Date().toISOString()
    return `[${timestamp}] [${this.scope}] [${level.toUpperCase()}] ${message}`
  }

  debug(message: string, ...args: any[]) {
    if (this.shouldLog('debug')) {
      console.debug(this.formatMessage('debug', message), ...args)
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args)
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args)
    }
  }

  error(message: string, ...args: any[]) {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('error', message), ...args)
    }
  }
}

export const logger = new Logger('RadarSystem')
